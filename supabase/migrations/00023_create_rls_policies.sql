-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_workout_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE pain_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobility_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_prep_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE stake_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE stake_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_board_items ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION is_partner(check_user UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM partnerships
    WHERE status = 'active'
    AND ((user_a = auth.uid() AND user_b = check_user)
      OR (user_b = auth.uid() AND user_a = check_user))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: users can read/update own, read partner's
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view partner profile" ON profiles FOR SELECT USING (is_partner(id));
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Generic own-data policies (apply to most tables with user_id)
-- Weight logs
CREATE POLICY "Own weight logs" ON weight_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Partner weight logs" ON weight_logs FOR SELECT USING (is_partner(user_id));

-- Workout sessions
CREATE POLICY "Own workout sessions" ON workout_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Partner workout sessions" ON workout_sessions FOR SELECT USING (is_partner(user_id));

-- Nutrition logs
CREATE POLICY "Own nutrition logs" ON nutrition_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Partner nutrition logs" ON nutrition_logs FOR SELECT USING (is_partner(user_id));

-- Habits
CREATE POLICY "Own habits" ON habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Partner habits" ON habits FOR SELECT USING (is_partner(user_id));

-- Habit completions
CREATE POLICY "Own habit completions" ON habit_completions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Partner habit completions" ON habit_completions FOR SELECT USING (is_partner(user_id));

-- Goals
CREATE POLICY "Own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Partner goals" ON goals FOR SELECT USING (is_partner(user_id));

-- Sleep logs
CREATE POLICY "Own sleep logs" ON sleep_logs FOR ALL USING (auth.uid() = user_id);

-- Mood logs
CREATE POLICY "Own mood logs" ON mood_logs FOR ALL USING (auth.uid() = user_id);

-- Exercises (public read for non-custom, own for custom)
CREATE POLICY "Read all exercises" ON exercises FOR SELECT USING (NOT is_custom OR created_by = auth.uid());
CREATE POLICY "Own custom exercises" ON exercises FOR ALL USING (created_by = auth.uid());

-- Foods (public read for non-custom, own for custom)
CREATE POLICY "Read all foods" ON foods FOR SELECT USING (NOT is_custom OR created_by = auth.uid());
CREATE POLICY "Own custom foods" ON foods FOR ALL USING (created_by = auth.uid());

-- Apply similar patterns to remaining tables...
-- Countdowns
CREATE POLICY "Own countdowns" ON countdowns FOR ALL USING (auth.uid() = user_id);

-- Measurements
CREATE POLICY "Own measurements" ON measurements FOR ALL USING (auth.uid() = user_id);

-- Workout templates
CREATE POLICY "Own workout templates" ON workout_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Shared workout templates" ON workout_templates FOR SELECT USING (is_shared = true);

-- Workout template exercises
CREATE POLICY "Own template exercises" ON workout_template_exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM workout_templates WHERE id = template_id AND user_id = auth.uid())
);

-- Workout sets
CREATE POLICY "Own workout sets" ON workout_sets FOR ALL USING (
  EXISTS (SELECT 1 FROM workout_sessions WHERE id = session_id AND user_id = auth.uid())
);

-- Personal records
CREATE POLICY "Own PRs" ON personal_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Partner PRs" ON personal_records FOR SELECT USING (is_partner(user_id));

-- Live workout sync
CREATE POLICY "Own live sync" ON live_workout_sync FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Partner live sync" ON live_workout_sync FOR SELECT USING (auth.uid() = partner_id);

-- Pain logs
CREATE POLICY "Own pain logs" ON pain_logs FOR ALL USING (auth.uid() = user_id);

-- Mobility sessions
CREATE POLICY "Own mobility" ON mobility_sessions FOR ALL USING (auth.uid() = user_id);

-- Saved meals
CREATE POLICY "Own saved meals" ON saved_meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Shared saved meals" ON saved_meals FOR SELECT USING (is_shared = true);

-- Saved meal items
CREATE POLICY "Own saved meal items" ON saved_meal_items FOR ALL USING (
  EXISTS (SELECT 1 FROM saved_meals WHERE id = saved_meal_id AND user_id = auth.uid())
);

-- Water logs
CREATE POLICY "Own water logs" ON water_logs FOR ALL USING (auth.uid() = user_id);

-- Supplements
CREATE POLICY "Own supplements" ON supplements FOR ALL USING (auth.uid() = user_id);

-- Supplement logs
CREATE POLICY "Own supplement logs" ON supplement_logs FOR ALL USING (auth.uid() = user_id);

