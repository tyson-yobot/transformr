# TRANSFORMR Color System Audit

**Date:** 2026-04-20
**Source of truth:** `apps/mobile/theme/colors.ts`

---

## Dark Mode — Brand Kit (Implemented)

| Token | Hex | Role |
|-------|-----|------|
| `background.primary` | `#0C0A15` | Deep Space — app background |
| `background.secondary` | `#16122A` | Surface — cards, inputs |
| `background.tertiary` | `#1E1838` | Elevated surfaces |
| `background.elevated` | `#2D2450` | Highest elevation |
| `text.primary` | `#F0F0FC` | Body text |
| `text.secondary` | `#9B8FC0` | Muted text |
| `text.muted` | `#6B5E8A` | Dimmed text |
| `accent.primary` | `#A855F7` | TRANSFORMR Purple |
| `accent.primaryLight` | `#C084FC` | Lighter purple |
| `accent.primaryDark` | `#7E22CE` | Deeper purple |
| `accent.success` | `#10B981` | Success green |
| `accent.warning` | `#F59E0B` | Warning amber |
| `accent.danger` | `#EF4444` | Error red |
| `accent.info` | `#3B82F6` | Info blue |
| `accent.fire` | `#F97316` | Streak/fire orange |
| `accent.gold` | `#EAB308` | Achievement gold |
| `accent.pink` | `#EC4899` | Partner pink |
| `accent.cyan` | `#22D3EE` | AI/tech cyan |
| `border.default` | `#2A2248` | Default borders |
| `border.focus` | `#A855F7` | Focus ring |

---

## Banned Colors (Old Slate Design System)

These colors are NO LONGER in the codebase. Any reference to them is incorrect:

| Banned Hex | Was Used For | Correct Replacement |
|-----------|--------------|---------------------|
| `#0F172A` | Old background | `#0C0A15` |
| `#1E293B` | Old surface | `#16122A` |
| `#334155` | Old border | `#2A2248` |
| `#F8FAFC` | Old text-primary | `#F0F0FC` |
| `#94A3B8` | Old text-secondary | `#9B8FC0` |
| `#64748B` | Old text-muted | `#6B5E8A` |
| `#22C55E` | Old green | `#10B981` |
| `#6366F1` | Old indigo | `#A855F7` |
| `#8B5CF6` | Old violet | `#A855F7` |
| `#F5F5F5` | Old light bg | `#F8F7FF` |
| `#E5E5E5` | Old light border | `#DDD8F0` |
| `#999999` | Old muted | `#6B5E8A` |

---

## Light Mode — Brand Kit (Implemented)

| Token | Hex | Role |
|-------|-----|------|
| `background.primary` | `#F8F7FF` | Purple-tinted off-white |
| `background.secondary` | `#FFFFFF` | Cards |
| `background.tertiary` | `#F0EDF8` | Elevated surfaces |
| `text.primary` | `#1A1530` | Deep purple-black |
| `text.secondary` | `#4A3F6B` | Medium purple-gray |
| `accent.primary` | `#7C3AED` | Deeper purple (WCAG AA) |
| `accent.success` | `#059669` | Dark green (accessible) |
| `border.default` | `#DDD8F0` | Purple-tinted border |

---

## Status

- Theme file (`theme/colors.ts`): Fully migrated to purple ambient system
- Edge functions: Zero banned color violations
- App source code: Zero banned color violations (verified via grep)
- The old Slate-based palette is completely eradicated from all source files

---

## Notes for Documentation Updates

If TRANSFORMR-INSTRUCTIONS.md or any other project documentation still references the
Slate color palette (slate-900, slate-800, slate-700, emerald-500, indigo-500, violet-500),
those values are outdated and should be updated to match the values in this document.
