export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          key: string
          requirement_type: string | null
          requirement_value: number | null
          secret: boolean | null
          tier: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          key: string
          requirement_type?: string | null
          requirement_value?: number | null
          secret?: boolean | null
          tier?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          key?: string
          requirement_type?: string | null
          requirement_value?: number | null
          secret?: boolean | null
          tier?: string | null
          title?: string
        }
        Relationships: []
      }
      ai_chat_conversations: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          last_message_at: string | null
          message_count: number
          pinned: boolean
          title: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          message_count?: number
          pinned?: boolean
          title?: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          message_count?: number
          pinned?: boolean
          title?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          content: string
          context_snapshot: Json | null
          conversation_id: string
          created_at: string
          disclaimer_type: string | null
          id: string
          latency_ms: number | null
          model: string | null
          role: string
          suggestions: Json | null
          tokens_in: number | null
          tokens_out: number | null
          user_id: string
        }
        Insert: {
          content: string
          context_snapshot?: Json | null
          conversation_id: string
          created_at?: string
          disclaimer_type?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          role: string
          suggestions?: Json | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id: string
        }
        Update: {
          content?: string
          context_snapshot?: Json | null
          conversation_id?: string
          created_at?: string
          disclaimer_type?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          role?: string
          suggestions?: Json | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_predictions: {
        Row: {
          action_label: string | null
          action_route: string | null
          body: string
          category: string
          confidence: number
          created_at: string
          data_points: Json
          expires_at: string | null
          id: string
          is_acknowledged: boolean
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_route?: string | null
          body: string
          category: string
          confidence?: number
          created_at?: string
          data_points?: Json
          expires_at?: string | null
          id?: string
          is_acknowledged?: boolean
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_route?: string | null
          body?: string
          category?: string
          confidence?: number
          created_at?: string
          data_points?: Json
          expires_at?: string | null
          id?: string
          is_acknowledged?: boolean
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_screen_insights: {
        Row: {
          category: string
          created_at: string
          id: string
          insight: string
          refreshed_at: string
          screen_key: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          insight: string
          refreshed_at?: string
          screen_key: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          insight?: string
          refreshed_at?: string
          screen_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_screen_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          ai_recommendation_reason: string | null
          ai_recommended: boolean | null
          author: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          key_takeaways: string[] | null
          notes: string | null
          pages_read: number | null
          pages_total: number | null
          rating: number | null
          started_at: string | null
          status: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          ai_recommendation_reason?: string | null
          ai_recommended?: boolean | null
          author?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          key_takeaways?: string[] | null
          notes?: string | null
          pages_read?: number | null
          pages_total?: number | null
          rating?: number | null
          started_at?: string | null
          status?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          ai_recommendation_reason?: string | null
          ai_recommended?: boolean | null
          author?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          key_takeaways?: string[] | null
          notes?: string | null
          pages_read?: number | null
          pages_total?: number | null
          rating?: number | null
          started_at?: string | null
          status?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          category: string
          created_at: string | null
          current_spent: number | null
          id: string
          month: string
          monthly_limit: number
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          current_spent?: number | null
          id?: string
          month: string
          monthly_limit: number
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          current_spent?: number | null
          id?: string
          month?: string
          monthly_limit?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_milestones: {
        Row: {
          business_id: string | null
          celebration_message: string | null
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          id: string
          is_completed: boolean | null
          sort_order: number | null
          target_date: string | null
          target_metric: string | null
          target_value: number | null
          title: string
        }
        Insert: {
          business_id?: string | null
          celebration_message?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          is_completed?: boolean | null
          sort_order?: number | null
          target_date?: string | null
          target_metric?: string | null
          target_value?: number | null
          title: string
        }
        Update: {
          business_id?: string | null
          celebration_message?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          is_completed?: boolean | null
          sort_order?: number | null
          target_date?: string | null
          target_metric?: string | null
          target_value?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_milestones_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string | null
          customer_count: number | null
          description: string | null
          id: string
          logo_url: string | null
          monthly_expenses: number | null
          monthly_revenue: number | null
          name: string
          stripe_account_id: string | null
          stripe_connected: boolean | null
          type: string | null
          user_id: string | null
          valuation: number | null
        }
        Insert: {
          created_at?: string | null
          customer_count?: number | null
          description?: string | null
          id?: string
          logo_url?: string | null
          monthly_expenses?: number | null
          monthly_revenue?: number | null
          name: string
          stripe_account_id?: string | null
          stripe_connected?: boolean | null
          type?: string | null
          user_id?: string | null
          valuation?: number | null
        }
        Update: {
          created_at?: string | null
          customer_count?: number | null
          description?: string | null
          id?: string
          logo_url?: string | null
          monthly_expenses?: number | null
          monthly_revenue?: number | null
          name?: string
          stripe_account_id?: string | null
          stripe_connected?: boolean | null
          type?: string | null
          user_id?: string | null
          valuation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_daily_logs: {
        Row: {
          all_tasks_completed: boolean | null
          auto_verified: Json | null
          created_at: string | null
          date: string
          day_number: number
          enrollment_id: string | null
          id: string
          notes: string | null
          tasks_completed: Json
          user_id: string | null
        }
        Insert: {
          all_tasks_completed?: boolean | null
          auto_verified?: Json | null
          created_at?: string | null
          date?: string
          day_number: number
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          tasks_completed: Json
          user_id?: string | null
        }
        Update: {
          all_tasks_completed?: boolean | null
          auto_verified?: Json | null
          created_at?: string | null
          date?: string
          day_number?: number
          enrollment_id?: string | null
          id?: string
          notes?: string | null
          tasks_completed?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_daily_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "challenge_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_daily_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_definitions: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string | null
          duration_days: number
          estimated_daily_time_minutes: number | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          restart_on_failure: boolean | null
          rules: Json
          slug: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days: number
          estimated_daily_time_minutes?: number | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          restart_on_failure?: boolean | null
          rules: Json
          slug: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          duration_days?: number
          estimated_daily_time_minutes?: number | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          restart_on_failure?: boolean | null
          rules?: Json
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_enrollments: {
        Row: {
          actual_end_date: string | null
          challenge_id: string | null
          configuration: Json | null
          created_at: string | null
          current_day: number | null
          id: string
          partnership_id: string | null
          restart_count: number | null
          stake_goal_id: string | null
          started_at: string
          status: string | null
          target_end_date: string
          user_id: string | null
        }
        Insert: {
          actual_end_date?: string | null
          challenge_id?: string | null
          configuration?: Json | null
          created_at?: string | null
          current_day?: number | null
          id?: string
          partnership_id?: string | null
          restart_count?: number | null
          stake_goal_id?: string | null
          started_at?: string
          status?: string | null
          target_end_date: string
          user_id?: string | null
        }
        Update: {
          actual_end_date?: string | null
          challenge_id?: string | null
          configuration?: Json | null
          created_at?: string | null
          current_day?: number | null
          id?: string
          partnership_id?: string | null
          restart_count?: number | null
          stake_goal_id?: string | null
          started_at?: string
          status?: string | null
          target_end_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_enrollments_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_enrollments_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_enrollments_stake_goal_id_fkey"
            columns: ["stake_goal_id"]
            isOneToOne: false
            referencedRelation: "stake_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string | null
          current_progress: number | null
          id: string
          joined_at: string | null
          rank: number | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          current_progress?: number | null
          id?: string
          joined_at?: string | null
          rank?: number | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          current_progress?: number | null
          id?: string
          joined_at?: string | null
          rank?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "community_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_challenges: {
        Row: {
          challenge_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_public: boolean | null
          max_participants: number | null
          metric: string | null
          start_date: string | null
          target_value: number | null
          title: string
        }
        Insert: {
          challenge_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          metric?: string | null
          start_date?: string | null
          target_value?: number | null
          title: string
        }
        Update: {
          challenge_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_public?: boolean | null
          max_participants?: number | null
          metric?: string | null
          start_date?: string | null
          target_value?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_leaderboards: {
        Row: {
          category: string | null
          id: string
          period: string | null
          period_start: string | null
          rank: number | null
          score: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          id?: string
          period?: string | null
          period_start?: string | null
          rank?: number | null
          score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          id?: string
          period?: string | null
          period_start?: string | null
          rank?: number | null
          score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_leaderboards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      countdowns: {
        Row: {
          color: string | null
          created_at: string | null
          emoji: string | null
          id: string
          is_primary: boolean | null
          linked_goal_ids: string[] | null
          target_date: string
          title: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_primary?: boolean | null
          linked_goal_ids?: string[] | null
          target_date: string
          title: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_primary?: boolean | null
          linked_goal_ids?: string[] | null
          target_date?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "countdowns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          certificate_url: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          platform: string | null
          progress_percent: number | null
          started_at: string | null
          status: string | null
          title: string
          url: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          platform?: string | null
          progress_percent?: number | null
          started_at?: string | null
          status?: string | null
          title: string
          url?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          platform?: string | null
          progress_percent?: number | null
          started_at?: string | null
          status?: string | null
          title?: string
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          business_id: string | null
          churned_at: string | null
          created_at: string | null
          email: string | null
          id: string
          mrr: number | null
          name: string
          notes: string | null
          plan_tier: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          business_id?: string | null
          churned_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          mrr?: number | null
          name: string
          notes?: string | null
          plan_tier?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          business_id?: string | null
          churned_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          mrr?: number | null
          name?: string
          notes?: string | null
          plan_tier?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_affirmations: {
        Row: {
          action_tip: string | null
          affirmation: string | null
          audio_script: string | null
          created_at: string | null
          date: string
          gratitude_cue: string | null
          id: string
          intention: string | null
          reflection_prompt: string | null
          tomorrow_prep: string | null
          type: string
          user_id: string
          wind_down_exercise: string | null
        }
        Insert: {
          action_tip?: string | null
          affirmation?: string | null
          audio_script?: string | null
          created_at?: string | null
          date: string
          gratitude_cue?: string | null
          id?: string
          intention?: string | null
          reflection_prompt?: string | null
          tomorrow_prep?: string | null
          type: string
          user_id: string
          wind_down_exercise?: string | null
        }
        Update: {
          action_tip?: string | null
          affirmation?: string | null
          audio_script?: string | null
          created_at?: string | null
          date?: string
          gratitude_cue?: string | null
          id?: string
          intention?: string | null
          reflection_prompt?: string | null
          tomorrow_prep?: string | null
          type?: string
          user_id?: string
          wind_down_exercise?: string | null
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          ai_evening_reflection: string | null
          ai_morning_briefing: string | null
          calories_logged: number | null
          created_at: string | null
          date: string
          day_score: number | null
          focus_hours: number | null
          habits_completed: number | null
          habits_total: number | null
          id: string
          mood_average: number | null
          protein_logged: number | null
          revenue_logged: number | null
          sleep_hours: number | null
          user_id: string | null
          water_oz: number | null
          workouts_completed: number | null
        }
        Insert: {
          ai_evening_reflection?: string | null
          ai_morning_briefing?: string | null
          calories_logged?: number | null
          created_at?: string | null
          date?: string
          day_score?: number | null
          focus_hours?: number | null
          habits_completed?: number | null
          habits_total?: number | null
          id?: string
          mood_average?: number | null
          protein_logged?: number | null
          revenue_logged?: number | null
          sleep_hours?: number | null
          user_id?: string | null
          water_oz?: number | null
          workouts_completed?: number | null
        }
        Update: {
          ai_evening_reflection?: string | null
          ai_morning_briefing?: string | null
          calories_logged?: number | null
          created_at?: string | null
          date?: string
          day_score?: number | null
          focus_hours?: number | null
          habits_completed?: number | null
          habits_total?: number | null
          id?: string
          mood_average?: number | null
          protein_logged?: number | null
          revenue_logged?: number | null
          sleep_hours?: number | null
          user_id?: string | null
          water_oz?: number | null
          workouts_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          layout: Json
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          layout: Json
          name?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          layout?: Json
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string | null
          common_mistakes: string | null
          created_at: string | null
          created_by: string | null
          difficulty: string | null
          equipment: string | null
          id: string
          image_url: string | null
          instructions: string | null
          is_compound: boolean | null
          is_custom: boolean | null
          muscle_groups: string[]
          name: string
          tips: string | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          common_mistakes?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_compound?: boolean | null
          is_custom?: boolean | null
          muscle_groups: string[]
          name: string
          tips?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          common_mistakes?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          equipment?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_compound?: boolean | null
          is_custom?: boolean | null
          muscle_groups?: string[]
          name?: string
          tips?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_logs: {
        Row: {
          amount: number
          business_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_recurring: boolean | null
          recurring_interval: string | null
          transaction_date: string
        }
        Insert: {
          amount: number
          business_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurring_interval?: string | null
          transaction_date: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurring_interval?: string | null
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_accounts: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_recurring: boolean | null
          transaction_date: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          transaction_date: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          transaction_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          actual_duration_minutes: number | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          distractions_count: number | null
          id: string
          notes: string | null
          planned_duration_minutes: number | null
          productivity_rating: number | null
          started_at: string
          task_description: string | null
          user_id: string | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          distractions_count?: number | null
          id?: string
          notes?: string | null
          planned_duration_minutes?: number | null
          productivity_rating?: number | null
          started_at: string
          task_description?: string | null
          user_id?: string | null
        }
        Update: {
          actual_duration_minutes?: number | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          distractions_count?: number | null
          id?: string
          notes?: string | null
          planned_duration_minutes?: number | null
          productivity_rating?: number | null
          started_at?: string
          task_description?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          barcode: string | null
          brand: string | null
          calories: number
          carbs: number
          cholesterol: number | null
          created_at: string | null
          created_by: string | null
          fat: number
          fiber: number | null
          id: string
          image_url: string | null
          is_custom: boolean | null
          is_verified: boolean | null
          name: string
          open_food_facts_id: string | null
          potassium: number | null
          protein: number
          saturated_fat: number | null
          serving_size: number
          serving_unit: string
          sodium: number | null
          sugar: number | null
          trans_fat: number | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories: number
          carbs: number
          cholesterol?: number | null
          created_at?: string | null
          created_by?: string | null
          fat: number
          fiber?: number | null
          id?: string
          image_url?: string | null
          is_custom?: boolean | null
          is_verified?: boolean | null
          name: string
          open_food_facts_id?: string | null
          potassium?: number | null
          protein: number
          saturated_fat?: number | null
          serving_size: number
          serving_unit: string
          sodium?: number | null
          sugar?: number | null
          trans_fat?: number | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories?: number
          carbs?: number
          cholesterol?: number | null
          created_at?: string | null
          created_by?: string | null
          fat?: number
          fiber?: number | null
          id?: string
          image_url?: string | null
          is_custom?: boolean | null
          is_verified?: boolean | null
          name?: string
          open_food_facts_id?: string | null
          potassium?: number | null
          protein?: number
          saturated_fat?: number | null
          serving_size?: number
          serving_unit?: string
          sodium?: number | null
          sugar?: number | null
          trans_fat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "foods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      geofence_triggers: {
        Row: {
          action: string
          action_params: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          latitude: number
          longitude: number
          radius_meters: number | null
          trigger_on: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          action_params?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          latitude: number
          longitude: number
          radius_meters?: number | null
          trigger_on?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          action_params?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          latitude?: number
          longitude?: number
          radius_meters?: number | null
          trigger_on?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geofence_triggers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_milestones: {
        Row: {
          celebration_message: string | null
          completed_at: string | null
          created_at: string | null
          goal_id: string | null
          id: string
          is_completed: boolean | null
          sort_order: number | null
          target_date: string | null
          target_value: number | null
          title: string
        }
        Insert: {
          celebration_message?: string | null
          completed_at?: string | null
          created_at?: string | null
          goal_id?: string | null
          id?: string
          is_completed?: boolean | null
          sort_order?: number | null
          target_date?: string | null
          target_value?: number | null
          title: string
        }
        Update: {
          celebration_message?: string | null
          completed_at?: string | null
          created_at?: string | null
          goal_id?: string | null
          id?: string
          is_completed?: boolean | null
          sort_order?: number | null
          target_date?: string | null
          target_value?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          color: string | null
          completed_at: string | null
          countdown_id: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          goal_type: string | null
          icon: string | null
          id: string
          is_staked: boolean | null
          partnership_id: string | null
          priority: number | null
          stake_amount: number | null
          stake_charity: string | null
          start_date: string | null
          status: string | null
          target_date: string | null
          target_value: number | null
          title: string
          unit: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          completed_at?: string | null
          countdown_id?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          goal_type?: string | null
          icon?: string | null
          id?: string
          is_staked?: boolean | null
          partnership_id?: string | null
          priority?: number | null
          stake_amount?: number | null
          stake_charity?: string | null
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          target_value?: number | null
          title: string
          unit?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          completed_at?: string | null
          countdown_id?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          goal_type?: string | null
          icon?: string | null
          id?: string
          is_staked?: boolean | null
          partnership_id?: string | null
          priority?: number | null
          stake_amount?: number | null
          stake_charity?: string | null
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          target_value?: number | null
          title?: string
          unit?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_countdown_id_fkey"
            columns: ["countdown_id"]
            isOneToOne: false
            referencedRelation: "countdowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_lists: {
        Row: {
          ai_generated: boolean | null
          created_at: string | null
          id: string
          items: Json
          meal_prep_plan_id: string | null
          total_estimated_cost: number | null
          user_id: string | null
          week_start: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string | null
          id?: string
          items: Json
          meal_prep_plan_id?: string | null
          total_estimated_cost?: number | null
          user_id?: string | null
          week_start?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string | null
          id?: string
          items?: Json
          meal_prep_plan_id?: string | null
          total_estimated_cost?: number | null
          user_id?: string | null
          week_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grocery_lists_meal_prep_plan_id_fkey"
            columns: ["meal_prep_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_prep_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_completions: {
        Row: {
          completed_at: string | null
          completed_count: number | null
          habit_id: string | null
          id: string
          notes: string | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          completed_at?: string | null
          completed_count?: number | null
          habit_id?: string | null
          id?: string
          notes?: string | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          completed_at?: string | null
          completed_count?: number | null
          habit_id?: string | null
          id?: string
          notes?: string | null
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          current_streak: number | null
          custom_days: number[] | null
          description: string | null
          frequency: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          longest_streak: number | null
          name: string
          reminder_time: string | null
          sort_order: number | null
          streak_shields: number | null
          target_count: number | null
          unit: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          current_streak?: number | null
          custom_days?: number[] | null
          description?: string | null
          frequency?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          longest_streak?: number | null
          name: string
          reminder_time?: string | null
          sort_order?: number | null
          streak_shields?: number | null
          target_count?: number | null
          unit?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          current_streak?: number | null
          custom_days?: number[] | null
          description?: string | null
          frequency?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          longest_streak?: number | null
          name?: string
          reminder_time?: string | null
          sort_order?: number | null
          streak_shields?: number | null
          target_count?: number | null
          unit?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          ai_patterns_detected: Json | null
          ai_prompt: string | null
          ai_response: string | null
          created_at: string | null
          date: string
          entry_text: string | null
          gratitude: string[] | null
          id: string
          is_private: boolean | null
          mood_at_entry: number | null
          struggles: string[] | null
          tags: string[] | null
          tomorrow_focus: string[] | null
          user_id: string | null
          wins: string[] | null
        }
        Insert: {
          ai_patterns_detected?: Json | null
          ai_prompt?: string | null
          ai_response?: string | null
          created_at?: string | null
          date?: string
          entry_text?: string | null
          gratitude?: string[] | null
          id?: string
          is_private?: boolean | null
          mood_at_entry?: number | null
          struggles?: string[] | null
          tags?: string[] | null
          tomorrow_focus?: string[] | null
          user_id?: string | null
          wins?: string[] | null
        }
        Update: {
          ai_patterns_detected?: Json | null
          ai_prompt?: string | null
          ai_response?: string | null
          created_at?: string | null
          date?: string
          entry_text?: string | null
          gratitude?: string[] | null
          id?: string
          is_private?: boolean | null
          mood_at_entry?: number | null
          struggles?: string[] | null
          tags?: string[] | null
          tomorrow_focus?: string[] | null
          user_id?: string | null
          wins?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_biomarkers: {
        Row: {
          category: string | null
          collected_at: string | null
          created_at: string
          flag: string | null
          id: string
          interpretation_id: string | null
          name: string
          reference_high: number | null
          reference_low: number | null
          trend_note: string | null
          unit: string | null
          upload_id: string
          user_id: string
          value: number | null
        }
        Insert: {
          category?: string | null
          collected_at?: string | null
          created_at?: string
          flag?: string | null
          id?: string
          interpretation_id?: string | null
          name: string
          reference_high?: number | null
          reference_low?: number | null
          trend_note?: string | null
          unit?: string | null
          upload_id: string
          user_id: string
          value?: number | null
        }
        Update: {
          category?: string | null
          collected_at?: string | null
          created_at?: string
          flag?: string | null
          id?: string
          interpretation_id?: string | null
          name?: string
          reference_high?: number | null
          reference_low?: number | null
          trend_note?: string | null
          unit?: string | null
          upload_id?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_biomarkers_interpretation_id_fkey"
            columns: ["interpretation_id"]
            isOneToOne: false
            referencedRelation: "lab_interpretations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_biomarkers_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "lab_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_biomarkers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_interpretations: {
        Row: {
          concerns: Json
          created_at: string
          disclaimer_text: string
          follow_up_questions: Json
          highlights: Json
          id: string
          latency_ms: number | null
          lifestyle_suggestions: Json
          model: string
          overall_summary: string
          tokens_in: number | null
          tokens_out: number | null
          upload_id: string
          user_id: string
          wellness_score: number | null
        }
        Insert: {
          concerns?: Json
          created_at?: string
          disclaimer_text: string
          follow_up_questions?: Json
          highlights?: Json
          id?: string
          latency_ms?: number | null
          lifestyle_suggestions?: Json
          model: string
          overall_summary: string
          tokens_in?: number | null
          tokens_out?: number | null
          upload_id: string
          user_id: string
          wellness_score?: number | null
        }
        Update: {
          concerns?: Json
          created_at?: string
          disclaimer_text?: string
          follow_up_questions?: Json
          highlights?: Json
          id?: string
          latency_ms?: number | null
          lifestyle_suggestions?: Json
          model?: string
          overall_summary?: string
          tokens_in?: number | null
          tokens_out?: number | null
          upload_id?: string
          user_id?: string
          wellness_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_interpretations_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "lab_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_interpretations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_uploads: {
        Row: {
          collected_at: string | null
          created_at: string
          file_size_bytes: number | null
          file_type: string
          id: string
          lab_name: string | null
          mime_type: string
          notes: string | null
          status: string
          storage_path: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          collected_at?: string | null
          created_at?: string
          file_size_bytes?: number | null
          file_type: string
          id?: string
          lab_name?: string | null
          mime_type: string
          notes?: string | null
          status?: string
          storage_path: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          collected_at?: string | null
          created_at?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          lab_name?: string | null
          mime_type?: string
          notes?: string | null
          status?: string
          storage_path?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_workout_sync: {
        Row: {
          exercise_name: string | null
          id: string
          partner_id: string | null
          reps: number | null
          session_id: string | null
          set_number: number | null
          status: string | null
          synced_at: string | null
          user_id: string | null
          weight: number | null
        }
        Insert: {
          exercise_name?: string | null
          id?: string
          partner_id?: string | null
          reps?: number | null
          session_id?: string | null
          set_number?: number | null
          status?: string | null
          synced_at?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          exercise_name?: string | null
          id?: string
          partner_id?: string | null
          reps?: number | null
          session_id?: string | null
          set_number?: number | null
          status?: string | null
          synced_at?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_workout_sync_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_workout_sync_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_workout_sync_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_prep_plans: {
        Row: {
          ai_generated: boolean | null
          container_plan: Json | null
          created_at: string | null
          grocery_list: Json | null
          id: string
          meals: Json | null
          partnership_id: string | null
          prep_instructions: Json | null
          total_estimated_cost: number | null
          total_prep_time_minutes: number | null
          user_id: string | null
          week_start: string
        }
        Insert: {
          ai_generated?: boolean | null
          container_plan?: Json | null
          created_at?: string | null
          grocery_list?: Json | null
          id?: string
          meals?: Json | null
          partnership_id?: string | null
          prep_instructions?: Json | null
          total_estimated_cost?: number | null
          total_prep_time_minutes?: number | null
          user_id?: string | null
          week_start: string
        }
        Update: {
          ai_generated?: boolean | null
          container_plan?: Json | null
          created_at?: string | null
          grocery_list?: Json | null
          id?: string
          meals?: Json | null
          partnership_id?: string | null
          prep_instructions?: Json | null
          total_estimated_cost?: number | null
          total_prep_time_minutes?: number | null
          user_id?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_prep_plans_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_prep_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          bicep_left: number | null
          bicep_right: number | null
          calf_left: number | null
          calf_right: number | null
          chest: number | null
          forearm_left: number | null
          forearm_right: number | null
          hips: number | null
          id: string
          measured_at: string | null
          neck: number | null
          shoulders: number | null
          thigh_left: number | null
          thigh_right: number | null
          user_id: string | null
          waist: number | null
        }
        Insert: {
          bicep_left?: number | null
          bicep_right?: number | null
          calf_left?: number | null
          calf_right?: number | null
          chest?: number | null
          forearm_left?: number | null
          forearm_right?: number | null
          hips?: number | null
          id?: string
          measured_at?: string | null
          neck?: number | null
          shoulders?: number | null
          thigh_left?: number | null
          thigh_right?: number | null
          user_id?: string | null
          waist?: number | null
        }
        Update: {
          bicep_left?: number | null
          bicep_right?: number | null
          calf_left?: number | null
          calf_right?: number | null
          chest?: number | null
          forearm_left?: number | null
          forearm_right?: number | null
          hips?: number | null
          id?: string
          measured_at?: string | null
          neck?: number | null
          shoulders?: number | null
          thigh_left?: number | null
          thigh_right?: number | null
          user_id?: string | null
          waist?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mobility_sessions: {
        Row: {
          completed_at: string | null
          duration_minutes: number | null
          exercises_completed: Json | null
          id: string
          post_workout_session_id: string | null
          target_muscles: string[]
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          duration_minutes?: number | null
          exercises_completed?: Json | null
          id?: string
          post_workout_session_id?: string | null
          target_muscles: string[]
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          duration_minutes?: number | null
          exercises_completed?: Json | null
          id?: string
          post_workout_session_id?: string | null
          target_muscles?: string[]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mobility_sessions_post_workout_session_id_fkey"
            columns: ["post_workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobility_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_letters: {
        Row: {
          created_at: string | null
          highlights: Json | null
          id: string
          letter_text: string
          month: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          highlights?: Json | null
          id?: string
          letter_text: string
          month: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          highlights?: Json | null
          id?: string
          letter_text?: string
          month?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_letters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_retrospectives: {
        Row: {
          generated_at: string | null
          growth_areas: string[] | null
          headline: string | null
          id: string
          key_stats: Json | null
          letter: string | null
          month: string
          next_month_focus: string | null
          user_id: string
          wins: string[] | null
        }
        Insert: {
          generated_at?: string | null
          growth_areas?: string[] | null
          headline?: string | null
          id?: string
          key_stats?: Json | null
          letter?: string | null
          month: string
          next_month_focus?: string | null
          user_id: string
          wins?: string[] | null
        }
        Update: {
          generated_at?: string | null
          growth_areas?: string[] | null
          headline?: string | null
          id?: string
          key_stats?: Json | null
          letter?: string | null
          month?: string
          next_month_focus?: string | null
          user_id?: string
          wins?: string[] | null
        }
        Relationships: []
      }
      mood_logs: {
        Row: {
          context: string | null
          energy: number | null
          id: string
          logged_at: string | null
          mood: number | null
          motivation: number | null
          notes: string | null
          stress: number | null
          user_id: string | null
        }
        Insert: {
          context?: string | null
          energy?: number | null
          id?: string
          logged_at?: string | null
          mood?: number | null
          motivation?: number | null
          notes?: string | null
          stress?: number | null
          user_id?: string | null
        }
        Update: {
          context?: string | null
          energy?: number | null
          id?: string
          logged_at?: string | null
          mood?: number | null
          motivation?: number | null
          notes?: string | null
          stress?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_snapshots: {
        Row: {
          business_equity: number | null
          created_at: string | null
          id: string
          net_worth: number | null
          snapshot_date: string | null
          total_assets: number | null
          total_liabilities: number | null
          user_id: string | null
        }
        Insert: {
          business_equity?: number | null
          created_at?: string | null
          id?: string
          net_worth?: number | null
          snapshot_date?: string | null
          total_assets?: number | null
          total_liabilities?: number | null
          user_id?: string | null
        }
        Update: {
          business_equity?: number | null
          created_at?: string | null
          id?: string
          net_worth?: number | null
          snapshot_date?: string | null
          total_assets?: number | null
          total_liabilities?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "net_worth_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nfc_triggers: {
        Row: {
          action: string
          action_params: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          tag_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          action_params?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          tag_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          action_params?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          tag_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfc_triggers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          is_sent: boolean | null
          read_at: string | null
          sent_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          read_at?: string | null
          sent_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          read_at?: string | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_logs: {
        Row: {
          ai_confidence: number | null
          calories: number
          carbs: number
          created_at: string | null
          fat: number
          food_id: string | null
          id: string
          logged_at: string | null
          meal_type: string | null
          photo_url: string | null
          protein: number
          quantity: number
          saved_meal_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          ai_confidence?: number | null
          calories: number
          carbs: number
          created_at?: string | null
          fat: number
          food_id?: string | null
          id?: string
          logged_at?: string | null
          meal_type?: string | null
          photo_url?: string | null
          protein: number
          quantity?: number
          saved_meal_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          ai_confidence?: number | null
          calories?: number
          carbs?: number
          created_at?: string | null
          fat?: number
          food_id?: string | null
          id?: string
          logged_at?: string | null
          meal_type?: string | null
          photo_url?: string | null
          protein?: number
          quantity?: number
          saved_meal_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_logs_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_logs_saved_meal_id_fkey"
            columns: ["saved_meal_id"]
            isOneToOne: false
            referencedRelation: "saved_meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pain_logs: {
        Row: {
          body_part: string
          id: string
          logged_at: string | null
          notes: string | null
          pain_level: number | null
          pain_type: string | null
          user_id: string | null
        }
        Insert: {
          body_part: string
          id?: string
          logged_at?: string | null
          notes?: string | null
          pain_level?: number | null
          pain_type?: string | null
          user_id?: string | null
        }
        Update: {
          body_part?: string
          id?: string
          logged_at?: string | null
          notes?: string | null
          pain_level?: number | null
          pain_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pain_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_challenges: {
        Row: {
          challenge_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_days: number | null
          end_date: string | null
          id: string
          metric: string | null
          partnership_id: string | null
          stake_amount: number | null
          start_date: string | null
          status: string | null
          target_value: number | null
          title: string
          user_a_progress: number | null
          user_b_progress: number | null
          winner_id: string | null
        }
        Insert: {
          challenge_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          metric?: string | null
          partnership_id?: string | null
          stake_amount?: number | null
          start_date?: string | null
          status?: string | null
          target_value?: number | null
          title: string
          user_a_progress?: number | null
          user_b_progress?: number | null
          winner_id?: string | null
        }
        Update: {
          challenge_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          metric?: string | null
          partnership_id?: string | null
          stake_amount?: number | null
          start_date?: string | null
          status?: string | null
          target_value?: number | null
          title?: string
          user_a_progress?: number | null
          user_b_progress?: number | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_challenges_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_challenges_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_nudges: {
        Row: {
          created_at: string | null
          emoji: string | null
          from_user_id: string | null
          id: string
          is_read: boolean | null
          message: string | null
          reaction_to: string | null
          to_user_id: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          from_user_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          reaction_to?: string | null
          to_user_id?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          from_user_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          reaction_to?: string | null
          to_user_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_nudges_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_nudges_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partnerships: {
        Row: {
          created_at: string | null
          id: string
          invite_code: string | null
          joint_streak: number | null
          longest_joint_streak: number | null
          shared_preferences: Json | null
          status: string | null
          user_a: string | null
          user_b: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invite_code?: string | null
          joint_streak?: number | null
          longest_joint_streak?: number | null
          shared_preferences?: Json | null
          status?: string | null
          user_a?: string | null
          user_b?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invite_code?: string | null
          joint_streak?: number | null
          longest_joint_streak?: number | null
          shared_preferences?: Json | null
          status?: string | null
          user_a?: string | null
          user_b?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partnerships_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnerships_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          achieved_at: string | null
          created_at: string | null
          exercise_id: string | null
          id: string
          previous_record: number | null
          record_type: string | null
          user_id: string | null
          value: number
          workout_session_id: string | null
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          previous_record?: number | null
          record_type?: string | null
          user_id?: string | null
          value: number
          workout_session_id?: string | null
        }
        Update: {
          achieved_at?: string | null
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          previous_record?: number | null
          record_type?: string | null
          user_id?: string | null
          value?: number
          workout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      posture_analysis_results: {
        Row: {
          analyzed_at: string | null
          exercises_prescribed: Json | null
          follow_up_date: string | null
          front_view: Json | null
          id: string
          image_base64: string | null
          issues: string[] | null
          overall_score: number | null
          recommendations: string[] | null
          side_view: Json | null
          user_id: string
        }
        Insert: {
          analyzed_at?: string | null
          exercises_prescribed?: Json | null
          follow_up_date?: string | null
          front_view?: Json | null
          id?: string
          image_base64?: string | null
          issues?: string[] | null
          overall_score?: number | null
          recommendations?: string[] | null
          side_view?: Json | null
          user_id: string
        }
        Update: {
          analyzed_at?: string | null
          exercises_prescribed?: Json | null
          follow_up_date?: string | null
          front_view?: Json | null
          id?: string
          image_base64?: string | null
          issues?: string[] | null
          overall_score?: number | null
          recommendations?: string[] | null
          side_view?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      proactive_messages: {
        Row: {
          action_label: string | null
          action_url: string | null
          body: string
          category: string
          created_at: string
          expires_at: string | null
          id: string
          is_dismissed: boolean
          is_read: boolean
          reference_id: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          body: string
          category: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          reference_id?: string | null
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          body?: string
          category?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          reference_id?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proactive_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          avatar_url: string | null
          coaching_tone: string | null
          countdown_date: string | null
          countdown_label: string | null
          created_at: string | null
          current_level: number | null
          current_mrr: number | null
          current_weight: number | null
          customer_count: number | null
          daily_calorie_target: number | null
          daily_carb_target: number | null
          daily_fat_target: number | null
          daily_protein_target: number | null
          daily_water_target_oz: number | null
          date_of_birth: string | null
          display_name: string
          email: string
          estimated_hourly_value: number | null
          expo_push_token: string | null
          gamification_enabled: boolean | null
          gamification_style: string | null
          gender: string | null
          goal_deadline: string | null
          goal_direction: string | null
          goal_weight: number | null
          grocery_budget_weekly: number | null
          health_conditions: string[] | null
          height_inches: number | null
          id: string
          narrator_enabled: boolean | null
          narrator_voice: string | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          revenue_goal: number | null
          spotify_access_token: string | null
          spotify_connected: boolean | null
          spotify_refresh_token: string | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          stripe_subscription_id: string | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          supplement_budget_monthly: number | null
          theme: string | null
          timezone: string | null
          total_xp: number | null
          updated_at: string | null
          voice_commands_enabled: boolean | null
          watch_paired: boolean | null
          weekly_grocery_budget_usd: number | null
          workout_streak: number | null
        }
        Insert: {
          activity_level?: string | null
          avatar_url?: string | null
          coaching_tone?: string | null
          countdown_date?: string | null
          countdown_label?: string | null
          created_at?: string | null
          current_level?: number | null
          current_mrr?: number | null
          current_weight?: number | null
          customer_count?: number | null
          daily_calorie_target?: number | null
          daily_carb_target?: number | null
          daily_fat_target?: number | null
          daily_protein_target?: number | null
          daily_water_target_oz?: number | null
          date_of_birth?: string | null
          display_name: string
          email: string
          estimated_hourly_value?: number | null
          expo_push_token?: string | null
          gamification_enabled?: boolean | null
          gamification_style?: string | null
          gender?: string | null
          goal_deadline?: string | null
          goal_direction?: string | null
          goal_weight?: number | null
          grocery_budget_weekly?: number | null
          health_conditions?: string[] | null
          height_inches?: number | null
          id: string
          narrator_enabled?: boolean | null
          narrator_voice?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          revenue_goal?: number | null
          spotify_access_token?: string | null
          spotify_connected?: boolean | null
          spotify_refresh_token?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          supplement_budget_monthly?: number | null
          theme?: string | null
          timezone?: string | null
          total_xp?: number | null
          updated_at?: string | null
          voice_commands_enabled?: boolean | null
          watch_paired?: boolean | null
          weekly_grocery_budget_usd?: number | null
          workout_streak?: number | null
        }
        Update: {
          activity_level?: string | null
          avatar_url?: string | null
          coaching_tone?: string | null
          countdown_date?: string | null
          countdown_label?: string | null
          created_at?: string | null
          current_level?: number | null
          current_mrr?: number | null
          current_weight?: number | null
          customer_count?: number | null
          daily_calorie_target?: number | null
          daily_carb_target?: number | null
          daily_fat_target?: number | null
          daily_protein_target?: number | null
          daily_water_target_oz?: number | null
          date_of_birth?: string | null
          display_name?: string
          email?: string
          estimated_hourly_value?: number | null
          expo_push_token?: string | null
          gamification_enabled?: boolean | null
          gamification_style?: string | null
          gender?: string | null
          goal_deadline?: string | null
          goal_direction?: string | null
          goal_weight?: number | null
          grocery_budget_weekly?: number | null
          health_conditions?: string[] | null
          height_inches?: number | null
          id?: string
          narrator_enabled?: boolean | null
          narrator_voice?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          revenue_goal?: number | null
          spotify_access_token?: string | null
          spotify_connected?: boolean | null
          spotify_refresh_token?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          supplement_budget_monthly?: number | null
          theme?: string | null
          timezone?: string | null
          total_xp?: number | null
          updated_at?: string | null
          voice_commands_enabled?: boolean | null
          watch_paired?: boolean | null
          weekly_grocery_budget_usd?: number | null
          workout_streak?: number | null
        }
        Relationships: []
      }
      readiness_scores: {
        Row: {
          ai_explanation: string | null
          created_at: string | null
          date: string
          energy_component: number | null
          id: string
          recommendation: string | null
          score: number | null
          sleep_component: number | null
          soreness_component: number | null
          stress_component: number | null
          training_load_component: number | null
          user_id: string | null
        }
        Insert: {
          ai_explanation?: string | null
          created_at?: string | null
          date?: string
          energy_component?: number | null
          id?: string
          recommendation?: string | null
          score?: number | null
          sleep_component?: number | null
          soreness_component?: number | null
          stress_component?: number | null
          training_load_component?: number | null
          user_id?: string | null
        }
        Update: {
          ai_explanation?: string | null
          created_at?: string | null
          date?: string
          energy_component?: number | null
          id?: string
          recommendation?: string | null
          score?: number | null
          sleep_component?: number | null
          soreness_component?: number | null
          stress_component?: number | null
          training_load_component?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "readiness_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_logs: {
        Row: {
          amount: number
          business_id: string | null
          created_at: string | null
          customer_name: string | null
          description: string | null
          id: string
          source: string | null
          stripe_payment_id: string | null
          transaction_date: string
          type: string | null
        }
        Insert: {
          amount: number
          business_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          source?: string | null
          stripe_payment_id?: string | null
          transaction_date: string
          type?: string | null
        }
        Update: {
          amount?: number
          business_id?: string | null
          created_at?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          source?: string | null
          stripe_payment_id?: string | null
          transaction_date?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_meal_items: {
        Row: {
          created_at: string | null
          food_id: string | null
          id: string
          quantity: number
          saved_meal_id: string | null
        }
        Insert: {
          created_at?: string | null
          food_id?: string | null
          id?: string
          quantity?: number
          saved_meal_id?: string | null
        }
        Update: {
          created_at?: string | null
          food_id?: string | null
          id?: string
          quantity?: number
          saved_meal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_meal_items_saved_meal_id_fkey"
            columns: ["saved_meal_id"]
            isOneToOne: false
            referencedRelation: "saved_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_meals: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          instructions: string | null
          is_shared: boolean | null
          meal_type: string | null
          name: string
          prep_time_minutes: number | null
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_shared?: boolean | null
          meal_type?: string | null
          name: string
          prep_time_minutes?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_shared?: boolean | null
          meal_type?: string | null
          name?: string
          prep_time_minutes?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          created_at: string | null
          hours_practiced: number | null
          id: string
          name: string
          notes: string | null
          proficiency: number | null
          target_proficiency: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          hours_practiced?: number | null
          id?: string
          name: string
          notes?: string | null
          proficiency?: number | null
          target_proficiency?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          hours_practiced?: number | null
          id?: string
          name?: string
          notes?: string | null
          proficiency?: number | null
          target_proficiency?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_logs: {
        Row: {
          ai_sleep_recommendation: string | null
          bedtime: string
          caffeine_cutoff_time: string | null
          created_at: string | null
          date: string | null
          duration_hours: number | null
          duration_minutes: number | null
          id: string
          notes: string | null
          quality: number | null
          quality_score: number | null
          screen_cutoff_time: string | null
          source: string | null
          user_id: string | null
          wake_time: string
        }
        Insert: {
          ai_sleep_recommendation?: string | null
          bedtime: string
          caffeine_cutoff_time?: string | null
          created_at?: string | null
          date?: string | null
          duration_hours?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          quality?: number | null
          quality_score?: number | null
          screen_cutoff_time?: string | null
          source?: string | null
          user_id?: string | null
          wake_time: string
        }
        Update: {
          ai_sleep_recommendation?: string | null
          bedtime?: string
          caffeine_cutoff_time?: string | null
          created_at?: string | null
          date?: string | null
          duration_hours?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          quality?: number | null
          quality_score?: number | null
          screen_cutoff_time?: string | null
          source?: string | null
          user_id?: string | null
          wake_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_notification_rules: {
        Row: {
          cooldown_hours: number
          created_at: string
          custom_message: string | null
          id: string
          is_enabled: boolean
          last_triggered_at: string | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cooldown_hours?: number
          created_at?: string
          custom_message?: string | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cooldown_hours?: number
          created_at?: string
          custom_message?: string | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_notification_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_content: {
        Row: {
          caption: string | null
          content_data: Json | null
          created_at: string | null
          id: string
          image_url: string | null
          is_shared: boolean | null
          platform: string | null
          shared_at: string | null
          template: string | null
          type: string | null
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          caption?: string | null
          content_data?: Json | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_shared?: boolean | null
          platform?: string | null
          shared_at?: string | null
          template?: string | null
          type?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          caption?: string | null
          content_data?: Json | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_shared?: boolean | null
          platform?: string | null
          shared_at?: string | null
          template?: string | null
          type?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stake_evaluations: {
        Row: {
          amount_at_risk: number | null
          amount_charged: number | null
          created_at: string | null
          evaluation_data: Json | null
          id: string
          notes: string | null
          passed: boolean
          period_end: string | null
          period_start: string | null
          stake_goal_id: string | null
        }
        Insert: {
          amount_at_risk?: number | null
          amount_charged?: number | null
          created_at?: string | null
          evaluation_data?: Json | null
          id?: string
          notes?: string | null
          passed: boolean
          period_end?: string | null
          period_start?: string | null
          stake_goal_id?: string | null
        }
        Update: {
          amount_at_risk?: number | null
          amount_charged?: number | null
          created_at?: string | null
          evaluation_data?: Json | null
          id?: string
          notes?: string | null
          passed?: boolean
          period_end?: string | null
          period_start?: string | null
          stake_goal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stake_evaluations_stake_goal_id_fkey"
            columns: ["stake_goal_id"]
            isOneToOne: false
            referencedRelation: "stake_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      stake_goals: {
        Row: {
          charity_name: string | null
          charity_url: string | null
          created_at: string | null
          currency: string | null
          evaluated_at: string | null
          evaluation_criteria: Json | null
          evaluation_date: string | null
          evaluation_evidence: Json | null
          evaluation_frequency: string | null
          goal_direction: string | null
          goal_id: string | null
          goal_type: string | null
          id: string
          is_active: boolean | null
          partner_receives: boolean | null
          payment_intent_id: string | null
          stake_amount: number
          start_date: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          target_value: number | null
          total_lost: number | null
          total_saved: number | null
          user_id: string | null
        }
        Insert: {
          charity_name?: string | null
          charity_url?: string | null
          created_at?: string | null
          currency?: string | null
          evaluated_at?: string | null
          evaluation_criteria?: Json | null
          evaluation_date?: string | null
          evaluation_evidence?: Json | null
          evaluation_frequency?: string | null
          goal_direction?: string | null
          goal_id?: string | null
          goal_type?: string | null
          id?: string
          is_active?: boolean | null
          partner_receives?: boolean | null
          payment_intent_id?: string | null
          stake_amount: number
          start_date?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          target_value?: number | null
          total_lost?: number | null
          total_saved?: number | null
          user_id?: string | null
        }
        Update: {
          charity_name?: string | null
          charity_url?: string | null
          created_at?: string | null
          currency?: string | null
          evaluated_at?: string | null
          evaluation_criteria?: Json | null
          evaluation_date?: string | null
          evaluation_evidence?: Json | null
          evaluation_frequency?: string | null
          goal_direction?: string | null
          goal_id?: string | null
          goal_type?: string | null
          id?: string
          is_active?: boolean | null
          partner_receives?: boolean | null
          payment_intent_id?: string | null
          stake_amount?: number
          start_date?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          target_value?: number | null
          total_lost?: number | null
          total_saved?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stake_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stake_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      step_logs: {
        Row: {
          created_at: string | null
          date: string
          id: string
          source: string
          steps: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          source?: string
          steps?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          source?: string
          steps?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "step_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_interval:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          partner_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          partner_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          partner_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_partner_subscription_id_fkey"
            columns: ["partner_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_logs: {
        Row: {
          id: string
          supplement_id: string | null
          taken_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          supplement_id?: string | null
          taken_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          supplement_id?: string | null
          taken_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplement_logs_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplements: {
        Row: {
          ai_recommendation_reason: string | null
          category: string | null
          created_at: string | null
          dosage: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          is_ai_recommended: boolean | null
          name: string
          times: string[] | null
          user_id: string | null
        }
        Insert: {
          ai_recommendation_reason?: string | null
          category?: string | null
          created_at?: string | null
          dosage?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          is_ai_recommended?: boolean | null
          name: string
          times?: string[] | null
          user_id?: string | null
        }
        Update: {
          ai_recommendation_reason?: string | null
          category?: string | null
          created_at?: string | null
          dosage?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          is_ai_recommended?: boolean | null
          name?: string
          times?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feature_gates: {
        Row: {
          gates: Json
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          gates?: Json
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          gates?: Json
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feature_gates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_supplement_logs: {
        Row: {
          id: string
          supplement_id: string
          taken_at: string
          user_id: string
        }
        Insert: {
          id?: string
          supplement_id: string
          taken_at?: string
          user_id: string
        }
        Update: {
          id?: string
          supplement_id?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_supplement_logs_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "user_supplements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_supplement_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_supplements: {
        Row: {
          ai_recommendation_reason: string | null
          bottle_size: number | null
          category: string | null
          created_at: string
          dosage: string | null
          evidence_level: string | null
          evidence_sources: Json
          frequency: string | null
          id: string
          is_active: boolean
          is_ai_recommended: boolean
          monthly_cost: number | null
          name: string
          notes: string | null
          priority: number
          purchase_url: string | null
          purchased_at: string | null
          reorder_reminder_sent: boolean
          tier: string
          timing: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_recommendation_reason?: string | null
          bottle_size?: number | null
          category?: string | null
          created_at?: string
          dosage?: string | null
          evidence_level?: string | null
          evidence_sources?: Json
          frequency?: string | null
          id?: string
          is_active?: boolean
          is_ai_recommended?: boolean
          monthly_cost?: number | null
          name: string
          notes?: string | null
          priority?: number
          purchase_url?: string | null
          purchased_at?: string | null
          reorder_reminder_sent?: boolean
          tier?: string
          timing?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_recommendation_reason?: string | null
          bottle_size?: number | null
          category?: string | null
          created_at?: string
          dosage?: string | null
          evidence_level?: string | null
          evidence_sources?: Json
          frequency?: string | null
          id?: string
          is_active?: boolean
          is_ai_recommended?: boolean
          monthly_cost?: number | null
          name?: string
          notes?: string | null
          priority?: number
          purchase_url?: string | null
          purchased_at?: string | null
          reorder_reminder_sent?: boolean
          tier?: string
          timing?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_supplements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vision_board_items: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          image_url: string
          linked_goal_id: string | null
          sort_order: number | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          linked_goal_id?: string | null
          sort_order?: number | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          linked_goal_id?: string | null
          sort_order?: number | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vision_board_items_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vision_board_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      water_logs: {
        Row: {
          amount_oz: number
          id: string
          logged_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_oz: number
          id?: string
          logged_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_oz?: number
          id?: string
          logged_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "water_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_cache: {
        Row: {
          aqi: number | null
          condition: string
          condition_code: string | null
          feels_like_f: number | null
          fetched_at: string
          humidity: number | null
          id: string
          latitude: number
          longitude: number
          sunrise: string | null
          sunset: string | null
          temperature_f: number | null
          user_id: string
          uv_index: number | null
          wind_mph: number | null
        }
        Insert: {
          aqi?: number | null
          condition: string
          condition_code?: string | null
          feels_like_f?: number | null
          fetched_at?: string
          humidity?: number | null
          id?: string
          latitude: number
          longitude: number
          sunrise?: string | null
          sunset?: string | null
          temperature_f?: number | null
          user_id: string
          uv_index?: number | null
          wind_mph?: number | null
        }
        Update: {
          aqi?: number | null
          condition?: string
          condition_code?: string | null
          feels_like_f?: number | null
          fetched_at?: string
          humidity?: number | null
          id?: string
          latitude?: number
          longitude?: number
          sunrise?: string | null
          sunset?: string | null
          temperature_f?: number | null
          user_id?: string
          uv_index?: number | null
          wind_mph?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reviews: {
        Row: {
          ai_weekly_summary: string | null
          areas_to_improve: string[] | null
          avg_calories: number | null
          avg_mood: number | null
          avg_protein: number | null
          avg_readiness: number | null
          avg_sleep_hours: number | null
          body_business_correlations: Json | null
          business_grade: string | null
          created_at: string | null
          cumulative_revenue: number | null
          fitness_grade: string | null
          focus_hours_total: number | null
          habits_completion_rate: number | null
          habits_grade: string | null
          id: string
          new_customers: number | null
          next_week_goals: string[] | null
          nutrition_grade: string | null
          overall_grade: string | null
          prs_this_week: number | null
          revenue_this_week: number | null
          sleep_grade: string | null
          top_wins: string[] | null
          user_id: string | null
          week_start: string
          weight_change: number | null
          workouts_completed: number | null
          workouts_target: number | null
        }
        Insert: {
          ai_weekly_summary?: string | null
          areas_to_improve?: string[] | null
          avg_calories?: number | null
          avg_mood?: number | null
          avg_protein?: number | null
          avg_readiness?: number | null
          avg_sleep_hours?: number | null
          body_business_correlations?: Json | null
          business_grade?: string | null
          created_at?: string | null
          cumulative_revenue?: number | null
          fitness_grade?: string | null
          focus_hours_total?: number | null
          habits_completion_rate?: number | null
          habits_grade?: string | null
          id?: string
          new_customers?: number | null
          next_week_goals?: string[] | null
          nutrition_grade?: string | null
          overall_grade?: string | null
          prs_this_week?: number | null
          revenue_this_week?: number | null
          sleep_grade?: string | null
          top_wins?: string[] | null
          user_id?: string | null
          week_start: string
          weight_change?: number | null
          workouts_completed?: number | null
          workouts_target?: number | null
        }
        Update: {
          ai_weekly_summary?: string | null
          areas_to_improve?: string[] | null
          avg_calories?: number | null
          avg_mood?: number | null
          avg_protein?: number | null
          avg_readiness?: number | null
          avg_sleep_hours?: number | null
          body_business_correlations?: Json | null
          business_grade?: string | null
          created_at?: string | null
          cumulative_revenue?: number | null
          fitness_grade?: string | null
          focus_hours_total?: number | null
          habits_completion_rate?: number | null
          habits_grade?: string | null
          id?: string
          new_customers?: number | null
          next_week_goals?: string[] | null
          nutrition_grade?: string | null
          overall_grade?: string | null
          prs_this_week?: number | null
          revenue_this_week?: number | null
          sleep_grade?: string | null
          top_wins?: string[] | null
          user_id?: string | null
          week_start?: string
          weight_change?: number | null
          workouts_completed?: number | null
          workouts_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_logs: {
        Row: {
          ai_body_analysis: Json | null
          body_fat_percentage: number | null
          created_at: string | null
          date: string | null
          id: string
          logged_at: string | null
          notes: string | null
          photo_back_url: string | null
          photo_front_url: string | null
          photo_side_url: string | null
          source: string | null
          user_id: string | null
          weight: number
          weight_kg: number | null
        }
        Insert: {
          ai_body_analysis?: Json | null
          body_fat_percentage?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          photo_back_url?: string | null
          photo_front_url?: string | null
          photo_side_url?: string | null
          source?: string | null
          user_id?: string | null
          weight: number
          weight_kg?: number | null
        }
        Update: {
          ai_body_analysis?: Json | null
          body_fat_percentage?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          photo_back_url?: string | null
          photo_front_url?: string | null
          photo_side_url?: string | null
          source?: string | null
          user_id?: string | null
          weight?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          ai_form_feedback: Json | null
          completed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          energy_level: number | null
          form_check_video_url: string | null
          id: string
          is_live_sync: boolean | null
          is_with_partner: boolean | null
          mobility_completed: boolean | null
          mood_after: number | null
          mood_before: number | null
          name: string
          notes: string | null
          partner_session_id: string | null
          readiness_score: number | null
          spotify_playlist_id: string | null
          started_at: string
          template_id: string | null
          total_sets: number | null
          total_volume: number | null
          user_id: string | null
        }
        Insert: {
          ai_form_feedback?: Json | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          energy_level?: number | null
          form_check_video_url?: string | null
          id?: string
          is_live_sync?: boolean | null
          is_with_partner?: boolean | null
          mobility_completed?: boolean | null
          mood_after?: number | null
          mood_before?: number | null
          name: string
          notes?: string | null
          partner_session_id?: string | null
          readiness_score?: number | null
          spotify_playlist_id?: string | null
          started_at: string
          template_id?: string | null
          total_sets?: number | null
          total_volume?: number | null
          user_id?: string | null
        }
        Update: {
          ai_form_feedback?: Json | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          energy_level?: number | null
          form_check_video_url?: string | null
          id?: string
          is_live_sync?: boolean | null
          is_with_partner?: boolean | null
          mobility_completed?: boolean | null
          mood_after?: number | null
          mood_before?: number | null
          name?: string
          notes?: string | null
          partner_session_id?: string | null
          readiness_score?: number | null
          spotify_playlist_id?: string | null
          started_at?: string
          template_id?: string | null
          total_sets?: number | null
          total_volume?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          created_at: string | null
          distance: number | null
          duration_seconds: number | null
          exercise_id: string | null
          ghost_beaten: boolean | null
          ghost_reps: number | null
          ghost_weight: number | null
          id: string
          is_dropset: boolean | null
          is_failure: boolean | null
          is_personal_record: boolean | null
          is_warmup: boolean | null
          logged_at: string | null
          notes: string | null
          reps: number | null
          rpe: number | null
          session_id: string | null
          set_number: number
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          distance?: number | null
          duration_seconds?: number | null
          exercise_id?: string | null
          ghost_beaten?: boolean | null
          ghost_reps?: number | null
          ghost_weight?: number | null
          id?: string
          is_dropset?: boolean | null
          is_failure?: boolean | null
          is_personal_record?: boolean | null
          is_warmup?: boolean | null
          logged_at?: string | null
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          session_id?: string | null
          set_number: number
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          distance?: number | null
          duration_seconds?: number | null
          exercise_id?: string | null
          ghost_beaten?: boolean | null
          ghost_reps?: number | null
          ghost_weight?: number | null
          id?: string
          is_dropset?: boolean | null
          is_failure?: boolean | null
          is_personal_record?: boolean | null
          is_warmup?: boolean | null
          logged_at?: string | null
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          session_id?: string | null
          set_number?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_template_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string | null
          id: string
          notes: string | null
          rest_seconds: number | null
          sort_order: number
          superset_group: string | null
          target_reps: string | null
          target_rpe: number | null
          target_sets: number | null
          target_weight: number | null
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          notes?: string | null
          rest_seconds?: number | null
          sort_order: number
          superset_group?: string | null
          target_reps?: string | null
          target_rpe?: number | null
          target_sets?: number | null
          target_weight?: number | null
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          notes?: string | null
          rest_seconds?: number | null
          sort_order?: number
          superset_group?: string | null
          target_reps?: string | null
          target_rpe?: number | null
          target_sets?: number | null
          target_weight?: number | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_template_exercises_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          ai_last_adjusted_at: string | null
          category: string | null
          created_at: string | null
          day_of_week: number | null
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_ai_generated: boolean | null
          is_shared: boolean | null
          name: string
          sort_order: number | null
          user_id: string | null
        }
        Insert: {
          ai_last_adjusted_at?: string | null
          category?: string | null
          created_at?: string | null
          day_of_week?: number | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_ai_generated?: boolean | null
          is_shared?: boolean | null
          name: string
          sort_order?: number | null
          user_id?: string | null
        }
        Update: {
          ai_last_adjusted_at?: string | null
          category?: string | null
          created_at?: string | null
          day_of_week?: number | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_ai_generated?: boolean | null
          is_shared?: boolean | null
          name?: string
          sort_order?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reason: string
          reference_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reason: string
          reference_id?: string | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reason?: string
          reference_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_partner: { Args: { check_user: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      billing_interval: "monthly" | "annual"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "paused"
      subscription_tier: "free" | "pro" | "elite" | "partners"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      billing_interval: ["monthly", "annual"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "paused",
      ],
      subscription_tier: ["free", "pro", "elite", "partners"],
    },
  },
} as const
// ==========================================
// PROFILES
// ==========================================

export interface NotificationPreferences {
  wake_up: { enabled: boolean; time: string };
  meals: { enabled: boolean; times: string[] };
  gym: { enabled: boolean; time: string };
  sleep: { enabled: boolean; time: string };
  water: { enabled: boolean; interval_minutes: number };
  daily_checkin: { enabled: boolean; time: string };
  weekly_review: { enabled: boolean; day: string; time: string };
  focus_reminder: { enabled: boolean; time: string };
  supplement: { enabled: boolean };
  partner_activity: { enabled: boolean };
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height_inches?: number;
  current_weight?: number;
  goal_weight?: number;
  goal_direction?: 'gain' | 'lose' | 'maintain';
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
  daily_calorie_target?: number;
  daily_protein_target?: number;
  daily_carb_target?: number;
  daily_fat_target?: number;
  daily_water_target_oz?: number;
  timezone?: string;
  theme?: 'dark' | 'light' | 'system';
  notification_preferences?: NotificationPreferences;
  voice_commands_enabled?: boolean;
  narrator_enabled?: boolean;
  narrator_voice?: string;
  spotify_connected?: boolean;
  spotify_access_token?: string;
  spotify_refresh_token?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_tier?: 'free' | 'pro' | 'elite' | 'partners';
  subscription_expires_at?: string;
  watch_paired?: boolean;
  expo_push_token?: string;
  supplement_budget_monthly?: number;
  weekly_grocery_budget_usd?: number;
  onboarding_completed?: boolean;
  coaching_tone?: 'drill_sergeant' | 'motivational' | 'balanced' | 'calm';
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// PARTNERSHIPS
// ==========================================

export interface SharedPreferences {
  can_see_weight: boolean;
  can_see_workouts: boolean;
  can_see_nutrition: boolean;
  can_see_habits: boolean;
  can_see_goals: boolean;
  can_see_mood: boolean;
  can_see_journal: boolean;
  can_see_business: boolean;
  can_see_finance: boolean;
  can_nudge: boolean;
  can_challenge: boolean;
  live_sync_enabled: boolean;
}

export interface Partnership {
  id: string;
  user_a?: string;
  user_b?: string;
  status?: 'pending' | 'active' | 'paused' | 'ended';
  invite_code?: string;
  shared_preferences?: SharedPreferences;
  joint_streak?: number;
  longest_joint_streak?: number;
  created_at?: string;
}

// ==========================================
// COUNTDOWNS
// ==========================================

export interface Countdown {
  id: string;
  user_id?: string;
  title: string;
  target_date: string;
  emoji?: string;
  is_primary?: boolean;
  color?: string;
  linked_goal_ids?: string[];
  created_at?: string;
}

// ==========================================
// FITNESS
// ==========================================

export interface Exercise {
  id: string;
  name: string;
  category?: 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'glutes' | 'abs' | 'cardio' | 'compound' | 'olympic' | 'stretching' | 'mobility';
  muscle_groups: string[];
  equipment?: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'bands' | 'smith_machine' | 'trx' | 'other';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string;
  tips?: string;
  common_mistakes?: string;
  video_url?: string;
  image_url?: string;
  is_compound?: boolean;
  is_custom?: boolean;
  created_by?: string;
  created_at?: string;
}

export interface WeightLog {
  id: string;
  user_id?: string;
  weight: number;
  body_fat_percentage?: number;
  photo_front_url?: string;
  photo_side_url?: string;
  photo_back_url?: string;
  ai_body_analysis?: Record<string, unknown>;
  notes?: string;
  logged_at?: string;
  created_at?: string;
}

export interface Measurement {
  id: string;
  user_id?: string;
  chest?: number;
  waist?: number;
  hips?: number;
  bicep_left?: number;
  bicep_right?: number;
  thigh_left?: number;
  thigh_right?: number;
  calf_left?: number;
  calf_right?: number;
  neck?: number;
  shoulders?: number;
  forearm_left?: number;
  forearm_right?: number;
  measured_at?: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  day_of_week?: number;
  estimated_duration_minutes?: number;
  is_shared?: boolean;
  is_ai_generated?: boolean;
  ai_last_adjusted_at?: string;
  sort_order?: number;
  created_at?: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  template_id?: string;
  exercise_id?: string;
  sort_order: number;
  target_sets?: number;
  target_reps?: string;
  target_weight?: number;
  target_rpe?: number;
  rest_seconds?: number;
  superset_group?: string;
  notes?: string;
  created_at?: string;
}

export interface WorkoutSession {
  id: string;
  user_id?: string;
  template_id?: string;
  name: string;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  total_volume?: number;
  total_sets?: number;
  notes?: string;
  mood_before?: number;
  mood_after?: number;
  energy_level?: number;
  readiness_score?: number;
  is_with_partner?: boolean;
  is_live_sync?: boolean;
  partner_session_id?: string;
  spotify_playlist_id?: string;
  form_check_video_url?: string;
  ai_form_feedback?: Record<string, unknown>;
  mobility_completed?: boolean;
  created_at?: string;
}

export interface WorkoutSet {
  id: string;
  session_id?: string;
  exercise_id?: string;
  set_number: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  distance?: number;
  is_warmup?: boolean;
  is_dropset?: boolean;
  is_failure?: boolean;
  is_personal_record?: boolean;
  rpe?: number;
  ghost_weight?: number;
  ghost_reps?: number;
  ghost_beaten?: boolean;
  notes?: string;
  logged_at?: string;
  created_at?: string;
}

export interface PersonalRecord {
  id: string;
  user_id?: string;
  exercise_id?: string;
  record_type?: 'max_weight' | 'max_reps' | 'max_volume' | 'max_duration' | 'max_1rm';
  value: number;
  previous_record?: number;
  workout_session_id?: string;
  achieved_at?: string;
  created_at?: string;
}

export interface LiveWorkoutSync {
  id: string;
  session_id?: string;
  user_id?: string;
  partner_id?: string;
  exercise_name?: string;
  set_number?: number;
  reps?: number;
  weight?: number;
  status?: 'resting' | 'active' | 'completed';
  synced_at?: string;
}

export interface PainLog {
  id: string;
  user_id?: string;
  body_part: string;
  pain_level?: number;
  pain_type?: 'sharp' | 'dull' | 'aching' | 'burning' | 'tingling' | 'stiffness';
  notes?: string;
  logged_at?: string;
}

export interface MobilitySession {
  id: string;
  user_id?: string;
  target_muscles: string[];
  duration_minutes?: number;
  exercises_completed?: Record<string, unknown>;
  post_workout_session_id?: string;
  completed_at?: string;
}

// ==========================================
// NUTRITION
// ==========================================

export interface Food {
  id: string;
  name: string;
  brand?: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturated_fat?: number;
  trans_fat?: number;
  cholesterol?: number;
  potassium?: number;
  barcode?: string;
  open_food_facts_id?: string;
  image_url?: string;
  is_custom?: boolean;
  created_by?: string;
  is_verified?: boolean;
  created_at?: string;
}

export interface SavedMeal {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'shake' | 'pre_workout' | 'post_workout';
  is_shared?: boolean;
  total_calories?: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  prep_time_minutes?: number;
  instructions?: string;
  image_url?: string;
  created_at?: string;
}

export interface SavedMealItem {
  id: string;
  saved_meal_id?: string;
  food_id?: string;
  quantity?: number;
  created_at?: string;
}

export interface NutritionLog {
  id: string;
  user_id?: string;
  food_id?: string;
  saved_meal_id?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'shake' | 'pre_workout' | 'post_workout';
  quantity?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source?: 'manual' | 'camera' | 'barcode' | 'voice' | 'saved_meal' | 'menu_scan';
  photo_url?: string;
  ai_confidence?: number;
  logged_at?: string;
  created_at?: string;
}

export interface WaterLog {
  id: string;
  user_id?: string;
  amount_oz: number;
  logged_at?: string;
}

export interface Supplement {
  id: string;
  user_id?: string;
  name: string;
  dosage?: string;
  frequency?: string;
  times?: string[];
  category?: 'protein' | 'creatine' | 'vitamin' | 'mineral' | 'amino_acid' | 'pre_workout' | 'post_workout' | 'sleep' | 'other';
  is_ai_recommended?: boolean;
  ai_recommendation_reason?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface SupplementLog {
  id: string;
  user_id?: string;
  supplement_id?: string;
  taken_at?: string;
}

export interface MealPrepPlan {
  id: string;
  user_id?: string;
  partnership_id?: string;
  week_start: string;
  total_prep_time_minutes?: number;
  grocery_list?: Record<string, unknown>;
  total_estimated_cost?: number;
  meals?: Record<string, unknown>;
  prep_instructions?: Record<string, unknown>;
  container_plan?: Record<string, unknown>;
  ai_generated?: boolean;
  created_at?: string;
}

export interface GroceryList {
  id: string;
  user_id?: string;
  meal_prep_plan_id?: string;
  week_start?: string;
  items: Record<string, unknown>;
  total_estimated_cost?: number;
  ai_generated?: boolean;
  created_at?: string;
}

// ==========================================
// GOALS & HABITS
// ==========================================

export interface Goal {
  id: string;
  user_id?: string;
  partnership_id?: string;
  title: string;
  description?: string;
  category?: 'fitness' | 'nutrition' | 'business' | 'financial' | 'personal' | 'relationship' | 'education' | 'health' | 'mindset';
  goal_type?: 'target' | 'habit' | 'milestone' | 'project';
  target_value?: number;
  current_value?: number;
  unit?: string;
  start_date?: string;
  target_date?: string;
  countdown_id?: string;
  status?: 'active' | 'completed' | 'paused' | 'abandoned';
  priority?: number;
  color?: string;
  icon?: string;
  is_staked?: boolean;
  stake_amount?: number;
  stake_charity?: string;
  created_at?: string;
  completed_at?: string;
}

export interface GoalMilestone {
  id: string;
  goal_id?: string;
  title: string;
  target_value?: number;
  target_date?: string;
  is_completed?: boolean;
  completed_at?: string;
  celebration_message?: string;
  sort_order?: number;
  created_at?: string;
}

export interface Habit {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  category?: 'fitness' | 'nutrition' | 'business' | 'health' | 'personal' | 'mindset' | 'finance' | 'learning';
  frequency?: 'daily' | 'weekdays' | 'weekends' | 'custom';
  custom_days?: number[];
  target_count?: number;
  unit?: string;
  reminder_time?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
  current_streak?: number;
  longest_streak?: number;
  streak_shields?: number;
  sort_order?: number;
  created_at?: string;
}

export interface HabitCompletion {
  id: string;
  habit_id?: string;
  user_id?: string;
  completed_count?: number;
  value?: number;
  notes?: string;
  completed_at?: string;
}

// ==========================================
// SLEEP & MOOD
// ==========================================

export interface SleepLog {
  id: string;
  user_id?: string;
  bedtime: string;
  wake_time: string;
  duration_minutes?: number;
  quality?: number;
  caffeine_cutoff_time?: string;
  screen_cutoff_time?: string;
  notes?: string;
  ai_sleep_recommendation?: string;
  created_at?: string;
}

export interface MoodLog {
  id: string;
  user_id?: string;
  mood?: number;
  energy?: number;
  stress?: number;
  motivation?: number;
  context?: 'morning' | 'midday' | 'afternoon' | 'evening' | 'post_workout' | 'post_meal';
  notes?: string;
  logged_at?: string;
}

export interface ReadinessScore {
  id: string;
  user_id?: string;
  date: string;
  score?: number;
  sleep_component?: number;
  soreness_component?: number;
  stress_component?: number;
  energy_component?: number;
  training_load_component?: number;
  recommendation?: 'go_hard' | 'moderate' | 'light' | 'rest';
  ai_explanation?: string;
  created_at?: string;
}

// ==========================================
// BUSINESS
// ==========================================

export interface Business {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  type?: 'saas' | 'service' | 'product' | 'consulting' | 'other';
  valuation?: number;
  monthly_revenue?: number;
  monthly_expenses?: number;
  customer_count?: number;
  logo_url?: string;
  stripe_account_id?: string;
  stripe_connected?: boolean;
  created_at?: string;
}

export interface RevenueLog {
  id: string;
  business_id?: string;
  amount: number;
  type?: 'subscription' | 'one_time' | 'consulting' | 'affiliate' | 'other';
  source?: string;
  customer_name?: string;
  description?: string;
  stripe_payment_id?: string;
  transaction_date: string;
  created_at?: string;
}

export interface ExpenseLog {
  id: string;
  business_id?: string;
  amount: number;
  category?: 'infrastructure' | 'marketing' | 'tools' | 'payroll' | 'legal' | 'contractors' | 'office' | 'travel' | 'other';
  description?: string;
  is_recurring?: boolean;
  recurring_interval?: string;
  transaction_date: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  business_id?: string;
  name: string;
  email?: string;
  plan_tier?: string;
  mrr?: number;
  status?: 'trial' | 'active' | 'churned' | 'paused';
  started_at?: string;
  churned_at?: string;
  notes?: string;
  created_at?: string;
}

export interface BusinessMilestone {
  id: string;
  business_id?: string;
  title: string;
  target_metric?: string;
  target_value?: number;
  current_value?: number;
  is_completed?: boolean;
  completed_at?: string;
  target_date?: string;
  celebration_message?: string;
  sort_order?: number;
  created_at?: string;
}

// ==========================================
// PERSONAL FINANCE
// ==========================================

export interface FinanceAccount {
  id: string;
  user_id?: string;
  name: string;
  type?: 'checking' | 'savings' | 'credit_card' | 'investment' | 'crypto' | 'cash' | 'other';
  balance?: number;
  currency?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface FinanceTransaction {
  id: string;
  user_id?: string;
  account_id?: string;
  amount: number;
  category?: 'income' | 'food' | 'housing' | 'transportation' | 'entertainment' | 'health' | 'education' | 'shopping' | 'subscriptions' | 'savings' | 'investment' | 'business_income' | 'other';
  description?: string;
  is_recurring?: boolean;
  transaction_date: string;
  created_at?: string;
}

export interface Budget {
  id: string;
  user_id?: string;
  category: string;
  monthly_limit: number;
  current_spent?: number;
  month: string;
  created_at?: string;
}

export interface NetWorthSnapshot {
  id: string;
  user_id?: string;
  total_assets?: number;
  total_liabilities?: number;
  net_worth?: number;
  business_equity?: number;
  snapshot_date?: string;
  created_at?: string;
}

// ==========================================
// FOCUS, JOURNAL, SKILLS
// ==========================================

export interface FocusSession {
  id: string;
  user_id?: string;
  task_description?: string;
  category?: 'coding' | 'business' | 'marketing' | 'learning' | 'admin' | 'creative' | 'other';
  planned_duration_minutes?: number;
  actual_duration_minutes?: number;
  started_at: string;
  completed_at?: string;
  distractions_count?: number;
  productivity_rating?: number;
  notes?: string;
  created_at?: string;
}

export interface JournalEntry {
  id: string;
  user_id?: string;
  date: string;
  ai_prompt?: string;
  entry_text?: string;
  wins?: string[];
  struggles?: string[];
  gratitude?: string[];
  tomorrow_focus?: string[];
  ai_response?: string;
  ai_patterns_detected?: Record<string, unknown>;
  mood_at_entry?: number;
  tags?: string[];
  is_private?: boolean;
  created_at?: string;
}

export interface MonthlyLetter {
  id: string;
  user_id?: string;
  month: string;
  letter_text: string;
  highlights?: Record<string, unknown>;
  created_at?: string;
}

export interface Skill {
  id: string;
  user_id?: string;
  name: string;
  category?: 'technical' | 'business' | 'fitness' | 'nutrition' | 'language' | 'creative' | 'leadership' | 'other';
  proficiency?: number;
  target_proficiency?: number;
  hours_practiced?: number;
  notes?: string;
  created_at?: string;
}

export interface Book {
  id: string;
  user_id?: string;
  title: string;
  author?: string;
  category?: string;
  status?: 'want_to_read' | 'reading' | 'completed' | 'abandoned';
  pages_total?: number;
  pages_read?: number;
  rating?: number;
  notes?: string;
  key_takeaways?: string[];
  ai_recommended?: boolean;
  ai_recommendation_reason?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
}

export interface Course {
  id: string;
  user_id?: string;
  title: string;
  platform?: string;
  category?: string;
  url?: string;
  progress_percent?: number;
  status?: 'planned' | 'in_progress' | 'completed' | 'abandoned';
  certificate_url?: string;
  notes?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
}

// ==========================================
// PARTNER FEATURES
// ==========================================

export interface PartnerNudge {
  id: string;
  from_user_id?: string;
  to_user_id?: string;
  type?: 'encouragement' | 'reminder' | 'celebration' | 'challenge' | 'reaction';
  message?: string;
  emoji?: string;
  reaction_to?: string;
  is_read?: boolean;
  created_at?: string;
}

export interface PartnerChallenge {
  id: string;
  partnership_id?: string;
  created_by?: string;
  title: string;
  description?: string;
  challenge_type?: 'both_complete' | 'competition' | 'streak' | 'custom';
  metric?: string;
  target_value?: number;
  duration_days?: number;
  start_date?: string;
  end_date?: string;
  user_a_progress?: number;
  user_b_progress?: number;
  winner_id?: string;
  stake_amount?: number;
  status?: 'active' | 'completed' | 'expired';
  created_at?: string;
}

// ==========================================
// NFC & GEOFENCE
// ==========================================

export interface NfcTrigger {
  id: string;
  user_id?: string;
  tag_id: string;
  label: string;
  action: string;
  action_params?: Record<string, unknown>;
  is_active?: boolean;
  created_at?: string;
}

export interface GeofenceTrigger {
  id: string;
  user_id?: string;
  label: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  trigger_on?: 'enter' | 'exit' | 'both';
  action: string;
  action_params?: Record<string, unknown>;
  is_active?: boolean;
  created_at?: string;
}

// ==========================================
// DASHBOARD
// ==========================================

export interface DashboardLayout {
  id: string;
  user_id?: string;
  name?: string;
  is_active?: boolean;
  layout: Record<string, unknown>;
  created_at?: string;
}

// ==========================================
// SOCIAL CONTENT
// ==========================================

export interface SocialContent {
  id: string;
  user_id?: string;
  type?: 'transformation' | 'weekly_recap' | 'pr_celebration' | 'milestone' | 'time_lapse' | 'custom';
  template?: string;
  content_data?: Record<string, unknown>;
  image_url?: string;
  video_url?: string;
  caption?: string;
  platform?: string;
  is_shared?: boolean;
  shared_at?: string;
  created_at?: string;
}

// ==========================================
// STAKE GOALS
// ==========================================

export interface StakeGoal {
  id: string;
  goal_id?: string;
  user_id?: string;
  stake_amount: number;
  evaluation_frequency?: 'daily' | 'weekly' | 'monthly';
  charity_name?: string;
  charity_url?: string;
  partner_receives?: boolean;
  stripe_payment_intent_id?: string;
  evaluation_criteria?: Record<string, unknown>;
  total_lost?: number;
  total_saved?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface StakeEvaluation {
  id: string;
  stake_goal_id?: string;
  period_start?: string;
  period_end?: string;
  passed: boolean;
  evaluation_data?: Record<string, unknown>;
  amount_at_risk?: number;
  amount_charged?: number;
  notes?: string;
  created_at?: string;
}

// ==========================================
// COMMUNITY
// ==========================================

export interface CommunityChallenge {
  id: string;
  created_by?: string;
  title: string;
  description?: string;
  challenge_type?: string;
  metric?: string;
  target_value?: number;
  start_date?: string;
  end_date?: string;
  max_participants?: number;
  is_public?: boolean;
  created_at?: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id?: string;
  user_id?: string;
  current_progress?: number;
  rank?: number;
  joined_at?: string;
}

export interface CommunityLeaderboard {
  id: string;
  user_id?: string;
  category?: 'consistency' | 'volume' | 'streaks' | 'prs' | 'overall';
  score?: number;
  rank?: number;
  period?: 'weekly' | 'monthly' | 'all_time';
  period_start?: string;
  updated_at?: string;
}

// ==========================================
// ACHIEVEMENTS
// ==========================================

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description?: string;
  icon?: string;
  category?: 'fitness' | 'nutrition' | 'body' | 'business' | 'finance' | 'consistency' | 'partner' | 'community' | 'mindset' | 'learning';
  tier?: 'bronze' | 'silver' | 'gold' | 'diamond';
  requirement_type?: string;
  requirement_value?: number;
  secret?: boolean;
  created_at?: string;
}

export interface UserAchievement {
  id: string;
  user_id?: string;
  achievement_id?: string;
  earned_at?: string;
}

// ==========================================
// NOTIFICATIONS
// ==========================================

export interface NotificationLogEntry {
  id: string;
  user_id?: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_sent?: boolean;
  sent_at?: string;
  is_read?: boolean;
  read_at?: string;
  created_at?: string;
}

// ==========================================
// DAILY CHECK-INS & WEEKLY REVIEWS
// ==========================================

export interface DailyCheckin {
  id: string;
  user_id?: string;
  date: string;
  day_score?: number;
  habits_completed?: number;
  habits_total?: number;
  calories_logged?: number;
  protein_logged?: number;
  workouts_completed?: number;
  sleep_hours?: number;
  focus_hours?: number;
  revenue_logged?: number;
  water_oz?: number;
  mood_average?: number;
  ai_morning_briefing?: string;
  ai_evening_reflection?: string;
  created_at?: string;
}

export interface WeeklyReview {
  id: string;
  user_id?: string;
  week_start: string;
  weight_change?: number;
  workouts_completed?: number;
  workouts_target?: number;
  avg_calories?: number;
  avg_protein?: number;
  avg_sleep_hours?: number;
  avg_mood?: number;
  avg_readiness?: number;
  habits_completion_rate?: number;
  focus_hours_total?: number;
  revenue_this_week?: number;
  cumulative_revenue?: number;
  new_customers?: number;
  prs_this_week?: number;
  top_wins?: string[];
  areas_to_improve?: string[];
  next_week_goals?: string[];
  ai_weekly_summary?: string;
  fitness_grade?: string;
  nutrition_grade?: string;
  business_grade?: string;
  habits_grade?: string;
  sleep_grade?: string;
  overall_grade?: string;
  body_business_correlations?: Record<string, unknown>;
  created_at?: string;
}

// ==========================================
// VISION BOARD
// ==========================================

export interface VisionBoardItem {
  id: string;
  user_id?: string;
  image_url: string;
  title?: string;
  category?: 'body' | 'business' | 'lifestyle' | 'relationship' | 'material' | 'travel' | 'personal';
  linked_goal_id?: string;
  sort_order?: number;
  created_at?: string;
}

// ==========================================
// CHALLENGE CENTER
// ==========================================

export type ChallengeTaskType =
  | 'workout'
  | 'water'
  | 'nutrition'
  | 'reading'
  | 'photo'
  | 'meditation'
  | 'steps'
  | 'sleep'
  | 'alcohol_free'
  | 'sugar_free'
  | 'journal'
  | 'custom'
  | 'fasting'
  | 'measurement'
  | 'calories'
  | 'protein';

export type ChallengeCategory =
  | 'mental_toughness'
  | 'fitness'
  | 'nutrition'
  | 'running'
  | 'strength'
  | 'lifestyle'
  | 'custom';

export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'extreme';

export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'abandoned';

export interface ChallengeTask {
  id: string;
  label: string;
  type: ChallengeTaskType;
  auto_verify: boolean;
  /** Task-specific config: min_duration_minutes, min_count, target_oz, target_pages, etc. */
  config: Record<string, unknown>;
}

export interface ChallengeRules {
  tasks: ChallengeTask[];
  restart_on_failure?: boolean;
  /** Per-day overrides for progressive challenges (squat targets, plank durations, C25K intervals) */
  daily_schedule?: Record<number, Record<string, unknown>>;
  /** Allowed rest days per week (e.g., 75 Soft allows 1) */
  rest_days_per_week?: number;
  /** Fasting protocol for IF challenges */
  fasting_protocol?: '16:8' | '18:6' | '20:4' | '5:2';
  /** Whole30 elimination categories */
  elimination_list?: string[];
  [key: string]: unknown;
}

export interface ChallengeDefinition {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: ChallengeCategory;
  difficulty?: ChallengeDifficulty;
  duration_days: number;
  rules: ChallengeRules;
  restart_on_failure?: boolean;
  is_system?: boolean;
  created_by?: string;
  icon?: string;
  color?: string;
  estimated_daily_time_minutes?: number;
  created_at?: string;
}

export interface ChallengeEnrollment {
  id: string;
  user_id?: string;
  challenge_id?: string;
  partnership_id?: string;
  started_at?: string;
  target_end_date?: string;
  actual_end_date?: string;
  status?: ChallengeStatus;
  current_day?: number;
  restart_count?: number;
  longest_streak?: number;
  configuration?: Record<string, unknown>;
  stake_goal_id?: string;
  created_at?: string;
}

export interface ChallengeDailyLog {
  id: string;
  enrollment_id?: string;
  user_id?: string;
  day_number: number;
  date: string;
  tasks_completed: Record<string, boolean>;
  all_tasks_completed?: boolean;
  auto_verified?: Record<string, boolean>;
  notes?: string;
  created_at?: string;
}
