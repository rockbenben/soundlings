import { Segmented } from 'antd';
import { useStore } from '../hooks';
import { store, type ThemeMode } from '../store';
import { makeT } from '../i18n';

export default function SettingsPage() {
  const { lang, theme } = useStore((s) => ({ lang: s.lang, theme: s.theme }));
  const tr = makeT(lang);

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: `☀️ ${tr('settings.theme.light')}`, value: 'light' },
    { label: `🌙 ${tr('settings.theme.dark')}`, value: 'dark' },
    { label: `🌓 ${tr('settings.theme.auto')}`, value: 'auto' },
  ];

  const themeHint = tr('settings.theme.hint');
  const langHint = tr('settings.language.hint');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-5)', paddingTop: 'var(--sl-space-2)' }}>
      <div className="sl-page-head">
        <h2 className="sl-page-title">⚙️ {tr('nav.settings')}</h2>
      </div>

      <section className="sl-settings-card">
        <header className="sl-settings-head">
          <span className="sl-settings-icon" aria-hidden="true">🎨</span>
          <div>
            <h3 className="sl-settings-title">{tr('settings.theme')}</h3>
            <p className="sl-settings-hint">{themeHint}</p>
          </div>
        </header>
        <Segmented<ThemeMode>
          options={themeOptions}
          value={theme}
          onChange={(value) => store.set({ theme: value })}
          size="large"
          block
        />
      </section>

      <section className="sl-settings-card">
        <header className="sl-settings-head">
          <span className="sl-settings-icon" aria-hidden="true">🌐</span>
          <div>
            <h3 className="sl-settings-title">{tr('settings.language')}</h3>
            <p className="sl-settings-hint">{langHint}</p>
          </div>
        </header>
      </section>

      <section className="sl-settings-card">
        <header className="sl-settings-head">
          <span className="sl-settings-icon" aria-hidden="true">ℹ️</span>
          <div>
            <h3 className="sl-settings-title">{tr('about.title')}</h3>
            <p className="sl-settings-hint">{tr('settings.about_subtitle')}</p>
          </div>
        </header>
        <a className="sl-about-row" href="CREDITS.md" target="_blank" rel="noopener noreferrer">
          <span className="sl-about-emoji" aria-hidden="true">🎵</span>
          <span>{tr('about.credits')}</span>
          <span className="sl-about-arrow" aria-hidden="true">→</span>
        </a>
        <a className="sl-about-row" href="PRIVACY.md" target="_blank" rel="noopener noreferrer">
          <span className="sl-about-emoji" aria-hidden="true">🔒</span>
          <span>{tr('about.privacy')}</span>
          <span className="sl-about-arrow" aria-hidden="true">→</span>
        </a>
        <a className="sl-about-row" href="LICENSE" target="_blank" rel="noopener noreferrer">
          <span className="sl-about-emoji" aria-hidden="true">📄</span>
          <span>{tr('about.license')}</span>
          <span className="sl-about-arrow" aria-hidden="true">→</span>
        </a>
        <a
          className="sl-about-row"
          href="https://github.com/rockbenben/soundlings"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="sl-about-emoji" aria-hidden="true">⭐</span>
          <span>GitHub</span>
          <span className="sl-about-arrow" aria-hidden="true">→</span>
        </a>
      </section>
    </div>
  );
}
