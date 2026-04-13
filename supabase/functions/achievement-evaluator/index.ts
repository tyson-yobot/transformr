import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: string;
  check: (data: any) => boolean;
}

const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  {
    id: "first_workout",
    name: "First Rep",
    description: "Complete your first workout",
    category: "fitness",
    check: (d) => (d.total_workouts || 0) >= 1,
  },
  {
    id: "workout_10",
    name: "Getting Serious",
    description: "Complete 10 workouts",
    category: "fitness",
    check: (d) => (d.total_workouts || 0) >= 10,
  },
  {
    id: "workout_50",
    name: "Iron Addict",
    description: "Complete 50 workouts",
    category: "fitness",
    check: (d) => (d.total_workouts || 0) >= 50,
  },
  {
    id: "workout_100",
    name: "Century Club",
    description: "Complete 100 workouts",
    category: "fitness",
    check: (d) => (d.total_workouts || 0) >= 100,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    category: "consistency",
    check: (d) => (d.current_streak || 0) >= 7,
  },
  {
    id: "streak_30",
    name: "Monthly Monster",
    description: "Maintain a 30-day streak",
    category: "consistency",
    check: (d) => (d.current_streak || 0) >= 30,
  },
  {
    id: "streak_100",
    name: "Unstoppable",
    description: "Maintain a 100-day streak",
    category: "consistency",
    check: (d) => (d.current_streak || 0) >= 100,
  },
  {
    id: "first_pr",
    name: "Personal Best",
    description: "Set your first personal record",
    category: "fitness",
    check: (d) => (d.total_prs || 0) >= 1,
  },
  {
    id: "pr_10",
    name: "Record Breaker",
    description: "Set 10 personal records",
    category: "fitness",
    check: (d) => (d.total_prs || 0) >= 10,
  },
  {
    id: "meal_tracker_7",
    name: "Nutrition Novice",
    description: "Log meals for 7 consecutive days",
    category: "nutrition",
    check: (d) => (d.meal_log_streak || 0) >= 7,
  },
  {
    id: "meal_tracker_30",
    name: "Macro Master",
    description: "Log meals for 30 consecutive days",
    category: "nutrition",
    check: (d) => (d.meal_log_streak || 0) >= 30,
  },
  {
    id: "weight_loss_5",
    name: "Dropping Pounds",
    description: "Lose 5 lbs from starting weight",
    category: "body",
    check: (d) => (d.weight_lost || 0) >= 5,
  },
  {
    id: "weight_loss_20",
    name: "Transformed",
    description: "Lose 20 lbs from starting weight",
    category: "body",
    check: (d) => (d.weight_lost || 0) >= 20,
  },
  {
    id: "first_journal",
    name: "Self Aware",
    description: "Write your first journal entry",
    category: "mindset",
    check: (d) => (d.total_journal_entries || 0) >= 1,
  },
  {
    id: "business_revenue_goal",
    name: "Money Maker",
    description: "Hit a monthly revenue goal",
    category: "business",
    check: (d) => d.revenue_goal_hit === true,
  },

  // ── Challenge Achievements ──────────────────────────────────────────────
  {
    id: "challenge_day_one",
    name: "Day One",
    description: "Start any challenge",
    category: "challenge",
    check: (d) => (d.challenges_started || 0) >= 1,
  },
  {
    id: "challenge_halfway",
    name: "Halfway There",
    description: "Reach 50% of any challenge",
    category: "challenge",
    check: (d) => d.challenge_halfway === true,
  },
  {
    id: "challenge_75_hard",
    name: "75 Hard Survivor",
    description: "Complete 75 Hard",
    category: "challenge",
    check: (d) => d.challenge_75_hard_completed === true,
  },
  {
    id: "challenge_75_soft",
    name: "75 Soft Champion",
    description: "Complete 75 Soft with 90%+ compliance",
    category: "challenge",
    check: (d) => d.challenge_75_soft_completed === true,
  },
  {
    id: "challenge_murph",
    name: "Murph Finisher",
    description: "Complete a full Murph",
    category: "challenge",
    check: (d) => d.challenge_murph_completed === true,
  },
  {
    id: "challenge_murph_sub40",
    name: "Sub-40 Murph",
    description: "Complete Murph in under 40 minutes",
    category: "challenge",
    check: (d) => d.challenge_murph_sub40 === true,
  },
  {
    id: "challenge_c25k",
    name: "Couch to Runner",
    description: "Complete Couch to 5K",
    category: "challenge",
    check: (d) => d.challenge_c25k_completed === true,
  },
  {
    id: "challenge_squat",
    name: "Squat Machine",
    description: "Complete 30-Day Squat Challenge",
    category: "challenge",
    check: (d) => d.challenge_squat_completed === true,
  },
  {
    id: "challenge_plank",
    name: "Iron Plank",
    description: "Hold a 5-minute plank",
    category: "challenge",
    check: (d) => d.challenge_plank_300s === true,
  },
  {
    id: "challenge_sober",
    name: "Sober Streak",
    description: "Complete 30 days alcohol-free",
    category: "challenge",
    check: (d) => d.challenge_sober_completed === true,
  },
  {
    id: "challenge_whole30",
    name: "Whole30 Clean",
    description: "Complete Whole30 with zero violations",
    category: "challenge",
    check: (d) => d.challenge_whole30_completed === true,
  },
  {
    id: "challenge_steps",
    name: "Step Master",
    description: "Walk 10,000 steps for 30 consecutive days",
    category: "challenge",
    check: (d) => d.challenge_steps_completed === true,
  },
  {
    id: "challenge_stacker",
    name: "Challenge Stacker",
    description: "Complete 3 or more challenges in a year",
    category: "challenge",
    check: (d) => (d.challenges_completed_year || 0) >= 3,
  },
  {
    id: "challenge_never_give_up",
    name: "Never Give Up",
    description: "Restart a challenge after failure and complete it",
    category: "challenge",
    check: (d) => d.challenge_restart_complete === true,
  },
  {
    id: "challenge_power_couple",
    name: "Power Couple",
    description: "Complete any challenge alongside your partner",
    category: "challenge",
    check: (d) => d.challenge_partner_completed === true,
  },
  {
    id: "challenge_creator",
    name: "Challenge Creator",
    description: "Create and complete a custom challenge",
    category: "challenge",
    check: (d) => d.challenge_custom_completed === true,
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Can be triggered for a specific user or run for all
    let userIds: string[] = [];
    try {
      const body = await req.json();
      if (body.user_id) {
        userIds = [body.user_id];
      }
    } catch {
      // No body = run for all users
    }

    if (userIds.length === 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id");
      userIds = (profiles || []).map((p: any) => p.id);
    }

    const newAchievements: any[] = [];

    for (const userId of userIds) {
      // Fetch user stats
      const [
        { count: totalWorkouts },
        { data: streakData },
        { count: totalPrs },
        { count: totalJournalEntries },
        { data: weightData },
        { data: existingAchievements },
      ] = await Promise.all([
        supabaseAdmin.from("workout_sessions").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabaseAdmin.from("streaks").select("current_count").eq("user_id", userId).eq("streak_type", "daily_checkin").single(),
        supabaseAdmin.from("personal_records").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabaseAdmin.from("journal_entries").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabaseAdmin.from("weight_logs").select("weight_lbs").eq("user_id", userId).order("logged_at", { ascending: true }).limit(1),
        supabaseAdmin.from("user_achievements").select("achievement_id").eq("user_id", userId),
      ]);

      // Get latest weight for weight loss calculation
      const { data: latestWeight } = await supabaseAdmin
        .from("weight_logs")
        .select("weight_lbs")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(1);

      const startWeight = weightData?.[0]?.weight_lbs || 0;
      const currentWeight = latestWeight?.[0]?.weight_lbs || startWeight;
      const weightLost = Math.max(0, startWeight - currentWeight);

      const earnedIds = new Set(
        (existingAchievements || []).map((a: any) => a.achievement_id)
      );

      // ── Challenge data fetching ─────────────────────────────────────────
      const { data: enrollments } = await supabaseAdmin
        .from("challenge_enrollments")
        .select("*, challenge_definitions!inner(slug, duration_days, is_system)")
        .eq("user_id", userId);

      const allEnrollments = enrollments || [];
      const completedEnrollments = allEnrollments.filter((e: any) => e.status === "completed");

      // Count enrollments started
      const challengesStarted = allEnrollments.length;

      // Check halfway: any enrollment with current_day >= duration_days / 2
      const challengeHalfway = allEnrollments.some(
        (e: any) => e.current_day >= (e.challenge_definitions.duration_days / 2)
      );

      // Slug-based completions
      const completedSlugs = new Set(completedEnrollments.map((e: any) => e.challenge_definitions.slug));

      // 75 Soft: completed with 90%+ daily log compliance
      let challenge75SoftCompleted = false;
      const softEnrollment = completedEnrollments.find(
        (e: any) => e.challenge_definitions.slug === "75-soft"
      );
      if (softEnrollment) {
        const { count: logCount } = await supabaseAdmin
          .from("challenge_daily_logs")
          .select("*", { count: "exact", head: true })
          .eq("enrollment_id", softEnrollment.id)
          .eq("all_tasks_completed", true);
        const complianceRate = (logCount || 0) / softEnrollment.challenge_definitions.duration_days;
        challenge75SoftCompleted = complianceRate >= 0.9;
      }

      // Whole30: completed with all daily logs showing compliant_meals
      let challengeWhole30Completed = false;
      const whole30Enrollment = completedEnrollments.find(
        (e: any) => e.challenge_definitions.slug === "whole30"
      );
      if (whole30Enrollment) {
        const { data: whole30Logs } = await supabaseAdmin
          .from("challenge_daily_logs")
          .select("tasks_completed")
          .eq("enrollment_id", whole30Enrollment.id);
        challengeWhole30Completed = (whole30Logs || []).length > 0 && (whole30Logs || []).every(
          (log: any) => log.tasks_completed?.compliant_meals === true
        );
      }

      // Challenges completed this year
      const currentYear = new Date().getFullYear();
      const challengesCompletedYear = completedEnrollments.filter(
        (e: any) => e.actual_end_date && new Date(e.actual_end_date).getFullYear() === currentYear
      ).length;

      // Restart and complete: any completed enrollment with restart_count > 0
      const challengeRestartComplete = completedEnrollments.some(
        (e: any) => (e.restart_count || 0) > 0
      );

      // Partner challenge: any completed enrollment with partnership_id
      const challengePartnerCompleted = completedEnrollments.some(
        (e: any) => e.partnership_id != null
      );

      // Custom challenge: completed enrollment where challenge is_system = false
      const challengeCustomCompleted = completedEnrollments.some(
        (e: any) => e.challenge_definitions.is_system === false
      );

      // Plank: check workout_sets for plank exercise with duration >= 300 seconds
      const { count: plankCount } = await supabaseAdmin
        .from("workout_sets")
        .select("*, workout_sessions!inner(user_id), exercises!inner(name)", { count: "exact", head: true })
        .eq("workout_sessions.user_id", userId)
        .ilike("exercises.name", "%plank%")
        .gte("duration_seconds", 300);

      // Murph sub-40: check workout_sessions for murph with duration < 40 min (2400s)
      const { data: murphSessions } = await supabaseAdmin
        .from("workout_sessions")
        .select("duration_seconds")
        .eq("user_id", userId)
        .ilike("name", "%murph%")
        .lt("duration_seconds", 2400)
        .limit(1);

      const userData = {
        total_workouts: totalWorkouts || 0,
        current_streak: streakData?.current_count || 0,
        total_prs: totalPrs || 0,
        total_journal_entries: totalJournalEntries || 0,
        weight_lost: weightLost,
        meal_log_streak: 0, // Would need separate calculation
        revenue_goal_hit: false, // Would need business metric check

        // Challenge data
        challenges_started: challengesStarted,
        challenge_halfway: challengeHalfway,
        challenge_75_hard_completed: completedSlugs.has("75-hard"),
        challenge_75_soft_completed: challenge75SoftCompleted,
        challenge_murph_completed: completedSlugs.has("murph"),
        challenge_murph_sub40: (murphSessions || []).length > 0,
        challenge_c25k_completed: completedSlugs.has("c25k"),
        challenge_squat_completed: completedSlugs.has("30-day-squat"),
        challenge_plank_300s: (plankCount || 0) >= 1,
        challenge_sober_completed: completedSlugs.has("sober-month"),
        challenge_whole30_completed: challengeWhole30Completed,
        challenge_steps_completed: completedSlugs.has("10k-steps"),
        challenges_completed_year: challengesCompletedYear,
        challenge_restart_complete: challengeRestartComplete,
        challenge_partner_completed: challengePartnerCompleted,
        challenge_custom_completed: challengeCustomCompleted,
      };

      for (const achievement of ACHIEVEMENT_DEFINITIONS) {
        if (earnedIds.has(achievement.id)) continue;

        if (achievement.check(userData)) {
          const { error } = await supabaseAdmin
            .from("user_achievements")
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
              earned_at: new Date().toISOString(),
            });

          if (!error) {
            // Send notification
            await supabaseAdmin.from("notifications").insert({
              user_id: userId,
              type: "achievement",
              title: `Achievement Unlocked: ${achievement.name}`,
              body: achievement.description,
              data: { achievement_id: achievement.id, category: achievement.category },
              scheduled_for: new Date().toISOString(),
            });

            newAchievements.push({
              user_id: userId,
              achievement: achievement.name,
              achievement_id: achievement.id,
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        users_evaluated: userIds.length,
        new_achievements: newAchievements,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
