---
name: Translation contribution
about: Add or update a language
labels: enhancement, i18n
---

**Language / locale code**
e.g. `ja` (Japanese), `de` (German), `es` (Spanish).

**JSON file attached?**
Paste the contents of `src/i18n/<code>.json` (or link to your branch).

---

Reminders:
- Copy every key from `src/i18n/en.json` and translate the value.
- Per-sound labels live in `public/assets/manifest.json` under
  `presets[*].labels.<code>`. Add the new code there too if you want
  sound names to appear in your language.
- Wire the new code into `src/i18n/index.ts` (`DICTS`, `ANTD_LOCALES`),
  `src/store.ts` (`Lang` type), and `src/components/TopNav.tsx`
  (`NEXT_LANG`, `LANG_LABEL` for the navbar 🌐 toggle).
- `npm run typecheck` must be clean before opening the PR.
