import { renderHook } from '@testing-library/react-native';
import { useNutrition } from '../../hooks/useNutrition';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetchTodayNutrition = jest.fn();
const mockGetMacroProgress = jest.fn((target: number, actual: number) => ({
  target,
  actual,
  percentage: target > 0 ? Math.round((actual / target) * 100) : 0,
}));

const mockNutritionState = {
  todayLogs: [] as { id: string; calories: number; protein: number; carbs: number; fat: number }[],
  waterLogs: [],
  searchResults: [],
  isLoading: false,
  error: null,
  fetchTodayNutrition: mockFetchTodayNutrition,
  logFood: jest.fn(),
  logWater: jest.fn(),
  deleteLog: jest.fn(),
  searchFoods: jest.fn(),
  getTodayMacros: jest.fn(),
  clearError: jest.fn(),
  reset: jest.fn(),
};

jest.mock('../../stores/nutritionStore', () => ({
  useNutritionStore: jest.fn((selector?: (s: typeof mockNutritionState) => unknown) =>
    selector ? selector(mockNutritionState) : mockNutritionState,
  ),
}));

const mockAuthState = { user: { id: 'u-1' } };
jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (s: typeof mockAuthState) => unknown) =>
    selector ? selector(mockAuthState) : mockAuthState,
  ),
}));

const mockProfileState = {
  profile: {
    daily_calorie_target: 2000,
    daily_protein_target: 150,
    daily_carb_target: 200,
    daily_fat_target: 65,
  },
};
jest.mock('../../stores/profileStore', () => ({
  useProfileStore: jest.fn((selector?: (s: typeof mockProfileState) => unknown) =>
    selector ? selector(mockProfileState) : mockProfileState,
  ),
}));

jest.mock('../../services/calculations/macros', () => ({
  getMacroProgress: (target: number, actual: number) => mockGetMacroProgress(target, actual),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useNutrition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNutritionState.todayLogs = [];
  });

  it('calls fetchTodayNutrition on mount when user exists', () => {
    renderHook(() => useNutrition());
    expect(mockFetchTodayNutrition).toHaveBeenCalledTimes(1);
  });

  it('returns todayMacros summed from todayLogs', () => {
    mockNutritionState.todayLogs = [
      { id: '1', calories: 500, protein: 40, carbs: 50, fat: 15 },
      { id: '2', calories: 300, protein: 25, carbs: 30, fat: 10 },
    ];
    const { result } = renderHook(() => useNutrition());
    expect(result.current.todayMacros.calories).toBe(800);
    expect(result.current.todayMacros.protein).toBe(65);
    expect(result.current.todayMacros.carbs).toBe(80);
    expect(result.current.todayMacros.fat).toBe(25);
  });

  it('returns zero todayMacros when no logs', () => {
    const { result } = renderHook(() => useNutrition());
    expect(result.current.todayMacros.calories).toBe(0);
    expect(result.current.todayMacros.protein).toBe(0);
  });

  it('calls getMacroProgress with profile targets', () => {
    mockNutritionState.todayLogs = [{ id: '1', calories: 1000, protein: 75, carbs: 100, fat: 30 }];
    renderHook(() => useNutrition());
    expect(mockGetMacroProgress).toHaveBeenCalledWith(2000, 1000);
    expect(mockGetMacroProgress).toHaveBeenCalledWith(150, 75);
  });

  it('returns store properties', () => {
    const { result } = renderHook(() => useNutrition());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
