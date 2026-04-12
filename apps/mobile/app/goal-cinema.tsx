// =============================================================================
// TRANSFORMR -- Goal Cinema (Motivational Slideshow)
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  SlideInRight,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ProgressRing } from '@components/ui/ProgressRing';
import { useProfileStore } from '@stores/profileStore';
import { useGoalStore } from '@stores/goalStore';
import { formatNumber, formatPercentage, formatCountdown, formatWeight } from '@utils/formatters';
import { hapticLight } from '@utils/haptics';
import type { Goal, WeightLog } from '@app-types/database';
import { supabase } from '@services/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SLIDE_DURATION = 5000; // 5 seconds per slide

interface Slide {
  id: string;
  type: 'stat' | 'milestone' | 'photo' | 'countdown' | 'quote';
  title: string;
  subtitle?: string;
  value?: string;
  imageUrl?: string;
  color?: string;
}

export default function GoalCinemaScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const { goals, milestones } = useGoalStore();

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulsing animation for the progress ring
  const pulseScale = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [pulseScale]);

  // Fetch weight logs for progress photos
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', user.id)
          .not('photo_front_url', 'is', null)
          .order('logged_at', { ascending: false })
          .limit(10);
        setWeightLogs((data ?? []) as WeightLog[]);
      } catch {
        // Silent
      }
    };
    loadPhotos();
  }, []);

  // Build slides
  useEffect(() => {
    const built: Slide[] = [];

    // Opening quote
    built.push({
      id: 'quote-1',
      type: 'quote',
      title: 'The only bad workout is the one that didn\'t happen.',
      subtitle: 'Keep pushing forward.',
    });

    // Weight stat
    if (profile?.current_weight && profile?.goal_weight) {
      const progress = Math.abs(profile.current_weight - profile.goal_weight);
      built.push({
        id: 'stat-weight',
        type: 'stat',
        title: 'Weight Progress',
        value: formatWeight(profile.current_weight),
        subtitle: `Goal: ${formatWeight(profile.goal_weight)} (${formatNumber(progress, 1)} lbs to go)`,
      });
    }

    // Goals with progress
    const activeGoals = goals.filter((g) => g.status === 'active' && g.target_value);
    for (const goal of activeGoals.slice(0, 4)) {
      const pct = goal.target_value ? Math.min(((goal.current_value ?? 0) / goal.target_value) * 100, 100) : 0;
      built.push({
        id: `goal-${goal.id}`,
        type: 'stat',
        title: goal.title,
        value: formatPercentage(pct),
        subtitle: `${goal.current_value ?? 0} / ${goal.target_value} ${goal.unit ?? ''}`,
        color: goal.color ?? undefined,
      });
    }

    // Countdowns
    const goalsWithDeadline = goals.filter((g) => g.target_date && g.status === 'active');
    for (const goal of goalsWithDeadline.slice(0, 3)) {
      const countdown = formatCountdown(goal.target_date!);
      built.push({
        id: `countdown-${goal.id}`,
        type: 'countdown',
        title: goal.title,
        value: `${countdown.days}`,
        subtitle: countdown.label,
      });
    }

    // Progress photos
    for (const log of weightLogs.slice(0, 3)) {
      if (log.photo_front_url) {
        built.push({
          id: `photo-${log.id}`,
          type: 'photo',
          title: 'Progress Photo',
          subtitle: log.logged_at ? new Date(log.logged_at).toLocaleDateString() : '',
          imageUrl: log.photo_front_url,
        });
      }
    }

    // Closing quote
    built.push({
      id: 'quote-2',
      type: 'quote',
      title: 'Discipline is choosing between what you want now and what you want most.',
    });

    setSlides(built);
  }, [profile, goals, milestones, weightLogs]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying || slides.length === 0) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, slides.length]);

  const currentSlide = slides[currentIndex] ?? null;

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[typography.h2, { color: colors.text.primary }]}>Loading Cinema...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: '#0F172A' }]}>
      {/* Slide Content */}
      <View style={styles.slideContainer}>
        {currentSlide && (
          <Animated.View
            key={currentSlide.id}
            entering={FadeIn.duration(600)}
            exiting={FadeOut.duration(400)}
            style={styles.slide}
          >
            {currentSlide.type === 'quote' && (
              <View style={styles.quoteSlide}>
                <Text style={[styles.quoteText, { color: '#F8FAFC' }]}>
                  "{currentSlide.title}"
                </Text>
                {currentSlide.subtitle && (
                  <Text style={[typography.caption, { color: '#94A3B8', marginTop: spacing.md }]}>
                    {currentSlide.subtitle}
                  </Text>
                )}
              </View>
            )}

            {currentSlide.type === 'stat' && (
              <View style={styles.statSlide}>
                <Animated.View style={pulseStyle}>
                  <ProgressRing
                    progress={parseFloat(currentSlide.value?.replace('%', '') ?? '0') / 100}
                    size={160}
                    strokeWidth={14}
                    color={currentSlide.color ?? '#6366F1'}
                  >
                    <Text style={[typography.stat, { color: '#F8FAFC' }]}>
                      {currentSlide.value}
                    </Text>
                  </ProgressRing>
                </Animated.View>
                <Text style={[typography.h2, { color: '#F8FAFC', textAlign: 'center', marginTop: spacing.lg }]}>
                  {currentSlide.title}
                </Text>
                {currentSlide.subtitle && (
                  <Text style={[typography.caption, { color: '#94A3B8', textAlign: 'center', marginTop: spacing.sm }]}>
                    {currentSlide.subtitle}
                  </Text>
                )}
              </View>
            )}

            {currentSlide.type === 'countdown' && (
              <View style={styles.countdownSlide}>
                <Text style={[styles.countdownNumber, { color: '#6366F1' }]}>
                  {currentSlide.value}
                </Text>
                <Text style={[typography.h3, { color: '#94A3B8' }]}>
                  {currentSlide.subtitle}
                </Text>
                <Text style={[typography.h2, { color: '#F8FAFC', textAlign: 'center', marginTop: spacing.lg }]}>
                  {currentSlide.title}
                </Text>
              </View>
            )}

            {currentSlide.type === 'photo' && currentSlide.imageUrl && (
              <View style={styles.photoSlide}>
                <Image
                  source={{ uri: currentSlide.imageUrl }}
                  style={styles.progressPhoto}
                  resizeMode="cover"
                />
                <View style={styles.photoOverlay}>
                  <Text style={[typography.h3, { color: '#F8FAFC' }]}>
                    {currentSlide.title}
                  </Text>
                  {currentSlide.subtitle && (
                    <Text style={[typography.caption, { color: '#CBD5E1' }]}>
                      {currentSlide.subtitle}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </Animated.View>
        )}
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.lg }]}>
        {/* Progress Dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, idx) => (
            <Pressable key={idx} onPress={() => { hapticLight(); setCurrentIndex(idx); }} accessibilityLabel={`Go to slide ${idx + 1}`} accessibilityRole="button">
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: idx === currentIndex ? '#6366F1' : '#334155',
                    width: idx === currentIndex ? 24 : 8,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* Playback Controls */}
        <View style={styles.controlButtons}>
          <Pressable onPress={() => { hapticLight(); handlePrevious(); }} style={styles.controlButton} accessibilityLabel="Previous slide" accessibilityRole="button">
            <Text style={{ color: '#F8FAFC', fontSize: 24 }}>{'\u25C0'}</Text>
          </Pressable>
          <Pressable onPress={() => { hapticLight(); handleTogglePlay(); }} style={styles.controlButton} accessibilityLabel={isPlaying ? 'Pause slideshow' : 'Play slideshow'} accessibilityRole="button">
            <Text style={{ color: '#F8FAFC', fontSize: 24 }}>
              {isPlaying ? '\u23F8' : '\u25B6'}
            </Text>
          </Pressable>
          <Pressable onPress={() => { hapticLight(); handleNext(); }} style={styles.controlButton} accessibilityLabel="Next slide" accessibilityRole="button">
            <Text style={{ color: '#F8FAFC', fontSize: 24 }}>{'\u25B6'}</Text>
          </Pressable>
        </View>

        {/* Close */}
        <Pressable
          onPress={() => { hapticLight(); router.back(); }}
          style={[styles.closeButton, { backgroundColor: '#1E293B', borderRadius: 20 }]}
          accessibilityLabel="Close cinema"
          accessibilityRole="button"
        >
          <Text style={[typography.captionBold, { color: '#F8FAFC' }]}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  slideContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', width: SCREEN_WIDTH, paddingHorizontal: 32 },
  quoteSlide: { alignItems: 'center', paddingHorizontal: 20 },
  quoteText: { fontSize: 28, fontWeight: '700', textAlign: 'center', lineHeight: 38, fontStyle: 'italic' },
  statSlide: { alignItems: 'center' },
  countdownSlide: { alignItems: 'center' },
  countdownNumber: { fontSize: 96, fontWeight: '900' },
  photoSlide: { flex: 1, width: SCREEN_WIDTH, justifyContent: 'flex-end' },
  progressPhoto: { ...StyleSheet.absoluteFillObject },
  photoOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    padding: 24,
  },
  controls: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
  dot: { height: 8, borderRadius: 4 },
  controlButtons: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 16 },
  controlButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  closeButton: { alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 10 },
});
