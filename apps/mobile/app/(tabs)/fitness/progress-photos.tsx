// =============================================================================
// TRANSFORMR — Progress Photo Timelapse Screen
//
// Camera capture → Supabase Storage upload → gallery grid → AI analysis.
// Timelapse: horizontal scrollable timeline sorted by date.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { supabase } from '@services/supabase';
import { uploadProgressPhoto, analyzeProgressPhotos } from '@services/ai/progressPhoto';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { useFeatureGate } from '@hooks/useFeatureGate';
import type { AIProgressPhotoAnalysis } from '@app-types/ai';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { EmptyStateBackground } from '@components/ui/EmptyStateBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - 48) / 3;
const TIMELINE_ITEM_W = 100;

type PhotoAngle = 'front' | 'side' | 'back';

interface StoredPhoto {
  url: string;
  angle: PhotoAngle;
  takenAt: Date;
  name: string;
}

const ANGLE_LABELS: Record<PhotoAngle, string> = {
  front: 'Front',
  side:  'Side',
  back:  'Back',
};

export default function ProgressPhotosScreen() {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const progressPhotoGate = useFeatureGate('ai_progress_photo');

  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIProgressPhotoAnalysis | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<PhotoAngle>('front');
  const timelineRef = useRef<FlatList>(null);

  const loadPhotos = useCallback(async (uid: string) => {
    const { data, error } = await supabase.storage
      .from('progress-photos')
      .list(uid, { sortBy: { column: 'created_at', order: 'desc' } });

    if (error || !data) { setLoading(false); return; }

    const stored: StoredPhoto[] = data
      .filter((f: { name: string }) => f.name.endsWith('.jpg'))
      .map((f: { name: string }) => {
        const { data: urlData } = supabase.storage
          .from('progress-photos')
          .getPublicUrl(`${uid}/${f.name}`);

        const parts = f.name.replace('.jpg', '').split('_');
        const ts = parseInt(parts[0] ?? '0', 10);
        const angle = (parts[1] ?? 'front') as PhotoAngle;

        return {
          url: urlData.publicUrl,
          angle,
          takenAt: new Date(ts),
          name: f.name,
        };
      });

    setPhotos(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      void loadPhotos(user.id);
    });
  }, [loadPhotos]);

  const handleCapture = useCallback(async () => {
    if (!userId) return;
    hapticLight();

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Camera Access Needed', 'Allow camera access in Settings to take progress photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      await uploadProgressPhoto(result.assets[0].uri, userId, selectedAngle);
      hapticSuccess();
      await loadPhotos(userId);
    } catch {
      Alert.alert('Upload Failed', 'Could not save your photo. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [userId, selectedAngle, loadPhotos]);

  const handleAnalyze = useCallback(async () => {
    if (!userId || photos.length === 0) return;
    if (!progressPhotoGate.isAvailable) return;
    hapticLight();
    setAnalyzing(true);

    try {
      // Use the most recent photo per angle
      const byAngle = photos.reduce<Partial<Record<PhotoAngle, string>>>((acc, p) => {
        if (!acc[p.angle]) acc[p.angle] = p.url;
        return acc;
      }, {});

      const result = await analyzeProgressPhotos(
        { front: byAngle.front, side: byAngle.side, back: byAngle.back },
        userId,
      );
      setAnalysis(result);
      hapticSuccess();
    } catch {
      Alert.alert('Analysis Failed', 'AI analysis is temporarily unavailable. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }, [userId, photos, progressPhotoGate.isAvailable]);

  const ANGLE_OPTIONS: PhotoAngle[] = ['front', 'side', 'back'];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background.primary} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[typography.h2, { color: colors.text.primary, flex: 1, marginLeft: spacing.sm }]}>
          Progress Photos
        </Text>
        {photos.length >= 2 && (
          <Pressable
            onPress={handleAnalyze}
            disabled={analyzing}
            accessibilityLabel="Analyze progress"
            accessibilityRole="button"
          >
            {analyzing ? (
              <ActivityIndicator color={colors.accent.primary} size="small" />
            ) : (
              <Ionicons name="sparkles-outline" size={22} color={colors.accent.primary} />
            )}
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Angle selector + capture */}
        <View style={[styles.captureRow, { padding: spacing.lg, gap: spacing.sm }]}>
          {ANGLE_OPTIONS.map((angle) => (
            <Pressable
              key={angle}
              onPress={() => setSelectedAngle(angle)}
              style={[
                styles.angleBtn,
                {
                  backgroundColor: selectedAngle === angle ? colors.accent.primary : colors.background.tertiary,
                  borderRadius: borderRadius.full,
                  paddingVertical: spacing.xs,
                  paddingHorizontal: spacing.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Select ${ANGLE_LABELS[angle]} angle`}
            >
              <Text
                style={[
                  typography.captionBold,
                  { color: selectedAngle === angle ? '#FFFFFF' : colors.text.secondary },
                ]}
              >
                {ANGLE_LABELS[angle]}
              </Text>
            </Pressable>
          ))}

          <Pressable
            onPress={handleCapture}
            disabled={uploading}
            style={[
              styles.captureBtn,
              {
                backgroundColor: colors.accent.primary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.md,
                marginLeft: 'auto',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Capture ${ANGLE_LABELS[selectedAngle]} photo`}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            )}
          </Pressable>
        </View>

        {/* Timelapse horizontal timeline */}
        {photos.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text
              style={[
                typography.captionBold,
                { color: colors.text.secondary, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
              ]}
            >
              Timeline
            </Text>
            <FlatList
              ref={timelineRef}
              data={[...photos].reverse()}
              horizontal
              showsHorizontalScrollIndicator={false}
              removeClippedSubviews
              windowSize={5}
              maxToRenderPerBatch={6}
              initialNumToRender={5}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <View style={{ width: TIMELINE_ITEM_W, alignItems: 'center' }}>
                  <Image
                    source={{ uri: item.url }}
                    style={[
                      styles.timelineThumb,
                      {
                        borderRadius: borderRadius.sm,
                        borderColor: colors.border.default,
                      },
                    ]}
                  />
                  <Badge
                    label={ANGLE_LABELS[item.angle as PhotoAngle] ?? item.angle}
                    variant="default"
                    size="sm"
                    style={{ marginTop: 4 }}
                  />
                  <Text
                    style={[
                      typography.tiny,
                      { color: colors.text.muted, marginTop: 2, textAlign: 'center' },
                    ]}
                  >
                    {item.takenAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              )}
            />
          </Animated.View>
        )}

        {/* Gallery grid */}
        <View style={[styles.gallery, { padding: spacing.lg, gap: spacing.xs }]}>
          <Text
            style={[
              typography.captionBold,
              { color: colors.text.secondary, marginBottom: spacing.sm },
            ]}
          >
            Gallery
          </Text>

          {loading && <ActivityIndicator color={colors.accent.primary} />}

          {!loading && photos.length === 0 && (
            <View style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, minHeight: 200 }}>
              <EmptyStateBackground query="transformation fitness dark" opacity={0.15} />
              <Card style={{ padding: spacing.lg, alignItems: 'center' }}>
                <Ionicons name="camera-outline" size={40} color={colors.text.muted} />
                <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.md, textAlign: 'center' }]}>
                  No photos yet. Tap the camera to capture your first progress photo.
                </Text>
              </Card>
            </View>
          )}

          <View style={styles.gridRow}>
            {photos.map((photo) => (
              <Image
                key={photo.name}
                source={{ uri: photo.url }}
                style={[
                  styles.gridThumb,
                  { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: borderRadius.sm },
                ]}
              />
            ))}
          </View>
        </View>

        {/* AI Analysis */}
        {analysis && (
          <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: spacing.lg }}>
            <Card variant="elevated" style={{ padding: spacing.lg }}>
              <View style={[styles.analysisHeader, { marginBottom: spacing.md }]}>
                <Ionicons name="sparkles" size={18} color={colors.accent.primary} />
                <Text style={[typography.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}>
                  AI Body Composition Analysis
                </Text>
              </View>
              <Text style={[typography.body, { color: colors.text.secondary, lineHeight: 22 }]}>
                {(analysis as unknown as { summary?: string }).summary ?? JSON.stringify(analysis)}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Analyze CTA (if photos exist but no analysis yet) */}
        {!analysis && photos.length >= 2 && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
            <Button
              title={analyzing ? 'Analyzing…' : 'Analyze Progress'}
              variant="primary"
              onPress={handleAnalyze}
              loading={analyzing}
              fullWidth
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:         { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  captureRow:     { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  angleBtn:       {},
  captureBtn:     { alignItems: 'center', justifyContent: 'center' },
  timelineThumb:  { width: TIMELINE_ITEM_W - 8, height: 120, borderWidth: 1 },
  gallery:        {},
  gridRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gridThumb:      { resizeMode: 'cover' },
  analysisHeader: { flexDirection: 'row', alignItems: 'center' },
});
