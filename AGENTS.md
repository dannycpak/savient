# AGENTS.md

Sage is a mobile-first mineral-collector app: one Expo (React Native) codebase for iOS/Android
plus a Supabase backend (Postgres + RLS in `supabase/migrations/`, Deno Edge Functions in
`supabase/functions/`). See `README.md`, `ARCHITECTURE.md`, `docs/BACKEND_SPEC.md`, and `TODO.md`
for product/architecture detail, and `.cursorrules` for non-negotiable billing/security rules.

## Cursor Cloud specific instructions

Standard commands live in `package.json` scripts; run them with `npm run <script>`.

- **Dependencies:** `npm install` (npm; `package-lock.json` is the lockfile). Installed automatically by the startup update script.
- **Typecheck:** `npm run typecheck` (`tsc --noEmit`) — works and passes.
- **Lint:** `npm run lint` maps to `eslint .`, but ESLint is **not installed and not configured**
  (no eslint dependency, no eslint config in the repo), so it fails with `eslint: not found`.
  Lint is not usable as-is; do not treat its failure as a regression.
- **Env vars:** the app reads `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (and
  optional RevenueCat keys) at boot. Copy `.env.example` → `.env` and fill values. Without a real
  Supabase project the UI still renders, but any auth/network call (login, signup) will hang/fail.

### Running the app (GUI testing in the cloud VM)

- There are **no iOS/Android simulators** in the cloud VM, so the only browser-testable surface is
  Expo web: `npx expo start --web` (Metro serves on `http://localhost:8081`). Trigger a real bundle
  compile by requesting the page; first bundle takes ~5-15s.
- **Web gotcha (important):** `expo-secure-store` is **native-only and throws on web**. It is used
  for Supabase session storage in `lib/supabase.ts` and also in `app/index.tsx` and
  `app/onboarding.tsx`. As written the app **crashes on web** at boot
  (`ExpoSecureStore.default.getValueWithKeyAsync is not a function`). To render/test in a browser you
  must temporarily shim SecureStore with a `localStorage`-backed adapter when `Platform.OS === "web"`.
  Treat this as a throwaway testing aid — do not commit it (the app targets native, not web).

### Supabase backend

- Edge Functions (`supabase/functions/*`) and the schema migration require the Supabase CLI plus
  either a linked cloud project or a local Docker stack; neither is installed by default.
- `scripts/setup.sh` is **interactive** (prompts for Anthropic/Stripe/RevenueCat secrets and
  `supabase link`) — it cannot run unattended. Secret-bearing values belong only in Edge Function
  env, never in the Expo app.
