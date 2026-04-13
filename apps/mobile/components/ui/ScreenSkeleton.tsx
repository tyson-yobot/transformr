import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Skeleton } from './Skeleton';

interface ScreenSkeletonProps {
  style?: ViewStyle;
}

export function DashboardSkeleton({ style }: ScreenSkeletonProps) {
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }, style]}>
      {/* Greeting */}
      <Skeleton variant="text" width="60%" height={24} style={{ marginBottom: spacing.xs }} />
      <Skeleton variant="text" width="40%" height={16} style={{ marginBottom: spacing.xl }} />

      {/* Countdown Card */}
      <Skeleton variant="card" height={140} style={{ marginBottom: spacing.lg }} />

      {/* Quick Stats Row */}
      <View style={[styles.row, { gap: spacing.sm, marginBottom: spacing.lg }]}>
        <Skeleton variant="card" height={72} style={{ flex: 1 }} />
        <Skeleton variant="card" height={72} style={{ flex: 1 }} />
        <Skeleton variant="card" height={72} style={{ flex: 1 }} />
        <Skeleton variant="card" height={72} style={{ flex: 1 }} />
      </View>

      {/* Plan Card */}
      <Skeleton variant="card" height={160} style={{ marginBottom: spacing.lg }} />

      {/* Weight Chart Card */}
      <Skeleton variant="card" height={200} style={{ marginBottom: spacing.lg }} />

      {/* Motivation Card */}
      <Skeleton variant="card" height={100} style={{ marginBottom: spacing.lg }} />
    </View>
  );
}

export function ListSkeleton({ style, rows = 5 }: ScreenSkeletonProps & { rows?: number }) {
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }, style]}>
      {/* Header */}
      <Skeleton variant="text" width="50%" height={24} style={{ marginBottom: spacing.lg }} />

      {/* List items */}
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[styles.listRow, { gap: spacing.md, marginBottom: spacing.md }]}>
          <Skeleton variant="circle" height={44} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function DetailSkeleton({ style }: ScreenSkeletonProps) {
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }, style]}>
      {/* Header */}
      <Skeleton variant="text" width="60%" height={28} style={{ marginBottom: spacing.sm }} />
      <Skeleton variant="text" width="30%" height={14} style={{ marginBottom: spacing.xl }} />

      {/* Chart area */}
      <Skeleton variant="card" height={220} style={{ marginBottom: spacing.lg }} />

      {/* Info rows */}
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={[styles.infoRow, { marginBottom: spacing.md }]}>
          <Skeleton variant="text" width="35%" height={14} />
          <Skeleton variant="text" width="25%" height={14} />
        </View>
      ))}
    </View>
  );
}

export function FormSkeleton({ style }: ScreenSkeletonProps) {
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }, style]}>
      {/* Header */}
      <Skeleton variant="text" width="50%" height={28} style={{ marginBottom: spacing.xxl }} />

      {/* Input fields */}
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={{ marginBottom: spacing.lg }}>
          <Skeleton variant="text" width="30%" height={12} style={{ marginBottom: spacing.sm }} />
          <Skeleton variant="card" height={48} />
        </View>
      ))}

      {/* Button */}
      <Skeleton variant="card" height={48} style={{ marginTop: spacing.lg }} />
    </View>
  );
}

export function CardSkeleton({ style, height = 120 }: ScreenSkeletonProps & { height?: number }) {
  return <Skeleton variant="card" height={height} style={style} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
