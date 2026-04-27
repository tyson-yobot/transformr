// =============================================================================
// TRANSFORMR — ProgressPhotoGuide
// Full-screen camera modal for progress photos.
// Overlays a body-silhouette guide with dashed alignment lines.
// =============================================================================

import { useRef, useCallback } from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Icon3D } from '@components/ui/Icon3D';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ProgressPhotoGuideProps {
  visible:       boolean;
  onClose:       () => void;
  onPhotoTaken:  (uri: string) => void;
}

// -----------------------------------------------------------------------------
// Silhouette overlay
// Pure View shapes — no SVG dependency needed.
// -----------------------------------------------------------------------------

function BodySilhouette() {
  return (
    <View style={silhouette.container} pointerEvents="none">
      {/* Head */}
      <View style={silhouette.head} />
      {/* Neck */}
      <View style={silhouette.neck} />
      {/* Torso */}
      <View style={silhouette.torso} />
      {/* Hips */}
      <View style={silhouette.hips} />
      {/* Legs */}
      <View style={silhouette.legsRow}>
        <View style={silhouette.leg} />
        <View style={{ width: 20 }} />
        <View style={silhouette.leg} />
      </View>

      {/* Horizontal alignment guides */}
      <View style={[silhouette.guide, { top: '15%' }]} />
      <View style={[silhouette.guide, { top: '42%' }]} />
      <View style={[silhouette.guide, { top: '68%' }]} />
    </View>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ProgressPhotoGuide({ visible, onClose, onPhotoTaken }: ProgressPhotoGuideProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
    if (photo?.uri) {
      onPhotoTaken(photo.uri);
      onClose();
    }
  }, [onPhotoTaken, onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: colors.background.primary }]}>

        {/* Permission denied branch */}
        {!permission?.granted && (
          <View style={[styles.permissionContainer, { padding: spacing.xl }]}>
            <Icon3D name="camera" size={48} style={{ marginBottom: spacing.lg }} />
            <Text style={[typography.h3, { color: colors.text.primary, textAlign: 'center', marginBottom: spacing.md }]}>
              Camera access required
            </Text>
            <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xl }]}>
              Allow camera access to take progress photos.
            </Text>
            <Button title="Grant Permission" onPress={() => void requestPermission()} fullWidth style={{ marginBottom: spacing.md }} />
            <Button title="Cancel" onPress={onClose} variant="ghost" fullWidth />
          </View>
        )}

        {/* Camera view */}
        {permission?.granted && (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing="back"
            />

            {/* Silhouette overlay */}
            <BodySilhouette />

            {/* Top bar */}
            <View style={[styles.topBar, { paddingTop: spacing.xl, paddingHorizontal: spacing.lg }]}>
              <Pressable
                onPress={onClose}
                style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: borderRadius.full }]}
                accessibilityRole="button"
                accessibilityLabel="Close camera"
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </Pressable>
              <Text style={[typography.captionBold, { color: '#FFFFFF' }]}>
                Align to guide
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Bottom controls */}
            <View style={[styles.bottomBar, { paddingBottom: spacing.xl, paddingHorizontal: spacing.xl }]}>
              <Text style={[typography.tiny, { color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: spacing.lg }]}>
                Stand 6–8 ft from camera • Full body in frame
              </Text>
              <Pressable
                onPress={() => void handleCapture()}
                style={styles.shutterButton}
                accessibilityRole="button"
                accessibilityLabel="Take progress photo"
              >
                <View style={styles.shutterInner} />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  root:                { flex: 1 },
  permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar:              { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottomBar:           { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  iconButton:          { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  shutterButton:       { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner:        { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF' },
});

const silhouette = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '12%',
  },
  head: {
    width:         60,
    height:        60,
    borderRadius:  30,
    borderWidth:   1.5,
    borderColor:   'rgba(255,255,255,0.35)',
    borderStyle:   'dashed',
  },
  neck: {
    width:         22,
    height:        18,
    borderLeftWidth:  1.5,
    borderRightWidth: 1.5,
    borderColor:   'rgba(255,255,255,0.3)',
    borderStyle:   'dashed',
  },
  torso: {
    width:         100,
    height:        120,
    borderRadius:  8,
    borderWidth:   1.5,
    borderColor:   'rgba(255,255,255,0.35)',
    borderStyle:   'dashed',
  },
  hips: {
    width:         110,
    height:        50,
    borderRadius:  8,
    borderWidth:   1.5,
    borderColor:   'rgba(255,255,255,0.3)',
    borderStyle:   'dashed',
  },
  legsRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    marginTop:     2,
  },
  leg: {
    width:         44,
    height:        140,
    borderRadius:  6,
    borderWidth:   1.5,
    borderColor:   'rgba(255,255,255,0.3)',
    borderStyle:   'dashed',
  },
  guide: {
    position:      'absolute',
    left:          '5%',
    right:         '5%',
    height:        1,
    borderTopWidth: 1,
    borderColor:   'rgba(255,255,255,0.18)',
    borderStyle:   'dashed',
  },
});
