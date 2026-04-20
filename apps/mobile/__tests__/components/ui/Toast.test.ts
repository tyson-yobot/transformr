// Tests for ToastManager (the class-based singleton — no React rendering needed)

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import { toastManager } from '../../../components/ui/Toast';

describe('toastManager', () => {
  let received: Array<{ id: string; type: string; message: string; duration?: number }> = [];
  let unsubscribe: () => void;

  beforeEach(() => {
    received = [];
    unsubscribe = toastManager.subscribe((toasts) => {
      received = toasts as typeof received;
    });
  });

  afterEach(() => {
    // Dismiss all toasts so the singleton is clean for the next test
    [...received].forEach((t) => toastManager.dismiss(t.id));
    unsubscribe();
  });

  it('notifies subscribers when a toast is shown', () => {
    toastManager.success('Saved!');
    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('success');
    expect(received[0].message).toBe('Saved!');
  });

  it('notifies subscribers when a toast is dismissed', () => {
    toastManager.error('Failed');
    expect(received).toHaveLength(1);
    const id = received[0].id;
    toastManager.dismiss(id);
    expect(received).toHaveLength(0);
  });

  it('supports warning convenience method', () => {
    toastManager.warning('Watch out');
    expect(received[0].type).toBe('warning');
    expect(received[0].message).toBe('Watch out');
  });

  it('supports info convenience method', () => {
    toastManager.info('FYI');
    expect(received[0].type).toBe('info');
    expect(received[0].message).toBe('FYI');
  });

  it('unsubscribe stops future notifications', () => {
    unsubscribe();
    const countBefore = received.length;
    toastManager.show('info', 'Should not appear');
    expect(received.length).toBe(countBefore);
    // Re-subscribe so afterEach cleanup works
    unsubscribe = toastManager.subscribe((toasts) => {
      received = toasts as typeof received;
    });
    // Dismiss the toast we just added via show()
    const allToasts: Array<{ id: string }> = [];
    const cleanup = toastManager.subscribe((t) => { allToasts.push(...(t as typeof allToasts)); });
    cleanup();
    allToasts.forEach((t) => toastManager.dismiss(t.id));
  });
});
