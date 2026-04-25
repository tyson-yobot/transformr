// NOTE: No AI API calls — compliance preamble not required
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const QB_CLIENT_ID = Deno.env.get("QB_CLIENT_ID")!;
const QB_CLIENT_SECRET = Deno.env.get("QB_CLIENT_SECRET")!;
const QB_REFRESH_TOKEN = Deno.env.get("QB_REFRESH_TOKEN")!;
const QB_COMPANY_ID = Deno.env.get("QB_COMPANY_ID")!;
const QB_ENVIRONMENT = Deno.env.get("QB_ENVIRONMENT") ?? "sandbox";

function getQBBaseUrl(): string {
  return QB_ENVIRONMENT === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";
}

async function getQBAccessToken(): Promise<string> {
  const tokenUrl = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
  const basicAuth = btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`);

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(QB_REFRESH_TOKEN)}`,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`QB token refresh failed: ${errText}`);
  }

  const tokenData = await response.json();
  return tokenData.access_token;
}

interface LedgerEntry {
  id: string;
  user_id: string;
  amount: number;
  gross_amount: number | null;
  discount_amount: number | null;
  entry_type: string;
  description: string | null;
  status: string;
}

function buildQBPayload(entry: LedgerEntry): { endpoint: string; body: Record<string, unknown> } {
  const baseUrl = `${getQBBaseUrl()}/v3/company/${QB_COMPANY_ID}`;

  // Revenue share payout -> QB Bill (expense)
  if (entry.entry_type === "revenue_share_payout") {
    return {
      endpoint: `${baseUrl}/bill`,
      body: {
        VendorRef: { value: entry.user_id },
        Line: [
          {
            Amount: entry.amount / 100, // cents to dollars
            DetailType: "AccountBasedExpenseLineDetail",
            AccountBasedExpenseLineDetail: {
              AccountRef: { value: "6001" },
            },
            Description: entry.description ?? "Creator revenue share payout",
          },
        ],
        TxnDate: new Date().toISOString().split("T")[0],
      },
    };
  }

  // Free month -> Invoice with full price + 100% discount line
  if (entry.entry_type === "free_month") {
    const grossAmount = (entry.gross_amount ?? entry.amount) / 100;
    return {
      endpoint: `${baseUrl}/invoice`,
      body: {
        CustomerRef: { value: entry.user_id },
        Line: [
          {
            Amount: grossAmount,
            DetailType: "SalesItemLineDetail",
            SalesItemLineDetail: {
              ItemRef: { value: "1" },
              UnitPrice: grossAmount,
              Qty: 1,
            },
            Description: entry.description ?? "Subscription - Free month",
          },
          {
            Amount: grossAmount,
            DetailType: "DiscountLineDetail",
            DiscountLineDetail: {
              PercentBased: true,
              DiscountPercent: 100,
              DiscountAccountRef: { value: "4101" },
            },
            Description: "Free month - 100% discount",
          },
        ],
        TxnDate: new Date().toISOString().split("T")[0],
      },
    };
  }

  // Discounted payment -> Invoice with gross + contra-revenue discount lines
  if (entry.discount_amount && entry.discount_amount > 0) {
    const grossAmount = (entry.gross_amount ?? entry.amount + entry.discount_amount) / 100;
    const discountAmount = entry.discount_amount / 100;
    const netAmount = entry.amount / 100;

    // Determine revenue and contra-revenue accounts based on entry type
    const revenueAccount = entry.entry_type === "subscription"
      ? "4001"
      : entry.entry_type === "addon"
        ? "4002"
        : "4003";
    const contraAccount = entry.entry_type === "subscription"
      ? "4101"
      : entry.entry_type === "addon"
        ? "4102"
        : "4105";

    return {
      endpoint: `${baseUrl}/invoice`,
      body: {
        CustomerRef: { value: entry.user_id },
        Line: [
          {
            Amount: grossAmount,
            DetailType: "SalesItemLineDetail",
            SalesItemLineDetail: {
              ItemRef: { value: "1" },
              UnitPrice: grossAmount,
              Qty: 1,
            },
            Description: entry.description ?? `Subscription payment (gross) — Account ${revenueAccount}`,
          },
          {
            Amount: discountAmount,
            DetailType: "DiscountLineDetail",
            DiscountLineDetail: {
              PercentBased: false,
              DiscountAccountRef: { value: contraAccount },
            },
            Description: `Discount — contra-revenue (net: $${netAmount.toFixed(2)})`,
          },
        ],
        TxnDate: new Date().toISOString().split("T")[0],
      },
    };
  }

  // Normal payment -> Invoice with payment
  const amount = entry.amount / 100;
  return {
    endpoint: `${baseUrl}/invoice`,
    body: {
      CustomerRef: { value: entry.user_id },
      Line: [
        {
          Amount: amount,
          DetailType: "SalesItemLineDetail",
          SalesItemLineDetail: {
            ItemRef: { value: "1" },
            UnitPrice: amount,
            Qty: 1,
          },
          Description: entry.description ?? "Subscription payment",
        },
      ],
      TxnDate: new Date().toISOString().split("T")[0],
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check for manual retry of a specific entry
    let specificEntryId: string | null = null;
    try {
      const body = await req.json();
      specificEntryId = body?.ledgerEntryId ?? null;
    } catch {
      // No body — hourly cron mode
    }

    // Build query for unsynced entries
    let query = supabaseAdmin
      .from("billing_ledger")
      .select("*")
      .eq("status", "completed")
      .eq("qb_synced", false);

    if (specificEntryId) {
      query = query.eq("id", specificEntryId);
    }

    const { data: entries, error: fetchError } = await query;

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({ synced: 0, failed: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get QB access token
    const accessToken = await getQBAccessToken();

    let synced = 0;
    let failed = 0;

    for (const entry of entries) {
      try {
        const { endpoint, body } = buildQBPayload(entry as LedgerEntry);

        const qbResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        });

        if (qbResponse.ok) {
          const qbData = await qbResponse.json();
          const invoiceId =
            qbData?.Invoice?.Id ?? qbData?.Bill?.Id ?? null;

          await supabaseAdmin
            .from("billing_ledger")
            .update({
              qb_synced: true,
              qb_invoice_id: invoiceId,
              qb_sync_error: null,
            })
            .eq("id", entry.id);

          synced++;
        } else {
          const errorText = await qbResponse.text();
          await supabaseAdmin
            .from("billing_ledger")
            .update({
              qb_sync_error: errorText.substring(0, 1000),
            })
            .eq("id", entry.id);

          await supabaseAdmin.from("billing_audit_log").insert({
            entry_type: "qb_sync_failure",
            severity: "error",
            ledger_entry_id: entry.id,
            details: { error: errorText.substring(0, 500), endpoint },
          });

          failed++;
        }
      } catch (entryErr) {
        const errorMsg = entryErr instanceof Error ? entryErr.message : "Unknown QB sync error";
        await supabaseAdmin
          .from("billing_ledger")
          .update({ qb_sync_error: errorMsg })
          .eq("id", entry.id);

        await supabaseAdmin.from("billing_audit_log").insert({
          entry_type: "qb_sync_failure",
          severity: "error",
          ledger_entry_id: entry.id,
          details: { error: errorMsg },
        });

        failed++;
      }
    }

    return new Response(
      JSON.stringify({ synced, failed }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
