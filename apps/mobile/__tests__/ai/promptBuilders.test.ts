// =============================================================================
// TRANSFORMR — AI Prompt Builders Unit Tests
// =============================================================================

import { AI_MODEL } from '@utils/constants';

// ---------------------------------------------------------------------------
// Imports (after mocks are set up)
// ---------------------------------------------------------------------------
import {
  getAICoaching,
  getMorningBriefing,
  getEveningReflection,
  getWorkoutAdvice,
} from '@services/ai/coach';

import {
  analyzeMealPhoto,
  analyzeMenuPhoto,
} from '@services/ai/mealCamera';

import {
  getMotivation,
  getDailyQuote,
} from '@services/ai/motivation';

import { analyzeExerciseForm } from '@services/ai/formCheck';
import { generateTrajectory } from '@services/ai/trajectory';
import * as FileSystem from 'expo-file-system';

// ---------------------------------------------------------------------------
// Mock: expo-file-system
// ---------------------------------------------------------------------------
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('bW9ja2VkLWJhc2U2NC1jb250ZW50'),
  EncodingType: { Base64: 'base64' },
}));

// ---------------------------------------------------------------------------
// Mock: @supabase/supabase-js — captured via the re-export in @services/supabase
// ---------------------------------------------------------------------------
const mockInvoke = jest.fn();
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn().mockReturnValue({
  data: { publicUrl: 'https://storage.example.com/video.mp4' },
});

jest.mock('@services/supabase', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        getPublicUrl: (...args: unknown[]) => mockGetPublicUrl(...args),
      }),
    },
  },
}));

// ---------------------------------------------------------------------------
// Mock: expo-speech (used by narrator)
// ---------------------------------------------------------------------------
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));

// =============================================================================
// Helpers
// =============================================================================

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// AI_MODEL constant
// =============================================================================
describe('AI_MODEL constant', () => {
  it('references the expected claude-sonnet-4-20250514 model', () => {
    expect(AI_MODEL).toBe('claude-sonnet-4-20250514');
  });
});

