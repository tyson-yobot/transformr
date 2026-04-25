# TRANSFORMR — Visual Asset Manifest

## DO NOT REMOVE IMAGES LISTED IN THIS FILE

Every image listed below is intentionally placed on its screen.
If your edit would remove any of these, your edit is WRONG.
Stop, revert, and re-read the task scope.

---

## Onboarding Screens (`app/(auth)/onboarding/`)

These screens use the `localSource` prop on `<OnboardingBackground>`.
Every `<OnboardingBackground>` call MUST carry `localSource`.

| Screen File | localSource Asset | Status |
|-------------|------------------|--------|
| welcome.tsx | assets/images/gym-hero.jpg | LOCKED |
| profile.tsx | assets/images/hero-profile.jpg | LOCKED |
| goals.tsx | assets/images/hero-goals.jpg | LOCKED |
| fitness.tsx | assets/images/hero-fitness.jpg | LOCKED |
| nutrition.tsx | assets/images/hero-nutrition.jpg | LOCKED |
| business.tsx (×2 — both renders) | assets/images/hero-business.jpg | LOCKED |
| partner.tsx (×2 — both renders) | assets/images/hero-partner.jpg | LOCKED |
| notifications.tsx | assets/images/hero-notifications.jpg | LOCKED |
| ready.tsx | assets/images/hero-ready.jpg | LOCKED |

### How the image system works

`OnboardingBackground` (`components/ui/OnboardingBackground.tsx`) renders a
full-screen `expo-image` layer. When `localSource` is provided it takes
priority over the `imageUrl` fallback. A LinearGradient overlay sits on top
for text readability.

---

## Login Screen (`app/(auth)/login.tsx`) — LOCKED

| Asset | Usage |
|-------|-------|
| assets/icons/transformr-icon.png | App wordmark logo |
| assets/videos/pillar-fitness.mp4 | Cycling video background — FITNESS pillar |
| assets/videos/pillar-nutrition.mp4 | Cycling video background — NUTRITION pillar |
| assets/videos/pillar-sleep.mp4 | Cycling video background — SLEEP pillar |
| assets/videos/pillar-business.mp4 | Cycling video background — BUSINESS pillar |
| assets/videos/pillar-mindset.mp4 | Cycling video background — MINDSET pillar |

> Note: Static gym-hero.jpg background replaced by cycling Pexels video backgrounds
> via `VideoBackground` component. Videos sourced from Pexels API (free, attribution required).
> Attribution rendered as "Videos by Pexels" on-screen.

---

## Splash Screen (`components/SplashOverlay.tsx`) — LOCKED

| Asset | Usage |
|-------|-------|
| assets/icons/transformr-icon.png | App wordmark logo |
| assets/images/gym-hero.jpg | Full-screen background |

---

## Verification Command

Run this before committing any .tsx changes to confirm no images were removed:

```bash
grep -rn "localSource\|require.*\.(jpg\|png)" apps/mobile/app/\(auth\)/onboarding/ --include="*.tsx"
```

Expected output: 11 matches across 9 files (business and partner have 2 each).

---

**RULE: If a screen file is listed here and your diff removes its
image reference, STOP. Your edit has a regression. Fix it first.**
