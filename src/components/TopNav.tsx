import { Segmented, Button } from 'antd';
import { useStore } from '../hooks';
import { store, type Lang } from '../store';
import { actions } from '../actions';
import type { Route } from '../store';

const ROUTES: Route[] = ['home', 'search', 'random', 'bedtime', 'mystery', 'settings'];

const GitHubIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width="20"
    height="20"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

type Props = {
  tr: (key: string) => string;
};

const NEXT_LANG: Record<Lang, Lang> = { zh: 'en', en: 'zh' };
const LANG_LABEL: Record<Lang, string> = { zh: '中文', en: 'EN' };

export default function TopNav({ tr }: Props) {
  const { route, lang } = useStore((s) => ({ route: s.route, lang: s.lang }));

  const options = ROUTES.map((r) => ({
    label: tr(`nav.${r}`),
    value: r,
  }));

  const cycleLang = () => store.set({ lang: NEXT_LANG[lang] });
  const langAria = tr('label.lang_switch');

  return (
    <header className="sl-topbar">
      <span className="sl-brand" translate="no">
        <span className="sl-brand-dot" aria-hidden="true" />
        Soundlings
      </span>
      <nav className="sl-topbar-nav" aria-label="Primary">
        <Segmented<Route>
          options={options}
          value={route}
          onChange={(value) => actions.navigate(value)}
          size="middle"
        />
      </nav>
      <button
        type="button"
        className="sl-lang-toggle"
        onClick={cycleLang}
        aria-label={langAria}
        title={langAria}
      >
        <span aria-hidden="true">🌐</span>
        <span>{LANG_LABEL[lang]}</span>
      </button>
      <Button
        className="sl-icon-btn"
        type="text"
        shape="circle"
        icon={<GitHubIcon />}
        aria-label="GitHub"
        onClick={() => window.open('https://github.com/rockbenben/soundlings', '_blank', 'noopener')}
      />
    </header>
  );
}
