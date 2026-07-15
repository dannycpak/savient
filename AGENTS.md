# AGENTS.md

Sage is a mobile-first mineral-collector app: one Expo (React Native) codebase for iOS/Android
plus a Supabase backend (Postgres + RLS in `supabase/migrations/`, Deno Edge Functions in
`supabase/functions/`). See `README.md`, `ARCHITECTURE.md`, `docs/BACKEND_SPEC.md`,
`docs/STORE_SUBMISSION.md`, and `TODO.md` for product/architecture detail, and `.cursorrules`
for non-negotiable billing/security rules.

## Cursor Cloud specific instructions

Standard commands live in `package.json` scripts; run them with `npm run <script>`.

- **Dependencies:** `npm install` (npm; `package-lock.json` is the lockfile). Installed automatically by the startup update script.
- **Typecheck:** `npm run typecheck` (`tsc --noEmit`) — works and passes.
- **Lint:** `npm run lint` maps to `eslint .`, but ESLint is **not installed and not configured**
  (no eslint dependency, no eslint config in the repo), so it fails with `eslint: not found`.
  Lint is not usable as-is; do not treat its failure as a regression.
- **Env vars:** the app reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (and
  optional RevenueCat / Google OAuth keys) at boot. Copy `.env.example` → `.env` and fill values.
  Without a real Supabase project the UI shell can still be exercised (placeholder `.env` is fine);
  auth / Visual Check / IAP / store submit will not work end-to-end until real credentials exist.
  Do not treat missing secrets as a setup failure for lint/typecheck/UI work.

### Running the app (GUI testing in the cloud VM)

- There are **no iOS/Android simulators** in the cloud VM, so the only browser-testable surface is
  Expo web: `npx expo start --web` (Metro serves on `http://localhost:8081`, not 8083). Trigger a
  real bundle compile by requesting the page; first bundle takes ~5-15s.
- **Web storage:** use `lib/storage.ts` (SecureStore on native, `localStorage` on web). Do not call
  `expo-secure-store` directly — it has no web implementation.
- **Native target:** IAP + Sign in with Apple need a **dev client** (`npx expo run:ios` /
  `npx expo run:android`), not Expo Go. This Linux VM cannot prove native catalog E2E.

### Supabase backend

- Soft-launch runbook: `docs/SOFT_LAUNCH.md`.
- Local: `supabase start` then `supabase functions serve --env-file supabase/.env.local --no-verify-jwt`.
  Verify with `scripts/verify-local-backend.sh`.
- Cloud project `sage`: verify with `scripts/verify-cloud-backend.sh`
  (needs `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, keys under `~/.config/sage/`).
  Deploy: `./scripts/deploy-cloud.sh` after `supabase link`.
- Live RPC arg names are `p_user` (not `p_user_id`) — keep Edge Functions aligned.
- `scripts/setup.sh` is interactive. Schedule `purge-deleted-accounts` daily with `CRON_SECRET`.
- In-app legal: `/legal/privacy`, `/legal/terms`. Counsel checklist: `docs/LEGAL.md`.

### Store submission

- Marketplace Buy / Checkout are gated as “Coming soon” for the first submission. Do not un-gate
  until Phase 4 (Connect + PaymentSheet) is complete. Market can show demo listing cards for visual
  parity with the approved offline prototype when live listings are empty.
- Follow `docs/STORE_SUBMISSION.md`. Placeholders `REPLACE_WITH_*` in `app.json` / `eas.json` must
  be filled before `eas build` / `eas submit`.

### UI / design system

- Tokens live in `constants/theme.ts` (canvas `#F5F2EB`, pill radius, on-dark palette). Shared
  primitives in `components/ui.tsx`; mineral gradients in `components/Swatch.tsx`.
- Tab bar: Home / Collection / elevated Check FAB / Market / Profile (`app/(tabs)/_layout.tsx`).
- Visual reference: the approved offline Sage prototype HTML (Instrument Serif/Sans, dark Check +
  Paywall, swatch heroes).
