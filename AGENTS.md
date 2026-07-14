# AGENTS.md

Sage is a mobile-first mineral-collector app: Expo (iOS/Android) + Supabase (Postgres/RLS +
Deno Edge Functions). Read `README.md`, `ARCHITECTURE.md`, `docs/BACKEND_SPEC.md`,
`docs/STORE_SUBMISSION.md`, and `TODO.md`. `.cursorrules` encodes billing/security invariants.

## Cursor Cloud specific instructions

Standard scripts: `package.json` (`npm run typecheck`, `npm start`, `npm run web`).

- **Dependencies:** `npm install` (lockfile: `package-lock.json`).
- **Lint:** `npm run lint` fails — ESLint is not installed/configured in this repo.
- **Typecheck:** `npm run typecheck` should pass.
- **Env:** copy `.env.example` → `.env`. Without a real Supabase project, auth/network calls fail;
  UI shell can still be exercised on web with temporary SecureStore shims (do not commit those).
- **Web gotcha:** `expo-secure-store` throws on web (`lib/supabase.ts`, onboarding). Native is the
  real target; IAP + Sign in with Apple need a **dev client** (`npx expo run:ios`), not Expo Go.
- **Marketplace:** Market / Buy / Checkout are gated as “Coming soon” for first submission.
  Do not un-gate until Phase 4 (Connect + PaymentSheet) is complete.
- **Backend:** apply migrations `0001` + `0002`, deploy functions with `scripts/setup.sh` (interactive).
  Schedule `purge-deleted-accounts` daily with `CRON_SECRET`.
- **Store submit:** follow `docs/STORE_SUBMISSION.md`. Placeholders `REPLACE_WITH_*` in
  `app.json` / `eas.json` must be filled before `eas build` / `eas submit`.
