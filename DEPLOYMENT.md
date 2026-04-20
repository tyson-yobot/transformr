# TRANSFORMR — Deployment Pipeline

## Branch Strategy

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `dev`  | Active development, all feature work | Nothing (local only) |
| `main` | Production releases — backup of dev | App Store + Google Play via EAS |

## Workflow

### Daily Development
1. All work happens on `dev`
2. Commit frequently with descriptive messages
3. Push to `origin/dev` regularly

### Syncing main as Backup
After completing a stable milestone on `dev`:
```bash
git checkout main
git merge dev --ff-only
git push origin main
git checkout dev
```
If main has diverged:
```bash
git checkout main
git reset --hard dev
git push origin main --force-with-lease
git checkout dev
```

### Production Release
1. Verify `dev` is clean:
   ```bash
   cd apps/mobile
   npx tsc --noEmit --pretty
   ```
   Must be 0 errors.

2. Merge dev into main:
   ```bash
   git checkout main
   git merge dev --ff-only
   git push origin main
   git checkout dev
   ```

3. Trigger EAS build + submit (Tyson's decision only):
   ```bash
   cd apps/mobile
   eas build --platform all --profile production --auto-submit
   ```

## EAS Configuration

- **Config file:** `apps/mobile/eas.json`
- **Bundle ID (iOS):** `com.automateai.transformr`
- **Package name (Android):** `com.automateai.transformr`
- **Production profile:** `eas.json` → `production`
- **iOS distribution:** App Store Connect via ASC API key
- **Android distribution:** Google Play via service account JSON key

## Automated Deployment (Future — GitHub Actions)

> **DO NOT create this file yet.** Tyson must configure EAS credentials first.

When ready, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to App Stores

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        working-directory: apps/mobile
        run: npx tsc --noEmit

      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build and submit
        working-directory: apps/mobile
        run: eas build --platform all --profile production --auto-submit --non-interactive
```

### Prerequisites Before Enabling the GitHub Action
1. Generate EXPO_TOKEN: `eas login` → account Settings → Access Tokens
2. Add as GitHub secret: Repo → Settings → Secrets and Variables → Actions → `EXPO_TOKEN`
3. Configure iOS credentials: `eas credentials` (App Store Connect API key)
4. Configure Android credentials: `eas credentials` (Google Play service account JSON)
5. Both stores must have the app entry created with at least one manual build uploaded

## Rollback

If a production build has critical issues:
1. **Do NOT revert main**
2. Fix on `dev` → test → merge to `main` → rebuild
3. Submit new build to both stores — both support expedited review for critical fixes
4. App Store: request expedited review via Resolution Center
5. Google Play: staged rollout can be halted immediately in Play Console

## First Manual Upload Checklist (iOS + Android)

Before automated deploys work, both stores need an app entry:

**App Store Connect:**
- [ ] Create app entry at appstoreconnect.apple.com
- [ ] Upload first build manually via Xcode or Transporter
- [ ] Complete app metadata (description, screenshots, age rating)
- [ ] Submit for initial review

**Google Play Console:**
- [ ] Create app entry at play.google.com/console
- [ ] Upload first AAB via internal testing track
- [ ] Complete store listing (description, screenshots, content rating)
- [ ] Promote to production when ready
