// =============================================================================
// TRANSFORMR -- Tab Navigator Layout
// =============================================================================

import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { House, Barbell, BowlFood, Trophy, UserCircle } from 'phosphor-react-native';
import { useTheme } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatFAB } from '@components/ui/ChatFAB';
import { UpgradeModal } from '@components/ui/UpgradeModal';
import { AmbientBackground } from '@components/ui/AmbientBackground';

interface TabIconProps {
  routeName: string;
  focused: boolean;
}

type PhosphorIcon = React.ComponentType<{ size?: number; color?: string; weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone' }>;

const PHOSPHOR_TABS: Record<string, PhosphorIcon> = {
  dashboard:  House,
  fitness:    Barbell,
  nutrition:  BowlFood,
  goals:      Trophy,
  profile:    UserCircle,
};

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Home', fitness: 'Fitness', nutrition: 'Nutrition', goals: 'Goals', profile: 'Profile',
};

const TabIcon = memo(function TabIcon({ routeName, focused }: TabIconProps) {
  const { colors, typography } = useTheme();
  const PhIcon = PHOSPHOR_TABS[routeName];
  const tintColor = focused ? colors.accent.primary : colors.text.muted;

  return (
    <View style={styles.tabIconContainer}>
      <View style={{
        width: 36, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: focused ? colors.dim.primary : 'transparent',
      }}>
        {PhIcon ? (
          <PhIcon size={22} color={tintColor} weight={focused ? 'duotone' : 'regular'} />
        ) : (
          <Ionicons name="apps-outline" size={22} color={tintColor} />
        )}
      </View>
      <Text
        style={[
          typography.tiny,
          {
            color: focused ? colors.accent.primary : colors.text.muted,
            fontWeight: focused ? '600' : '400',
            marginTop: 2,
          },
        ]}
        numberOfLines={1}
      >
        {ROUTE_LABELS[routeName] ?? routeName}
      </Text>
    </View>
  );
}, (prev, next) =>
  prev.focused   === next.focused &&
  prev.routeName === next.routeName,
);

export default function TabsLayout() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const tabBarHeight = 60 + insets.bottom;

  const tabBarStyle = useMemo(() => ({
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
  }), [colors, spacing, insets.bottom, tabBarHeight]);

  return (
    <View style={{ flex: 1 }}>
      <AmbientBackground />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle,
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.accent.primary,
          tabBarInactiveTintColor: colors.text.muted,
          // Performance: freeze off-screen tabs so they stop re-rendering
          freezeOnBlur: true,
          // Performance: defer rendering until first visit
          lazy: true,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon routeName="dashboard" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="fitness"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon routeName="fitness" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon routeName="nutrition" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon routeName="goals" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }: { focused: boolean }) => (
              <TabIcon routeName="profile" focused={focused} />
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
});
