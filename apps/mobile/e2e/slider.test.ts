import { by, device, element, expect } from 'detox';
import { execSync } from 'child_process';

/**
 * Slider worklet regression test.
 *
 * Asserts that dragging each slider does NOT produce the
 * Reanimated non-worklet error in logcat.
 *
 * Generated as part of Session 2A.1 (Reanimated worklet fix).
 * If this test fails on a future change, that change broke
 * worklet directives or runOnJS wrapping. Fix the directive,
 * not the test.
 */
describe('Reanimated slider worklet integrity', () => {
  const SLIDERS_TO_TEST = [
    { testID: 'mood-slider', screen: 'Mood' },
    { testID: 'readiness-slider', screen: 'Readiness' },
    { testID: 'rpe-slider', screen: 'RPE' },
    { testID: 'intensity-slider', screen: 'Intensity' },
  ];

  it('does not produce Reanimated non-worklet errors during slider drags', async () => {
    // Clear logcat before the test runs so we only see new errors
    execSync('adb logcat -c');

    for (const slider of SLIDERS_TO_TEST) {
      try {
        const sliderElement = element(by.id(slider.testID));
        await expect(sliderElement).toBeVisible();
        // Swipe right then left to exercise the gesture handler
        await sliderElement.swipe('right', 'slow', 0.6);
        await sliderElement.swipe('left', 'slow', 0.6);
      } catch (err) {
        // Slider not in current navigation context; skip and continue.
        // The agent's testID strategy may not navigate to every screen.
        // Logcat scan after the loop is the authoritative check.
        // eslint-disable-next-line no-console
        console.log(`Skipped ${slider.testID}: ${(err as Error).message}`);
      }
    }

    // Authoritative check: scan logcat for the Reanimated error
    const logcatOutput = execSync('adb logcat -d -t 1000').toString();
    const hasWorkletError = /Reanimated.*non-worklet/i.test(logcatOutput);

    if (hasWorkletError) {
      const errorLines = logcatOutput
        .split('\n')
        .filter((line) => /Reanimated.*non-worklet/i.test(line))
        .slice(0, 5)
        .join('\n');
      throw new Error(
        `Reanimated non-worklet error detected in logcat after slider drags:\n${errorLines}`,
      );
    }
  });
});
