# Sage — Legal copy for soft launch

This is the product-ready framing for counsel review. **Ship Visual Check only after a legal sign-off.**

## Visual Check disclaimer (in-app)

Canonical string lives in `constants/copy.ts` as `VISUAL_CHECK_DISCLAIMER`:

> Visual Check is a second opinion based on a photo — not a certified authentication, appraisal, or guarantee of identity, treatment status, or value.

### Framing rules (non-negotiable product policy)
- Always show the disclaimer on the Visual Check **result** screen (already wired).
- Never use words like “certified”, “authenticated”, “guaranteed ID”, or “appraisal” in CTAs or result headlines.
- Prefer “Most likely”, “Watch out for”, “Typical price” — second-opinion language.
- Free / paid copy must not imply lab verification.

### Counsel checklist
- [ ] Disclaimer reviewed for US (and launch markets) consumer / false-advertising risk
- [ ] Confirm AI output disclaimers are sufficient for mineral ID + price-range content
- [ ] Confirm soft-delete + 30-day purge language matches Privacy Policy
- [ ] Confirm photo processing (EXIF stripped; private storage) described accurately

## Account deletion (App Store)

UI: Account → Delete account. Behavior:
1. `soft_delete_account` sets `profiles.deleted_at` and `purge_after = now() + 30 days`
2. Client signs out globally; `AuthProvider` rejects sessions when `deleted_at` is set
3. Daily cron hits `purge-deleted-accounts` with `CRON_SECRET` to delete auth user + storage

## Hosted policies

In-app screens (and later public URLs) live at:
- Privacy Policy — `/legal/privacy` (source: `docs/PRIVACY.md`)
- Terms of Use — `/legal/terms` (source: `docs/TERMS.md`)

Replace the placeholder company entity / contact email before public launch.
