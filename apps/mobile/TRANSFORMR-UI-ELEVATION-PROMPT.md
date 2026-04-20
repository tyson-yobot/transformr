# TRANSFORMR — UI ELEVATION: SHIPPED PRODUCT QUALITY
## Principal UI/UX Engineer + Senior React Native Architect
## Automate AI LLC | Branch: dev | April 2026

---

## THE TWO STANDARDS YOU ARE MATCHING

### Standard 1: Your own splash and login screens

The splash and login are world-class. Study them before touching anything:

```powershell
cd C:\dev\transformr

Get-ChildItem -Recurse apps\mobile -Filter "*.tsx" |
  Where-Object {
    $_.FullName -notmatch "node_modules" -and
    ($_.Name -match "[Ss]plash|[Ll]aunch|[Ll]ogin|[Ss]ignIn|[Ss]ign.in")
  } |
  ForEach-Object {
    Write-Host "`n═══ $($_.FullName.Replace('C:\dev\transformr\', '')) ═══"
    Get-Content $_.FullName
  }
```

What makes them premium:
- Full-bleed gym photography with Deep Space overlay (~60-65% opacity)
- Glass-morphism form cards: rgba(22,18,42,0.88), 1px border rgba(168,85,247,0.15)
- Purple luminance: the wordmark and button glow like they're emitting light
- Wide letter-spaced "TRANSFORMR" wordmark
- Trust signals: "256-bit encrypted · Your data stays yours"
- "By Automate AI" footer

### Standard 2: Category leaders like MyFitnessPal

What makes apps like MyFitnessPal feel like REAL, SHIPPED PRODUCTS:

```
PATTERN A — REAL PHOTOGRAPHY EVERYWHERE
  Not just on splash. Real photos of people working out, healthy meals,
  gym environments. These photos appear in onboarding carousels, feature
  highlights, empty states, and marketing sections. They make the app
  feel like it exists in the real world, not in a code editor.

PATTERN B — ONBOARDING THAT SELLS THE PRODUCT
  Each onboarding screen has ONE clear value proposition:
  "Ready for some wins? Start tracking, it's easy!"
  "Discover the impact of your food and fitness"
  "Stay on it with tools that turn habits into results"
  The user understands WHY they should use the app before they start.

PATTERN C — FEATURE EXPLANATIONS WITH ICONS
  "Scan a barcode to log lightning fast"
  "Use your voice to log just by saying it"
  "Take a photo to log your entire meal"
  Each feature: icon + bold title + one-line explanation.
  Users learn what the app can do AS they onboard.

PATTERN D — ONE THOUGHT PER SCREEN, MASSIVE BREATHING ROOM
  MyFitnessPal onboarding screens have ONE image, ONE headline,
  ONE subtitle, and ONE button. Nothing is crammed. The whitespace
  is intentional. It communicates confidence: "we don't need to
  overwhelm you because the product speaks for itself."

PATTERN E — SUBSCRIPTION SCREEN THAT CONVERTS
  Clean pricing comparison (monthly vs annual with "save" badge),
  feature checklist with icons explaining what premium unlocks,
  prominent CTA with free trial text, cancellation reassurance.
  This is the revenue screen — it must be the most polished in the app.

PATTERN F — ILLUSTRATIONS FOR ABSTRACT CONCEPTS
  When there's no photo (goals, journey milestones, empty states),
  use purposeful illustrations: a signpost for "choose your path",
  a rocket for "you're making progress", a trophy for achievements.
  These feel intentional, not placeholder.
```

---

## THE PROBLEM WITH THE CURRENT INTERIOR

The splash and login feel like a $15/month premium wellness app.
The dashboard and interior screens feel like a developer's first project.

```
PROBLEM 1: FLAT VOID BACKGROUND
  Dashboard is a solid #0C0A15 fill. No texture, no depth, no ambient
  gradient. The splash creates an entire world. The dashboard creates nothing.

PROBLEM 2: NO REAL PHOTOGRAPHY AFTER LOGIN
  The splash has a gym photo. The login has a gym photo. Then it all stops.
  Every fitness app that feels "real" continues using photography throughout.

PROBLEM 3: BORDERED RECTANGLES INSTEAD OF GLASS CARDS
  Quick action tiles and cards look like wireframe placeholders.
  They should use the same glass effect as the login form.

PROBLEM 4: AI INSIGHT CARD LOOKS LIKE A WARNING
  Yellow/amber bordered card. Should be cyan (AI color) with glass.

PROBLEM 5: NO BREATHING ROOM
  The dashboard crams hero quote + quick actions + AI card + countdown +
  stats + today's progress + FAB all into one scroll. Each section
  needs more vertical space between it and the next.

PROBLEM 6: ONBOARDING DOESN'T SELL
  The onboarding probably collects data (name, weight, goals) but
  doesn't SHOW the user what the app can do. No feature previews,
  no lifestyle photography, no "here's what you're about to unlock."

PROBLEM 7: NO SUBSCRIPTION/PAYWALL SCREEN
  The pricing tiers (Free/Pro/Elite/Partners) need a polished screen
  that matches the quality of the login. This is the revenue screen.

PROBLEM 8: FLAT TEXT FOR MACRO PROGRESS
  "Calories 0 / 2,000" as flat text. Should be animated progress rings
  like Oura/Apple Watch.

PROBLEM 9: STAT TILES LACK WEIGHT
  Small, equal-sized tiles feel like metadata. They should feel like
  headline KPIs on a Bloomberg terminal.

PROBLEM 10: EMPTY STATES ARE GENERIC
  Lists with no data show boring text. Should show photography or
  illustrations with motivating copy and a clear CTA.
```

---

## IRON-CLAD RULES

```
NEVER run taskkill, Stop-Process, kill, or any process-killing command.
NEVER remove features, screens, components, navigation, or functionality.
NEVER use hardcoded hex colors in components — use theme tokens exclusively.
NEVER use console.log — only console.warn and console.error.
NEVER use 'any' types. NEVER use @ts-ignore.
NEVER make the app slower — use GPU-accelerated properties only
  (transform, opacity). No layout animations (width, height, padding).
ADD and IMPROVE only. Never remove existing functionality.
Branch: dev
Root: C:\dev\transformr
Mobile: apps\mobile
Package manager: pnpm
TypeScript: npx tsc --noEmit --pretty (0 errors after every phase)
cd on its own line before every command block.
Read every file completely before modifying it.
Commit after every phase. Push after every phase.
```

---

## MANDATORY STARTUP

```powershell
cd C:\dev\transformr

Get-Content CLAUDE.md -ErrorAction SilentlyContinue
Get-Content SOUL.md -ErrorAction SilentlyContinue
Get-Content CONFIGURATION_LOCK.md -ErrorAction SilentlyContinue
```

---

## PHASE 0 — DISCOVERY

```powershell
cd C:\dev\transformr

# Theme system
Get-ChildItem -Recurse apps\mobile -Filter "*.ts","*.tsx" |
  Where-Object {
    $_.FullName -notmatch "node_modules" -and
    ($_.Name -match "theme|color|palette|brand")
  } |
  ForEach-Object {
    Write-Host "`n═══ $($_.FullName.Replace('C:\dev\transformr\', '')) ═══"
    Get-Content $_.FullName
  }

# Splash + login (read completely — these are your quality reference)
Get-ChildItem -Recurse apps\mobile -Filter "*.tsx" |
  Where-Object {
    $_.FullName -notmatch "node_modules" -and
    ($_.Name -match "[Ss]plash|[Ll]aunch|[Ll]ogin|[Ss]ignIn")
  } |
  ForEach-Object {
    Write-Host "`n═══ $($_.Name) ═══"
    Get-Content $_.FullName
  }

# Existing premium components
Get-ChildItem -Recurse apps\mobile -Filter "*.tsx" |
  Where-Object {
    $_.FullName -notmatch "node_modules" -and
    ($_.Name -match "Glow|Glass|Premium|Radial|Ambient|Skeleton|Empty|Progress|Ring")
  } |
  ForEach-Object { Write-Host "COMPONENT: $($_.Name)" }

# All image/photo assets
Get-ChildItem -Recurse apps\mobile\assets -Filter "*.jpg","*.png","*.webp" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  ForEach-Object { $_.FullName.Replace("C:\dev\transformr\", "") }

# Dashboard
Get-ChildItem -Recurse apps\mobile -Filter "*.tsx" |
  Where-Object {
    $_.FullName -notmatch "node_modules" -and
    ($_.Name -match "dashboard|Dashboard") -and
    $_.FullName -match "\(tabs\)"
  } |
  ForEach-Object {
    Write-Host "`n═══ DASHBOARD ═══"
    Get-Content $_.FullName
  }

# All tab roots + layout
Get-ChildItem -Recurse "apps\mobile\app\(tabs)" -Filter "*.tsx" |
  Where-Object {
    $_.FullName -notmatch "node_modules" -and
    ($_.Name -eq "index.tsx" -or $_.Name -eq "_layout.tsx")
  } |
  ForEach-Object {
    Write-Host "`n═══ $($_.FullName.Replace('C:\dev\transformr\', '')) ═══"
    Get-Content $_.FullName | Select-Object -First 120
  }

# Onboarding screens
Get-ChildItem -Recurse apps\mobile -Filter "*.tsx" |
  Where-Object {
    $_.FullName -notmatch "node_modules" -and
    $_.FullName -match "[Oo]nboard"
  } |
  ForEach-Object {
    Write-Host "`n═══ ONBOARDING: $($_.Name) ═══"
    Get-Content $_.FullName | Select-Object -First 80
  }

# Subscription/paywall/upgrade screens
Get-ChildItem -Recurse apps\mobile -Filter "*.tsx" |
  Where-Object {
    $_.FullName -notmatch "node_modules" -and
    ($_.Name -match "[Ss]ubscri|[Pp]aywall|[Uu]pgrade|[Pp]ricing|[Pp]lan")
  } |
  ForEach-Object {
    Write-Host "`n═══ SUBSCRIPTION: $($_.Name) ═══"
    Get-Content $_.FullName
  }

# Modals and sheets
Get-ChildItem -Recurse apps\mobile -Filter "*.tsx" |
  Where-Object {
    $_.FullName -notmatch "node_modules" -and
    ($_.Name -match "[Mm]odal|[Ss]heet")
  } |
  ForEach-Object { Write-Host "MODAL: $($_.Name)" }
```

---

## PHASE 1 — PHOTOGRAPHY STRATEGY

Real photography is the single biggest difference between "developer project"
and "shipped product." The splash screen already uses a gym photo. Extend
this pattern throughout the app.

### 1A: Source high-quality royalty-free photos

Download these photos from Unsplash (free, no attribution required for apps)
and save to `apps/mobile/assets/images/`:

```powershell
cd C:\dev\transformr\apps\mobile\assets

New-Item -ItemType Directory -Force -Path images
```

The agent should download or create placeholder references for these categories.
If the agent cannot download from Unsplash (network restrictions), create a
`PHOTOGRAPHY_NEEDED.md` file listing the exact photos needed with search terms
so Tyson can download them manually.

```
PHOTOS NEEDED (save as high-quality JPG, ~1200px wide):

onboarding-workout.jpg
  Search: "person lifting weights gym dark" or "athlete training dark background"
  Usage: Onboarding feature carousel — workout tracking preview
  Style: Dark/moody gym environment, person mid-exercise

onboarding-nutrition.jpg
  Search: "healthy meal prep colorful overhead" or "healthy food bowl top view"
  Usage: Onboarding feature carousel — nutrition tracking preview
  Style: Vibrant, colorful, overhead angle, appetizing

onboarding-progress.jpg
  Search: "person celebrating fitness achievement" or "before after transformation"
  Usage: Onboarding feature carousel — progress tracking preview
  Style: Positive energy, achievement moment

empty-workout.jpg
  Search: "empty gym equipment dark moody" or "barbell dark gym"
  Usage: Empty state when no workouts logged
  Style: Dark, atmospheric, motivating

empty-nutrition.jpg
  Search: "kitchen ingredients fresh" or "meal prep containers"
  Usage: Empty state when no meals logged
  Style: Clean, appetizing, inviting

hero-dashboard.jpg
  Search: "gym atmosphere dark moody" or "gym interior cinematic"
  Usage: Dashboard hero section background (same as splash or new variant)
  Style: Dark, cinematic, premium feel
```

### 1B: Create ImageBackground helper

If one doesn't already exist, create a reusable component that overlays
photography with the Deep Space color at controlled opacity:

```
File: apps/mobile/components/ui/PhotoBackground.tsx

SPEC:
  Uses ImageBackground from react-native
  Props: source (image require), opacity?: number (default 0.6),
         children, style
  Renders: ImageBackground with the source, a View overlay on top
    with backgroundColor rgba(12,10,21,[opacity]), then children
  Image: resizeMode 'cover'
  Light mode: overlay uses rgba(248,247,255,0.85) instead
```

### COMMIT:

```powershell
cd C:\dev\transformr

git add -A
git commit -m "chore(assets): add photography strategy and PhotoBackground component"
git push origin dev
```

---

## PHASE 2 — PREMIUM COMPONENT LIBRARY

Build or update these components. If they exist and match the spec, skip them.
If they exist but are wrong, update them. If missing, create them.

### 2A: GlassCard

The login form card effect, made reusable.

```
Dark mode:
  backgroundColor: rgba(22, 18, 42, 0.88)
  borderWidth: 1
  borderColor: rgba(168, 85, 247, 0.10) — default
  borderColor: rgba(168, 85, 247, 0.25) — variant="featured"
  borderColor: rgba(34, 211, 238, 0.15) — variant="ai"
  borderRadius: 16, padding: 16, overflow: 'hidden'
  variant="featured" shadow: shadowColor #A855F7, shadowOpacity 0.12, shadowRadius 20

Light mode:
  backgroundColor: rgba(255, 255, 255, 0.92)
  borderWidth: 0 — use shadow for depth instead of borders
  borderRadius: 16, padding: 16
  shadow: shadowColor #0C0A15, shadowOpacity 0.06, shadowRadius 12, elevation 3
  variant="featured": add 2px bottom border rgba(124,58,237,0.15)
  variant="ai": add 2px bottom border rgba(8,145,178,0.12)

Props: variant 'default'|'featured'|'ai'|'streak', children, style, onPress
If onPress provided: wrap in Pressable, scale 0.98 on press with spring
File: apps/mobile/components/ui/GlassCard.tsx
```

### 2B: GlowButton

The Sign In button, extracted for every CTA.

```
variant="primary":
  Dark: bg #A855F7, shadow glow, white text 17pt semibold
  Light: bg #7C3AED, softer shadow
  Press: scale 0.97 spring, shadow dims, haptic light
  Loading: text fades out, ActivityIndicator fades in, same size

variant="secondary": transparent bg, 1.5px border accent, accent text
variant="ghost": rgba tinted bg, no border, accent text
variant="danger": danger red bg, white text

Props: title, onPress, loading, variant, disabled, icon (Ionicons name), style
File: apps/mobile/components/ui/GlowButton.tsx
```

### 2C: AmbientBackground

Replaces flat #0C0A15 void with subtle radial depth.

```
Layer 1: Solid theme.background.primary
Layer 2: Radial gradient rgba(168,85,247,0.05) at top-left (20%, 10%)
Layer 3: Radial gradient rgba(34,211,238,0.03) at bottom-right (85%, 90%)
Light mode: half opacity on both gradients
pointerEvents: 'none', position: 'absolute'
Props: variant 'default'|'subtle'|'warm'
File: apps/mobile/components/ui/AmbientBackground.tsx
```

### 2D: ProgressRing

Animated circular progress for macro tracking (like Oura/Apple Watch, not flat bars).

```
SVG circle progress indicator:
  Track: theme.border.default (dark) / #EDE9FE (light)
  Fill: semantic color, strokeLinecap round, rotated -90deg
  Center: monospace value + label
  Animation: arc length from 0 to target, 1000ms ease-out
  Sizes: sm (56px), md (72px), lg (96px)
Props: progress (0-1), size, color, label, value, animate
File: apps/mobile/components/ui/ProgressRing.tsx
```

### 2E: StatTile

Premium KPI cards with monospace numbers and semantic icons.

```
Container: GlassCard variant="default"
  Icon: 40x40 rounded container, semantic color at 0.12 opacity bg
  Value: monospace 24pt bold, count-up animation on mount
  Label: 11pt uppercase letterSpacing 1, theme.text.muted
Icons: flame-outline (streak/fire), barbell-outline (workouts/purple),
  nutrition-outline (calories/green), pulse-outline (readiness/cyan)
File: apps/mobile/components/ui/StatTile.tsx
```

### 2F: QuickActionTile

Glass tiles replacing flat bordered rectangles.

```
Container: GlassCard variant="default", onPress
  Icon: Ionicons 30pt in semantic color
  Label: 12pt semibold theme.text.primary
  Press: scale 0.93 spring, haptic light
File: apps/mobile/components/ui/QuickActionTile.tsx
```

### 2G: AIInsightCard

The AI speaking to the user. Cyan tinted, not amber.

```
Container: GlassCard variant="ai"
  Left accent: 3px solid cyan bar
  Header: AI badge pill (sparkles icon + "AI" in cyan)
  Body: 14pt, theme.text.primary, lineHeight 22
  Footer: "Got it" in cyan, refresh icon
  Entrance: slide-up fade-in 500ms
File: apps/mobile/components/cards/AIInsightCard.tsx
```

### 2H: SectionHeader

Consistent section headers throughout.

```
Title: 16pt bold theme.text.primary
Optional subtitle: 12pt theme.text.muted
Optional action: 13pt semibold theme.accent.primary (right-aligned)
Spacing: marginBottom 12, marginTop 24
File: apps/mobile/components/ui/SectionHeader.tsx
```

### 2I: GlassSkeleton

Loading skeletons that match the glass aesthetic (not generic gray).

```
Dark: base rgba(22,18,42,0.6), shimmer rgba(168,85,247,0.06)
Light: base rgba(0,0,0,0.04), shimmer rgba(255,255,255,0.8)
Presets: card, stat-row, line, circle, quick-actions
File: apps/mobile/components/ui/GlassSkeleton.tsx
```

### 2J: PremiumEmptyState

When lists have no data, show photography + motivating copy + CTA.

```
Layout: centered vertically
  Image: rounded photo from photography set (optional — fall back to icon)
    OR: large Ionicons icon in 80x80 circle with dim bg
  Title: 18pt semibold theme.text.primary
  Subtitle: 14pt theme.text.secondary, center, maxWidth 280
  CTA: GlowButton variant="primary" or "ghost"

Examples with photography:
  No workouts: photo of empty gym + "Your first rep is the hardest."
  No meals: photo of meal prep + "Your body can't build what it doesn't have."
  No habits: icon fallback + "Small daily actions compound into massive change."

File: apps/mobile/components/ui/PremiumEmptyState.tsx
```

### 2K: GlassInput

Login-quality inputs for all interior forms.

```
Dark unfocused: rgba(22,18,42,0.6), 1px border #2A2248
Dark focused: border animates to #A855F7, subtle purple glow ring
Light unfocused: white, 1px border theme.border.default
Light focused: border to #7C3AED, subtle glow
Label above: 13pt semibold theme.text.secondary
Error: danger border + error text below
File: apps/mobile/components/ui/GlassInput.tsx
```

### 2L: GlassModal

Glass aesthetic on every modal and bottom sheet.

```
Backdrop: rgba(0,0,0,0.6)
Dark container: rgba(22,18,42,0.95), 1px rgba(168,85,247,0.12), borderRadius 24
Light container: rgba(255,255,255,0.97), shadow, borderRadius 24
Bottom sheet handle: 40x4, borderRadius 2, theme.border.default
Entrance: spring translateY for sheets, scale+fade for center modals
File: apps/mobile/components/ui/GlassModal.tsx
```

### 2M: FeatureHighlightRow

For onboarding screens that explain what the app does (MyFitnessPal pattern).

```
Layout: horizontal row with icon container + text stack
  Icon container: 44x44, borderRadius 12, semantic color at 0.12 bg
    Icon: Ionicons 22pt in semantic color
  Title: 15pt semibold theme.text.primary
  Subtitle: 13pt theme.text.secondary, marginTop 2
  Spacing: 16px vertical gap between rows

File: apps/mobile/components/ui/FeatureHighlightRow.tsx
Props: icon: string, iconColor: string, title: string, subtitle: string
```

### COMMIT:

```powershell
cd C:\dev\transformr\apps\mobile

npx tsc --noEmit --pretty
```

```powershell
cd C:\dev\transformr

git add -A
git commit -m "feat(ui): premium component library — GlassCard, GlowButton, ProgressRing, StatTile, PhotoBackground, FeatureHighlightRow, GlassSkeleton, PremiumEmptyState"
git push origin dev
```

---

## PHASE 3 — ONBOARDING OVERHAUL

The onboarding flow is where the user decides if this is a real product or a
toy. It must SELL the product while collecting data. Every screen should make
the user more excited to start.

### 3A: Read all onboarding screens

```powershell
cd C:\dev\transformr

Get-ChildItem -Recurse apps\mobile -Filter "*.tsx" |
  Where-Object {
    $_.FullName -notmatch "node_modules" -and
    $_.FullName -match "[Oo]nboard"
  } |
  ForEach-Object {
    Write-Host "`n═══ $($_.FullName.Replace('C:\dev\transformr\', '')) ═══"
    Get-Content $_.FullName
  }
```

### 3B: Onboarding structure

The onboarding should alternate between SELLING screens (showing the user
what the app does) and DATA screens (collecting their info). This is the
MyFitnessPal pattern: sell → collect → sell → collect.

```
SCREEN 1: WELCOME CAROUSEL (sell)
  3-panel horizontal swipe carousel with dot indicators:

  Panel 1: "Track every rep, every meal, every dollar"
    - Background: gym photography with Deep Space overlay
    - Overlaid: screenshot preview of the dashboard with stats
    - This shows the user the PRODUCT they're about to use

  Panel 2: "AI coaching that knows your data"
    - Background: photography (person checking phone at gym)
    - Overlaid: screenshot preview of AI insight card
    - Shows the AI coaching feature

  Panel 3: "See your transformation unfold"
    - Background: photography (healthy meal or progress)
    - Overlaid: screenshot preview of progress rings
    - Shows the tracking/progress feature

  Each panel: headline (20pt bold white), subtitle (14pt rgba white 0.7)
  Bottom: dot indicators, "Get Started" GlowButton
  Below button: "Already have an account? Sign In" in muted text

SCREEN 2: PROFILE BASICS (collect)
  - Background: Deep Space with AmbientBackground
  - GlassCard containing: name, email (pre-filled), avatar picker
  - Progress bar at top showing step 1 of N
  - "Continue" GlowButton at bottom

SCREEN 3: YOUR GOALS (collect)
  - Goal direction: Gain / Lose / Maintain toggle
  - Target weight with slider
  - Countdown setup (title + date)
  - GlassCard with GlassInput fields

SCREEN 4: FEATURE HIGHLIGHT (sell)
  - Full-screen branded background (Deep Space + AmbientBackground)
  - Large headline: "Stay on it with tools that turn habits into results"
  - 3 FeatureHighlightRow items:
    barbell-outline / purple: "Log workouts in seconds" / "Track sets, reps, and weight with one tap"
    camera-outline / cyan: "Snap your meals" / "AI identifies food and calculates macros from a photo"
    trending-up-outline / green: "Watch your progress" / "See your body, fitness, and nutrition trends over time"
  - "Next" GlowButton

SCREEN 5: FITNESS SETUP (collect)
  - Activity level selector
  - Training experience (Beginner/Intermediate/Advanced)
  - Preferred training days

SCREEN 6: NUTRITION SETUP (collect)
  - Auto-calculated daily targets shown
  - Editable calories/protein/carbs/fat
  - Dietary restrictions multi-select

SCREEN 7: FEATURE HIGHLIGHT (sell)
  - Headline: "Your AI coach is always watching your data"
  - 3 FeatureHighlightRow items:
    sparkles-outline / cyan: "Daily coaching" / "Personalized advice based on yesterday's data"
    pulse-outline / purple: "Readiness scoring" / "Know when to push hard and when to recover"
    people-outline / pink: "Partner sync" / "Train together with live workout tracking"
  - "Next" GlowButton

SCREEN 8: PARTNER INVITE (collect, optional)
  - Generate invite code / Enter invite code
  - Skip option

SCREEN 9: READY TO TRANSFORM (sell — celebration)
  - AmbientBackground with stronger purple gradients
  - Confetti or celebration animation
  - Large: "You're ready."
  - Subtitle: "Your AI coach will learn more about you with every workout,
    every meal, and every check-in."
  - "Let's Go" GlowButton (navigates to dashboard)
```

### 3C: Key rules for onboarding

```
[ ] Every screen has a progress indicator (thin bar or dots at top)
[ ] "Sell" screens have photography or illustrations, NOT form fields
[ ] "Collect" screens use GlassCard + GlassInput
[ ] Every screen has exactly ONE primary button at the bottom
[ ] Non-critical screens have a "Skip" link below the button
[ ] Transitions: horizontal slide with spring physics between steps
[ ] ALL screens use the theme system (no hardcoded colors)
[ ] Dark and light mode both look premium
```

### COMMIT:

```powershell
cd C:\dev\transformr

git add -A
git commit -m "feat(onboarding): redesigned onboarding — carousel, feature highlights, photography, sell-then-collect flow"
git push origin dev
```

---

## PHASE 4 — DASHBOARD ELEVATION

### 4A: Read the dashboard

```powershell
cd C:\dev\transformr

Get-ChildItem -Recurse apps\mobile -Filter "*.tsx" |
  Where-Object {
    $_.FullName -notmatch "node_modules" -and
    ($_.Name -match "dashboard|Dashboard") -and
    $_.FullName -match "\(tabs\)"
  } |
  ForEach-Object {
    Write-Host "`n═══ DASHBOARD ═══"
    Get-Content $_.FullName
  }
```

### 4B: Dashboard changes

Do NOT rewrite from scratch. Enhance what exists:

```
CHANGE 1 — AMBIENT DEPTH
  Add AmbientBackground as first child. Replaces flat void.

CHANGE 2 — HERO QUOTE
  Wrap the motivational text in GlassCard variant="featured".
  Quote: 20pt bold, lineHeight 28
  Time of day: accent.primary, 13pt semibold
  Date: text.muted, 13pt
  Give this section BREATHING ROOM: marginBottom 20

CHANGE 3 — SECTION SPACING
  Add SectionHeader before each section. Add 20px marginBottom
  after each section. The dashboard should NOT feel crammed.
  Whitespace communicates confidence.

CHANGE 4 — QUICK ACTIONS
  Replace with QuickActionTile components. 3 per row, 12px gap.
  Each has correct Ionicons icon and semantic color.

CHANGE 5 — AI INSIGHT
  Replace amber card with AIInsightCard. AI = cyan, not amber.

CHANGE 6 — COUNTDOWN HERO
  GlassCard variant="featured"
  Number: monospace 36pt bold
  "days remaining": 12pt muted, letterSpacing 1
  Progress bar: 4px, gradient purple fill
  Icon: Ionicons calendar-outline, not emoji

CHANGE 7 — STAT TILES
  Replace with StatTile components. 4 per row, 8px gap.
  count-up animation on values.

CHANGE 8 — TODAY'S PROGRESS (RINGS NOT TEXT)
  Row of 4 ProgressRing components:
    Calories (green), Protein (purple), Water (cyan), Workout (fire)
  Wrap in GlassCard with SectionHeader "Today's progress"
  Rings animate staggered on mount (100ms delay each)

CHANGE 9 — STAGGERED ENTRANCE
  Sections animate in sequentially on first mount:
    t=0ms: hero quote (opacity 0→1, translateY 12→0)
    t=100ms: quick actions
    t=200ms: AI insight
    t=300ms: stat tiles (cascade 50ms each)
    t=500ms: progress rings
  Only on first mount — use ref to track.

CHANGE 10 — FAB
  Background: rgba(168,85,247,0.88) — glass, not opaque
  Glow: shadowColor #A855F7, shadowOpacity 0.5, shadowRadius 20
  Idle pulse: scale 1.0→1.03→1.0 over 3s repeating
  Press: scale 0.88, haptic medium

CHANGE 11 — TAB BAR
  Dark: rgba(12,10,21,0.92), borderTop rgba(168,85,247,0.06)
  Light: rgba(255,255,255,0.92), borderTop rgba(124,58,237,0.06), shadow
  All tabs: Ionicons (home, barbell, restaurant, flag, person-circle)
  Active: accent.primary, Inactive: text.muted

CHANGE 12 — PULL-TO-REFRESH
  tintColor: accent.primary (purple indicator, not system blue)
```

### COMMIT:

```powershell
cd C:\dev\transformr

git add -A
git commit -m "feat(dashboard): premium elevation — glass cards, progress rings, staggered entrance, breathing room, AI cyan"
git push origin dev
```

---

## PHASE 5 — ALL TAB ROOT SCREENS

Apply the same system to Fitness, Nutrition, Goals, Profile.

```powershell
cd C:\dev\transformr

Get-ChildItem -Recurse "apps\mobile\app\(tabs)" -Filter "index.tsx" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  ForEach-Object {
    Write-Host "`n═══ $($_.FullName.Replace('C:\dev\transformr\', '')) ═══"
    Get-Content $_.FullName
  }
```

Minimum bar for every tab root:
```
[ ] AmbientBackground as first child
[ ] GlassCard replacing flat bordered containers
[ ] SectionHeader on every section
[ ] Ionicons everywhere (zero emoji)
[ ] Monospace on all numbers
[ ] GlowButton on primary CTAs
[ ] PremiumEmptyState on empty lists (with photography if assets exist)
[ ] GlassSkeleton for loading
[ ] Staggered entrance on first mount
[ ] 20px breathing room between sections
[ ] Pull-to-refresh with purple indicator
[ ] All colors from theme tokens
```

Tab-specific:

**Fitness:** AmbientBackground variant="warm" (fire tint for energy),
"Start Workout" as GlowButton, workout cards as GlassCard, PR indicators
in gold with GlassCard variant="streak"

**Nutrition:** ProgressRing row for daily macros (Calories green, Protein
purple, Carbs amber, Fat pink), food cards as GlassCard, "Add Food" as
GlowButton with restaurant-outline icon

**Goals:** Countdown hero monospace 36pt, habit list as GlassCard with
toggle + haptic, streaks in fire color, goal progress as ProgressRing

**Profile:** Settings groups in GlassCard, subscription tier in GlassCard
variant="featured", achievement badges with gold dim background, profile
photo 80px with 2px purple border

### COMMIT after each tab:

```powershell
cd C:\dev\transformr

git add -A
git commit -m "feat([TAB]): premium elevation — glass cards, photography empty states, progress rings"
git push origin dev
```

---

## PHASE 6 — SUBSCRIPTION/UPGRADE SCREEN

This is the revenue screen. It must be the most polished screen in the app.

```powershell
cd C:\dev\transformr

Get-ChildItem -Recurse apps\mobile -Filter "*.tsx" |
  Where-Object {
    $_.FullName -notmatch "node_modules" -and
    ($_.Name -match "[Ss]ubscri|[Pp]aywall|[Uu]pgrade|[Pp]ricing|[Pp]lan")
  } |
  ForEach-Object {
    Write-Host "`n═══ $($_.Name) ═══"
    Get-Content $_.FullName
  }
```

If a subscription screen exists, elevate it. If not, create one.

```
SCREEN: SUBSCRIPTION / UPGRADE

Background: AmbientBackground with stronger purple gradient

Header:
  "Premium" or "TRANSFORMR Pro" — 24pt bold
  Subtitle explaining the value: 14pt text.secondary

Pricing toggle or cards:
  Monthly: $9.99/mo label, GlassCard
  Annual: $99.99/yr label, GlassCard variant="featured" with
    "SAVE 17%" badge in accent.primary pill
  The "recommended" plan has the featured variant with purple glow

Feature checklist (MyFitnessPal style):
  Each row: checkmark-circle icon in green + feature name + one-line description
  Use FeatureHighlightRow component
  Features:
    "Unlimited AI coaching" / "Personalized advice after every workout and meal"
    "Meal camera" / "Snap a photo, get instant macro breakdown"
    "Advanced analytics" / "See trends, correlations, and predictions"
    "Form check" / "AI analyzes your exercise technique from video"
    "Lab scanner" / "Upload blood work, get plain-language insights"
    [list all gated features]

CTA: GlowButton variant="primary"
  Text: "Start 7-day free trial" (or "Upgrade to Pro")
  Full width, prominent, with glow

Reassurance text below CTA:
  "Cancel anytime. No commitment." — 12pt text.muted, centered

Footer:
  "Restore purchases" link — 13pt text.secondary
  Terms and privacy links — 12pt text.muted
```

### COMMIT:

```powershell
cd C:\dev\transformr

git add -A
git commit -m "feat(subscription): premium upgrade screen — pricing cards, feature checklist, free trial CTA"
git push origin dev
```

---

## PHASE 7 — MODALS, SHEETS, AND DETAIL SCREENS

### 7A: Modals and sheets

```powershell
cd C:\dev\transformr

Get-ChildItem -Recurse apps\mobile -Filter "*.tsx" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Select-String "presentation.*modal|BottomSheet|bottomSheet|Modal" |
  ForEach-Object { "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
```

Apply GlassModal treatment to every modal and bottom sheet.

### 7B: Detail screens

Every pushed screen gets the minimum bar:
- Background uses theme tokens
- AmbientBackground variant="subtle"
- Cards use GlassCard
- CTAs use GlowButton
- Numbers use monospace
- Icons use Ionicons
- Loading uses GlassSkeleton
- Empty states use PremiumEmptyState
- Inputs use GlassInput
- Press feedback on all tappable elements
- Section dividers: 1px theme.border.default, indented 16px each side

### COMMIT:

```powershell
cd C:\dev\transformr

git add -A
git commit -m "feat(screens): glass card system applied to all detail screens and modals"
git push origin dev
```

---

## PHASE 8 — LIGHT MODE DEEP AUDIT

Light mode must feel premium, not washed out.

```powershell
cd C:\dev\transformr

# Hardcoded dark values that break light mode
Get-ChildItem -Recurse apps\mobile\src, apps\mobile\app -Filter "*.tsx" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Select-String "'#0C0A15'|'#16122A'|'#1E1838'|'#2A2248'" |
  Where-Object {
    $_.Line -notmatch "^\s*//" -and
    $_.Filename -notmatch "theme|color|palette"
  } |
  ForEach-Object { "$($_.Filename):$($_.LineNumber)" }

# Generic grays (should be purple-tinted)
Get-ChildItem -Recurse apps\mobile\src, apps\mobile\app -Filter "*.tsx" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Select-String "'#F5F5F5'|'#E5E5E5'|'#CCCCCC'|'#999999'|'#666666'|'#333333'" |
  Where-Object {
    $_.Line -notmatch "^\s*//" -and
    $_.Filename -notmatch "theme|color|palette"
  } |
  ForEach-Object { "GENERIC GRAY: $($_.Filename):$($_.LineNumber)" }
```

Light mode rules:
```
Background: #F8F7FF (purple-tinted off-white, NOT white, NOT gray)
Cards: white glass with shadow (no borders)
Buttons: #7C3AED (darker purple for contrast)
Text: #1A1530 (purple-tinted near-black)
Muted: #7B6FA0 (purple-gray)
Borders: #DDD8F0 (purple-tinted)
Progress ring tracks: #EDE9FE (lavender, not gray)
Tab bar: white glass with purple top border and shadow
FAB: rgba(124,58,237,0.9) with softer glow

Test: if you squint at light mode and it looks like a note-taking app,
it's wrong. If it looks like a premium wellness app in a bright gym, right.
```

### COMMIT:

```powershell
cd C:\dev\transformr

git add -A
git commit -m "fix(lightmode): purple-tinted backgrounds, branded grays, proper glass cards"
git push origin dev
```

---

## PHASE 9 — SCREEN TRANSITIONS + CHARTS

### Transitions:
- Auth → Tabs: fade (not default slide)
- Tab → Stack push: slide-from-right (default, fine)
- Stack → Modal: glass backdrop
- Onboarding steps: horizontal slide with spring

### Charts:
Find all chart/graph components and apply brand colors:
- Axes: theme.text.muted labels, theme.border.default grid
- Data: semantic colors (purple primary, green positive, red negative)
- Fill areas: semantic color at 0.15 opacity
- Tooltips: GlassCard styling
- Axis numbers: monospace

### COMMIT:

```powershell
cd C:\dev\transformr

git add -A
git commit -m "feat(polish): branded transitions, themed charts"
git push origin dev
```

---

## PHASE 10 — QUALITY GATE

```powershell
cd C:\dev\transformr\apps\mobile

$ts = (npx tsc --noEmit --pretty 2>&1 | Select-String "error TS").Count
$hardcoded = (Get-ChildItem -Recurse src, app -Filter "*.tsx" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Select-String "'#[0-9A-Fa-f]{6}'" |
  Where-Object {
    $_.Line -notmatch "^\s*//" -and
    $_.Filename -notmatch "theme|color|palette|brand"
  }).Count
$grays = (Get-ChildItem -Recurse src, app -Filter "*.tsx" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Select-String "'#F5F5F5'|'#E5E5E5'|'#CCCCCC'|'#999999'" |
  Where-Object {
    $_.Line -notmatch "^\s*//" -and
    $_.Filename -notmatch "theme|color|palette"
  }).Count
$oldColors = (Get-ChildItem -Recurse src, app -Filter "*.tsx","*.ts" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Select-String "#0F172A|#1E293B|#6366F1|#8B5CF6|#94A3B8" |
  Where-Object { $_.Line -notmatch "^\s*//|^\s*\*" }).Count

Write-Host ""
Write-Host "══════════════════════════════════════════════"
Write-Host "  TRANSFORMR UI ELEVATION — QUALITY GATE"
Write-Host "══════════════════════════════════════════════"
Write-Host "TypeScript errors:     $ts $(if ($ts -eq 0) {'✅'} else {'❌'})"
Write-Host "Hardcoded colors:      $hardcoded $(if ($hardcoded -eq 0) {'✅'} else {'⚠️'})"
Write-Host "Generic grays:         $grays $(if ($grays -eq 0) {'✅'} else {'❌'})"
Write-Host "Old Slate/Indigo:      $oldColors $(if ($oldColors -eq 0) {'✅'} else {'❌'})"
Write-Host "══════════════════════════════════════════════"
```

---

## PHASE 11 — FINAL COMMIT

```powershell
cd C:\dev\transformr

git add -A
git commit -m "feat(ui): complete UI elevation — shipped product quality, photography, glass cards, progress rings, premium onboarding, subscription screen"
git push origin dev
```

---

## THE ACCEPTANCE TEST

Walk this flow on the emulator in BOTH dark and light mode:

```
1.  Cold launch → splash screen                [PREMIUM — this is the bar]
2.  Splash → onboarding carousel               [Photography, product previews, value props?]
3.  Carousel → sign up / data collection       [Glass inputs, progress bar?]
4.  Feature highlight screen                    [Icons + descriptions explaining features?]
5.  More data collection                        [Glass cards, breathing room?]
6.  Celebration / ready screen                  [Animation, excitement?]
7.  Dashboard                                   [Glass cards, progress rings, stat tiles, AI cyan?]
8.  Fitness tab                                 [Glass cards, empty state with photo?]
9.  Nutrition tab                               [Progress rings for macros?]
10. Goals tab                                   [Countdown hero, habit cards?]
11. Profile tab                                 [Settings groups, subscription card?]
12. Upgrade/subscription screen                 [Pricing cards, feature checklist, CTA?]
13. Open any modal                              [Glass treatment?]
14. View any empty list                         [Photography or illustration + motivating copy?]
15. Trigger loading state                       [Glass skeletons, not gray rectangles?]
16. Switch to light mode, repeat 1-15           [Purple-tinted, NOT generic white?]
```

**At no point should the user feel like they left the app that showed
them the splash screen. At no point should the app feel like a
developer project instead of a shipped commercial product.**

The test a real user applies: "Would I pay $15/month for this?"
If the answer is "maybe" on any screen, that screen isn't done.
The answer must be "yes, obviously" on every screen.

---

## DO NOT STOP UNTIL EVERY SCREEN PASSES THE TEST.
## PHOTOGRAPHY. GLASS CARDS. PROGRESS RINGS. FEATURE EXPLANATIONS.
## BREATHING ROOM. BRANDED LIGHT MODE. SUBSCRIPTION SCREEN.
## THIS IS A SHIPPED COMMERCIAL PRODUCT. MAKE IT LOOK LIKE ONE.
