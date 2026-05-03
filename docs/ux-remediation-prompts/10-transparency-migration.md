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

# Prompt 10: AI Feedback Table Migration

**ADD/FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE. NEVER CHANGE UI STYLING WITHOUT EXPLICIT INSTRUCTION.**

## File-Locking Note
This prompt creates ONE new migration file in `supabase/migrations/`. No other files are touched. Existing migrations are NEVER modified.

## Governance Files
Read before starting: `CLAUDE.md`, `SOUL.md`, `ASSET-MANIFEST.md`, `LESSONS-LEARNED.md`, `ARCHITECTURE-DECISIONS.md`.

## Objective
Create the `ai_feedback` table needed for the transparency "Why this?" layer. This table stores user feedback on AI recommendations.

## Migration File
Create `supabase/migrations/00053_ai_feedback.sql`:

```sql
-- =============================================================================
-- TRANSFORMR Migration 00053: AI Feedback Table
-- Stores user feedback on AI-generated recommendations for the transparency
-- "Why this?" layer. Enables recommendation quality tracking and model improvement.
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ai_service TEXT NOT NULL,
  recommendation_id TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('not_helpful', 'regenerate', 'helpful', 'dismissed')),
  context_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON ai_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON ai_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_service ON ai_feedback(ai_service);
CREATE INDEX idx_ai_feedback_created ON ai_feedback(created_at DESC);
```

## Verification Gates
- [ ] Migration file created at correct path
- [ ] Migration number is sequential (check last migration number)
- [ ] No existing migration files modified
- [ ] RLS policies enable users to manage only their own feedback
- [ ] Table has proper foreign key to profiles
- [ ] CHECK constraint on feedback_type limits to valid values

## Important Notes
- If migration 00053 already exists (check first!), use the next available number
- Do NOT run the migration locally (Tyson manages Supabase migrations)
- Do NOT modify any existing migration file
