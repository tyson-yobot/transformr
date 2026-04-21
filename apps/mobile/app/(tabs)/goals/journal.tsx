// =============================================================================
// TRANSFORMR -- AI Journal
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Chip } from '@components/ui/Chip';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { formatDate } from '@utils/formatters';
import type { JournalEntry } from '@app-types/database';
import { EmptyState } from '@components/ui/EmptyState';
import { Skeleton } from '@components/ui/Skeleton';
import { supabase } from '@services/supabase';
import { getJournalResponse } from '@services/ai/journaling';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { ActionToast, useActionToast } from '@components/ui/ActionToast';
import { VoiceMicButton } from '@components/ui/VoiceMicButton';
import type { ParsedVoiceCommand } from '@services/voice';
import { SCREEN_HELP } from '../../../constants/screenHelp';

const AI_PROMPTS = [
  'What are you most proud of today?',
  'What challenge did you overcome this week?',
  'Describe a moment of gratitude from today.',
  'What would you tell your future self?',
  'What pattern have you noticed in your life lately?',
  'What goal are you closest to achieving?',
  'How did you push yourself outside your comfort zone?',
];

const SUGGESTED_TAGS = [
  'growth', 'mindset', 'fitness', 'business', 'relationships',
  'gratitude', 'reflection', 'breakthrough', 'challenge',
];

