## SPEC COMPLIANCE REQUIREMENTS — MANDATORY (read before any edit)

This prompt operates within the canonical TRANSFORMR spec system.
Spec files are the single source of truth. Code follows spec, never
the other way around.

### Required reading before any code edit

You MUST read these files before making any change to dashboard,
screen layout, component structure, AI behavior, notifications, or
any specced behavior:

  C:\dev\transformr\docs\TRANSFORMR-DASHBOARD-V2-SPEC.md
  C:\dev\transformr\docs\specs\TRANSFORMR-MASTER-PRINCIPLES.md
  C:\dev\transformr\TRANSFORMR-BRAND-KIT.md
  C:\dev\transformr\CLAUDE.md
  C:\dev\transformr\ASSET-MANIFEST.md
  C:\dev\transformr\LESSONS-LEARNED.md
  C:\dev\transformr\ARCHITECTURE-DECISIONS.md
  C:\dev\transformr\SOUL.md

### Conflict resolution

If any instruction in this prompt conflicts with the spec files:
  - The spec files win.
  - STOP immediately and report the conflict to the user.
  - Do NOT proceed with the conflicting instruction.
  - Do NOT improvise a compromise.

### Spec sync requirement (Master Principles Section 23)

If your code changes amend any specced behavior, you MUST update the
relevant spec file in the SAME commit as the code change. Both files
must appear in `git status` before the commit. If only the code
changes, that is a defect.

If the spec is silent on the behavior you are changing, add a section
to the relevant spec file documenting the new behavior. The spec must
always reflect reality.

### Windows paths only

This is a Windows machine running PowerShell.
  - Use C:\dev\transformr\... for all paths.
  - NEVER use /mnt/user-data/ for any output.
  - NEVER use Linux-style paths (forward slashes for system paths).
  - NEVER write files outside C:\dev\transformr\.
  - PowerShell only. Never bash, grep, find, cat, ls, sed, awk.
  - cd on its own line, command on the next line. Never chain
    with && or ;.

### Required pre-edit checks

Before making any change, run:

  cd C:\dev\transformr
  git log -1 --format="%H %s"

Capture the starting commit hash. Include it in your final report.

Read the spec sections relevant to your work. Confirm your planned
changes do not conflict with the specs above. If conflict exists,
STOP and report to the user before any edit.

### Process killing prohibition (zero tolerance)

NEVER suggest or use:
  - taskkill
  - Stop-Process
  - kill
  - pkill
  - any process-killing command in any context

Zombie process remediation is "manually close the window" or
"restart the computer." No exceptions ever.

### Asset preservation

If the prompt is onboarding-adjacent, run an asset checksum check
before and after edits. Hero images in apps/mobile/assets/images/
are locked per ASSET-MANIFEST.md. Any change to that folder is
a defect unless explicitly instructed.

### Spec sync verification gate

Before committing, verify:
  cd C:\dev\transformr
  git status

Expected: at least one spec file in the modified files list IF this
prompt amended specced behavior. If only code changed AND spec was
amended, STOP — the spec file was not updated. Add the spec update
to the same commit.

If this prompt did not amend any specced behavior (purely additive
work that the spec already accommodates), state explicitly in your
final report: "No spec amendment required because [reason]."

---

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
