# Journal

React + TypeScript personal journaling app (originally built from a Claude Docs handoff spec, since customized). Password-gated, behind a persistent bottom nav, light/dark mode. State persists to `localStorage` — no backend.

## Theme

Two themes, toggled from the sun/moon button next to the Home heading, persisted in `localStorage` (defaults to dark). Both share one "old-web" design (from a Claude Design handoff): a single Times New Roman stack, square-cornered 1px-bordered cards/inputs/buttons, underlined links, a yellow "NEW" badge on Home's most recent entry, and a 5-hue (not graduated) mood scale — only the color values differ:

- **Dark** — the same design, darkened: near-black background, off-white text, a brighter blue/gold/green/red mood scale and border tuned for visibility on dark backgrounds.
- **Light** — the original restyle: cream background, black text, a classic blue link color.

Everything screen/interaction/data-model-wise is identical between themes — this is a colors/fonts/shape system only (`src/tokens.css` token values per theme + shared shape rules in `src/app.css`), not a functional change. The drawing canvas stays dark in both themes on purpose (like a physical sketchpad).

## Run

```bash
npm install
npm run dev
```

## Password lock

The app shows a lock screen on every fresh open (`sessionStorage`-scoped, so it re-prompts each new session/tab but not on every reload within one). The passphrase is never stored in plaintext — only its SHA-256 digest is hardcoded (`src/components/PasswordGate.tsx`), checked client-side via the Web Crypto API. This deters casual "just open the file and read it" access; it is **not** real security — anyone with devtools access to a running session, or willing to brute-force the hash offline, can get past it. There is no backend to enforce this.

## Offline / installable

This is a PWA (`vite-plugin-pwa`, generated `sw.js` + web manifest). `npm run dev` only precaches a minimal shell — to see the real offline behavior, build and serve the production bundle:

```bash
npm run build
npm run preview
```

Open it, let it load once, then go offline (or kill the server) and reload — it keeps working from cache. On a phone, "Add to Home Screen" installs it with the app icon and no browser chrome (`display: standalone`).

## Screens

Home, Kept Words, New/Edit Entry, Entries (Calendar / Tags / All-chronological), Entry Detail, Insights, Images, and **Storage** — a general link/media/note dump: paste anything, it's timestamped and listed newest-first, with URLs auto-linkified, and tagged (with its own All/Tags toggle to filter and see per-tag counts, independent of entry tags). (This replaced an earlier "Reading" book-tracker screen entirely — no book/reading code remains.)

## Editing and deletion

Every user-created thing — quotes, journal entries, storage items, images — supports edit and/or delete via an inline confirm pattern (`ConfirmDelete`), not native browser dialogs.

## Images

- Grid view: delete controls are hidden by default (tap "Edit" to reveal them, "Done" to hide again) to keep the view clean.
- Freeform view: images support real touch gestures — one-finger drag to move, two-finger pinch to resize, two-finger twist to rotate — alongside a tap-to-select toolbar (−/+/rotate/delete) for desktop/precision use. The board grows to fit wherever images get dragged instead of clipping at a fixed height.

## What's real vs. still a stub

- Image upload uses an actual file picker → `FileReader` → stored as data URLs in `localStorage`.
- The drawing pad captures real pointer input onto a `<canvas>`, offers a full basic color palette, and rasterizes to a PNG saved with the entry.
- New Entry's placeholder rotates deterministically (tracks the last shown index) instead of picking randomly on each load.
- Calendar month arrows page real months.
- Line breaks in quotes, entries, and storage items are preserved on display (`white-space: pre-wrap`).

Assumptions:

- Quote-of-the-day is chosen randomly per calendar day, avoiding the last ~5 shown.
- Insights' "total entries" stat tile doubles as a deep link to the full Entries list; Entries also has its own "All entries" chronological link.
- No settings/account/export/notifications screens (intentionally out of scope).

Not implemented (genuinely out of scope, not decided against): real backend sync or real auth — this is local-only. Home has a Backup section (export as JSON/TXT, restore from a saved file) and the lock screen's "Forgot password?" offers the same import, or wiping to an empty log, as its only recovery paths — there's no real password reset since there's no backend.