-- Meal prep plans
CREATE POLICY "Own meal prep plans" ON meal_prep_plans FOR ALL USING (auth.uid() = user_id);

-- Grocery lists
CREATE POLICY "Own grocery lists" ON grocery_lists FOR ALL USING (auth.uid() = user_id);

-- Goal milestones
CREATE POLICY "Own goal milestones" ON goal_milestones FOR ALL USING (
  EXISTS (SELECT 1 FROM goals WHERE id = goal_id AND user_id = auth.uid())
);

-- Readiness scores
CREATE POLICY "Own readiness" ON readiness_scores FOR ALL USING (auth.uid() = user_id);

-- Business
CREATE POLICY "Own businesses" ON businesses FOR ALL USING (auth.uid() = user_id);

-- Revenue logs
CREATE POLICY "Own revenue" ON revenue_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND user_id = auth.uid())
);

-- Expense logs
CREATE POLICY "Own expenses" ON expense_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND user_id = auth.uid())
);

-- Customers
CREATE POLICY "Own customers" ON customers FOR ALL USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND user_id = auth.uid())
);

-- Business milestones
CREATE POLICY "Own business milestones" ON business_milestones FOR ALL USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND user_id = auth.uid())
);

-- Finance
CREATE POLICY "Own finance accounts" ON finance_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own finance transactions" ON finance_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own net worth" ON net_worth_snapshots FOR ALL USING (auth.uid() = user_id);

-- Focus sessions
CREATE POLICY "Own focus sessions" ON focus_sessions FOR ALL USING (auth.uid() = user_id);

-- Journal
CREATE POLICY "Own journal" ON journal_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own monthly letters" ON monthly_letters FOR ALL USING (auth.uid() = user_id);

-- Skills, books, courses
CREATE POLICY "Own skills" ON skills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own books" ON books FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own courses" ON courses FOR ALL USING (auth.uid() = user_id);

-- Partner features
CREATE POLICY "Own partner nudges sent" ON partner_nudges FOR ALL USING (auth.uid() = from_user_id);
CREATE POLICY "Received nudges" ON partner_nudges FOR SELECT USING (auth.uid() = to_user_id);
CREATE POLICY "Update received nudges" ON partner_nudges FOR UPDATE USING (auth.uid() = to_user_id);

CREATE POLICY "Own partner challenges" ON partner_challenges FOR ALL USING (
  EXISTS (SELECT 1 FROM partnerships WHERE id = partnership_id AND (user_a = auth.uid() OR user_b = auth.uid()))
);

-- Partnerships
CREATE POLICY "Own partnerships" ON partnerships FOR ALL USING (user_a = auth.uid() OR user_b = auth.uid());

-- NFC & Geofence
CREATE POLICY "Own NFC triggers" ON nfc_triggers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own geofence triggers" ON geofence_triggers FOR ALL USING (auth.uid() = user_id);

-- Dashboard layouts
CREATE POLICY "Own dashboard" ON dashboard_layouts FOR ALL USING (auth.uid() = user_id);

-- Social content
CREATE POLICY "Own social content" ON social_content FOR ALL USING (auth.uid() = user_id);

-- Stake goals
CREATE POLICY "Own stake goals" ON stake_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own stake evaluations" ON stake_evaluations FOR ALL USING (
  EXISTS (SELECT 1 FROM stake_goals WHERE id = stake_goal_id AND user_id = auth.uid())
);

-- Community (public read)
CREATE POLICY "Read community challenges" ON community_challenges FOR SELECT USING (true);
CREATE POLICY "Own community challenges" ON community_challenges FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Own challenge participation" ON challenge_participants FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "View challenge participants" ON challenge_participants FOR SELECT USING (true);

CREATE POLICY "View leaderboards" ON community_leaderboards FOR SELECT USING (true);
CREATE POLICY "Own leaderboard entry" ON community_leaderboards FOR ALL USING (auth.uid() = user_id);

-- Achievements (public read, own earned)
CREATE POLICY "Read achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Own earned achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "View user achievements" ON user_achievements FOR SELECT USING (true);

-- Notifications
CREATE POLICY "Own notifications" ON notification_log FOR ALL USING (auth.uid() = user_id);

-- Daily checkins
CREATE POLICY "Own checkins" ON daily_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Partner checkins" ON daily_checkins FOR SELECT USING (is_partner(user_id));

-- Weekly reviews
CREATE POLICY "Own weekly reviews" ON weekly_reviews FOR ALL USING (auth.uid() = user_id);

-- Vision board
CREATE POLICY "Own vision board" ON vision_board_items FOR ALL USING (auth.uid() = user_id);