// =============================================================================
// coach.ts
// =============================================================================
describe('AI Coach service', () => {
  // -------------------------------------------------------------------------
  // getAICoaching
  // -------------------------------------------------------------------------
  describe('getAICoaching', () => {
    const coachContext = {
      userId: 'user-123',
      currentWeight: 185,
      goalWeight: 175,
      goalDirection: 'lose',
      workoutsThisWeek: 4,
      caloriesYesterday: 2100,
      proteinYesterday: 180,
      currentStreak: 12,
      sleepHoursLast: 7.5,
      moodAverage: 7,
      readinessScore: 82,
      countdownDaysLeft: 45,
      countdownTitle: 'Beach vacation',
      businessRevenue: 8500,
      revenueGoal: 15000,
    };

    const mockCoachResponse = {
      message: 'Great progress this week!',
      suggestions: ['Increase protein', 'Add a deload day'],
      priority: 'medium' as const,
      category: 'fitness' as const,
    };

    it('invokes the ai-coach edge function with full context', async () => {
      mockInvoke.mockResolvedValueOnce({ data: mockCoachResponse, error: null });

      const result = await getAICoaching(coachContext);

      expect(mockInvoke).toHaveBeenCalledTimes(1);
      expect(mockInvoke).toHaveBeenCalledWith('ai-coach', {
        body: coachContext,
      });
      expect(result).toEqual(mockCoachResponse);
    });

    it('passes partial context when optional fields are omitted', async () => {
      const partialContext = { userId: 'user-456' };
      mockInvoke.mockResolvedValueOnce({
        data: mockCoachResponse,
        error: null,
      });

      await getAICoaching(partialContext);

      expect(mockInvoke).toHaveBeenCalledWith('ai-coach', {
        body: partialContext,
      });
    });

    it('throws when the edge function returns an error', async () => {
      const edgeError = new Error('Edge function timeout');
      mockInvoke.mockResolvedValueOnce({ data: null, error: edgeError });

      await expect(getAICoaching(coachContext)).rejects.toThrow('Edge function timeout');
    });
  });

  // -------------------------------------------------------------------------
  // getMorningBriefing
  // -------------------------------------------------------------------------
  describe('getMorningBriefing', () => {
    it('invokes ai-coach with type morning_briefing and returns the message', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { message: 'Good morning! Today is leg day.' },
        error: null,
      });

      const result = await getMorningBriefing('user-123');

      expect(mockInvoke).toHaveBeenCalledWith('ai-coach', {
        body: { userId: 'user-123', type: 'morning_briefing' },
      });
      expect(result).toBe('Good morning! Today is leg day.');
    });

    it('throws on error', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Auth failed'),
      });

      await expect(getMorningBriefing('user-bad')).rejects.toThrow('Auth failed');
    });
  });

  // -------------------------------------------------------------------------
  // getEveningReflection
  // -------------------------------------------------------------------------
  describe('getEveningReflection', () => {
    it('invokes ai-coach with type evening_reflection and returns the message', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { message: 'Great day! You crushed your protein goal.' },
        error: null,
      });

      const result = await getEveningReflection('user-789');

      expect(mockInvoke).toHaveBeenCalledWith('ai-coach', {
        body: { userId: 'user-789', type: 'evening_reflection' },
      });
      expect(result).toBe('Great day! You crushed your protein goal.');
    });

    it('throws on error', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Network error'),
      });

      await expect(getEveningReflection('user-789')).rejects.toThrow('Network error');
    });
  });

  // -------------------------------------------------------------------------
  // getWorkoutAdvice
  // -------------------------------------------------------------------------
  describe('getWorkoutAdvice', () => {
    it('sends readinessScore and musclesSore in the body', async () => {
      const adviceResponse = {
        message: 'Take it easy today.',
        suggestions: ['Light cardio', 'Stretch'],
        priority: 'high' as const,
        category: 'recovery' as const,
      };
      mockInvoke.mockResolvedValueOnce({ data: adviceResponse, error: null });

      const result = await getWorkoutAdvice('user-123', 45, ['chest', 'triceps']);

      expect(mockInvoke).toHaveBeenCalledWith('ai-coach', {
        body: {
          userId: 'user-123',
          type: 'workout_advice',
          readinessScore: 45,
          musclesSore: ['chest', 'triceps'],
        },
      });
      expect(result).toEqual(adviceResponse);
    });

    it('handles empty musclesSore array', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          message: 'You are good to go!',
          suggestions: [],
          priority: 'low',
          category: 'fitness',
        },
        error: null,
      });

      await getWorkoutAdvice('user-123', 95, []);

      expect(mockInvoke).toHaveBeenCalledWith('ai-coach', {
        body: {
          userId: 'user-123',
          type: 'workout_advice',
          readinessScore: 95,
          musclesSore: [],
        },
      });
    });

    it('throws on error', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Server error'),
      });

      await expect(getWorkoutAdvice('u', 50, [])).rejects.toThrow('Server error');
    });
  });
});

