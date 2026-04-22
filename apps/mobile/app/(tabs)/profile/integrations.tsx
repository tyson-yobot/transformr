// =============================================================================
// TRANSFORMR -- Integrations Screen
// =============================================================================

import { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { useProfileStore } from '@stores/profileStore';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';

// ---------------------------------------------------------------------------
// Integration definitions
// ---------------------------------------------------------------------------
interface Integration {
  id: string;
  name: string;
  icon: string;
  description: string;
  connectedKey: keyof IntegrationState;
  color: string;
}

interface IntegrationState {
  spotify: boolean;
  stripe: boolean;
  appleWatch: boolean;
  appleHealth: boolean;
  googleFit: boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    icon: '🎵',
    description: 'Play workout playlists and auto-generate gym mixes',
    connectedKey: 'spotify',
    color: '#1DB954', /* brand-ok */
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: '💳',
    description: 'Track revenue automatically and power stake goals',
    connectedKey: 'stripe',
    color: '#635BFF', /* brand-ok */
  },
  {
    id: 'appleWatch',
    name: 'Apple Watch',
    icon: '⌚',
    description: 'Heart rate, activity rings, and workout tracking',
    connectedKey: 'appleWatch',
    color: '#FF375F', /* brand-ok */
  },
  {
    id: 'appleHealth',
    name: 'Apple Health',
    icon: '❤️',
    description: 'Sync steps, sleep, heart rate, and workouts',
    connectedKey: 'appleHealth',
    color: '#FF2D55', /* brand-ok */
  },
  {
    id: 'googleFit',
    name: 'Google Fit',
    icon: '🏃',
    description: 'Activity tracking and health metrics sync',
    connectedKey: 'googleFit',
    color: '#4285F4', /* brand-ok */
  },
];

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function IntegrationsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.integrationsScreen} />,
    });
  }, [navigation]);

  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);

  const [connectionState, setConnectionState] = useState<IntegrationState>({
    spotify: profile?.spotify_connected ?? false,
    stripe: !!profile?.stripe_customer_id,
    appleWatch: profile?.watch_paired ?? false,
    appleHealth: false,
    googleFit: false,
  });

  const [connecting, setConnecting] = useState<string | null>(null);

  // Handle connect/disconnect
  const handleToggleIntegration = useCallback(
    async (integration: Integration) => {
      const isConnected = connectionState[integration.connectedKey];

      if (isConnected) {
        // Disconnect
        Alert.alert(
          `Disconnect ${integration.name}`,
          `Stop syncing with ${integration.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disconnect',
              style: 'destructive',
              onPress: async () => {
                void hapticLight();
                setConnectionState((prev) => ({
                  ...prev,
                  [integration.connectedKey]: false,
                }));

                // Update profile based on integration type
                if (integration.id === 'spotify') {
                  await updateProfile({ spotify_connected: false });
                } else if (integration.id === 'appleWatch') {
                  await updateProfile({ watch_paired: false });
                }
              },
            },
          ],
        );
        return;
      }

      // Connect
      setConnecting(integration.id);
      void hapticLight();

      try {
        if (integration.id === 'strava') {
          const clientId = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ?? '';
          const redirectUrl = Linking.createURL('integrations/strava');
          const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUrl)}&approval_prompt=force&scope=activity:read_all`;
          const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
          if (result.type === 'success') {
            setConnectionState((prev) => ({ ...prev, [integration.connectedKey]: true }));
            await updateProfile({ [integration.connectedKey]: true } as never);
            await hapticSuccess();
            Alert.alert('Connected', `${integration.name} is now linked.`);
          }
        } else if (integration.id === 'appleHealth' || integration.id === 'appleWatch') {
          // Apple HealthKit requires native module — mark as pending
          Alert.alert(
            'Requires Physical Device',
            'Apple Health integration is available on a physical iPhone with HealthKit permissions. Install the app on your device to connect.',
          );
        } else if (integration.id === 'googleFit') {
          Alert.alert(
            'Available on Android',
            'Google Fit integration is available on Android devices. Update the app to enable this connection.',
          );
        } else if (integration.id === 'spotify') {
          // Spotify requires the Spotify iOS/Android SDK or Web OAuth
          const redirectUrl = Linking.createURL('integrations/spotify');
          const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '';
          if (!clientId || clientId.includes('your-') || clientId.includes('xxxxx')) {
            Alert.alert(
              'Spotify Not Configured',
              'Spotify integration requires a valid client ID. Set EXPO_PUBLIC_SPOTIFY_CLIENT_ID in your environment to enable Spotify workout integration.',
            );
            return;
          }
          const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=user-read-currently-playing%20user-read-playback-state`;
          const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
          if (result.type === 'success') {
            setConnectionState((prev) => ({ ...prev, spotify: true }));
            await updateProfile({ spotify_connected: true });
            await hapticSuccess();
            Alert.alert('Connected', 'Spotify is now linked.');
          }
        } else {
          Alert.alert('Setup Required', `${integration.name} integration requires additional configuration. Check your environment variables and ensure the required API credentials are set.`);
        }
      } finally {
        setConnecting(null);
      }
    },
    [connectionState, updateProfile],
  );

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
      <ScreenBackground />
      <AmbientBackground />
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text
          style={[
            typography.body,
            {
              color: colors.text.secondary,
              marginBottom: spacing.xl,
            },
          ]}
        >
          Connect external services to unlock powerful tracking and automation
          features.
        </Text>
      </Animated.View>

      {INTEGRATIONS.map((integration, index) => {
        const isConnected = connectionState[integration.connectedKey];
        const isConnecting = connecting === integration.id;

        return (
          <Animated.View
            key={integration.id}
            entering={FadeInDown.delay(index * 60).duration(400)}
          >
            <Card
              variant="default"
              style={{ marginBottom: spacing.md }}
            >
              <View style={styles.integrationRow}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: `${integration.color}20`,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 28 }}>{integration.icon}</Text>
                </View>

                <View style={{ flex: 1, marginLeft: spacing.md }}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
                  <View style={styles.nameRow}>
                    <Text
                      style={[
                        typography.bodyBold,
                        { color: colors.text.primary },
                      ]}
                    >
                      {integration.name}
                    </Text>
                    <Badge
                      label={isConnected ? 'Connected' : 'Not Connected'}
                      variant={isConnected ? 'success' : 'default'}
                      size="sm"
                    />
                  </View>
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: colors.text.secondary,
                        marginTop: spacing.xs,
                      },
                    ]}
                  >
                    {integration.description}
                  </Text>
                </View>
              </View>

              <View style={[styles.actionRow, { marginTop: spacing.md }]}>
                <Button
                  title={
                    isConnecting
                      ? 'Connecting...'
                      : isConnected
                        ? 'Disconnect'
                        : 'Connect'
                  }
                  variant={isConnected ? 'outline' : 'primary'}
                  size="sm"
                  loading={isConnecting}
                  onPress={() => handleToggleIntegration(integration)}
                />
              </View>
            </Card>
          </Animated.View>
        );
      })}

      {/* Info footer */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: `${colors.accent.info}10`,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginTop: spacing.lg,
            },
          ]}
        >
          <Text style={{ fontSize: 16, marginBottom: spacing.sm }}>
            🔒
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.text.secondary },
            ]}
          >
            Your data is encrypted and never shared with third parties.
            Integrations use secure OAuth tokens that can be revoked at any time.
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  integrationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  infoBox: {},
});
