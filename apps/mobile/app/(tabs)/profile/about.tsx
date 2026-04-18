// =============================================================================
// TRANSFORMR -- About Screen
// =============================================================================

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { Card } from '@components/ui/Card';
import { hapticLight } from '@utils/haptics';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '42';
const COMPANY_NAME = 'Automate AI LLC';
const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@transformr.ai';
const HELP_CENTER_URL = process.env.EXPO_PUBLIC_HELP_CENTER_URL ?? 'https://transformr.ai/help';
const SUBMIT_REQUEST_URL = `${HELP_CENTER_URL}/en-us/requests/new`;
const WEBSITE_URL = 'https://transformr.app';
const PRIVACY_URL = 'https://transformr.app/privacy';
const TERMS_URL = 'https://transformr.app/terms';

// ---------------------------------------------------------------------------
// Link Row
// ---------------------------------------------------------------------------
function LinkRow({
  icon,
  ioniconsName,
  label,
  onPress,
}: {
  icon?: string;
  ioniconsName?: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  return (
    <Pressable
      onPress={() => {
        void hapticLight();
        onPress();
      }}
      style={[
        styles.linkRow,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.xs,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {ioniconsName ? (
        <Ionicons name={ioniconsName} size={18} color={colors.text.secondary} style={{ marginRight: spacing.md }} />
      ) : (
        <Text style={{ fontSize: 18, marginRight: spacing.md }}>{icon}</Text>
      )}
      <Text
        style={[typography.body, { color: colors.text.primary, flex: 1 }]}
      >
        {label}
      </Text>
      <Text style={[typography.body, { color: colors.text.muted }]}>
        {'\u203A'}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function AboutScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.aboutScreen} />,
    });
  }, [navigation]);

  const handleOpenUrl = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  const handleContactSupport = useCallback(() => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=TRANSFORMR%20Support`);
  }, []);

  const handleHelpCenter = useCallback(() => {
    void WebBrowser.openBrowserAsync(HELP_CENTER_URL);
  }, []);

  const handleSubmitRequest = useCallback(() => {
    void WebBrowser.openBrowserAsync(SUBMIT_REQUEST_URL);
  }, []);

  const handleRateApp = useCallback(() => {
    // In production, this opens the App Store / Play Store rating flow
    Alert.alert(
      'Rate TRANSFORMR',
      'Enjoying the app? A review helps others find it!',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Rate',
          onPress: () => {
            void hapticLight();
            // Platform-specific store URL would go here
          },
        },
      ],
    );
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: insets.bottom + 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* App Icon & Version */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={[styles.heroSection, { marginBottom: spacing.xl }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
          <View
            style={[
              styles.appIcon,
              {
                backgroundColor: colors.accent.primary,
                borderRadius: borderRadius.xl,
              },
            ]}
          >
            <Text style={{ fontSize: 48 }}>T</Text>
          </View>
          <Text
            style={[
              typography.h1,
              { color: colors.text.primary, marginTop: spacing.lg },
            ]}
          >
            TRANSFORMR
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.text.secondary, marginTop: spacing.xs },
            ]}
          >
            Version <Text style={typography.monoBody}>{APP_VERSION}</Text> (Build <Text style={typography.monoBody}>{BUILD_NUMBER}</Text>)
          </Text>
        </View>
      </Animated.View>

      {/* Built By */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)}>
        <Card
          variant="default"
          style={{ marginBottom: spacing.xl }}
        >
          <View style={styles.centeredContent}>
            <Text
              style={[
                typography.caption,
                {
                  color: colors.text.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              Built By
            </Text>
            <Text
              style={[typography.h3, { color: colors.text.primary }]}
            >
              {COMPANY_NAME}
            </Text>
            <Text
              style={[
                typography.caption,
                { color: colors.text.secondary, marginTop: spacing.xs },
              ]}
            >
              Transforming lives through AI-powered accountability
            </Text>
          </View>
        </Card>
      </Animated.View>

      {/* Support */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text
          style={[
            typography.caption,
            {
              color: colors.text.muted,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              marginBottom: spacing.xs,
              marginTop: spacing.xs,
            },
          ]}
        >
          Support
        </Text>
        <LinkRow
          icon="📚"
          label="Help Center"
          onPress={handleHelpCenter}
        />
        <LinkRow
          icon="📧"
          label="Contact Support"
          onPress={handleContactSupport}
        />
        <LinkRow
          icon="🎫"
          label="Submit a Request"
          onPress={handleSubmitRequest}
        />
      </Animated.View>

      {/* Links */}
      <Animated.View entering={FadeInDown.delay(150).duration(400)}>
        <Text
          style={[
            typography.caption,
            {
              color: colors.text.muted,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              marginBottom: spacing.xs,
              marginTop: spacing.lg,
            },
          ]}
        >
          Legal & More
        </Text>
        <LinkRow
          icon="🌐"
          label="Website"
          onPress={() => handleOpenUrl(WEBSITE_URL)}
        />
        <LinkRow
          icon="🔒"
          label="Privacy Policy"
          onPress={() => handleOpenUrl(PRIVACY_URL)}
        />
        <LinkRow
          icon="📜"
          label="Terms of Service"
          onPress={() => handleOpenUrl(TERMS_URL)}
        />
        <LinkRow
          ioniconsName="star"
          label="Rate the App"
          onPress={handleRateApp}
        />
      </Animated.View>

      {/* Tech Stack */}
      <Animated.View entering={FadeInDown.delay(150).duration(400)}>
        <Card
          variant="outlined"
          style={{ marginTop: spacing.xl }}
        >
          <View style={styles.centeredContent}>
            <Text
              style={[
                typography.caption,
                {
                  color: colors.text.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  marginBottom: spacing.md,
                },
              ]}
            >
              Powered By
            </Text>
            <View style={styles.techRow}>
              {['React Native', 'Expo', 'Supabase', 'OpenAI'].map(
                (tech) => (
                  <View
                    key={tech}
                    style={[
                      styles.techBadge,
                      {
                        backgroundColor: colors.background.tertiary,
                        borderRadius: borderRadius.full,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.tiny,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {tech}
                    </Text>
                  </View>
                ),
              )}
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Footer */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <Text
          style={[
            typography.tiny,
            {
              color: colors.text.muted,
              textAlign: 'center',
              marginTop: spacing.xxl,
            },
          ]}
        >
          {'\u00A9'} {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
  },
  appIcon: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredContent: {
    alignItems: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  techRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  techBadge: {},
});