// =============================================================================
// mealCamera.ts
// =============================================================================
describe('AI Meal Camera service', () => {
  // -------------------------------------------------------------------------
  // analyzeMealPhoto
  // -------------------------------------------------------------------------
  describe('analyzeMealPhoto', () => {
    const mealAnalysis = {
      foods: [
        {
          name: 'Grilled chicken',
          estimated_calories: 350,
          estimated_protein: 45,
          estimated_carbs: 0,
          estimated_fat: 12,
          serving_size: '6 oz',
          confidence: 0.92,
        },
      ],
      total_calories: 350,
      total_protein: 45,
      total_carbs: 0,
      total_fat: 12,
      overall_confidence: 0.92,
      suggestions: ['Add a vegetable side'],
    };

    it('reads the photo as base64 and invokes ai-meal-analysis', async () => {
      mockInvoke.mockResolvedValueOnce({ data: mealAnalysis, error: null });

      const result = await analyzeMealPhoto('file:///photos/meal.jpg', 'user-123');

      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
        'file:///photos/meal.jpg',
        { encoding: FileSystem.EncodingType.Base64 },
      );
      expect(mockInvoke).toHaveBeenCalledWith('ai-meal-analysis', {
        body: {
          userId: 'user-123',
          image: 'bW9ja2VkLWJhc2U2NC1jb250ZW50',
          mimeType: 'image/jpeg',
        },
      });
      expect(result).toEqual(mealAnalysis);
    });

    it('throws when the edge function returns an error', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Image too large'),
      });

      await expect(
        analyzeMealPhoto('file:///photos/huge.jpg', 'user-123'),
      ).rejects.toThrow('Image too large');
    });

    it('throws when FileSystem.readAsStringAsync rejects', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValueOnce(
        new Error('File not found'),
      );

      await expect(
        analyzeMealPhoto('file:///missing.jpg', 'user-123'),
      ).rejects.toThrow('File not found');
    });
  });

  // -------------------------------------------------------------------------
  // analyzeMenuPhoto
  // -------------------------------------------------------------------------
  describe('analyzeMenuPhoto', () => {
    const menuAnalysis = {
      foods: [],
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      overall_confidence: 0.7,
      suggestions: ['Try the grilled fish'],
    };

    it('invokes ai-menu-scan with restaurantName when provided', async () => {
      mockInvoke.mockResolvedValueOnce({ data: menuAnalysis, error: null });

      const result = await analyzeMenuPhoto(
        'file:///photos/menu.jpg',
        'user-123',
        'Chipotle',
      );

      expect(mockInvoke).toHaveBeenCalledWith('ai-menu-scan', {
        body: {
          userId: 'user-123',
          image: 'bW9ja2VkLWJhc2U2NC1jb250ZW50',
          mimeType: 'image/jpeg',
          restaurantName: 'Chipotle',
        },
      });
      expect(result).toEqual(menuAnalysis);
    });

    it('invokes ai-menu-scan without restaurantName when omitted', async () => {
      mockInvoke.mockResolvedValueOnce({ data: menuAnalysis, error: null });

      await analyzeMenuPhoto('file:///photos/menu.jpg', 'user-123');

      expect(mockInvoke).toHaveBeenCalledWith('ai-menu-scan', {
        body: {
          userId: 'user-123',
          image: 'bW9ja2VkLWJhc2U2NC1jb250ZW50',
          mimeType: 'image/jpeg',
          restaurantName: undefined,
        },
      });
    });

    it('throws when the edge function returns an error', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Rate limited'),
      });

      await expect(
        analyzeMenuPhoto('file:///photos/menu.jpg', 'user-123'),
      ).rejects.toThrow('Rate limited');
    });
  });
});

// =============================================================================
// motivation.ts
// =============================================================================
describe('AI Motivation service', () => {
  // -------------------------------------------------------------------------
  // getMotivation
  // -------------------------------------------------------------------------
  describe('getMotivation', () => {
    const motivationContext = {
      userId: 'user-123',
      currentMood: 6,
      currentStreak: 21,
      todayWorkoutCompleted: true,
      todayCaloriesLogged: 1800,
      targetCalories: 2200,
      recentPRs: ['Bench Press 225 lbs', 'Deadlift 405 lbs'],
      countdownDaysLeft: 30,
      timeOfDay: 'morning' as const,
      lastWorkoutDaysAgo: 0,
      habitsCompletedToday: 5,
      habitsTotalToday: 7,
    };

    const mockMotivation = {
      message: 'Incredible streak! 21 days strong.',
      type: 'celebration' as const,
      context_used: ['currentStreak', 'recentPRs'],
    };

    it('invokes ai-motivation with full context', async () => {
      mockInvoke.mockResolvedValueOnce({ data: mockMotivation, error: null });

      const result = await getMotivation(motivationContext);

      expect(mockInvoke).toHaveBeenCalledWith('ai-motivation', {
        body: motivationContext,
      });
      expect(result).toEqual(mockMotivation);
    });

    it('passes all timeOfDay variants correctly', async () => {
      for (const tod of ['morning', 'afternoon', 'evening', 'night'] as const) {
        mockInvoke.mockResolvedValueOnce({ data: mockMotivation, error: null });
        await getMotivation({ ...motivationContext, timeOfDay: tod });
        expect(mockInvoke).toHaveBeenLastCalledWith('ai-motivation', {
          body: expect.objectContaining({ timeOfDay: tod }),
        });
      }
    });

    it('passes recentPRs as an empty array when no PRs exist', async () => {
      mockInvoke.mockResolvedValueOnce({ data: mockMotivation, error: null });

      await getMotivation({ ...motivationContext, recentPRs: [] });

      expect(mockInvoke).toHaveBeenCalledWith('ai-motivation', {
        body: expect.objectContaining({ recentPRs: [] }),
      });
    });

    it('includes optional countdownDaysLeft when provided', async () => {
      mockInvoke.mockResolvedValueOnce({ data: mockMotivation, error: null });

      await getMotivation(motivationContext);

      expect(mockInvoke).toHaveBeenCalledWith('ai-motivation', {
        body: expect.objectContaining({ countdownDaysLeft: 30 }),
      });
    });

    it('throws when the edge function returns an error', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Service unavailable'),
      });

      await expect(getMotivation(motivationContext)).rejects.toThrow(
        'Service unavailable',
      );
    });
  });

  // -------------------------------------------------------------------------
  // getDailyQuote
  // -------------------------------------------------------------------------
  describe('getDailyQuote', () => {
    it('invokes ai-motivation with type daily_quote and returns the message', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { message: 'The only bad workout is the one that did not happen.' },
        error: null,
      });

      const result = await getDailyQuote('user-123');

      expect(mockInvoke).toHaveBeenCalledWith('ai-motivation', {
        body: { userId: 'user-123', type: 'daily_quote' },
      });
      expect(result).toBe('The only bad workout is the one that did not happen.');
    });

    it('throws on error', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Quota exceeded'),
      });

      await expect(getDailyQuote('user-123')).rejects.toThrow('Quota exceeded');
    });
  });
});

