// =============================================================================
// TRANSFORMR -- Active Workout Player Screen
// =============================================================================

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Icon3D } from '@components/ui/Icon3D';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { Slider } from '@components/ui/Slider';
import { Skeleton } from '@components/ui/Skeleton';
import { MonoText } from '@components/ui/MonoText';
import { NarratorCard } from '@components/workout/NarratorCard';
import { useWorkout } from '@hooks/useWorkout';
import { useWorkoutStore } from '@stores/workoutStore';
import { useNutritionStore } from '@stores/nutritionStore';
import {
  formatTimerDisplay,
  formatRestTimer,
  formatVolume,
  formatSetDisplay,
} from '@utils/formatters';
import { hapticLight, hapticMedium, hapticSuccess, hapticPR } from '@utils/haptics';
import { supabase } from '@services/supabase';
import { getMidWorkoutCoachingTip, getNarratorMessage } from '@services/ai/workoutCoach';
import * as Speech from 'expo-speech';
import { generateNarration, stopSpeaking } from '@services/ai/narrator';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { VoiceMicButton } from '@components/ui/VoiceMicButton';
import { NowPlayingBar } from '@components/ui/NowPlayingBar';
import type { ParsedVoiceCommand } from '@services/voice';
import { playWorkoutByIntensity } from '@services/spotify';
import { Disclaimer } from '@components/ui/Disclaimer';
import { HelpBubble } from '@components/ui/HelpBubble';
import { HelpIcon } from '@components/ui/HelpIcon';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { ActionToast, useActionToast } from '@components/ui/ActionToast';
import { Coachmark } from '@components/ui/Coachmark';
import type { CoachmarkStep } from '@components/ui/Coachmark';
import { HELP } from '../../../constants/helpContent';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { COACHMARK_KEYS, COACHMARK_CONTENT } from '../../../constants/coachmarkSteps';
import type { Exercise, WorkoutTemplateExercise } from '@app-types/database';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { useChallengeStore } from '@stores/challengeStore';
import { checkWorkoutCompliance } from '@services/ai/compliance';
import { SpeedDialFAB } from '@components/workout/SpeedDialFAB';
import { RestTimerPanel } from '@components/workout/RestTimerPanel';
import { RPEPicker } from '@components/workout/RPEPicker';
import { PlateCalculator } from '@components/workout/PlateCalculator';
import { PRCelebration } from '@components/workout/PRCelebration';

interface GhostSet {
  exercise_id: string;
  set_number: number;
  weight: number | undefined;
  reps: number | undefined;
  session_date: string;
}

interface LoggedSet {
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number;
  isPR: boolean;
}

interface ExerciseWithSets {
  exercise: Exercise;
  templateExercise: WorkoutTemplateExercise | null;
  loggedSets: LoggedSet[];
  ghostSets: GhostSet[];
}

