-- =============================================================================
-- TRANSFORMR — Supabase RLS Audit Queries
-- Run in Supabase SQL editor. Do not execute via client SDK.
-- =============================================================================

-- 1. List all public tables and whether RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Find policies with qual = 'true' (open-access — any authenticated user can read/write)
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR with_check = 'true')
ORDER BY tablename, policyname;

-- 3. Find tables with RLS DISABLED (these are fully open to any authenticated request)
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- 4. Verify financial tables have user-scoped policies
--    Tables expected: stripe_customers, subscriptions, payment_intents, stakes
SELECT
  t.tablename,
  t.rowsecurity AS rls_enabled,
  p.policyname,
  p.cmd,
  p.qual
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'stripe_customers',
    'subscriptions',
    'payment_intents',
    'stakes',
    'goal_stakes',
    'transactions'
  )
ORDER BY t.tablename, p.policyname;

-- 5. List all policies and their definitions (full audit overview)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- 6. Enable RLS on any table found to be missing it (run per table as needed)
--    Replace <table_name> with actual table name from query #3 results.
--
--    ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
--
--    Then create a user-scoped policy:
--
--    CREATE POLICY "Users can only access their own rows"
--      ON public.<table_name>
--      FOR ALL
--      USING (auth.uid() = user_id)
--      WITH CHECK (auth.uid() = user_id);

-- 7. Check for service-role bypass policies (these skip RLS entirely)
SELECT
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND roles @> ARRAY['service_role']
ORDER BY tablename;
