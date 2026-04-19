# TRANSFORMR — Configuration Lock

## LOCKED FILES — READ BEFORE WRITE, NEVER CHANGE WITHOUT TYSON APPROVAL

These files are configuration-locked. Modifying them without explicit approval
from Tyson Lerfald can break the build, OTA updates, or App Store submission.

### app.config.ts / app.json
- bundleIdentifier: com.automateai.transformr — LOCKED
- android.package: com.automateai.transformr — LOCKED
- scheme: com.automateai.transformr — LOCKED
- expo.name: TRANSFORMR — LOCKED
- Version bumps are allowed. Plugin configs require approval.

### babel.config.js
- LOCKED — Do not add, remove, or change plugins without approval

### metro.config.js
- LOCKED — Do not modify serializer, resolver, or transformer config

### package.json (scripts section)
- LOCKED — Do not modify build scripts, start scripts, or test scripts

## LOCKED VERSIONS

- Expo SDK: 53.0.23 — LOCKED, never upgrade without Tyson approval
- React Native: 0.79.6 — follows Expo SDK, LOCKED
- expo-router: ~5.1.10 — LOCKED

## LOCKED IDENTIFIERS

- iOS Bundle ID: com.automateai.transformr
- Android Package: com.automateai.transformr
- URL Scheme: com.automateai.transformr
- EAS Project: (pending — set when keys are live)
- App Store ID: (pending submission)

## PACKAGE INSTALLATION POLICY

- Package manager: npm exclusively (never pnpm, never yarn)
- Installation command: npx expo install [package] for Expo-managed packages
- NEVER install without explicit Tyson approval
- NEVER remove a package
- NEVER upgrade a package version

## AI MODEL

- All AI features use: claude-sonnet-4-20250514
- API Key: ANTHROPIC_API_KEY (server-side in Edge Functions only)
- NEVER expose ANTHROPIC_API_KEY client-side
- NEVER use openai or other AI providers

## EAS BUILD PROFILES

- eas.json is LOCKED
- NEVER trigger a build without Tyson's explicit instruction
- Build profiles: development, preview, production
