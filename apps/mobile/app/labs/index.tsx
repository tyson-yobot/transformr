// =============================================================================
// TRANSFORMR -- Lab Work History Screen
// Lists all lab uploads with their status + quick access to interpretation.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  ListRenderItem,
} from 'react-native';
import { ListSkeleton } from '@components/ui/ScreenSkeleton';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Icon3D } from '@components/ui/Icon3D';
import { StatusBar } from 'expo-status-bar';
import { useLabsStore } from '@stores/labsStore';
import { PurpleRadialBackground } from '@components/ui/PurpleRadialBackground';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { EmptyStateBackground } from '@components/ui/EmptyStateBackground';
import type { LabUpload, LabUploadStatus } from '@app-types/ai';
import { hapticLight, hapticMedium } from '@utils/haptics';

const STATUS_LABEL: Record<LabUploadStatus, string> = {
  pending: 'Pending',
  processing: 'Interpreting…',
  complete: 'Complete',
  failed: 'Failed',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function LabsHistoryScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const uploads = useLabsStore((s) => s.uploads);
  const isLoading = useLabsStore((s) => s.isLoadingUploads);
  const error = useLabsStore((s) => s.error);
  const fetchUploadList = useLabsStore((s) => s.fetchUploadList);
  const removeUpload = useLabsStore((s) => s.removeUpload);
  const clearError = useLabsStore((s) => s.clearError);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void fetchUploadList();
  }, [fetchUploadList]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUploadList();
    setRefreshing(false);
  }, [fetchUploadList]);

  const handleOpen = useCallback(
    (uploadId: string) => {
      void hapticLight();
      router.push({ pathname: '/labs/detail', params: { upload_id: uploadId } });
    },
    [router],
  );

  const handleLongPress = useCallback(
    (upload: LabUpload) => {
      void hapticMedium();
      Alert.alert(
        upload.title,
        'What would you like to do?',
        [
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Delete lab upload?',
                'This removes the file and interpretation. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await removeUpload(upload.id);
                      } catch (err) {
                        const message =
                          err instanceof Error ? err.message : 'Failed to delete';
                        Alert.alert('Delete failed', message);
                      }
                    },
                  },
                ],
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    },
    [removeUpload],
  );

  const statusColor = useCallback(
    (status: LabUploadStatus): string => {
      switch (status) {
        case 'complete':
          return colors.accent.success;
        case 'processing':
          return colors.accent.info;
        case 'pending':
          return colors.accent.warning;
        case 'failed':
          return colors.accent.danger;
      }
    },
    [colors],
  );

  const renderItem: ListRenderItem<LabUpload> = useCallback(
    ({ item, index }) => (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(280)}>
        <Pressable
          onPress={() => handleOpen(item.id)}
          onLongPress={() => handleLongPress(item)}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.subtle,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginBottom: spacing.sm,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Open lab upload: ${item.title}`}
        >
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: colors.accent.cyanDim,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <Icon3D name="flask" size={20} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text
              style={[typography.bodyBold, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[
                typography.caption,
                { color: colors.text.secondary, marginTop: spacing.xs / 2 },
              ]}
              numberOfLines={1}
            >
              {item.lab_name ? `${item.lab_name} · ` : ''}
              {item.collected_at ? formatDate(item.collected_at) : formatDate(item.created_at)}
            </Text>
            <View style={[styles.statusRow, { marginTop: spacing.xs }]}>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                  backgroundColor: `${statusColor(item.status)}15`,
                }}
              >
                <Text
                  style={[
                    typography.tiny,
                    {
                      color: statusColor(item.status),
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    },
                  ]}
                >
                  {STATUS_LABEL[item.status]}
                </Text>
              </View>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.text.muted}
          />
        </Pressable>
      </Animated.View>
    ),
    [
      borderRadius.md,
      colors.accent.cyan,
      colors.accent.cyanDim,
      colors.background.secondary,
      colors.border.subtle,
      colors.text.muted,
      colors.text.primary,
      colors.text.secondary,
      handleLongPress,
      handleOpen,
      spacing.md,
      spacing.sm,
      spacing.xs,
      statusColor,
      typography.bodyBold,
      typography.caption,
      typography.tiny,
    ],
  );

  const renderEmpty = () => (
    <View
      style={[
        styles.emptyContainer,
        { paddingTop: spacing.xxxl * 2, paddingHorizontal: spacing.xl, position: 'relative', overflow: 'hidden' },
      ]}
    >
      <EmptyStateBackground query="laboratory science dark blue" opacity={0.15} />
      <Icon3D name="flask" size={56} />
      <Text
        style={[
          typography.h3,
          {
            color: colors.text.primary,
            marginTop: spacing.lg,
            textAlign: 'center',
          },
        ]}
      >
        No lab work yet
      </Text>
      <Text
        style={[
          typography.body,
          {
            color: colors.text.secondary,
            marginTop: spacing.sm,
            textAlign: 'center',
          },
        ]}
      >
        Upload a photo of your bloodwork and TRANSFORMR will translate the numbers into wellness-focused observations.
      </Text>
      <Pressable
        onPress={() => {
          void hapticLight();
          router.push('/labs/upload');
        }}
        style={[
          styles.ctaButton,
          {
            backgroundColor: colors.accent.primary,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            marginTop: spacing.xl,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Upload new lab work"
      >
        <Icon3D name="cloud" size={16} />
        <Text
          style={[
            typography.bodyBold,
            { color: '#FFFFFF' /* brand-ok — white on accent */, marginLeft: spacing.sm },
          ]}
        >
          Upload Lab Work
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.primary },
      ]}
    >
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <PurpleRadialBackground />
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomColor: colors.border.subtle,
            backgroundColor: colors.background.secondary,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            void hapticLight();
            router.back();
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.text.primary }]}>
          Lab Work
        </Text>
        <Pressable
          onPress={() => {
            void hapticLight();
            router.push('/labs/upload');
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Upload new lab work"
        >
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={colors.accent.cyan}
          />
        </Pressable>
      </View>

      {error && (
        <Pressable
          onPress={clearError}
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.accent.dangerDim,
              borderColor: colors.accent.danger,
              marginHorizontal: spacing.lg,
              marginTop: spacing.sm,
              borderRadius: borderRadius.md,
              padding: spacing.md,
            },
          ]}
        >
          <Icon3D
            name="warning"
            size={18}
          />
          <Text
            style={[
              typography.caption,
              { color: colors.accent.danger, marginLeft: spacing.sm, flex: 1 },
            ]}
            numberOfLines={2}
          >
            {error}
          </Text>
        </Pressable>
      )}

      {isLoading && uploads.length === 0 ? (
        <ListSkeleton />
      ) : (
        <FlatList
          data={uploads}
          renderItem={renderItem}
          keyExtractor={(u) => u.id}
          removeClippedSubviews
          windowSize={7}
          maxToRenderPerBatch={8}
          initialNumToRender={10}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
            flexGrow: 1,
          }}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.primary}
              colors={[colors.accent.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