export default function WorkoutPlayerScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { activeSession, logSetWithPRDetection, completeWorkout, getGhostData, isLoading } =
    useWorkout();
  const logCaloriesBurned = useNutritionStore((s) => s.logCaloriesBurned);
  const pendingExerciseId = useWorkoutStore((s) => s.pendingExerciseId);
  const setPendingExerciseId = useWorkoutStore((s) => s.setPendingExerciseId);
  const activeEnrollment = useChallengeStore((s) => s.activeEnrollment);
  const challengeDefinitions = useChallengeStore((s) => s.challengeDefinitions);

  const { toast, show: showToast, hide: hideToast } = useActionToast();

  // AI Workout Narrator — feature gate + readiness-adaptive TTS
  const narratorGate = useFeatureGate('ai_workout_narrator');
  // Track whether a PR narration is currently playing (must not be cancelled)
  const prNarrationActiveRef = useRef(false);

  // Header help button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.workoutPlayer} />,
    });
  }, [navigation]);

  // Coachmark state and refs
  const [coachmarkSteps, setCoachmarkSteps] = React.useState<CoachmarkStep[]>([]);
  const setInputRef = React.useRef<View>(null);
  const restTimerRefCoach = React.useRef<View>(null);

  const measureCoachmarks = React.useCallback(() => {
    const content = COACHMARK_CONTENT.workoutPlayer;
    const steps: CoachmarkStep[] = [];
    let pending = 2;
    const done = () => {
      if (--pending === 0) setCoachmarkSteps(steps.filter(Boolean) as CoachmarkStep[]);
    };
    setInputRef.current?.measure((_x, _y, w, h, px, py) => {
      const s1 = content[1];
      if (s1) steps[1] = { ...s1, targetX: px, targetY: py, targetWidth: w, targetHeight: h };
      done();
    });
    restTimerRefCoach.current?.measure((_x, _y, w, h, px, py) => {
      const s2 = content[2];
      if (s2) steps[2] = { ...s2, targetX: px, targetY: py, targetWidth: w, targetHeight: h };
      done();
    });
  }, []);

  // Hide the tab bar while the workout player is focused
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        parent?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation]),
  );

  const [exercisesWithSets, setExercisesWithSets] = useState<ExerciseWithSets[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedSecondsRef = React.useRef(elapsedSeconds);
  React.useEffect(() => { elapsedSecondsRef.current = elapsedSeconds; }, [elapsedSeconds]);
  const [restSeconds, setRestSeconds] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTarget] = useState(90);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [moodBefore, setMoodBefore] = useState(5);
  const [moodAfter, setMoodAfter] = useState(5);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showPRCelebration, setShowPRCelebration] = useState(false);
  const [prMessage, setPrMessage] = useState('');
  const [showGhostOverlay, setShowGhostOverlay] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [exerciseLoadError, setExerciseLoadError] = useState<string | null>(null);
  const [aiCoachTip, setAiCoachTip] = useState<string | null>(null);
  const [narratorText, setNarratorText] = useState<string | null>(null);

  // Set logger state per exercise
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [currentRpe, setCurrentRpe] = useState(7);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const { exerciseId: incomingExerciseId } = useLocalSearchParams<{ exerciseId?: string }>();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStartedOnceRef = useRef(false);
  const midpointFiredRef = useRef(false);
  const spotifyStartedRef = useRef(false);

  // Consume pendingExerciseId set by exercise-detail "Add to Workout"
  useFocusEffect(
    useCallback(() => {
      if (!pendingExerciseId) return;
      const id = pendingExerciseId;
      setPendingExerciseId(null);

      void (async () => {
        try {
          const { data, error } = await supabase
            .from('exercises')
            .select('*')
            .eq('id', id)
            .single();
          if (error || !data) return;

          const ghostData = await getGhostData(data.id);
          setExercisesWithSets((prev) => {
            if (prev.some((e) => e.exercise.id === id)) return prev;
            const newList = [
              ...prev,
              {
                exercise: data as Exercise,
                templateExercise: null,
                loggedSets: [],
                ghostSets: ghostData,
              },
            ];
            setActiveExerciseIndex(newList.length - 1);
            return newList;
          });
        } catch {
          // Non-fatal
        }
      })();
    }, [pendingExerciseId, setPendingExerciseId, getGhostData]),
  );

  // Workout duration timer — only runs when user taps the play button
  useEffect(() => {
    if (activeSession && timerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession, timerRunning]);

  // Rest timer
  useEffect(() => {
    if (isResting && restSeconds > 0) {
      restTimerRef.current = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            hapticMedium();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isResting, restSeconds]);

  // Spotify auto-play — start intense workout playlist when timer first starts
  useEffect(() => {
    if (!timerRunning || spotifyStartedRef.current || !activeSession) return;
    spotifyStartedRef.current = true;
    playWorkoutByIntensity('intense').catch(() => {/* Spotify optional */});
  }, [timerRunning, activeSession]);

  // Event 1: Workout start narration — fires once when timer first starts
  useEffect(() => {
    if (!timerRunning || timerStartedOnceRef.current || !activeSession) return;
    timerStartedOnceRef.current = true;
    getNarratorMessage({
      event: 'workout_start',
      templateName: activeSession.name ?? undefined,
      moodBefore,
    })
      .then((res) => setNarratorText(res.narration))
      .catch(() => {
        setNarratorText(`Session started. ${activeSession.name ?? 'Workout'} — let's get to work.`);
      });
  }, [timerRunning, activeSession, moodBefore]);

  // Event 4: Midpoint narration — fires when reaching the halfway exercise
  useEffect(() => {
    if (!activeSession || exercisesWithSets.length < 2 || midpointFiredRef.current || totalSets === 0) return;
    const halfway = Math.floor(exercisesWithSets.length / 2);
    if (activeExerciseIndex < halfway) return;
    midpointFiredRef.current = true;
    getNarratorMessage({
      event: 'midpoint',
      setsCompleted: totalSets,
      totalVolume,
      elapsedMinutes: Math.floor(elapsedSeconds / 60),
      totalExercises: exercisesWithSets.length,
      completedExercises: activeExerciseIndex,
    })
      .then((res) => setNarratorText(res.narration))
      .catch(() => {});
  }, [activeExerciseIndex, exercisesWithSets.length, totalSets, totalVolume, elapsedSeconds, activeSession]);

  // Load exercises for the template
  useEffect(() => {
    const loadExercises = async () => {
      if (!activeSession) return;
      setLoadingExercises(true);

      try {
        if (activeSession.template_id) {
          const { data: templateExercises } = await supabase
            .from('workout_template_exercises')
            .select('*, exercises(*)')
            .eq('template_id', activeSession.template_id)
            .order('sort_order');

          if (templateExercises) {
            const exerciseItems: ExerciseWithSets[] = [];
            for (const te of templateExercises) {
              const exerciseData = (te as Record<string, unknown>).exercises as Exercise | null;
              if (exerciseData) {
                const ghostData = await getGhostData(exerciseData.id);
                exerciseItems.push({
                  exercise: exerciseData,
                  templateExercise: {
                    id: te.id,
                    template_id: te.template_id,
                    exercise_id: te.exercise_id,
                    sort_order: te.sort_order,
                    target_sets: te.target_sets,
                    target_reps: te.target_reps,
                    target_weight: te.target_weight,
                    target_rpe: te.target_rpe,
                    rest_seconds: te.rest_seconds,
                    superset_group: te.superset_group,
                    notes: te.notes,
                  },
                  loggedSets: [],
                  ghostSets: ghostData,
                });
              }
            }
            setExercisesWithSets(exerciseItems);
          }
        }
      } catch (err: unknown) {
        setExerciseLoadError('Failed to load exercises. Pull to refresh.');
      } finally {
        setLoadingExercises(false);
      }
    };

    loadExercises();
  }, [activeSession, getGhostData]);

  // Handle exercise added from the library via "Add to Workout"
  useEffect(() => {
    if (!incomingExerciseId || loadingExercises) return;

    const alreadyAdded = exercisesWithSets.some(
      (e) => e.exercise.id === incomingExerciseId,
    );
    if (alreadyAdded) return;

    const addExercise = async () => {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .eq('id', incomingExerciseId)
          .single();
        if (error || !data) return;

        const ghostData = await getGhostData(data.id);
        setExercisesWithSets((prev) => {
          const newList = [
            ...prev,
            {
              exercise: data as Exercise,
              templateExercise: null,
              loggedSets: [],
              ghostSets: ghostData,
            },
          ];
          setActiveExerciseIndex(newList.length - 1);
          return newList;
        });
      } catch {
        // Non-fatal — user can try adding again
      }
    };

    void addExercise();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingExerciseId, loadingExercises]);

  const handleLogSet = useCallback(async () => {
    const weight = parseFloat(currentWeight);
    const reps = parseInt(currentReps, 10);

    if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid weight and reps.');
      return;
    }

    const currentExercise = exercisesWithSets[activeExerciseIndex];
    if (!currentExercise) return;

    await hapticMedium();

    const result = await logSetWithPRDetection(currentExercise.exercise.id, {
      weight,
      reps,
      rpe: currentRpe,
    });

    const newSet: LoggedSet = {
      exerciseId: currentExercise.exercise.id,
      setNumber: currentExercise.loggedSets.length + 1,
      weight,
      reps,
      rpe: currentRpe,
      isPR: result.isPR,
    };

    setExercisesWithSets((prev) =>
      prev.map((item, idx) =>
        idx === activeExerciseIndex
          ? { ...item, loggedSets: [...item.loggedSets, newSet] }
          : item,
      ),
    );

    setTotalVolume((prev) => prev + weight * reps);
    setTotalSets((prev) => prev + 1);

    if (result.isPR) {
      setShowPRCelebration(true);
      setPrMessage(`New PR! ${weight} x ${reps}`);
      setTimeout(() => setShowPRCelebration(false), 3000);
      showToast('New Personal Record!', {
        subtext: `${currentExercise.exercise.name}: ${weight} lbs`,
        type: 'pr',
      });
    } else {
      showToast('Set logged', {
        subtext: `${weight} lbs × ${reps} reps`,
        type: 'success',
      });
    }

    // Request AI coaching tip every 3rd set
    const newTotalSets = totalSets + 1;
    if (newTotalSets % 3 === 0 && newTotalSets > 0) {
      // Include the just-logged set in recentSets (loggedSets state updates after this callback)
      const priorSets = currentExercise.loggedSets.slice(-2);
      getMidWorkoutCoachingTip({
        userId: activeSession?.user_id ?? '',
        exerciseName: currentExercise.exercise.name,
        setsCompleted: newTotalSets,
        totalVolume: totalVolume + weight * reps,
        elapsedMinutes: Math.floor(elapsedSeconds / 60),
        recentWeights: [...priorSets.map((s) => s.weight), weight],
        recentReps: [...priorSets.map((s) => s.reps), reps],
      })
        .then((response) => {
          setAiCoachTip(response.tip);
        })
        .catch(() => {
          // AI coaching tips are non-fatal — silently ignore
        });
    }

    // Clear previous narrator card so it remounts for the new set
    setNarratorText(null);

    // Start rest timer
    const restDuration = currentExercise.templateExercise?.rest_seconds ?? restTarget;
    setRestSeconds(restDuration);
    setIsResting(true);

    // AI Workout Narrator — gated users get full TTS; others get text card only
    // Immediate static fallback while AI loads
    setNarratorText(
      result.isPR
        ? `New PR — ${weight} lbs × ${reps} reps on ${currentExercise.exercise.name}.`
        : `Set ${currentExercise.loggedSets.length + 1} done. Rest, then go again.`,
    );

    if (narratorGate.isAvailable && activeSession) {
      const eventType = result.isPR ? 'pr_detected' : 'set_completed';

      // Debounce: cancel current speech unless a PR narration is actively playing
      if (!prNarrationActiveRef.current) {
        stopSpeaking();
      }

      void generateNarration({
        userId: activeSession.user_id ?? '',
        eventType,
        eventContext: {
          sessionId:     activeSession.id ?? '',
          exerciseName:  currentExercise.exercise.name,
          setNumber:     currentExercise.loggedSets.length + 1,
          repsCompleted: reps,
          weightUsed:    weight,
          targetReps:    currentExercise.templateExercise?.target_reps
                           ? Number(currentExercise.templateExercise.target_reps)
                           : reps,
          targetWeight:  currentExercise.templateExercise?.target_weight
                           ? Number(currentExercise.templateExercise.target_weight)
                           : weight,
        },
        // Readiness score drives TTS rate; default 50 (neutral) when not available
        readinessScore: 50,
      }).then((narResult) => {
        if (!narResult.text) return;
        setNarratorText(narResult.text);

        if (eventType === 'pr_detected') {
          prNarrationActiveRef.current = true;
          stopSpeaking();
        }

        Speech.speak(narResult.text, {
          language: 'en-US',
          rate: narResult.speechRate,
          onDone: () => { prNarrationActiveRef.current = false; },
          onError: () => { prNarrationActiveRef.current = false; },
        });
      }).catch(() => {
        // Non-fatal — narrator failure must never surface to the user mid-workout
      });
    } else {
      // Non-gated: fetch text narration (no TTS)
      const narratorEvent = result.isPR ? 'pr_detected' : 'set_logged';
      getNarratorMessage({
        event: narratorEvent,
        exerciseName: currentExercise.exercise.name,
        setsCompleted: newTotalSets,
        totalVolume: totalVolume + weight * reps,
        elapsedMinutes: Math.floor(elapsedSeconds / 60),
        isPR: result.isPR,
        prWeight: result.isPR ? weight : undefined,
        prReps: result.isPR ? reps : undefined,
        weight,
        reps,
      })
        .then((res) => setNarratorText(res.narration))
        .catch(() => {/* keep static fallback */});
    }

    // Clear inputs
    setCurrentWeight('');
    setCurrentReps('');
    setCurrentRpe(7);

    await hapticSuccess();
  }, [
    currentWeight,
    currentReps,
    currentRpe,
    activeExerciseIndex,
    exercisesWithSets,
    logSetWithPRDetection,
    restTarget,
    totalSets,
    totalVolume,
    elapsedSeconds,
    showToast,
    narratorGate.isAvailable,
    activeSession,
    prNarrationActiveRef,
  ]);

  const handleSkipRest = useCallback(() => {
    setIsResting(false);
    setRestSeconds(0);
    hapticLight();
  }, []);

  const handleCompleteWorkout = useCallback(async () => {
    if (totalSets === 0) {
      Alert.alert('No Sets Logged', 'Log at least one set before completing.');
      return;
    }
    // Event 5: Workout complete narration (non-blocking — shows before mood modal)
    getNarratorMessage({
      event: 'workout_complete',
      setsCompleted: totalSets,
      totalVolume,
      elapsedMinutes: Math.floor(elapsedSecondsRef.current / 60),
    })
      .then((res) => setNarratorText(res.narration))
      .catch(() => {});
    setShowMoodModal(true);
  }, [totalSets, totalVolume]);

  const handleFinishWithMood = useCallback(async () => {
    setShowMoodModal(false);
    // Capture ID before completeWorkout() clears activeSession
    const sessionId = activeSession?.id ?? '';

    try {
      if (activeSession) {
        const { error: updateError } = await supabase
          .from('workout_sessions')
          .update({
            mood_before: moodBefore,
            mood_after: moodAfter,
            total_volume: totalVolume,
            total_sets: totalSets,
          })
          .eq('id', activeSession.id);
        if (updateError) throw updateError;
      }

      await completeWorkout();

      // Calculate and log estimated calories burned to nutrition
      const durationMinutes = Math.round(elapsedSecondsRef.current / 60);
      const estimatedCalories = Math.round(totalVolume * 0.05 + durationMinutes * 5);
      if (estimatedCalories > 0) {
        await logCaloriesBurned(estimatedCalories, activeSession?.name ?? 'Workout');
      }

      // Challenge compliance check — fire after completing workout (non-blocking)
      const activeDef = challengeDefinitions.find((d) => d.id === activeEnrollment?.challenge_id);
      const slug = activeDef?.slug ?? '';
      if (activeEnrollment && (slug === '75-hard' || slug === '75hard')) {
        void checkWorkoutCompliance(activeEnrollment.id, {
          duration_minutes: durationMinutes,
          started_at: activeSession?.started_at ?? new Date().toISOString(),
          is_outdoor: false, // outdoor flag not tracked at session level; user confirms manually
        }).then((result) => {
          if (!result.compliant && result.violations.length > 0) {
            showToast('Workout saved', { subtext: result.violations[0] ?? '', type: 'info' });
          } else if (result.warnings.length > 0) {
            showToast('Workout saved', { subtext: result.warnings[0] ?? '' });
          }
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save workout';
      Alert.alert('Save Failed', `${message}\n\nPlease try again.`);
      return;
    }

    router.replace(
      `/(tabs)/fitness/workout-summary?sessionId=${sessionId}` as never,
    );
  }, [activeSession, moodBefore, moodAfter, totalVolume, totalSets, completeWorkout, router, logCaloriesBurned, activeEnrollment, challengeDefinitions, showToast]);

  const currentExercise = exercisesWithSets[activeExerciseIndex] ?? null;

  // Voice command handler — processes commands from VoiceMicButton
  const handleVoiceCommand = useCallback((result: ParsedVoiceCommand) => {
    const cmd = result.command;
    switch (cmd.action) {
      case 'log_set': {
        const c = cmd as { action: string; weight: number; reps: number };
        setCurrentWeight(String(c.weight));
        setCurrentReps(String(c.reps));
        showToast(`Ready: ${c.weight} lbs × ${c.reps} reps`, { type: 'success' });
        break;
      }
      case 'next_exercise':
        if (activeExerciseIndex < exercisesWithSets.length - 1) {
          setActiveExerciseIndex((prev) => prev + 1);
        }
        break;
      case 'prev_exercise':
        if (activeExerciseIndex > 0) {
          setActiveExerciseIndex((prev) => prev - 1);
        }
        break;
      case 'start_rest_timer': {
        const c = cmd as { action: string; seconds?: number };
        const secs = c.seconds ?? 90;
        setRestSeconds(secs);
        setIsResting(true);
        showToast(`Rest timer: ${secs}s`, { type: 'info' });
        break;
      }
      case 'end_workout':
        void handleCompleteWorkout();
        break;
      default:
        if (result.humanReadable) showToast(result.humanReadable, { type: 'success' });
    }
  }, [activeExerciseIndex, exercisesWithSets.length, showToast, handleCompleteWorkout]);

  const workoutError = useWorkoutStore((s) => s.error);

  if (!activeSession) {
    if (workoutError) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.background.primary,
          alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Icon3D name="warning" size={48} />
          <Text style={{ color: colors.text.primary, fontSize: 18,
            fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
            Could not start workout
          </Text>
          <Text style={{ color: colors.text.secondary, fontSize: 14,
            marginTop: 8, textAlign: 'center' }}>
            {workoutError}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: 24, backgroundColor: colors.accent.primary,
              paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
              Go Back
            </Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={[styles.centered, { backgroundColor: colors.background.primary }]}>
        <View style={{ padding: spacing.lg, width: '100%' }}>
          <Skeleton variant="card" height={60} style={{ marginBottom: spacing.lg }} />
          <Skeleton variant="card" height={200} style={{ marginBottom: spacing.lg }} />
          <Skeleton variant="card" height={120} />
        </View>
        <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.lg }]}>
          Starting workout...
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={{ marginTop: spacing.xl, flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
            backgroundColor: colors.background.secondary }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text.secondary} />
          <Text style={[typography.bodyBold, { color: colors.text.secondary, marginLeft: spacing.xs }]}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      {/* Top Bar: Timer + Volume */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: colors.background.secondary, padding: spacing.md },
        ]}
      >
        <View style={styles.topBarItem}>
          <Icon3D name="clock" size={18} />
          <Text style={[typography.statSmall, { color: colors.text.primary, marginLeft: spacing.xs }]}>
            {formatTimerDisplay(elapsedSeconds)}
          </Text>
        </View>
        <View style={styles.topBarItem}>
          <Icon3D name="dumbbell" size={18} />
          <Text style={[typography.monoBody, { color: colors.text.primary, marginLeft: spacing.xs, fontWeight: '600' }]}>
            {formatVolume(totalVolume)}
          </Text>
        </View>
        <View style={styles.topBarItem}>
          <Text style={[typography.monoCaption, { color: colors.text.muted }]}>
            {totalSets} sets
          </Text>
        </View>
        <Pressable
          onPress={() => { setTimerRunning((prev) => !prev); hapticLight(); }}
          accessibilityLabel={timerRunning ? 'Pause workout timer' : 'Start workout timer'}
          accessibilityRole="button"
          style={[
            styles.topBarItem,
            {
              backgroundColor: timerRunning
                ? `${colors.accent.danger}25`
                : `${colors.accent.success}25`,
              borderRadius: borderRadius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: 4,
            },
          ]}
        >
          <Ionicons
            name={timerRunning ? 'pause-circle' : 'play-circle'}
            size={24}
            color={timerRunning ? colors.accent.danger : colors.accent.success}
          />
          <Text
            style={[
              typography.tiny,
              {
                color: timerRunning ? colors.accent.danger : colors.accent.success,
                marginLeft: 4,
                fontWeight: '600',
              },
            ]}
          >
            {timerRunning ? 'Pause' : 'Start'}
          </Text>
        </Pressable>
      </View>

      {/* Spotify Now Playing */}
      {timerRunning && (
        <NowPlayingBar
          paused={isResting}
          onError={() => {/* non-fatal */}}
        />
      )}

      {/* Rest Timer Panel (non-blocking bottom panel) */}

      {/* PR Celebration — enhanced with confetti + haptic */}

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {loadingExercises ? (
          <View style={{ gap: spacing.sm }}>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="card" height={200} />
          </View>
        ) : exercisesWithSets.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <Text style={{ fontSize: 56, marginBottom: spacing.lg }}>{'\u{1F3CB}\uFE0F'}</Text>
            <Text style={[typography.h3, { color: colors.text.primary, textAlign: 'center', marginBottom: spacing.sm }]}>
              {exerciseLoadError ? 'Failed to load exercises' : 'No exercises yet'}
            </Text>
            <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 }]}>
              {exerciseLoadError
                ? exerciseLoadError
                : 'Search the library and add exercises to build your session.'}
            </Text>
            <Button
              title="Browse Exercise Library"
              onPress={() => router.push('/(tabs)/fitness/exercises' as never)}
              fullWidth
              accessibilityLabel="Browse exercises to add"
              leftIcon={<Icon3D name="search" size={18} />}
            />
          </View>
        ) : (
          <>
            {/* Exercise Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: spacing.lg }}
            >
              {exercisesWithSets.map((item, idx) => (
                <Pressable
                  key={item.exercise.id}
                  accessibilityLabel={`Select exercise ${item.exercise.name}`}
                  accessibilityRole="tab"
                  onPress={() => {
                    setActiveExerciseIndex(idx);
                    hapticLight();
                  }}
                  style={[
                    styles.exerciseTab,
                    {
                      backgroundColor:
                        idx === activeExerciseIndex
                          ? colors.accent.pink
                          : 'transparent',
                      borderRadius: borderRadius.full,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                      marginRight: spacing.sm,
                      borderWidth: idx === activeExerciseIndex ? 0 : 1,
                      borderColor: colors.border.default,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.captionBold,
                      {
                        color:
                          idx === activeExerciseIndex ? colors.text.inverse : colors.text.muted,
                        fontWeight: idx === activeExerciseIndex ? '700' : '500',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.exercise.name}
                  </Text>
                  {item.loggedSets.length > 0 && (
                    <Badge
                      label={`${item.loggedSets.length}`}
                      variant="success"
                      size="sm"
                      style={{ marginLeft: spacing.xs }}
                    />
                  )}
                </Pressable>
              ))}
              {/* Always-visible Add Exercise button */}
              <Pressable
                onPress={() => { router.push('/(tabs)/fitness/exercises' as never); hapticLight(); }}
                accessibilityLabel="Add another exercise to workout"
                accessibilityRole="button"
                style={[
                  styles.exerciseTab,
                  {
                    backgroundColor: `${colors.accent.primary}15`,
                    borderRadius: borderRadius.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    marginRight: spacing.sm,
                    borderWidth: 1,
                    borderColor: `${colors.accent.primary}60`,
                  },
                ]}
              >
                <Ionicons name="add" size={16} color={colors.accent.primary} />
                <Text
                  style={[
                    typography.captionBold,
                    { color: colors.accent.primary, marginLeft: 4 },
                  ]}
                >
                  Add
                </Text>
              </Pressable>
            </ScrollView>

            {/* AI Coach Tip */}
            {aiCoachTip && (
              <Card
                style={{
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.accent.cyan,
                  shadowColor: '#A855F7',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <View style={styles.aiCoachHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Icon3D name="sparkles" size={16} />
                    <Badge
                      label="AI Coach"
                      variant="info"
                      size="sm"
                      style={{ marginLeft: spacing.xs }}
                    />
                  </View>
                  <Pressable
                    onPress={() => { setAiCoachTip(null); hapticLight(); }}
                    accessibilityLabel="Dismiss AI coaching tip"
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={18} color={colors.text.muted} />
                  </Pressable>
                </View>
                <Text
                  style={[
                    typography.body,
                    { color: colors.text.secondary, marginTop: spacing.sm },
                  ]}
                >
                  {aiCoachTip}
                </Text>
                <Disclaimer type="workout" compact style={{ marginTop: spacing.sm }} />
              </Card>
            )}

            {/* Narrator Card — shown after each set */}
            {narratorText && (
              <View style={{ marginBottom: spacing.lg }}>
                <NarratorCard narration={narratorText} restSeconds={isResting ? restSeconds : 0} />
              </View>
            )}

            {/* Active Exercise Card */}
            {currentExercise && (
              <Card
                variant="elevated"
                style={{
                  marginBottom: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.accent.primary,
                  shadowColor: '#A855F7',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <View style={styles.exerciseHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h2, { color: colors.text.primary }]}>
                      {currentExercise.exercise.name}
                    </Text>
                    {currentExercise.exercise.category && (
                      <Badge
                        label={currentExercise.exercise.category}
                        variant="info"
                        size="sm"
                        style={{ marginTop: spacing.xs }}
                      />
                    )}
                  </View>
                  {currentExercise.templateExercise?.target_sets && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[typography.caption, { color: colors.text.muted }]}>
                        Target
                      </Text>
                      <Text style={[typography.monoBody, { color: colors.text.secondary, fontWeight: '600' }]}>
                        {currentExercise.templateExercise.target_sets} x{' '}
                        {currentExercise.templateExercise.target_reps ?? '?'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Logged Sets Table */}
                {currentExercise.loggedSets.length > 0 && (
                  <View style={{ marginTop: spacing.md }}>
                    <View style={[styles.setRow, { marginBottom: spacing.xs }]}>
                      <Text style={[typography.tiny, { color: colors.text.muted, width: 30 }]}>
                        SET
                      </Text>
                      <Text style={[typography.tiny, { color: colors.text.muted, flex: 1 }]}>
                        WEIGHT
                      </Text>
                      <Text style={[typography.tiny, { color: colors.text.muted, flex: 1 }]}>
                        REPS
                      </Text>
                      {showGhostOverlay && (
                        <Text style={[typography.tiny, { color: colors.text.muted, flex: 1 }]}>
                          PREV
                        </Text>
                      )}
                      <Text style={[typography.tiny, { color: colors.text.muted, width: 30 }]}>
                        RPE
                      </Text>
                    </View>
                    {currentExercise.loggedSets.map((set) => {
                      const ghost = currentExercise.ghostSets.find(
                        (g) => g.set_number === set.setNumber,
                      );
                      const beatGhost =
                        ghost &&
                        ghost.weight !== undefined &&
                        ghost.reps !== undefined &&
                        set.weight * set.reps > ghost.weight * ghost.reps;

                      return (
                        <View
                          key={set.setNumber}
                          style={[
                            styles.setRow,
                            {
                              paddingVertical: spacing.xs,
                              borderBottomWidth: 1,
                              borderBottomColor: colors.border.subtle,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              typography.monoCaption,
                              { color: set.isPR ? colors.accent.gold : colors.text.primary, width: 30, fontWeight: '600' },
                            ]}
                          >
                            {set.isPR ? '\u2B50' : `${set.setNumber}`}
                          </Text>
                          <Text style={[typography.monoBody, { color: colors.text.primary, flex: 1 }]}>
                            {set.weight} lbs
                          </Text>
                          <Text style={[typography.monoBody, { color: colors.text.primary, flex: 1 }]}>
                            {set.reps}
                          </Text>
                          {showGhostOverlay && (
                            <Text
                              style={[
                                typography.monoCaption,
                                {
                                  color: beatGhost
                                    ? colors.accent.success
                                    : colors.text.muted,
                                  flex: 1,
                                },
                              ]}
                            >
                              {ghost && ghost.weight !== undefined && ghost.reps !== undefined
                                ? formatSetDisplay(ghost.weight, ghost.reps)
                                : '-'}
                              {beatGhost ? ' \u2191' : ''}
                            </Text>
                          )}
                          <Text style={[typography.monoCaption, { color: colors.text.muted, width: 30 }]}>
                            {set.rpe}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Set Logger Inputs */}
                <View ref={setInputRef} onLayout={measureCoachmarks} style={[styles.setLogger, { marginTop: spacing.lg, gap: spacing.sm }]}>
                  <View style={styles.inputGroup}>
                    <Text style={[typography.tiny, { color: colors.text.muted, marginBottom: 2 }]}>
                      WEIGHT (lbs)
                    </Text>
                    <TextInput
                      value={currentWeight}
                      onChangeText={setCurrentWeight}
                      keyboardType="numeric"
                      accessibilityLabel="Weight in pounds"
                      placeholder={
                        currentExercise.templateExercise?.target_weight?.toString() ?? '0'
                      }
                      placeholderTextColor={colors.text.muted}
                      style={[
                        styles.numericInput,
                        {
                          backgroundColor: colors.background.input,
                          color: colors.text.primary,
                          borderRadius: borderRadius.sm,
                          borderWidth: 1,
                          borderColor: colors.border.default,
                          ...typography.h3,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[typography.tiny, { color: colors.text.muted, marginBottom: 2 }]}>
                      REPS
                    </Text>
                    <TextInput
                      value={currentReps}
                      onChangeText={setCurrentReps}
                      keyboardType="numeric"
                      accessibilityLabel="Number of reps"
                      placeholder={String(currentExercise.templateExercise?.target_reps ?? '0')}
                      placeholderTextColor={colors.text.muted}
                      style={[
                        styles.numericInput,
                        {
                          backgroundColor: colors.background.input,
                          color: colors.text.primary,
                          borderRadius: borderRadius.sm,
                          borderWidth: 1,
                          borderColor: colors.border.default,
                          ...typography.h3,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <Text style={[typography.tiny, { color: colors.text.muted }]}>
                        RPE
                      </Text>
                      <HelpIcon content={HELP.rpeRating} size={13} style={{ marginLeft: 3 }} />
                    </View>
                    <TextInput
                      value={currentRpe.toString()}
                      accessibilityLabel="Rate of perceived exertion"
                      onChangeText={(v) => {
                        const num = parseInt(v, 10);
                        if (!isNaN(num) && num >= 1 && num <= 10) setCurrentRpe(num);
                      }}
                      keyboardType="numeric"
                      placeholderTextColor={colors.text.muted}
                      style={[
                        styles.numericInput,
                        {
                          backgroundColor: colors.background.input,
                          color: colors.text.primary,
                          borderRadius: borderRadius.sm,
                          borderWidth: 1,
                          borderColor: colors.border.default,
                          ...typography.h3,
                        },
                      ]}
                    />
                  </View>
                </View>

                <Button
                  title={`Log Set ${currentExercise.loggedSets.length + 1}`}
                  onPress={handleLogSet}
                  loading={isLoading}
                  fullWidth
                  accessibilityLabel={`Log set ${currentExercise.loggedSets.length + 1} for ${currentExercise.exercise.name}`}
                  style={{ marginTop: spacing.md }}
                  leftIcon={<Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />}
                />
                <HelpBubble id="workout_log_set" message="Enter weight and reps, then tap check to log" position="above" />

                {/* Ghost overlay toggle */}
                <Pressable
                  onPress={() => { setShowGhostOverlay((prev) => !prev); hapticLight(); }}
                  accessibilityLabel={showGhostOverlay ? 'Hide previous session data' : 'Show previous session data'}
                  accessibilityRole="switch"
                  style={[styles.ghostToggle, { marginTop: spacing.md }]}
                >
                  <Ionicons
                    name={showGhostOverlay ? 'eye' : 'eye-off'}
                    size={16}
                    color={colors.text.muted}
                  />
                  <Text style={[typography.tiny, { color: colors.text.muted, marginLeft: spacing.xs }]}>
                    {showGhostOverlay ? 'Hide' : 'Show'} previous session
                  </Text>
                  <HelpIcon content={HELP.ghostMode} size={13} style={{ marginLeft: 3 }} />
                </Pressable>
              </Card>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background.secondary,
            padding: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.border.subtle,
          },
        ]}
      >
        <Button
          title="Complete Workout"
          onPress={handleCompleteWorkout}
          loading={isLoading}
          fullWidth
          size="lg"
          accessibilityLabel="Complete workout session"
          leftIcon={<Ionicons name="checkmark-done" size={22} color={colors.text.inverse} />}
        />
      </View>

      {/* Mood Modal */}
      <Modal visible={showMoodModal} onDismiss={() => setShowMoodModal(false)} dismissable={false} title="How are you feeling?">
        <View style={{ gap: spacing.lg }}>
          <Slider
            value={moodBefore}
            onValueChange={setMoodBefore}
            min={1}
            max={10}
            step={1}
            label="Mood Before Workout"
          />
          <Slider
            value={moodAfter}
            onValueChange={setMoodAfter}
            min={1}
            max={10}
            step={1}
            label="Mood After Workout"
          />
          <Button title="Finish Workout" onPress={handleFinishWithMood} fullWidth size="lg" />
        </View>
      </Modal>
    </View>
    <ActionToast
      message={toast.message}
      subtext={toast.subtext}
      visible={toast.visible}
      onHide={hideToast}
      type={toast.type}
    />
    <Coachmark screenKey={COACHMARK_KEYS.workoutPlayer} steps={coachmarkSteps} />
    <VoiceMicButton
      context={{
        userId: activeSession?.user_id ?? '',
        activeScreen: 'workout_player',
        workoutContext: {
          currentExercise: currentExercise?.exercise?.name,
          lastSet: (() => {
            const ls = currentExercise?.loggedSets?.at(-1);
            return ls !== undefined ? { weight: ls.weight, reps: ls.reps } : undefined;
          })(),
        },
      }}
      onCommand={handleVoiceCommand}
      onError={(msg) => showToast(msg, { type: 'info' })}
      bottom={120}
      right={16}
    />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseTab: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setLogger: {
    flexDirection: 'row',
  },
  inputGroup: {
    flex: 1,
  },
  numericInput: {
    height: 48,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  ghostToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCoachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBar: {},
});
