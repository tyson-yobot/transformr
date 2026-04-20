import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-av', () => ({
  Audio: { Sound: { createAsync: jest.fn().mockResolvedValue({ sound: { playAsync: jest.fn(), unloadAsync: jest.fn() } }) }, setAudioModeAsync: jest.fn() },
  Video: () => null,
}));
jest.mock('@components/ui/VoiceMicButton', () => ({ VoiceMicButton: () => null }));
jest.mock('@services/voice', () => ({
  startVoiceRecognition: jest.fn().mockResolvedValue(undefined),
  stopVoiceRecognition: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
}));
jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Pan: jest.fn(() => ({ onUpdate: jest.fn().mockReturnThis(), onEnd: jest.fn().mockReturnThis() })) },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  PanGestureHandler: ({ children }: { children: React.ReactNode }) => children,
  TapGestureHandler: ({ children }: { children: React.ReactNode }) => children,
  State: {},
}));
jest.mock('react-native-svg', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
  Svg: ({ children }: { children: React.ReactNode }) => children,
  Circle: () => null,
  Path: () => null,
  G: ({ children }: { children: React.ReactNode }) => children,
  Defs: ({ children }: { children: React.ReactNode }) => children,
  LinearGradient: () => null,
  RadialGradient: () => null,
  Stop: () => null,
  Ellipse: () => null,
  Rect: () => null,
  Text: () => null,
}));
jest.mock('@components/ui/BodyMap', () => ({ BodyMap: () => null }));
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => children,
  Rect: () => null,
  RoundedRect: () => null,
  BlurMask: () => null,
  RadialGradient: () => null,
  vec: jest.fn().mockReturnValue({ x: 0, y: 0 }),
  Fill: () => null,
  Path: () => null,
  LinearGradient: () => null,
  useFont: jest.fn().mockReturnValue(null),
}));
jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'ex-1', sessionId: 'sess-1' }),
  useFocusEffect: (cb: () => void) => cb(),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn(), setOptions: jest.fn(), getParent: jest.fn(() => ({ setOptions: jest.fn() })) }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-camera', () => ({
  CameraView: ({ children }: { children: React.ReactNode }) => children,
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
  Camera: { requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }) },
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// UI Components
jest.mock('@components/ui/Card', () => ({ Card: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@components/ui/Button', () => ({
  Button: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));
jest.mock('@components/ui/Badge', () => ({ Badge: () => null }));
jest.mock('@components/ui/Avatar', () => ({ Avatar: () => null }));
jest.mock('@components/ui/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));
jest.mock('@components/ui/Skeleton', () => ({ Skeleton: () => null }));
jest.mock('@components/ui/ProgressBar', () => ({ ProgressBar: () => null }));
jest.mock('@components/ui/ProgressRing', () => ({ ProgressRing: () => null }));
jest.mock('@components/ui/GatePromptCard', () => ({ GatePromptCard: () => null }));
jest.mock('@components/ui/PurpleRadialBackground', () => ({
  PurpleRadialBackground: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@components/ui/ScreenSkeleton', () => ({
  ListSkeleton: () => null,
  DashboardSkeleton: () => null,
  DetailSkeleton: () => null,
}));
jest.mock('@components/ui/HelpBubble', () => ({ HelpBubble: () => null }));
jest.mock('@components/ui/HelpIcon', () => ({ HelpIcon: () => null }));
jest.mock('@components/ui/MonoText', () => ({
  MonoText: ({ children }: { children: React.ReactNode }) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
}));
jest.mock('@components/workout/NarratorCard', () => ({ NarratorCard: () => null }));
jest.mock('@components/workout/SetLogger', () => ({ SetLogger: () => null }));
jest.mock('@components/workout/RestTimer', () => ({ RestTimer: () => null }));
jest.mock('@components/workout/PRCelebration', () => ({ PRCelebration: () => null }));
jest.mock('@components/workout/ExerciseCard', () => ({ ExerciseCard: () => null }));
jest.mock('@components/workout/ExerciseThumbnail', () => ({ ExerciseThumbnail: () => null }));
jest.mock('@components/workout/MuscleGroupTile', () => ({ MuscleGroupTile: () => null }));
jest.mock('@components/workout/FormCheckRecorder', () => ({ FormCheckRecorder: () => null }));
jest.mock('@components/workout/GhostOverlay', () => ({ GhostOverlay: () => null }));
jest.mock('@components/charts/WeightChart', () => ({ WeightChart: () => null }));
jest.mock('@components/charts/SkiaSparkline', () => ({ SkiaSparkline: () => null }));
jest.mock('@components/cards/AIInsightCard', () => ({ AIInsightCard: () => null }));
jest.mock('@components/social/ShareButton', () => ({ ShareButton: () => null }));

// Services
jest.mock('@services/supabase', () => {
  const chain: Record<string, unknown> = {};
  const resolved = Promise.resolve({ data: [], error: null });
  ['eq', 'neq', 'in', 'contains', 'is', 'limit', 'range', 'single', 'maybeSingle', 'insert', 'update', 'delete'].forEach(
    (m) => { chain[m] = jest.fn(() => chain); }
  );
  chain['order'] = jest.fn(() => chain);
  chain['then'] = (resolve: (v: { data: unknown[]; error: null }) => void) =>
    resolved.then(resolve);
  return {
    supabase: {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
      from: jest.fn(() => ({ select: jest.fn(() => chain) })),
      storage: { from: jest.fn(() => ({ upload: jest.fn().mockResolvedValue({ data: {}, error: null }), getPublicUrl: jest.fn(() => ({ data: { publicUrl: '' } })), list: jest.fn().mockResolvedValue({ data: [], error: null }), remove: jest.fn().mockResolvedValue({ data: [], error: null }) })) },
    },
  };
});
jest.mock('@services/ai/formCheck', () => ({
  analyzeExerciseForm: jest.fn().mockResolvedValue({ feedback: [], score: 0 }),
  uploadFormCheckVideo: jest.fn().mockResolvedValue(''),
}));
jest.mock('@services/ai/progressPhoto', () => ({
  analyzeProgressPhotos: jest.fn().mockResolvedValue({ analysis: '' }),
  uploadProgressPhoto: jest.fn().mockResolvedValue(''),
}));
jest.mock('@services/commerce', () => ({
  getAvailablePrograms: jest.fn().mockResolvedValue([]),
  getUserPurchases: jest.fn().mockResolvedValue([]),
  checkProgramAccess: jest.fn().mockResolvedValue(false),
  purchaseProgram: jest.fn().mockResolvedValue({ success: false }),
}));
jest.mock('@services/calendar', () => ({
  requestCalendarPermissions: jest.fn().mockResolvedValue(true),
  addWorkoutToCalendar: jest.fn().mockResolvedValue('event-id'),
  getUpcomingWorkouts: jest.fn().mockResolvedValue([]),
  removeCalendarEvent: jest.fn().mockResolvedValue(undefined),
}));

// Hooks
jest.mock('@hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: true,
    requiredTier: 'free',
    showUpgradeModal: jest.fn(),
    upgradeMessage: '',
  })),
}));
jest.mock('@hooks/useWorkout', () => ({
  useWorkout: jest.fn(() => ({
    activeSession: null,
    isLoading: false,
    startSession: jest.fn(),
    endSession: jest.fn().mockResolvedValue(undefined),
    logSet: jest.fn(),
    logSetWithPRDetection: jest.fn(),
    sessions: [],
    templates: [],
    fetchSessions: jest.fn(),
    fetchTemplates: jest.fn(),
  })),
}));

