// =============================================================================
// TRANSFORMR -- Lab Work Upload Screen
// Upload a photo of a lab report, optionally tag it with a lab name and
// collection date, then send it to the AI Lab Interpreter.
// =============================================================================

import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { GatePromptCard } from '@components/ui/GatePromptCard';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Disclaimer } from '@components/ui/Disclaimer';
import { useLabsStore } from '@stores/labsStore';
import { useAuthStore } from '@stores/authStore';
import { hapticLight, hapticMedium, hapticSuccess } from '@utils/haptics';
import { HelpBubble } from '@components/ui/HelpBubble';

type PickedAsset = {
  uri: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number | null;
};

function inferMimeType(uri: string): PickedAsset['mimeType'] {
  const lowered = uri.toLowerCase();
  if (lowered.endsWith('.png')) return 'image/png';
  if (lowered.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export default function LabUploadScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const gate = useFeatureGate('lab_scanner');

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const uploadAndInterpret = useLabsStore((s) => s.uploadAndInterpret);
  const isUploading = useLabsStore((s) => s.isUploading);
  const isInterpreting = useLabsStore((s) => s.isInterpreting);
  const error = useLabsStore((s) => s.error);
  const clearError = useLabsStore((s) => s.clearError);

  const [asset, setAsset] = useState<PickedAsset | null>(null);
  const [title, setTitle] = useState('');
  const [labName, setLabName] = useState('');
  const [collectedAt, setCollectedAt] = useState('');
  const [notes, setNotes] = useState('');

  const busy = isUploading || isInterpreting;

  const handlePickFromLibrary = useCallback(async () => {
    void hapticLight();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'TRANSFORMR needs photo library access to read lab documents.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
      exif: false,
    });
    if (result.canceled || result.assets.length === 0) return;
    const picked = result.assets[0];
    if (!picked) return;
    setAsset({
      uri: picked.uri,
      mimeType: inferMimeType(picked.uri),
      sizeBytes: picked.fileSize ?? null,
    });
  }, []);

  const handleTakePhoto = useCallback(async () => {
    void hapticLight();
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'TRANSFORMR needs camera access to capture your lab document.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
      exif: false,
    });
    if (result.canceled || result.assets.length === 0) return;
    const picked = result.assets[0];
    if (!picked) return;
    setAsset({
      uri: picked.uri,
      mimeType: inferMimeType(picked.uri),
      sizeBytes: picked.fileSize ?? null,
    });
  }, []);

  const handleClearAsset = useCallback(() => {
    void hapticLight();
    setAsset(null);
  }, []);

  const validCollectedAt = useMemo(() => {
    if (!collectedAt) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(collectedAt);
  }, [collectedAt]);

  const canSubmit =
    !!asset && !!userId && title.trim().length > 0 && validCollectedAt && !busy;

  const handleSubmit = useCallback(async () => {
    if (!asset || !userId) return;
    if (!canSubmit) return;
    void hapticMedium();

    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await uploadAndInterpret({
        userId,
        title: title.trim(),
        labName: labName.trim() || undefined,
        collectedAt: collectedAt.trim() || undefined,
        notes: notes.trim() || undefined,
        fileBase64: base64,
        mimeType: asset.mimeType,
        fileType: 'image',
        fileSizeBytes: asset.sizeBytes ?? undefined,
      });

      void hapticSuccess();
      router.replace({
        pathname: '/labs/detail',
        params: { upload_id: response.upload_id },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to interpret lab';
      Alert.alert('Interpretation failed', message);
    }
  }, [
    asset,
    canSubmit,
    collectedAt,
    labName,
    notes,
    router,
    title,
    uploadAndInterpret,
    userId,
  ]);

  const busyLabel = isUploading
    ? 'Uploading your lab work…'
    : isInterpreting
    ? 'Interpreting with AI…'
    : null;

  if (!gate.isAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <GatePromptCard featureKey="lab_scanner" height={200} />
      </SafeAreaView>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.primary },
      ]}
    >
      <StatusBar style="light" backgroundColor="#0C0A15" />
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
          Upload Lab Work
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <Pressable
            onPress={clearError}
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.accent.dangerDim,
                borderColor: colors.accent.danger,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
              },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={colors.accent.danger}
            />
            <Text
              style={[
                typography.caption,
                { color: colors.accent.danger, marginLeft: spacing.sm, flex: 1 },
              ]}
              numberOfLines={3}
            >
              {error}
            </Text>
          </Pressable>
        )}

        <HelpBubble id="labs_upload" message="Snap a photo of your blood work for AI analysis" position="above" />

        <Animated.View entering={FadeInDown.duration(320)}>
          <Text
            style={[
              typography.caption,
              {
                color: colors.text.muted,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: spacing.sm,
              },
            ]}
          >
            Document
          </Text>

          {asset ? (
            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.subtle,
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                },
              ]}
            >
              <Image
                source={{ uri: asset.uri }}
                style={[
                  styles.previewImage,
                  { borderRadius: borderRadius.sm },
                ]}
                resizeMode="cover"
              />
              <Pressable
                onPress={handleClearAsset}
                style={[
                  styles.clearButton,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderRadius: borderRadius.full,
                  },
                ]}
                hitSlop={10}
                accessibilityLabel="Remove selected image"
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={colors.text.primary}
                />
              </Pressable>
            </View>
          ) : (
            <View style={styles.pickerRow}>
              <Pressable
                onPress={handleTakePhoto}
                style={({ pressed }) => [
                  styles.pickerButton,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.subtle,
                    borderRadius: borderRadius.md,
                    padding: spacing.lg,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Take photo of lab work"
              >
                <Ionicons
                  name="camera-outline"
                  size={28}
                  color={colors.accent.cyan}
                />
                <Text
                  style={[
                    typography.captionBold,
                    { color: colors.text.primary, marginTop: spacing.sm },
                  ]}
                >
                  Take Photo
                </Text>
              </Pressable>
              <Pressable
                onPress={handlePickFromLibrary}
                style={({ pressed }) => [
                  styles.pickerButton,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.subtle,
                    borderRadius: borderRadius.md,
                    padding: spacing.lg,
                    marginLeft: spacing.sm,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Choose from photo library"
              >
                <Ionicons
                  name="images-outline"
                  size={28}
                  color={colors.accent.cyan}
                />
                <Text
                  style={[
                    typography.captionBold,
                    { color: colors.text.primary, marginTop: spacing.sm },
                  ]}
                >
                  Library
                </Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(320)}
          style={{ marginTop: spacing.lg }}
        >
          <Input
            label="Title"
            placeholder="e.g., Q2 Annual Physical"
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
            maxLength={80}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(320)}
          style={{ marginTop: spacing.md }}
        >
          <Input
            label="Lab name (optional)"
            placeholder="Quest, LabCorp, etc."
            value={labName}
            onChangeText={setLabName}
            autoCapitalize="words"
            maxLength={60}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(160).duration(320)}
          style={{ marginTop: spacing.md }}
        >
          <Input
            label="Collected on (YYYY-MM-DD, optional)"
            placeholder="2026-04-01"
            value={collectedAt}
            onChangeText={setCollectedAt}
            autoCapitalize="none"
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            maxLength={10}
          />
          {!validCollectedAt && (
            <Text
              style={[
                typography.tiny,
                { color: colors.accent.danger, marginTop: spacing.xs },
              ]}
            >
              Must be in YYYY-MM-DD format
            </Text>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(320)}
          style={{ marginTop: spacing.md }}
        >
          <Input
            label="Notes (optional)"
            placeholder="Anything to flag for the AI coach"
            value={notes}
            onChangeText={setNotes}
            autoCapitalize="sentences"
            multiline
            numberOfLines={3}
            maxLength={400}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(240).duration(320)}
          style={{ marginTop: spacing.xl }}
        >
          <Disclaimer type="lab" />
        </Animated.View>

        {busyLabel && (
          <View
            style={[
              styles.busyContainer,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginTop: spacing.lg,
              },
            ]}
          >
            <ActivityIndicator color={colors.accent.cyan} />
            <Text
              style={[
                typography.caption,
                { color: colors.text.secondary, marginLeft: spacing.md },
              ]}
            >
              {busyLabel}
            </Text>
          </View>
        )}

        <View style={{ marginTop: spacing.xl }}>
          <Button
            title="Interpret Lab Work"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={busy}
            fullWidth
          />
        </View>
      </ScrollView>
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
  pickerRow: {
    flexDirection: 'row',
  },
  pickerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  previewCard: {
    borderWidth: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 280,
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  busyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
