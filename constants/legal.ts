/** In-app legal content. Full counsel-ready drafts: docs/PRIVACY.md, docs/TERMS.md, docs/LEGAL.md */

export const PRIVACY_SECTIONS = {
  updated: "2026-07-15",
  blocks: [
    {
      title: "What we collect",
      body: "Account email and display name; specimen catalog data; photos you upload for catalog or Visual Check; purchase entitlements via Apple/Google and RevenueCat. We do not intentionally collect GPS — photos are re-encoded on-device to strip EXIF/GPS before upload.",
    },
    {
      title: "How we use it",
      body: "To run Sage (catalog, Visual Check, account, entitlements), secure the service, and communicate about your account. Visual Check sends submitted images to our servers and Anthropic solely to produce a second-opinion result stored in your account.",
    },
    {
      title: "Sharing",
      body: "We use processors such as Supabase (auth/database/storage), Anthropic (vision inference), and RevenueCat / Apple / Google (digital purchases). We do not sell your personal information.",
    },
    {
      title: "Retention & deletion",
      body: "Data is kept while your account is active. Account deletion soft-deletes immediately and permanently purges within 30 days (auth user and private storage objects).",
    },
    {
      title: "Contact",
      body: "privacy@sage.app — replace with your legal entity contact before public launch. Full policy text: docs/PRIVACY.md in the repo.",
    },
  ],
} as const;

export const TERMS_SECTIONS = {
  updated: "2026-07-15",
  blocks: [
    {
      title: "Visual Check is not authentication",
      body: "Visual Check is informational only — not certified authentication, appraisal, lab analysis, or a guarantee of species, treatment, locality, or value. You are responsible for purchase decisions. The in-app disclaimer appears on every result.",
    },
    {
      title: "Accounts & deletion",
      body: "Keep credentials secure. Delete your account anytime in Account settings; purge completes within 30 days.",
    },
    {
      title: "Digital goods",
      body: "Sage+ and Visual Check credit packs are sold through Apple App Store / Google Play and managed with RevenueCat. Platform billing terms apply.",
    },
    {
      title: "As-is / liability",
      body: "Sage is provided as is. AI outputs may be wrong or incomplete. To the fullest extent permitted by law, Sage is not liable for losses from decisions based on Visual Check or catalog valuations.",
    },
    {
      title: "Contact",
      body: "support@sage.app — replace with your legal entity contact before public launch. Full terms: docs/TERMS.md in the repo.",
    },
  ],
} as const;
