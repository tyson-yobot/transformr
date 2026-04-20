/**
 * React Native and Reanimated mock setup for component tests.
 * Import this file at the top of each component test that renders RN components.
 *
 * Usage:
 *   jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
 *   jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
 *   jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
 *
 * Note: these must be called in jest.mock() factories, not imported directly,
 * because jest.mock() hoisting requires factory-form mocks.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mockReactNative() {
  const React = jest.requireActual<typeof import('react')>('react');
  const el = React.createElement.bind(React);

  const View = ({ children, ...p }: any) => el('View', p, children);
  View.displayName = 'View';
  const Text = ({ children, ...p }: any) => el('Text', p, children);
  Text.displayName = 'Text';
  const Pressable = ({ children, ...p }: any) => el('Pressable', p, children);
  const ScrollView = ({ children, ...p }: any) => el('ScrollView', p, children);
  const TextInput = (p: any) => el('TextInput', p);
  const ActivityIndicator = (p: any) => el('ActivityIndicator', p);
  const Image = (p: any) => el('Image', p);
  const SafeAreaView = ({ children, ...p }: any) => el('SafeAreaView', p, children);
  const KeyboardAvoidingView = ({ children, ...p }: any) => el('KeyboardAvoidingView', p, children);
  const FlatList = ({ data, renderItem, keyExtractor: _keyExtractor, ...p }: any) =>
    el('FlatList', p, (data ?? []).map((item: any, i: number) => renderItem({ item, index: i })));
  const SectionList = ({ sections, renderItem, renderSectionHeader, keyExtractor: _keyExtractor2, ...p }: any) =>
    el('SectionList', p, (sections ?? []).flatMap((s: any) => [
      renderSectionHeader ? renderSectionHeader({ section: s }) : null,
      ...(s.data ?? []).map((item: any, i: number) => renderItem({ item, index: i, section: s })),
    ]));
  const VirtualizedList = ({ data, renderItem, ...p }: any) =>
    el('VirtualizedList', p, (data ?? []).map((item: any, i: number) => renderItem({ item, index: i })));

  return {
    View, Text, Pressable, ScrollView, TextInput, ActivityIndicator,
    Image, SafeAreaView, KeyboardAvoidingView, FlatList, SectionList, VirtualizedList,
    Switch: (p: any) => el('Switch', p),
    TouchableOpacity: Pressable, TouchableHighlight: Pressable,
    Platform: { OS: 'ios', select: (obj: any) => obj.ios },
    StyleSheet: { create: (s: any) => s, flatten: (s: any) => s, absoluteFillObject: {} },
    Dimensions: { get: () => ({ width: 375, height: 812 }) },
    Alert: { alert: jest.fn() },
    Linking: { openURL: jest.fn() },
    Animated: {
      View,
      Text,
      Value: jest.fn(() => ({ interpolate: jest.fn(), setValue: jest.fn() })),
      timing: jest.fn(() => ({ start: jest.fn() })),
      spring: jest.fn(() => ({ start: jest.fn() })),
      createAnimatedComponent: (c: any) => c,
    },
    Modal: ({ children, visible }: any) => visible ? el('View', {}, children) : null,
    useWindowDimensions: () => ({ width: 375, height: 812 }),
    AppState: { currentState: 'active', addEventListener: jest.fn() },
    AccessibilityInfo: {
      announceForAccessibility: jest.fn(),
      isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
      isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
    },
    InteractionManager: {
      runAfterInteractions: (cb: () => void) => { cb(); return { cancel: jest.fn() }; },
    },
    NativeModules: {},
    NativeEventEmitter: jest.fn().mockImplementation(() => ({
      addListener: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
  };
}

export function mockReanimated() {
  const React = jest.requireActual<typeof import('react')>('react');
  const el = React.createElement.bind(React);
  const AnimView = ({ children, style, ...p }: any) => el('View', { ...p, style }, children);

  return {
    __esModule: true,
    default: {
      View: AnimView,
      Text: ({ children, ...p }: any) => el('Text', p, children),
      createAnimatedComponent: (c: any) => c,
    },
    View: AnimView,
    createAnimatedComponent: (c: any) => c,
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: (fn: () => object) => { try { return fn(); } catch { return {}; } },
    withTiming: (v: any) => v,
    withSpring: (v: any) => v,
    withRepeat: (v: any) => v,
    withSequence: (...args: any[]) => args[args.length - 1],
    withDelay: (_ms: number, v: any) => v,
    Easing: {
      out: (e: any) => e, cubic: (t: any) => t, ease: jest.fn(),
      inOut: (e: any) => e, in: (e: any) => e, back: () => (t: any) => t,
      sin: (t: any) => t,
    },
    ...((() => {
      const makeAnim = () => {
        const a: Record<string, jest.Mock> = {};
        a.duration = jest.fn(() => a);
        a.delay = jest.fn(() => a);
        a.easing = jest.fn(() => a);
        a.springify = jest.fn(() => a);
        a.damping = jest.fn(() => a);
        return a;
      };
      return {
        FadeIn: makeAnim(), FadeOut: makeAnim(),
        FadeInDown: makeAnim(), FadeInUp: makeAnim(),
        FadeInLeft: makeAnim(), FadeInRight: makeAnim(),
        SlideInDown: makeAnim(), SlideInUp: makeAnim(),
        SlideInLeft: makeAnim(), SlideInRight: makeAnim(),
        ZoomIn: makeAnim(), ZoomOut: makeAnim(),
        BounceIn: makeAnim(), FlipInXUp: makeAnim(), StretchInX: makeAnim(),
      };
    })()),
    cancelAnimation: jest.fn(),
    runOnJS: (fn: any) => fn,
    runOnUI: (fn: any) => fn,
    useReducedMotion: () => false,
    makeMutable: (v: any) => ({ value: v }),
    interpolateColor: () => '#000000',
    interpolate: (_v: any, _input: any, output: any[]) => output[0],
    useAnimatedProps: (fn: () => object) => { try { return fn(); } catch { return {}; } },
  };
}

export function mockTheme() {
  return {
    useTheme: () => ({
      colors: {
        accent: {
          primary: '#A855F7', primaryDark: '#7E22CE', primaryLight: '#C084FC',
          primaryDim: 'rgba(168,85,247,0.12)', primarySubtle: 'rgba(168,85,247,0.12)',
          secondary: '#7E22CE',
          success: '#22C55E', warning: '#F59E0B', danger: '#EF4444', info: '#3B82F6',
          fire: '#FF6B35',
          gold: '#F59E0B',
          pink: '#EC4899',
          cyan: '#06B6D4',
          successDim: 'rgba(34,197,94,0.12)',
          cyanDim: 'rgba(6,182,212,0.12)',
          warningDim: 'rgba(245,158,11,0.12)',
        },
        shadow: { cardSubtle: 'rgba(168,85,247,0.15)', cardStrong: 'rgba(168,85,247,0.4)' },
        dim: { primary: 'rgba(168,85,247,0.15)', secondary: 'rgba(126,34,206,0.15)' },
        glow: {
          purple: 'rgba(168,85,247,0.3)', cyan: 'rgba(6,182,212,0.3)',
          success: 'rgba(34,197,94,0.3)', fire: 'rgba(255,107,53,0.3)',
          gold: 'rgba(245,158,11,0.3)', pink: 'rgba(236,72,153,0.3)',
          danger: 'rgba(239,68,68,0.3)',
        },
        background: {
          primary: '#0C0A15', secondary: '#16122A', tertiary: '#1E1937',
          card: '#16122A', overlay: 'rgba(0,0,0,0.7)',
        },
        text: {
          primary: '#F0F0FC', secondary: '#9B8FC0', tertiary: '#6B5F8F',
          muted: '#4A3F6B', inverse: '#1A0A2E',
        },
        border: { default: '#2A2248', strong: '#3D3366', subtle: '#1E1937' },
        gradient: { primary: ['#A855F7', '#7E22CE'] },
        card: { background: '#16122A', border: '#2A2248' },
      },
      typography: {
        h1: { fontSize: 32 }, h2: { fontSize: 24 }, h3: { fontSize: 20 },
        h4: { fontSize: 18 }, body: { fontSize: 16 }, bodyBold: { fontSize: 16, fontWeight: '700' },
        caption: { fontSize: 12 }, captionBold: { fontSize: 12, fontWeight: '700' },
        tiny: { fontSize: 10 }, monoBody: { fontSize: 14 }, monoCaption: { fontSize: 12 },
      },
      spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
      borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, xxl: 20, full: 9999 },
      shadows: {
        sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
        md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
        glow: { shadowColor: '#A855F7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 0 },
      },
      isDark: true,
      mode: 'dark' as const,
      setMode: jest.fn(),
    }),
  };
}
