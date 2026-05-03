# Prompt 11: Transparency "Why This?" Sheet

**ADD/FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE. NEVER CHANGE UI STYLING WITHOUT EXPLICIT INSTRUCTION.**

## File-Locking Note
This prompt creates `components/ui/WhyThisSheet.tsx` (NEW) and adds an optional `onWhyThis` prop to `components/cards/AIInsightCard.tsx` and `components/cards/PredictionAlert.tsx`. Depends on Prompt 10 (ai_feedback migration).

## Governance Files
Read before starting: `CLAUDE.md`, `SOUL.md`, `ASSET-MANIFEST.md`, `LESSONS-LEARNED.md`, `ARCHITECTURE-DECISIONS.md`.

## Objective
Add a "Why this?" transparency affordance to all AI-surfaced recommendation cards. Tapping reveals a bottom sheet showing data points used, model info, confidence level, and feedback actions.

## New Component: WhyThisSheet

Create `apps/mobile/components/ui/WhyThisSheet.tsx`:

### Props
```typescript
interface WhyThisSheetProps {
  visible: boolean;
  onClose: () => void;
  aiService: string;           // e.g. 'ai-coach', 'ai-screen-insight'
  recommendationId?: string;
  dataPoints: string[];        // e.g. ["Sleep quality averaged 2.8/5", "4/7 workouts completed"]
  confidence: 'high' | 'medium' | 'low';
  onRegenerate?: () => void;
  onFeedback?: (type: 'not_helpful' | 'helpful') => void;
}
```

### Layout
```
┌──────────────────────────────────────┐
│  Why this recommendation?       ✕    │
├──────────────────────────────────────┤
│                                      │
│  Based on your last 7 days:          │
│  • {dataPoints[0]}                   │
│  • {dataPoints[1]}                   │
│  • {dataPoints[2]}                   │
│  • ...                               │
│                                      │
│  ──────────────────────────────────  │
│  Model: Claude Sonnet 4              │
│  Confidence: {confidence}            │
│  ──────────────────────────────────  │
│                                      │
│  [Regenerate]      [Not helpful]     │
│                                      │
└──────────────────────────────────────┘
```

### Feedback Logging
When "Not helpful" or "Regenerate" is tapped, log to `ai_feedback` table:
```typescript
await supabase.from('ai_feedback').insert({
  user_id: userId,
  ai_service: aiService,
  recommendation_id: recommendationId,
  feedback_type: type,
  context_snapshot: { dataPoints, confidence },
});
```

### Confidence Display
- High: green badge (`colors.accent.success`)
- Medium: amber badge (`colors.accent.warning`)
- Low: red badge (`colors.accent.danger`)
Show explanatory text: "High: 7/7 days have complete data" etc.

## Modifications to Existing Cards

### AIInsightCard (`components/cards/AIInsightCard.tsx`)
Add an OPTIONAL prop:
```typescript
onWhyThis?: () => void;
```
Render a "Why this?" link at the bottom of the card when `onWhyThis` is provided:
```tsx
{onWhyThis && (
  <Pressable onPress={onWhyThis} accessibilityLabel="Why this recommendation">
    <Text style={[typography.caption, { color: colors.accent.cyan }]}>Why this?</Text>
  </Pressable>
)}
```

### PredictionAlert (`components/cards/PredictionAlert.tsx`)
Same pattern: add optional `onWhyThis` prop and render link when provided.

### Dashboard Accountability Card (in `dashboard.tsx`)
Add "Why this?" link next to "Talk to Coach" and "Dismiss" buttons:
```tsx
<Pressable onPress={() => setWhyThisVisible(true)}>
  <Text style={[typography.caption, { color: colors.accent.cyan }]}>Why this?</Text>
</Pressable>
```

## Dashboard Integration
In `dashboard.tsx`, add state and render:
```tsx
const [whyThisVisible, setWhyThisVisible] = useState(false);
const [whyThisContext, setWhyThisContext] = useState<WhyThisSheetProps | null>(null);

// Near the end of the return:
{whyThisContext && (
  <WhyThisSheet
    visible={whyThisVisible}
    onClose={() => setWhyThisVisible(false)}
    {...whyThisContext}
  />
)}
```

## Verification Gates
- [ ] WhyThisSheet.tsx created at `components/ui/WhyThisSheet.tsx`
- [ ] AIInsightCard accepts optional `onWhyThis` prop (backward compatible)
- [ ] PredictionAlert accepts optional `onWhyThis` prop (backward compatible)
- [ ] "Why this?" link renders on dashboard accountability card
- [ ] Sheet opens with data points, model info, confidence
- [ ] "Regenerate" calls the appropriate AI service
- [ ] "Not helpful" logs to ai_feedback table via Supabase
- [ ] Sheet closes correctly via close button and swipe-down
- [ ] All existing card content and styling preserved
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] No removed imports or require() statements

## Stores Touched
NONE modified. Supabase insert is direct (not via store).
