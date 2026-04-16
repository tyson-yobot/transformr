// =============================================================================
// TRANSFORMR -- Tab Navigator Layout
// =============================================================================

import { View, Text, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatFAB } from '@components/ui/ChatFAB';
import { UpgradeModal } from '@components/ui/UpgradeModal';

interface TabIconProps {
  icon: string;
  label: string;
  focused: boolean;
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.tabIconContainer}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
      <Text
        style={[
          typography.tiny,
          {
            color: focused ? colors.accent.primary : colors.text.muted,
            marginTop: 2,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {focused && (
        <View
          style={[
            styles.activeIndicator,
            { backgroundColor: colors.accent.primary, borderRadius: 2 },
          ]}
        />
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const tabBarHeight = 60 + insets.bottom;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tab.bar,
            borderTopColor: colors.tab.border,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom,
            ...Platform.select({
              ios: {
                shadowColor:   colors.accent.primary,
                shadowOffset:  { width: 0, height: -4 },
                shadowOpacity: 0.08,
                shadowRadius:  12,
              },
              android: { elevation: 8 },
            }),
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.accent.primary,
          tabBarInactiveTintColor: colors.text.muted,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon icon={'\uD83C\uDFE0'} label="Home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="fitness"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon icon={'\uD83C\uDFCB\uFE0F'} label="Fitness" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon icon={'\uD83C\uDF4E'} label="Nutrition" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon icon={'\uD83C\uDFAF'} label="Goals" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon icon={'\uD83D\uDC64'} label="Profile" focused={focused} />
            ),
          }}
        />
      </Tabs>
      <ChatFAB bottom={tabBarHeight + 16} right={20} />
      <UpgradeModal />
    </View>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  activeIndicator: {
    width: 20,
    height: 3,
    marginTop: 4,
  },
});