// Utils
jest.mock('@utils/haptics', () => ({ hapticLight: jest.fn(), hapticMedium: jest.fn(), hapticSuccess: jest.fn() }));
jest.mock('@components/ui/ActionToast', () => ({
  ActionToast: () => null,
  useActionToast: jest.fn(() => ({
    toast: { message: '', subtext: '', visible: false },
    show: jest.fn(),
    hide: jest.fn(),
  })),
}));
jest.mock('@components/ui/Modal', () => ({
  Modal: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
    visible ? children : null,
}));
jest.mock('@components/ui/ScreenHelpButton', () => ({ ScreenHelpButton: () => null }));
jest.mock('../../constants/screenHelp', () => ({ SCREEN_HELP: {} }));
jest.mock('@utils/formatters', () => ({
  formatNumber: (n: number) => String(n),
  formatDate: (d: string) => d,
  formatRelativeTime: () => '2h ago',
  formatWeight: (n: number) => `${n} kg`,
  formatDuration: (s: number) => `${s}s`,
  formatPercentage: (n: number) => `${n}%`,
}));

// Stores
const mockWorkoutState = {
  sessions: [],
  templates: [],
  lastSession: null,
  activeSession: null,
  exercises: [],
  isLoading: false,
  fetchSessions: jest.fn(),
  fetchTemplates: jest.fn(),
  fetchExercises: jest.fn().mockResolvedValue(undefined),
  startSession: jest.fn(),
  endSession: jest.fn().mockResolvedValue(undefined),
  logSet: jest.fn(),
};
jest.mock('@stores/workoutStore', () => ({
  useWorkoutStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockWorkoutState) : mockWorkoutState
  ),
}));

