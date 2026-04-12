-- =============================================================================
-- TRANSFORMR -- Weekly Grocery Budget
-- Adds a weekly_grocery_budget_usd column to profiles so AI meal-prep and
-- grocery-list functions can respect the user's food spending target.
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS weekly_grocery_budget_usd NUMERIC DEFAULT 0;
