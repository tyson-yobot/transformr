module.exports = {
  Platform: { OS: 'ios', select: (obj) => obj.ios },
  StyleSheet: { create: (styles) => styles },
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  Alert: { alert: jest.fn() },
  Linking: { openURL: jest.fn() },
  AppState: { currentState: 'active', addEventListener: jest.fn() },
  AccessibilityInfo: {
    announceForAccessibility: jest.fn(),
    isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
    isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
  },
  InteractionManager: {
    runAfterInteractions: (cb) => { cb(); return { cancel: jest.fn() }; },
  },
  NativeModules: {},
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  })),
};
