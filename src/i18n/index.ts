import en from './en.json';
import zh from './zh.json';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import type { Lang } from '../store';

const DICTS: Record<Lang, Record<string, string>> = { en, zh };

export function t(key: string, lang: Lang): string {
  return DICTS[lang]?.[key] ?? key;
}

/**
 * Hook-friendly translator: bind once with the active language.
 * Usage:
 *   const tr = makeT(lang);
 *   tr('nav.home')
 *   tr('search.no_match', { q: 'piano' })   // → "No sounds match \"piano\""
 *
 * Interpolation replaces every `{name}` with `String(vars[name])`. Missing
 * keys fall back to the key itself (so the surface still tells you which
 * lookup failed).
 */
export function makeT(lang: Lang) {
  const dict = DICTS[lang] ?? {};
  return (key: string, vars?: Record<string, string | number>): string => {
    const raw = dict[key] ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, k: string) =>
      vars[k] === undefined ? `{${k}}` : String(vars[k]),
    );
  };
}

export const ANTD_LOCALES = { en: enUS, zh: zhCN };
