# TRANSFORMR — Claude Code Instructions

## READ THIS FIRST
Before writing ANY code, read the complete blueprint: `TRANSFORMR-BLUEPRINT.md`
That document contains the full product spec, all 35 features, complete database schema, design system, and 135 implementation steps.

## Project Context
- **App:** TRANSFORMR — AI-Powered Life Transformation Platform
- **Owner:** Automate AI LLC
- **Repo:** tyson-yobot/transformr
- **Branch:** dev (default working branch)
- **Node:** 20.19.4 (enforced via .nvmrc)
- **Stack:** React Native + Expo SDK 52 + TypeScript (strict) + Supabase + Claude AI

## Alignment with Construktr
This project follows the same patterns as the Construktr app (C:\dev\construktr\mobile):
- Same React Native + Expo + TypeScript stack
- Same Supabase backend approach
- Same file-based routing (Expo Router)
- Same state management (Zustand + React Query)
- Match code style, naming conventions, and component patterns

## Critical Rules
1. **Node 20.19.4** — Do not use any other version
2. **TypeScript strict** — No `any` types. Full type safety everywhere.
3. **No stubs** — Every feature fully implemented. No placeholder screens. No "coming soon."
4. **No workarounds** — All code written to its fullest capabilities
5. **Offline-first** — Workout and meal logging MUST work without internet
6. **Speed** — Logging actions must take < 3 seconds and < 3 taps
7. **Dark mode first** — Default theme is dark
8. **All AI features use claude-sonnet-4-20250514** — Include full user context in every call

## Phase Execution Order
Follow the 13-phase, 135-step plan in TRANSFORMR-BLUEPRINT.md exactly.
Start with Phase 1: Infrastructure setup.

## Current Phase: PHASE 1 — Infrastructure

### Steps to Execute:
```bash
# Step 1: Verify repo structure exists
cd C:\dev\transformr
dir

# Step 2: Create Supabase project (if not done via dashboard)
cd C:\dev\transformr
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Step 3: Verify Node version
node --version
# Must output: v20.19.4

# Step 4: Install dependencies
cd C:\dev\transformr
npm install

cd C:\dev\transformr\apps\mobile
npm install

# Step 5: Run database migrations
cd C:\dev\transformr
supabase db push

# Step 6: Seed the database
cd C:\dev\transformr
supabase db seed

# Step 7: Verify Expo starts
cd C:\dev\transformr\apps\mobile
npx expo start

# Step 8: Initial commit
cd C:\dev\transformr
git add -A
git commit -m "feat: initial project setup with full directory structure"
git push origin dev
```

### After Phase 1, proceed to Phase 2: Design System + Auth
Refer to TRANSFORMR-BLUEPRINT.md for all subsequent phases.
