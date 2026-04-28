# Scope Lock - Required Boilerplate for Claude Code Sessions

Paste the block below at the TOP of every Claude Code prompt. This forces
the agent to acknowledge scope before starting and prevents the
while-I-am-here pattern that caused the cascade of breakage on 2026-04-27.

---

## SCOPE LOCK (paste this)

Assistant: before ANY implementation, you must:

1. State the files you intend to modify (no others will be accepted).
2. State the files you intend to create.
3. Confirm you will NOT touch any of these:
   - package.json / package-lock.json / .npmrc / eas.json
   - app.json / app.config.ts / babel.config.js / metro.config.js / tsconfig.json
   - Any store file (stores/**), migration (supabase/migrations/**),
     Edge Function (supabase/functions/**), or service file (services/**)
   - Any locked file listed in CLAUDE.md
4. If ANY of the above files must change for your task, explain WHY and
   wait for explicit approval before proceeding.

If I discover you modified a file outside your stated scope, I will
revert the ENTIRE session and re-run with a fresh agent.

---

## Why this exists

On 2026-04-27, a single add-3D-icons prompt resulted in:
- MMKV dependency downgraded (app could not start - 8 hours lost)
- Storage shim injected (hid the error instead of fixing it)
- Brand doc rewritten with wrong info
- Auth flow modified without permission

Each of these was helpful in isolation but catastrophic when bundled.
The scope lock prevents scope creep by making agents declare intent upfront.
