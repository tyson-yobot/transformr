# TRANSFORMR Email Template Setup — Supabase Dashboard

These templates are stored locally in `supabase/templates/` but must ALSO
be configured in the Supabase Dashboard for production.

## Steps

1. Go to https://supabase.com/dashboard
2. Select the TRANSFORMR project
3. Navigate to Authentication → Email Templates
4. For each template type (Confirm signup, Reset password, Magic link, Invite):
   a. Paste the subject line from the table below
   b. Paste the HTML content from the corresponding template file
   c. Save

## Template Files

| Type | Subject | File |
|------|---------|------|
| Confirm signup | Verify your TRANSFORMR account | templates/confirmation.html |
| Reset password | Reset your TRANSFORMR password | templates/reset-password.html |
| Magic link | Your TRANSFORMR sign-in link | templates/magic-link.html |
| Invite | You've been invited to TRANSFORMR | templates/invite.html |

## Testing

After pasting templates in the dashboard:
1. Create a new account in the app
2. Check the email received
3. Verify the TRANSFORMR branding appears correctly
4. Click the verify button — confirm it works
5. Test on both desktop and mobile email clients

## SMTP Configuration (Optional but Recommended)

By default Supabase uses their built-in email service which has rate limits
and shows "noreply@mail.app.supabase.io" as the sender.

For production, configure a custom SMTP:
- Go to Project Settings → Authentication → SMTP Settings
- Enable custom SMTP
- Recommended providers: Resend, Postmark, SendGrid, AWS SES
- Set sender: noreply@transformr.app (or noreply@automateai.com)
- Set sender name: TRANSFORMR
