# AGENTS.md

## Cursor Cloud specific instructions

Sage is a **mobile-first Expo (React Native) app** (`app/` = Expo Router screens) backed by
**Supabase** (Postgres + Auth + Storage + Deno Edge Functions in `supabase/`). See
`ARCHITECTURE.md`, `README.md`, `docs/BACKEND_SPEC.md`, and `TODO.md` for product/architecture
detail. Standard scripts live in `package.json` (`start`, `ios`, `android`, `web`, `typecheck`).

### What the update script does / doesn't do
The startup update script only runs `npm install`. Everything below (Docker daemon, Supabase
stack) is a **service you must start manually** each session — it is intentionally not in the
update script.

### Frontend (Expo)
- Type-check: `npm run typecheck` (`tsc --noEmit`) — passes clean.
- `npm run lint` is **not usable as-is**: `eslint` is not a dependency and there is no ESLint
  config in the repo. Rely on `npm run typecheck` for static analysis unless you add ESLint.
- **The web target (`npm run web` / `expo start --web`) crashes at boot.** `lib/supabase.ts`
  uses `expo-secure-store` for session storage, which is a native-only module with no web
  implementation here (`ExpoSecureStore.default.getValueWithKeyAsync is not a function`), so the
  app throws before rendering. This is expected for this codebase — it targets iOS/Android dev
  clients, not web. Do not "fix" it as part of unrelated work.
- No Android/iOS emulator is available (no `/dev/kvm`, iOS impossible on Linux). To validate the
  native app graph compiles, use `npx expo export --platform android` (or `ios`) — it produces a
  Hermes bundle without needing a device.
- Metro inlines `EXPO_PUBLIC_*` env vars at bundle time; **restart the dev server after editing
  `.env`** or the app keeps the old values.

### Backend (local Supabase) — required for auth/catalog/any data flow
Docker Engine and the Supabase CLI are preinstalled in the VM snapshot. If missing, reinstall
Docker (`docker`) and the Supabase CLI (`supabase`). To bring the backend up:
1. Start the Docker daemon (needs root; runs in the foreground, so background it):
   `sudo dockerd > /tmp/dockerd.log 2>&1 &` then `sudo chmod 666 /var/run/docker.sock` so the
   `ubuntu` user can reach it. Docker 29 here uses `fuse-overlayfs` with the containerd
   snapshotter disabled and `iptables-legacy` (already configured in `/etc/docker/daemon.json`).
2. `supabase start` (from repo root) boots the full stack and **auto-applies**
   `supabase/migrations/0001_initial_schema.sql`. It prints `API_URL`, `ANON_KEY`, etc. Studio
   is at `http://localhost:54323`; the mail catcher (Mailpit) at `http://localhost:54324`.
3. Local email confirmation is disabled by default, so `signUp` returns a session immediately and
   you can `signInWithPassword` right away (no inbox step needed).
4. Put the printed local values in `.env` (`cp .env.example .env` first):
   `EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321` and `EXPO_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>`.
- The schema self-creates a `profiles` row on signup (trigger `handle_new_user`), enforces the
  free-tier 25-specimen cap via trigger, and turns on RLS for every table — a signed-out client
  cannot read private `specimens` (returns `permission denied`).
- Edge Functions (`visual-check`, `stripe-webhook`, etc.) need real secrets (Anthropic/Stripe/
  RevenueCat) that are not available here; `scripts/setup.sh` targets a **cloud** Supabase
  project and expects those secrets, so it is not runnable end-to-end in this VM.

### Verifying core functionality without a GUI
Because the native GUI can't run headless, exercise the core journey (create account → log in →
add specimen → collection value) directly against the running local Supabase using the same
`@supabase/supabase-js` client and queries the screens use. This is the fastest end-to-end check.
