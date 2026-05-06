# Tier System Spec Conflict (audit captured 2026-05-06)

THREE conflicting tier systems exist in the repo simultaneously:

## 1. Master Principles Section 7 (most recent decision per chat memory)
- Off / Calm / Coach / Drill Sergeant (4 tiers)
- Merged tone x frequency
- Default: Coach
- Quiet hours: 10pm-7am user local

## 2. Dashboard V2 spec Section 10/19 (locked source of truth per its own header)
- Quiet / Standard / Coach (3 tiers)
- Pure frequency, separate from tone
- Default: Standard
- Quiet hours: 00:00-06:00 user local, non-overridable

## 3. Live code and migrations (current state)
- coaching_tone field with CHECK (drill_sergeant, motivational, balanced, calm)
- 4 values, pure tone, no frequency
- Migrations 00036 and 00038
- Field is named coaching_tone, not coach_style or notification_tier

## Resolution required
- Operator decides canonical system
- Loser specs update to match winner
- Migration planned to align database
- No tier-related work proceeds until reconciled

## Audit data
- docs/audit/tier-enum-actual.txt
- docs/audit/tier-migrations-actual.txt
- docs/audit/dashboard-v2-spec-tiers.txt
- docs/audit/master-principles-tiers.txt
