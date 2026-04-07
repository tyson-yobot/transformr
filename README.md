# TRANSFORMR

> Every rep. Every meal. Every dollar. Every day.

The world's most complete AI-powered life transformation platform. 35 features. 15+ industry firsts. Built with React Native, Expo, Supabase, and Claude AI.

## Owned By

**Automate AI LLC** | Repository: `tyson-yobot/transformr`

## Tech Stack

- **Runtime:** Node.js 20.19.4
- **Frontend:** React Native + Expo SDK 52 + TypeScript (strict)
- **Navigation:** Expo Router v4 (file-based)
- **State:** Zustand + TanStack React Query
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Payments:** Stripe
- **Music:** Spotify
- **CI/CD:** EAS Build + EAS Submit

## Features (35)

### AI-Powered (15)
1. AI Meal Camera — snap food, auto-log macros
2. AI Form Check — video analysis of exercise form
3. AI Adaptive Programming — workout program rewrites itself
4. AI Life Trajectory Simulator — see two futures
5. AI Progress Photo Analysis — visual body composition
6. AI Workout Narrator — personal trainer in your earbuds
7. AI Body-Business Correlation — proof that health = wealth
8. AI Context-Aware Motivation — personalized, data-driven
9. AI Sleep Optimizer — sleep pattern analysis
10. AI Supplement Advisor — evidence-based recommendations
11. AI Smart Grocery Lists — auto-generated weekly lists
12. AI Batch Meal Prep Planner — couples-aware meal prep
13. AI Journaling + Reflection — intelligent prompts and insights
14. AI Restaurant Menu Scanner — best macro choices anywhere
15. Voice Command Everything — fully hands-free

### Platform (20)
16. Ghost Mode Training — race your past self
17. Couples Live Sync Workout — real-time dual training
18. Stake Goals — put real money on the line
19. Apple Watch Companion
20. Daily Readiness Score
21. NFC + Geofence Triggers
22. Auto-Generated Social Content
23. Live Home Screen Widgets
24. Barcode Food Scanner
25. Mood-Performance Correlation
26. Injury Prevention + Pain Tracker
27. Deep Work Focus Mode
28. Spotify Workout Integration
29. Siri + Google Assistant Shortcuts
30. Community Challenges + Leaderboards
31. AI Vision Board + Goal Cinema
32. Personal Finance Tracker
33. Drag-and-Drop Dashboard Builder
34. Skill + Knowledge Tracker
35. Guided Mobility + Recovery

## Getting Started

```bash
# Clone
git clone https://github.com/tyson-yobot/transformr.git
cd transformr

# Use correct Node version
nvm use

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in your keys

# Start Supabase locally
npm run supabase:start

# Run migrations
npm run supabase:migrate

# Start the app
npm run mobile
```

## Project Structure

```
transformr/
├── apps/mobile/          # React Native Expo app
│   ├── app/              # Expo Router (file-based routes)
│   ├── components/       # Reusable UI components
│   ├── services/         # API & business logic
│   ├── stores/           # Zustand state management
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Helpers & formatters
│   ├── types/            # TypeScript types
│   └── theme/            # Design system
├── supabase/
│   ├── migrations/       # Database migrations
│   ├── functions/        # Edge Functions (AI, crons, webhooks)
│   └── seed.sql          # Initial data
├── watch/                # Apple Watch companion
└── widgets/              # Home screen widgets
```

## Branch Strategy

- `main` — Production releases only
- `dev` — Active development (default branch)
- Feature branches from `dev`: `feature/workout-player`, `feature/meal-camera`, etc.

## License

Proprietary — Automate AI LLC. All rights reserved.
