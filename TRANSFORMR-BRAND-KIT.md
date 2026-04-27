# TRANSFORMR — Brand Color System
## Vivid Purple + Deep Space
## Version 1.0 — April 2026

---

## COLOR PHILOSOPHY

Purple represents transformation, metamorphosis, and ambition. The word TRANSFORMR literally means change, and purple is the color of change. Deep space black communicates infinite potential, limitless growth, and premium quality. Together they create a UI that feels aspirational, exciting, and unmistakably different from every competitor on the market.

---

## DARK THEME (DEFAULT)

### Backgrounds — Deep Space
```
Background Primary:    #0C0A15    Main app background
Background Alt:        #08060E    Deepest layer (behind modals)
Surface:               #16122A    Cards, containers, list items
Surface Light:         #1E1838    Elevated surfaces, inputs
Surface Hover:         #271F48    Hover and pressed states
Elevated:              #2D2450    Highest elevation surfaces
```

### Text
```
Primary:               #F0F0FC    Headlines, body copy, values
Secondary:             #9B8FC0    Descriptions, labels, metadata
Muted:                 #6B5E8A    Hints, placeholders, disabled
Inverse:               #0C0A15    Text on light or accent surfaces
```

### Borders
```
Default:               #2A2248    Standard card borders
Light:                 #362C5E    Elevated borders, dividers
Focus:                 #A855F7    Focused input borders
```

### Primary — TRANSFORMR Purple
```
50:                    #F3E8FF    Lightest tint (backgrounds)
100:                   #E9D5FF
200:                   #D8B4FE
300:                   #C084FC    Light accent
400:                   #A855F7    ★ PRIMARY — actions, CTAs, active states
500:                   #9333EA    Pressed state
600:                   #7E22CE    Dark accent
700:                   #6B21A8
800:                   #581C87
900:                   #3B0764    Deepest shade
Dim:                   rgba(168,85,247,0.12)    Background tint
Glow:                  rgba(168,85,247,0.25)    Box shadow glow
```

### Secondary — Partner Pink
```
Default:               #EC4899    Partner features, couples mode
Dim:                   rgba(236,72,153,0.12)    Background tint
```

### Semantic Colors
```
Success:               #10B981    Completed, gains, positive trends
Success Dim:           rgba(16,185,129,0.12)
Warning:               #F59E0B    Attention, approaching limits
Warning Dim:           rgba(245,158,11,0.12)
Danger:                #EF4444    Missed, broken, overdue, errors
Danger Dim:            rgba(239,68,68,0.12)
Info:                  #3B82F6    Informational, protein, data
Info Dim:              rgba(59,130,246,0.12)
```

### Feature Colors
```
Fire:                  #F97316    Streaks, energy, urgency
Fire Dim:              rgba(249,115,22,0.12)
Gold:                  #EAB308    Achievements, milestones, revenue
Gold Dim:              rgba(234,179,8,0.12)
Cyan:                  #22D3EE    AI features, technology, water
Cyan Dim:              rgba(34,211,238,0.12)
Pink:                  #EC4899    Partner, couples, relationship
Pink Dim:              rgba(236,72,153,0.12)
```

---

## LIGHT THEME

### Backgrounds
```
Background Primary:    #FFFFFF
Background Secondary:  #FAF9FC
Surface:               #F3F1F8
Surface Light:         #EBE8F2
Input:                 #F3F1F8
```

### Text
```
Primary:               #0C0A15
Secondary:             #5B4F7A
Muted:                 #9B8FC0
Inverse:               #F0F0FC
```

### Accent colors remain the same in both themes.

---

## TYPOGRAPHY

### Font Families
```
Heading:     SF Pro Display / Inter
Body:        SF Pro Text / Inter
Data:        SF Mono / JetBrains Mono (ALL numeric displays)
```

### Type Scale
```
Hero:        32px / 700 / 38px line height
H1:          24px / 700 / 30px line height
H2:          20px / 600 / 26px line height
H3:          17px / 600 / 22px line height
Body:        15px / 400 / 22px line height
Body Bold:   15px / 600 / 22px line height
Caption:     13px / 400 / 18px line height
Caption Bold:13px / 600 / 18px line height
Stat Large:  28px / 700 / monospace
Stat Small:  20px / 600 / monospace
Countdown:   36px / 800 / monospace
Tiny:        11px / 500 / 14px line height
```

### Rule: All numeric data uses monospace
Weights, calories, percentages, streaks, countdowns, rep counts, set numbers, prices, revenue figures, step counts, water ounces, sleep hours — every number the user sees must render in SF Mono or JetBrains Mono.

---

## SPACING & LAYOUT

### Spacing Scale
```
xs:    4px     Icon internal gaps
sm:    8px     Inline element spacing
md:    12px    Compact card padding
lg:    16px    Standard card padding, section gaps
xl:    20px    Generous card padding
xxl:   24px    Section spacing
xxxl:  32px    Page margins, major section breaks
```

### Border Radius
```
sm:    8px     Badges, pills, small elements
md:    12px    Cards, inputs, buttons
lg:    16px    Large cards, modals
xl:    20px    Bottom sheets
full:  9999px  Avatars, circular elements
```

