// =============================================================================
// TRANSFORMR -- AI Journal
// =============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
  const { colors, typography, spacing, borderRadius } = useTheme();

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

    // Simulate AI response (in production, this would call the AI endpoint)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setAiResponse(
      'Thank you for sharing. I notice themes of growth and self-awareness in your reflection. ' +
      'Your wins show clear progress toward your goals. Consider how the struggles you mentioned ' +
      'might become stepping stones for tomorrow. Keep building on this momentum.',
    );

    await hapticSuccess();
    setIsSubmitting(false);
  }, [entryText]);

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
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <AIInsightCard screenKey="goals/journal" style={{ marginBottom: spacing.md }} />

        {/* AI Prompt */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card
            variant="elevated"
            style={{
              borderLeftWidth: 3,
              borderLeftColor: colors.accent.primary,
            }}
          >
            <View style={styles.promptHeader}>
              <Badge label="AI Prompt" variant="info" size="sm" />
            </View>
            <Text
              style={[
                typography.h3,
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
          <Card style={{ marginTop: spacing.md }}>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, textAlign: 'center' },
              ]}
            >
              No past entries yet. Start journaling!
            </Text>
          </Card>
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
