// =============================================================================
// TRANSFORMR — Offline Sync Banner
// Appears at the top of the screen when offline or syncing queued operations.
// =============================================================================

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useOfflineSyncStore } from '@stores/offlineSyncStore';
import { typography, spacing } from '@theme/index';

export function OfflineSyncBanner() {
  const isOnline = useOfflineSyncStore((s) => s.isOnline);
  const isSyncing = useOfflineSyncStore((s) => s.isSyncing);
  const pendingCount = useOfflineSyncStore((s) => s.pendingCount);

  const translateY = useSharedValue(-48);
  const opacity = useSharedValue(0);

  const shouldShow = !isOnline || isSyncing || pendingCount > 0;

  React.useEffect(() => {
    if (shouldShow) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(-48, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [shouldShow, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getMessage = (): string => {
    if (!isOnline && pendingCount > 0) return `Offline — ${pendingCount} pending`;
    if (!isOnline) return 'Offline — changes saved locally';
    if (isSyncing) return 'Syncing...';
    if (pendingCount > 0) return `${pendingCount} operations syncing...`;
    return '';
  };

  const getBannerColor = (): string => {
    if (!isOnline) return '#F59E0B';
    return '#22C55E';
  };

  if (!shouldShow) return null;

  return (
    <Animated.View style={[styles.banner, { backgroundColor: getBannerColor() }, animatedStyle]}>
      <Text style={styles.text}>{getMessage()}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  text: {
    ...typography.captionBold,
    color: '#000000' /* brand-ok */
  },
});
