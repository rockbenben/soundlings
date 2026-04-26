# Soundlings

A 100% offline, zero-tracking sound board for kids 3–10.
**React 19 + Ant Design 6 + Vite + TypeScript**.
Warm orange palette, large rounded controls, kid-first ergonomics.
**89 audio assets** across 6 categories (vehicles, animals, ambience,
household, instruments, nature) — every file is open-licensed.

## Quick start

```bash
git clone https://github.com/rockbenben/soundlings && cd soundlings
npm install
npm run dev          # http://localhost:5173
```

Build for production:

```bash
npm run build        # → dist/
npm run preview      # serve dist/ locally
```

## Features

- 6 categories, tap to play, long-press multi-variant cards for the
  variant menu (subtle dot row hints when a card has multiple variants)
- Search across labels (zh + en), iconKey, and category
- Three modes:
  - **Random** — continuous shuffle, animated dice hero
  - **Bedtime** — loop an ambience sound + sleep timer (15 / 30 / 60 min)
  - **Mystery** — guess-the-sound quiz with score chip
- Sleep timer (5 / 15 / 30 / 60 min) with mm:ss countdown badge
- Themes: light / dark / auto (Settings)
- 中文 / English (one-tap 🌐 toggle in the top nav)
- Skip-to-content, `prefers-reduced-motion`, `prefers-contrast: more`

## Repository layout

```
index.html              — Vite entry
package.json            — npm scripts (build / typecheck / audio:audit / audio:credits)
vite.config.ts          — base="./" so the build is portable to any subpath

src/
  main.tsx              — boots: catalog.load() → React render
  App.tsx               — ConfigProvider (theme + locale) + Layout
  theme.ts              — antd theme tokens (warm orange, large radii)
  store.ts              — reactive vanilla singleton (framework-agnostic)
  player.ts             — HTMLAudioElement wrapper
  catalog.ts            — manifest loader + search
  actions.ts            — playSound / stopAll / toggleLoop / navigate (the only playback entry)
  icons.ts              — emoji per iconKey
  hooks.ts              — useStore() over useSyncExternalStore
  i18n/                 — en.json + zh.json + antd locale wiring
  components/           — TopNav, SoundCard, NowPlayingBar, SleepTimerButton, VariantMenu
  pages/                — Home, Search, Random, Bedtime, Mystery, Settings
  styles.css            — design tokens + bespoke card / now-playing styles

public/assets/
  manifest.json         — preset catalog (90+ variants)
  LICENSES.json         — per-file source + license metadata (machine-readable)
  audio/<category>/*.mp3
  icon/                 — favicon + PWA app_icon

scripts/                — Python + bash maintenance tools (see table below)
.github/                — workflows + issue / PR templates
```

## npm scripts

| Script | What |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc -b` then `vite build` → `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run audio:audit` | License compliance check (CI gate) |
| `npm run audio:credits` | Regenerate `CREDITS.md` from `LICENSES.json` |
| `npm run audio:health` | Audio file health (duration, mean dB, silence) |

## scripts/

| File | Purpose |
|---|---|
| `audit_licenses.py` | Enforces the 4 license invariants. Run by CI. |
| `generate_credits.py` | Renders `CREDITS.md` from `LICENSES.json`. |
| `audit_audio.py` | Reports per-file duration / loudness / silence. |
| `verify_matches.py` | Heuristic tag check — flags wrong-source files. |
| `fetch_freesound.py` | Bulk fetch CC0 sounds from Freesound (`FREESOUND_TOKEN`). |
| `replace_by_id.py` | Swap one or more files by Freesound ID. |
| `normalize_loudness.sh` | Re-encode every mp3 to mono 44.1 kHz 128 kbps, –10 LUFS. |

## Adding a sound

1. Drop a normalized mp3 into `public/assets/audio/<category>/`
   (mono, 44.1 kHz, 128 kbps; `scripts/normalize_loudness.sh` does this).
2. Add a per-file entry in `public/assets/LICENSES.json` with `name`,
   `attribution`, `url`. Prefer **CC0 1.0**; **CC BY 4.0** is allowed.
3. Append a preset / variant in `public/assets/manifest.json`. The variant's
   `license` field must reference the new LICENSES key.
4. Add an emoji for the new `iconKey` in `src/icons.ts` (otherwise: 🔊 fallback).
5. `npm run audio:audit && npm run audio:credits` — both must succeed.

## Privacy

No network calls beyond loading the site's own static assets. No analytics.
No SDKs. localStorage holds only `lang` and `theme`. See [`PRIVACY.md`](PRIVACY.md).

## License

Code: **MIT** (see [`LICENSE`](LICENSE)).

Audio: **88 × CC0 1.0** + **1 × CC BY 4.0** (`rainy_night.mp3` — attributed
to *newlocknew* on Freesound). Per-file machine-readable metadata is in
`public/assets/LICENSES.json`; human-readable credits in [`CREDITS.md`](CREDITS.md),
surfaced inside the app at **Settings → Audio credits**.

The 4 license invariants enforced by `scripts/audit_licenses.py` (CI gate):

1. Every manifest variant references a license key that exists in `LICENSES.json`.
2. `LICENSES.json` has no orphan entries.
3. No incompatible families (CC BY-SA / CC BY-NC / CC BY-ND).
4. Every non-CC0 entry carries `attribution` and `url`.

## Browser support

The build targets `es2022`. That covers Chrome 94+, Edge 94+, Safari 16.4+,
and Firefox 93+ — every browser that supports `await` at the module top
level. Older browsers will display the `<noscript>` fallback or fail to load
the bundle entirely.

## Bundle layout

The Vite build emits two JS chunks:

| Chunk | Contents | Size (gzip) | Cache horizon |
|---|---|---|---|
| `antd-*.js` | Ant Design 6 + React (pulled in as peer dep) + antd locales | ~190 KB | rarely changes |
| `index-*.js` | Soundlings app code | ~15 KB | every release |

Splitting like this means bumping a sound or fixing a UI bug only invalidates
the small app chunk — users keep the cached antd bundle.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy-web.yml`, which runs the
license audit, type-checks, builds, and publishes `dist/` to the `gh-pages`
branch.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).
