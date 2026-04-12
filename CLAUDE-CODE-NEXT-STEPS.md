# Do all four. In this order.

## 1. Commit in logical chunks

Split the 154 files into these commits, in this order:

```
git add apps/mobile/theme/ apps/mobile/components/ui/MonoText.tsx apps/mobile/components/ui/ScreenSkeleton.tsx
git commit -m "feat: implement brand system foundation — Deep Space theme, MonoText, ScreenSkeleton"

git add apps/mobile/components/
git commit -m "feat: upgrade component library with brand-aligned design tokens"

git add apps/mobile/app/(auth)/
git commit -m "feat: polish auth and onboarding screens with brand system"

git add apps/mobile/app/(tabs)/dashboard.tsx apps/mobile/app/(tabs)/fitness/ apps/mobile/app/(tabs)/nutrition/ apps/mobile/app/(tabs)/goals/ apps/mobile/app/(tabs)/profile/
git commit -m "feat: complete Phase 4 UI/UX overhaul across all tab screens"

git add apps/mobile/app/daily-briefing.tsx apps/mobile/hooks/useDailyBriefing.ts
git commit -m "feat: add daily briefing screen and hook"

git add apps/mobile/app/trajectory.tsx apps/mobile/app/weekly-review.tsx apps/mobile/app/goal-cinema.tsx apps/mobile/app/partner/ apps/mobile/app/index.tsx
git commit -m "feat: polish standalone and modal screens with brand system"
```

For the AI Chat Coach scaffolding files (chat.tsx, chat-history.tsx, ChatFAB.tsx, chatStore.ts, supabase functions ai-chat-coach/ai-lab-interpret), commit those separately:

```
git add apps/mobile/app/ai-chat.tsx apps/mobile/app/ai-chat-history.tsx apps/mobile/components/ui/ChatFAB.tsx apps/mobile/stores/chatStore.ts supabase/functions/ai-chat-coach/ supabase/functions/ai-lab-interpret/
git commit -m "feat: scaffold AI Chat Coach and lab interpreter (Phase 1 prep)"
```

Catch any remaining files:
```
git add -A
git status
```

If anything is left, commit it:
```
git commit -m "chore: remaining Phase 4 cleanup"
git push origin dev
```

## 2. Install dependencies and typecheck

```powershell
cd C:\dev\transformr
npm install

cd C:\dev\transformr\apps\mobile
npm install

npx tsc --noEmit 2>&1 | head -50
```

If there are type errors, fix them. Target: zero errors. If there are more than 20 errors, show me the first 20 and I'll prioritize.

Also run lint:
```powershell
cd C:\dev\transformr\apps\mobile
npx eslint . --ext .ts,.tsx 2>&1 | tail -20
```

Report the results. Don't move to step 3 until typecheck and lint are clean (or you've documented what's blocking).

## 3. Verify the app starts

```powershell
cd C:\dev\transformr\apps\mobile
npx expo start
```

Let Metro bundler start. If it shows the QR code without crashing, it works. Report any errors.

If .env is missing or empty, stop and tell me — I need to provide Supabase and Anthropic keys before AI features will work. But the app should at least START without them (auth screens should render).

## 4. Save memory and prep for next phase

Save to your CLAUDE.md or session memory:
- Phase 4 UI/UX Overhaul: SHIPPED
- Brand system: Deep Space #0C0A15 + Vivid Purple #A855F7 — locked and applied to all screens
- MonoText component: all numeric displays use monospace
- ScreenSkeleton: all screens have skeleton loading states
- ActivityIndicator: fully eliminated from app screens
- MOTIVATION_QUOTES: fully eliminated
- Chat Coach scaffolding: exists but not wired up yet

Then read `TRANSFORMR-WELLNESS-INTELLIGENCE-PROMPT.md` in the repo root. If that file doesn't exist yet, tell me and I'll provide it. That's the master prompt for the next build phase — 14 modules starting with the Compliance Language Engine (Module 0), then AI Chat Coach (Module 1), then Lab Scanner, Budget Supplements, and so on.

**After steps 1-4 are complete, begin Module 0 from the Wellness Intelligence prompt.** Module 0 (Compliance Engine) creates `supabase/functions/_shared/compliance.ts` and updates ALL existing Edge Functions with the compliance preamble. It must be done before any other AI feature work.
