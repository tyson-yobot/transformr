// =============================================================================
// ShareModal.tsx — Bottom sheet modal with share platform options
// =============================================================================
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  onShare: (platform: string) => void;
  title?: string;
  message?: string;
}

interface ShareOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = 420;

const SHARE_OPTIONS: ShareOption[] = [
  { id: 'copy', label: 'Copy Link', icon: 'copy-outline', color: '#A78BFA' },
  { id: 'sms', label: 'SMS', icon: 'chatbubble-outline', color: '#34D399' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { id: 'twitter', label: 'Twitter/X', icon: 'logo-twitter', color: '#1DA1F2' },
  { id: 'email', label: 'Email', icon: 'mail-outline', color: '#F59E0B' },
  { id: 'qr', label: 'QR Code', icon: 'qr-code-outline', color: '#EC4899' },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  onClose,
  onShare,
  title = 'Share Your Referral',
  message,
}) => {
  const { colors, spacing, borderRadius } = useTheme();
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const isClosing = useRef(false);

  useEffect(() => {
    if (visible) {
      isClosing.current = false;
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    }
  }, [visible, backdropOpacity, translateY]);

  const handleClose = () => {
    if (isClosing.current) return;
    isClosing.current = true;
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(SHEET_HEIGHT, { damping: 20, stiffness: 200 }, () => {
      runOnJS(onClose)();
    });
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const renderItem = ({ item }: { item: ShareOption }) => (
    <Pressable
      onPress={() => onShare(item.id)}
      style={({ pressed }) => [
        styles.optionButton,
        {
          backgroundColor: pressed
            ? colors.background.tertiary
            : colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
        },
      ]}
      accessibilityLabel={`Share via ${item.label}`}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: item.color + '20', borderRadius: borderRadius.full },
        ]}
      >
        <Ionicons name={item.icon} size={24} color={item.color} />
      </View>
      <Text
        style={[
          styles.optionLabel,
          { color: colors.text.primary, fontSize: 12 },
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              backgroundColor: colors.background.primary,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleRow}>
            <View
              style={[
                styles.handle,
                { backgroundColor: colors.text.muted, borderRadius: borderRadius.full },
              ]}
            />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              {
                color: colors.text.primary,
                fontSize: 18,
                fontWeight: '700',
                marginBottom: spacing.xs,
              },
            ]}
          >
            {title}
          </Text>

          {message ? (
            <Text
              style={[
                styles.message,
                {
                  color: colors.text.secondary,
                  fontSize: 14,
                  marginBottom: spacing.md,
                },
              ]}
            >
              {message}
            </Text>
          ) : null}

          {/* Grid */}
          <FlatList
            data={SHARE_OPTIONS}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={[styles.row, { gap: spacing.sm }]}
            contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
            scrollEnabled={false}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    minHeight: SHEET_HEIGHT,
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  row: {
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
  },
  iconCircle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  optionLabel: {
    textAlign: 'center',
  },
});

export default ShareModal;
