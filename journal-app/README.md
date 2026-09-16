# Journal

React + TypeScript implementation of the "Personal Journal App" spec (Claude Docs handoff). Dark, Georgia/Verdana, 8 screens behind a persistent bottom nav. State persists to `localStorage` — no backend.

## Run

```bash
npm install
npm run dev
```

## What's real vs. still a stub

Per the handoff doc's "Build notes," everything the mockup left decorative is wired to real logic here:

- Image upload uses an actual file picker → `FileReader` → stored as data URLs in `localStorage`.
- The drawing pad captures real pointer input onto a `<canvas>` and rasterizes to a PNG saved with the entry.
- New Entry's placeholder rotates deterministically (tracks the last shown index) instead of picking randomly on each load.
- Save/Add/Finish/Log buttons all persist to `localStorage` via `src/lib/store.tsx`.
- Calendar month arrows page real months.

Assumptions carried over from the doc's "Clarifications" section:

- Quote-of-the-day is chosen randomly per calendar day, avoiding the last ~5 shown.
- Only one book can be `status: reading` at a time; finishing it clears the slot until a new one is started from a small inline form.
- One drawing per entry.
- Insights' "total entries" stat tile doubles as the dedicated deep link to the full Entries list.
- No settings/account/export/notifications screens (intentionally out of scope).

Not implemented (genuinely out of scope, not decided against): real backend sync, auth, or export — this is local-only, matching the doc.