// =============================================================================
// formCheck.ts
// =============================================================================
describe('AI Form Check service', () => {
  describe('analyzeExerciseForm', () => {
    const formResult = {
      overall_score: 85,
      form_issues: [
        {
          body_part: 'knees',
          issue: 'Knees caving inward',
          severity: 'moderate' as const,
          correction: 'Push knees outward over toes',
        },
      ],
      positive_notes: ['Good depth', 'Neutral spine maintained'],
      injury_risk: 'medium' as const,
    };

    it('reads the video as base64 and invokes ai-form-check with exerciseName', async () => {
      mockInvoke.mockResolvedValueOnce({ data: formResult, error: null });

      const result = await analyzeExerciseForm(
        'file:///videos/squat.mp4',
        'user-123',
        'Barbell Squat',
      );

      expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
        'file:///videos/squat.mp4',
        { encoding: FileSystem.EncodingType.Base64 },
      );
      expect(mockInvoke).toHaveBeenCalledWith('ai-form-check', {
        body: {
          userId: 'user-123',
          video: 'bW9ja2VkLWJhc2U2NC1jb250ZW50',
          mimeType: 'video/mp4',
          exerciseName: 'Barbell Squat',
        },
      });
      expect(result).toEqual(formResult);
    });

    it('throws when the edge function returns an error', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Video processing failed'),
      });

      await expect(
        analyzeExerciseForm('file:///videos/bad.mp4', 'user-123', 'Deadlift'),
      ).rejects.toThrow('Video processing failed');
    });

    it('throws when FileSystem rejects on video read', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Permission denied'),
      );

      await expect(
        analyzeExerciseForm('file:///videos/noperm.mp4', 'user-123', 'Squat'),
      ).rejects.toThrow('Permission denied');
    });
  });
});

// =============================================================================
// trajectory.ts
// =============================================================================
describe('AI Trajectory service', () => {
  describe('generateTrajectory', () => {
    const trajectoryContext = {
      userId: 'user-123',
      currentWeight: 190,
      goalWeight: 175,
      weightHistory: [
        { date: '2026-03-01', weight: 195 },
        { date: '2026-03-15', weight: 192 },
        { date: '2026-04-01', weight: 190 },
      ],
      workoutsPerWeek: 5,
      avgCalories: 2100,
      targetCalories: 2000,
      currentRevenue: 12000,
      revenueGoal: 20000,
      revenueHistory: [
        { date: '2026-02-01', amount: 9000 },
        { date: '2026-03-01', amount: 12000 },
      ],
      countdownDate: '2026-06-15',
      currentStreak: 30,
      habitsCompletionRate: 0.85,
    };

    const mockTrajectory = {
      current_path: {
        weight_projection: [{ date: '2026-05-01', value: 187 }],
        revenue_projection: [{ date: '2026-05-01', value: 14000 }],
        fitness_projection: [{ date: '2026-05-01', value: 78 }],
        narrative: 'On current trajectory you will reach 180 lbs by June.',
      },
      optimal_path: {
        weight_projection: [{ date: '2026-05-01', value: 183 }],
        revenue_projection: [{ date: '2026-05-01', value: 16000 }],
        fitness_projection: [{ date: '2026-05-01', value: 85 }],
        narrative: 'With adjustments you could reach 175 lbs by June.',
      },
      key_differences: ['Increase workout intensity', 'Reduce calorie surplus'],
      actionable_changes: ['Add HIIT twice per week'],
    };

    it('invokes ai-trajectory with the full context body', async () => {
      mockInvoke.mockResolvedValueOnce({ data: mockTrajectory, error: null });

      const result = await generateTrajectory(trajectoryContext);

      expect(mockInvoke).toHaveBeenCalledWith('ai-trajectory', {
        body: trajectoryContext,
      });
      expect(result).toEqual(mockTrajectory);
    });

    it('handles context without optional business fields', async () => {
      const noBusinessCtx = {
        userId: 'user-456',
        currentWeight: 200,
        goalWeight: 185,
        weightHistory: [],
        workoutsPerWeek: 3,
        avgCalories: 2500,
        targetCalories: 2200,
        currentStreak: 5,
        habitsCompletionRate: 0.6,
      };
      mockInvoke.mockResolvedValueOnce({ data: mockTrajectory, error: null });

      await generateTrajectory(noBusinessCtx);

      expect(mockInvoke).toHaveBeenCalledWith('ai-trajectory', {
        body: noBusinessCtx,
      });
    });

    it('throws when the edge function returns an error', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: new Error('Trajectory computation failed'),
      });

      await expect(generateTrajectory(trajectoryContext)).rejects.toThrow(
        'Trajectory computation failed',
      );
    });
  });
});