export default function JournalScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { toast, show: showToast, hide: hideToast } = useActionToast();

  const journalGate = useFeatureGate('ai_journal');

  const [currentPrompt] = useState(
    () => AI_PROMPTS[Math.floor(Math.random() * AI_PROMPTS.length)],
  );
  const [entryText, setEntryText] = useState('');
  const [wins, setWins] = useState('');
  const [struggles, setStruggles] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [tomorrowFocus, setTomorrowFocus] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const [showPastEntries, setShowPastEntries] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.journalScreen} />,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(30);
        if (data) setPastEntries(data as JournalEntry[]);
      } finally {
        setIsLoadingEntries(false);
      }
    };
    void fetchEntries();
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!entryText.trim()) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const winsArr = wins.trim() ? [wins.trim()] : [];
      const strugglesArr = struggles.trim() ? [struggles.trim()] : [];
      const gratitudeArr = gratitude.trim() ? [gratitude.trim()] : [];

      // Call real AI service — failure here is non-fatal, entry still saves
      let aiText: string | null = null;
      if (journalGate.isAvailable) {
        try {
          const response = await getJournalResponse(user.id, entryText, winsArr, strugglesArr, gratitudeArr);
          aiText = response.reflection + (response.encouragement ? `\n\n${response.encouragement}` : '');
        } catch {
          // AI unavailable — entry still saves, no fake response shown
          aiText = null;
        }
      }

      const todayStr = new Date().toISOString().split('T')[0];

      // Persist journal entry to Supabase
      const { data: saved, error: saveError } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          date: todayStr,
          ai_prompt: currentPrompt,
          entry_text: entryText.trim(),
          wins: winsArr,
          struggles: strugglesArr,
          gratitude: gratitudeArr,
          tomorrow_focus: tomorrowFocus.trim() ? [tomorrowFocus.trim()] : [],
          tags: Array.from(selectedTags),
          ai_response: aiText,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saveError) throw saveError;

      if (saved) {
        setPastEntries((prev) => [saved as JournalEntry, ...prev]);
      }

      if (aiText) {
        setAiResponse(aiText);
      } else {
        setAiResponse('Entry saved. AI reflection is currently unavailable — check back later.');
      }
      await hapticSuccess();
      showToast('Entry saved', { subtext: 'Keep reflecting' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save journal entry';
      Alert.alert('Save Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [entryText, wins, struggles, gratitude, tomorrowFocus, selectedTags, currentPrompt, showToast, journalGate.isAvailable]);

  const handleVoiceCommand = useCallback((result: ParsedVoiceCommand) => {
    const { command } = result;
    // Voice dictation: unknown commands with rawText become journal entry text
    if (command.action === 'unknown' && command.rawText) {
      setEntryText((prev) => prev ? `${prev} ${command.rawText}` : command.rawText);
      showToast('Voice added', { subtext: 'Transcript appended to entry' });
    }
  }, [showToast]);

  const handleClearEntry = useCallback(() => {
    setEntryText('');
    setWins('');
    setStruggles('');
    setGratitude('');
    setTomorrowFocus('');
    setSelectedTags(new Set());
    setAiResponse(null);
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ActionToast
        message={toast.message}
        subtext={toast.subtext}
        visible={toast.visible}
        onHide={hideToast}
        type={toast.type}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <AIInsightCard screenKey="goals/journal" style={{ marginBottom: spacing.md }} />

        {isLoadingEntries && (
          <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
            <Skeleton variant="card" height={80} />
            <Skeleton variant="card" height={120} />
            <Skeleton variant="card" height={80} />
          </View>
        )}

        {/* AI Prompt */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card
            variant="elevated"
            style={{
              borderLeftWidth: 2,
              borderLeftColor: colors.accent.cyan,
            }}
          >
            <View style={styles.promptHeader}>
              <Badge label="AI Prompt" variant="info" size="sm" />
            </View>
            <Text
              style={[
                typography.body,
                { color: colors.text.primary, marginTop: spacing.sm },
              ]}
            >
              {currentPrompt}
            </Text>
          </Card>
        </Animated.View>

        {/* Main Entry */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Input
            label="Your Reflection"
            value={entryText}
            onChangeText={setEntryText}
            placeholder="Write your thoughts..."
            multiline
            containerStyle={{ marginTop: spacing.lg }}
          />
        </Animated.View>

        {/* Structured Sections */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text
            style={[
              typography.h3,
              {
                color: colors.text.primary,
                marginTop: spacing.xl,
                marginBottom: spacing.md,
              },
            ]}
          >
            Structured Reflection
          </Text>

          <Input
            label="Wins"
            value={wins}
            onChangeText={setWins}
            placeholder="What went well today?"
            multiline
          />
          <Input
            label="Struggles"
            value={struggles}
            onChangeText={setStruggles}
            placeholder="What was challenging?"
            multiline
            containerStyle={{ marginTop: spacing.md }}
          />
          <Input
            label="Gratitude"
            value={gratitude}
            onChangeText={setGratitude}
            placeholder="What are you grateful for?"
            multiline
            containerStyle={{ marginTop: spacing.md }}
          />
          <Input
            label="Tomorrow's Focus"
            value={tomorrowFocus}
            onChangeText={setTomorrowFocus}
            placeholder="What will you focus on tomorrow?"
            multiline
            containerStyle={{ marginTop: spacing.md }}
          />
        </Animated.View>

        {/* Tags */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text
            style={[
              typography.captionBold,
              {
                color: colors.text.secondary,
                marginTop: spacing.lg,
                marginBottom: spacing.sm,
              },
            ]}
          >
            Tags
          </Text>
          <View style={styles.tagsWrap}>
            {SUGGESTED_TAGS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={selectedTags.has(tag)}
                onPress={() => toggleTag(tag)}
                style={{ marginRight: spacing.sm, marginBottom: spacing.sm }}
              />
            ))}
          </View>
        </Animated.View>

        {/* Submit */}
        <Button
          title="Submit & Get AI Reflection"
          onPress={handleSubmit}
          fullWidth
          loading={isSubmitting}
          disabled={!entryText.trim()}
          style={{ marginTop: spacing.xl }}
        />

        {/* AI Response */}
        {aiResponse && (
          <Animated.View entering={FadeInDown.delay(100)}>
            <Card
              style={{
                marginTop: spacing.lg,
                borderWidth: 1,
                borderColor: colors.accent.primary,
              }}
            >
              <View style={styles.aiHeader}>
                <Text style={[typography.bodyBold, { color: colors.accent.primary }]}>
                  AI Reflection
                </Text>
                <Badge label="AI" variant="info" size="sm" />
              </View>
              <Text
                style={[
                  typography.body,
                  { color: colors.text.secondary, marginTop: spacing.sm },
                ]}
              >
                {aiResponse}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* New Entry Button */}
        {aiResponse && (
          <Button
            title="New Entry"
            onPress={handleClearEntry}
            variant="outline"
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        )}

        {/* Past Entries Toggle */}
        <Pressable
          onPress={() => { hapticLight(); setShowPastEntries(!showPastEntries); }}
          accessibilityLabel={showPastEntries ? 'Hide past journal entries' : 'View past journal entries'}
          style={{ marginTop: spacing.xl }}
        >
          <Text
            style={[
              typography.bodyBold,
              { color: colors.accent.primary, textAlign: 'center' },
            ]}
          >
            {showPastEntries ? 'Hide Past Entries' : 'View Past Entries'}
          </Text>
        </Pressable>

        {showPastEntries && pastEntries.length === 0 && (
          <EmptyState
            ionIcon="journal-outline"
            title="No past entries yet"
            subtitle="Your AI coach generates a personalized prompt each evening based on your day."
            style={{ paddingVertical: 24 }}
          />
        )}

        {showPastEntries &&
          pastEntries.map((entry) => (
            <Card key={entry.id} style={{ marginTop: spacing.sm }}>
              <View style={styles.entryHeader}>
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                  {formatDate(entry.date)}
                </Text>
                {entry.tags && entry.tags.length > 0 && (
                  <View style={styles.entryTags}>
                    {entry.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} label={tag} size="sm" />
                    ))}
                  </View>
                )}
              </View>
              <Text
                style={[
                  typography.body,
                  { color: colors.text.secondary, marginTop: spacing.sm },
                ]}
                numberOfLines={3}
              >
                {entry.entry_text}
              </Text>
            </Card>
          ))}

        <View style={{ height: 24 }} />
      </ScrollView>
      <VoiceMicButton
        context={{ userId: '', activeScreen: 'journal' }}
        onCommand={handleVoiceCommand}
        bottom={100}
        right={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  promptHeader: { flexDirection: 'row' },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryTags: { flexDirection: 'row', gap: 4 },
});