### Touch Targets
Minimum 44pt on ALL interactive elements (Apple HIG compliance)

---

## COMPONENT PATTERNS

### Buttons
```
Primary:     bg #A855F7, text #FFFFFF, shadow 0 4px 20px rgba(168,85,247,0.25)
Secondary:   bg rgba(168,85,247,0.12), text #A855F7, border 1px solid rgba(168,85,247,0.25)
Tertiary:    bg transparent, text #9B8FC0, border 1px solid #2A2248
Destructive: bg #EF4444, text #FFFFFF
```

### Cards
```
Standard:    bg #16122A, border 1px solid #2A2248, radius 14px
Highlighted: bg #16122A, border 2px solid #A855F7, shadow 0 0 20px rgba(168,85,247,0.25)
Gradient:    bg linear-gradient(135deg, #16122A, #1a1145), border 1px solid rgba(168,85,247,0.25)
Status:      bg [semantic color dim], border 1px solid [semantic color 30% opacity]
```

### Badges & Pills
```
Background:  [color]12 (12% opacity tint)
Text:        [full color]
Font:        11px / 600 weight
Padding:     5px 12px
Radius:      8px
```

### Progress Bars
```
Track:       #1E1838 (surface light)
Fill:        [semantic color for the metric]
Height:      6px
Radius:      3px
```

### Progress Rings
```
Track:       #2A2248 (border)
Fill:        [semantic color]
Width:       5px stroke
Linecap:     round
```

---

## FEATURE COLOR MAPPING

| Feature | Color | Hex |
|---------|-------|-----|
| Primary actions, CTAs | TRANSFORMR Purple | #A855F7 |
| Partner, couples | Partner Pink | #EC4899 |
| Completed, gains | Success Green | #10B981 |
| Streaks, fire chain | Fire Orange | #F97316 |
| Achievements, PRs | Gold | #EAB308 |
| AI features, tech | Cyan | #22D3EE |
| Protein, data values | Info Blue | #3B82F6 |
| Warnings, limits | Warning Amber | #F59E0B |
| Missed, errors | Danger Red | #EF4444 |
| Sleep, recovery | Purple Light | #C084FC |
| Water, hydration | Cyan | #22D3EE |
| Revenue, money | Gold | #EAB308 |
| Readiness: go hard | Success Green | #10B981 |
| Readiness: moderate | Warning Amber | #F59E0B |
| Readiness: recover | Danger Red | #EF4444 |

---

## BRAND VOICE

### Tone Attributes
- **Direct** — No fluff. Say what needs to be said. Respect the user's time.
- **Data,driven** — Every claim backed by the user's own numbers. No generic advice.
- **Motivating** — Firm but never harsh. Push without breaking. Celebrate without being cheesy.
- **Honest** — If something isn't working, say it. Users trust truth over comfort.

### Tagline
"Transform Everything"

### Voice Examples
```
Notification:  "You're 40g short on protein. Grab a shake."
Achievement:   "New PR unlocked. The old you didn't stand a chance."
Weekly grade:  "This week: 4 workouts, 19,600 calories, 3 PRs. Grade: A."
Warning:       "You've been under 2,400 cal for 5 days. Your weight will stall."
Streak:        "12,day streak. Don't let Day 13 be the one you skip."
Partner nudge: "Your partner just finished leg day. Your move."
AI coaching:   "Your bench has stalled 3 weeks. Switching to pause reps this week."
```

---

## APP ICON

### Design
- Geometric hexagonal prism representing the multiple dimensions of life (fitness, nutrition, business, habits, mindset, relationships) unified into one structure
- Inner faceted core suggests AI intelligence at the center
- Gradient: #7E22CE → #A855F7 → #EC4899 (purple,to,pink, conveying transformation and energy)
- Clean white linework on the gradient background
- 1024x1024 source, rendered at all required sizes

### Splash Screen
- Background: #0C0A15 (deep space)
- Centered app icon with subtle purple glow
- "TRANSFORMR" wordmark below in #F0F0FC, letter,spacing: 4px

---

## USAGE RULES

### Do
- Use purple (#A855F7) as the primary action color on every screen
- Use monospace font for ALL numeric data
- Use deep space backgrounds (#0C0A15) as the default
- Use semantic colors consistently
- Use the purple glow on featured or active cards only
- Use 12,16px border radius on all containers
- Use pink exclusively for partner features
- Use cyan exclusively for AI feature indicators
- Always show skeleton loading states
- Minimum 44pt touch targets

### Do Not
- Use purple for destructive actions (use red)
- Use light backgrounds as default (dark mode is primary)
- Use proportional fonts for numbers
- Mix semantic color meanings
- Use more than 2 accent colors on a single card
- Use sharp corners on any UI element
- Show blank screens during loading
- Use generic system fonts outside the defined scale
- Apply purple glow to every card
- Make touch targets smaller than 44pt

---

*TRANSFORMR Brand Color System v1.0 — Automate AI LLC*