// =============================================================================
// Cross-cutting: Edge function names & model reference
// =============================================================================
describe('Edge function naming conventions', () => {
  it('coach service calls ai-coach', async () => {
    mockInvoke.mockResolvedValue({ data: { message: 'ok' }, error: null });

    await getMorningBriefing('u');
    expect(mockInvoke).toHaveBeenCalledWith('ai-coach', expect.anything());
  });

  it('meal camera service calls ai-meal-analysis', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        foods: [],
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        overall_confidence: 0,
        suggestions: [],
      },
      error: null,
    });

    await analyzeMealPhoto('file:///x.jpg', 'u');
    expect(mockInvoke).toHaveBeenCalledWith('ai-meal-analysis', expect.anything());
  });

  it('menu scanner calls ai-menu-scan', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        foods: [],
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        overall_confidence: 0,
        suggestions: [],
      },
      error: null,
    });

    await analyzeMenuPhoto('file:///x.jpg', 'u');
    expect(mockInvoke).toHaveBeenCalledWith('ai-menu-scan', expect.anything());
  });

  it('motivation service calls ai-motivation', async () => {
    mockInvoke.mockResolvedValue({
      data: { message: 'go', type: 'encouragement', context_used: [] },
      error: null,
    });

    await getDailyQuote('u');
    expect(mockInvoke).toHaveBeenCalledWith('ai-motivation', expect.anything());
  });

  it('form check service calls ai-form-check', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        overall_score: 90,
        form_issues: [],
        positive_notes: [],
        injury_risk: 'low',
      },
      error: null,
    });

    await analyzeExerciseForm('file:///v.mp4', 'u', 'Squat');
    expect(mockInvoke).toHaveBeenCalledWith('ai-form-check', expect.anything());
  });

  it('trajectory service calls ai-trajectory', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        current_path: { weight_projection: [], revenue_projection: [], fitness_projection: [], narrative: '' },
        optimal_path: { weight_projection: [], revenue_projection: [], fitness_projection: [], narrative: '' },
        key_differences: [],
        actionable_changes: [],
      },
      error: null,
    });

    await generateTrajectory({
      userId: 'u',
      currentWeight: 180,
      goalWeight: 170,
      weightHistory: [],
      workoutsPerWeek: 3,
      avgCalories: 2000,
      targetCalories: 1800,
      currentStreak: 1,
      habitsCompletionRate: 0.5,
    });
    expect(mockInvoke).toHaveBeenCalledWith('ai-trajectory', expect.anything());
  });
});

// =============================================================================
// Model reference verification
// =============================================================================
describe('AI model reference in constants', () => {
  it('AI_MODEL is claude-sonnet-4-20250514 (used by all edge functions)', () => {
    expect(AI_MODEL).toBe('claude-sonnet-4-20250514');
  });

  it('AI_MODEL is a non-empty string', () => {
    expect(typeof AI_MODEL).toBe('string');
    expect(AI_MODEL.length).toBeGreaterThan(0);
  });
});
