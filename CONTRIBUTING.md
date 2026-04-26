# Contributing

Soundlings is React 19 + Ant Design 6 + Vite + TypeScript. Built `dist/` is
plain static files (deployable anywhere); during development you need Node 20+.

## Local development

```bash
npm install
npm run dev          # http://localhost:5173, HMR on
npm run typecheck    # strict TS, must be clean
npm run build        # production bundle into dist/
npm run preview      # serve dist/ locally
```

## Project layout

See `README.md`. The two folders most contributors touch:

- `public/assets/manifest.json` — to add or rename sounds (drop the mp3 in
  `public/assets/audio/<category>/`)
- `src/pages/` and `src/components/` — to tweak how something looks or behaves

## Code style

- TypeScript `strict: true`. No `any`. Prefer `unknown` if you must.
- Functional React components. Subscribe to the store with the `useStore(selector)`
  hook from `src/hooks.ts` and **always pass a selector** that returns the
  smallest slice you need — this is how we keep re-renders tight.
- Theme tokens live in `src/theme.ts`. Don't introduce arbitrary inline colors;
  if you need a new color, add it to the token table.
- Hard rule: UI never instantiates `new Audio(...)`. All sound goes through
  `actions.playSound() / actions.stopAll() / actions.toggleLoop()`. The one
  exception is Mystery, which calls `player.playRaw()` to bypass the store.
- 2-space indent, `const` by default. Commit messages: `area: short imperative`
  (`feat:`, `fix:`, `core:`, `ui:`, `docs:`, `chore:`, `test:`).

## Pre-PR checklist

- [ ] `npm run typecheck` — clean
- [ ] `npm run build` — succeeds (chunk warnings tolerated up to ~700 KB
      because of antd; investigate anything new beyond that)
- [ ] `npm run dev` — exercised the changed feature in a browser
- [ ] If you added audio: `npm run audio:audit` (clean) and
      `npm run audio:credits` (regenerated `CREDITS.md`)

## Adding a sound

Audio files in `public/assets/audio/` are mostly CC0 from Freesound (one is
CC BY 4.0, see `CREDITS.md`). `scripts/` has helpers to fetch and normalize
new files (Python). The five-step contract:

1. Drop the mp3 in `public/assets/audio/<category>/` (mono, 44.1 kHz,
   128 kbps; `bash scripts/normalize_loudness.sh` does this).
2. Add a per-file entry in `public/assets/LICENSES.json` with `name`,
   `attribution`, and `url`. Prefer **CC0 1.0**; **CC BY 4.0** is allowed.
   **Never** add CC BY-SA / CC BY-NC / CC BY-ND — incompatible with MIT.
3. Add a preset / variant in `public/assets/manifest.json`. The variant's
   `license` field MUST reference the new LICENSES key.
4. `npm run audio:audit` — must pass. CI re-runs this and will reject the PR
   on any violation.
5. `npm run audio:credits` — refreshes `CREDITS.md`. Commit it. CI also
   verifies that the file is in sync with `LICENSES.json`.

## Adding a language

1. Create `src/i18n/<code>.json` with every key from `src/i18n/en.json`
   (interpolation tokens like `{n}` / `{q}` / `{total}` MUST stay intact).
2. Wire the new code into `src/i18n/index.ts` (`DICTS`, `ANTD_LOCALES`),
   `src/store.ts` (`Lang` type), and `src/components/TopNav.tsx`
   (`NEXT_LANG`, `LANG_LABEL`).
3. Optionally translate per-sound labels in `public/assets/manifest.json`
   under `presets[*].labels.<code>`.