const mockNutritionState = {
  todayCalories: 0,
  todayProtein: 0,
  isLoading: false,
  logs: [],
  todayLogs: [],
  waterLogs: [],
  fetchTodayNutrition: jest.fn(),
};
jest.mock('@stores/nutritionStore', () => ({
  useNutritionStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockNutritionState) : mockNutritionState
  ),
}));

const mockProfileState = {
  profile: { id: 'u1', name: 'Test', display_name: 'Test User' },
  isLoading: false,
  fetchProfile: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@stores/profileStore', () => ({
  useProfileStore: jest.fn((selector?: (s: object) => unknown) =>
    selector ? selector(mockProfileState) : mockProfileState
  ),
}));

// ── Exercises ─────────────────────────────────────────────────────────────────
import ExercisesScreen from '../../app/(tabs)/fitness/exercises';

describe('Fitness Exercises screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ExercisesScreen />)).not.toThrow();
  });
});

// ── Exercise Detail ───────────────────────────────────────────────────────────
import ExerciseDetailScreen from '../../app/(tabs)/fitness/exercise-detail';

describe('Fitness Exercise Detail screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ExerciseDetailScreen />)).not.toThrow();
  });
});

// ── Form Check ────────────────────────────────────────────────────────────────
import FormCheckScreen from '../../app/(tabs)/fitness/form-check';

describe('Fitness Form Check screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<FormCheckScreen />)).not.toThrow();
  });
});

// ── Marketplace ───────────────────────────────────────────────────────────────
import MarketplaceScreen from '../../app/(tabs)/fitness/marketplace';

describe('Fitness Marketplace screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<MarketplaceScreen />)).not.toThrow();
  });
});

// ── Mobility ──────────────────────────────────────────────────────────────────
import MobilityScreen from '../../app/(tabs)/fitness/mobility';

describe('Fitness Mobility screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<MobilityScreen />)).not.toThrow();
  });
});

// ── Pain Tracker ──────────────────────────────────────────────────────────────
import PainTrackerScreen from '../../app/(tabs)/fitness/pain-tracker';

describe('Fitness Pain Tracker screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<PainTrackerScreen />)).not.toThrow();
  });
});

// ── Posture Check ─────────────────────────────────────────────────────────────
import PostureCheckScreen from '../../app/(tabs)/fitness/posture-check';

describe('Fitness Posture Check screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<PostureCheckScreen />)).not.toThrow();
  });
});

// ── Programs ──────────────────────────────────────────────────────────────────
import ProgramsScreen from '../../app/(tabs)/fitness/programs';

describe('Fitness Programs screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ProgramsScreen />)).not.toThrow();
  });
});

// ── Progress ──────────────────────────────────────────────────────────────────
import ProgressScreen from '../../app/(tabs)/fitness/progress';

describe('Fitness Progress screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ProgressScreen />)).not.toThrow();
  });
});

// ── Progress Photos ───────────────────────────────────────────────────────────
import ProgressPhotosScreen from '../../app/(tabs)/fitness/progress-photos';

describe('Fitness Progress Photos screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ProgressPhotosScreen />)).not.toThrow();
  });
});

// ── Supplement Scanner ────────────────────────────────────────────────────────
import SupplementScannerScreen from '../../app/(tabs)/fitness/supplement-scanner';

describe('Fitness Supplement Scanner screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<SupplementScannerScreen />)).not.toThrow();
  });
});

// ── Workout Player ────────────────────────────────────────────────────────────
import WorkoutPlayerScreen from '../../app/(tabs)/fitness/workout-player';

describe('Fitness Workout Player screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<WorkoutPlayerScreen />)).not.toThrow();
  });
});

// ── Workout Summary ───────────────────────────────────────────────────────────
import WorkoutSummaryScreen from '../../app/(tabs)/fitness/workout-summary';

describe('Fitness Workout Summary screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<WorkoutSummaryScreen />)).not.toThrow();
  });
});
