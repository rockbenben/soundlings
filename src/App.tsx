import { useEffect } from 'react';
import { ConfigProvider, Layout } from 'antd';
import { useStore } from './hooks';

const { Content, Footer } = Layout;

import { getThemeConfig, isDarkMode } from './theme';
import { ANTD_LOCALES, makeT } from './i18n';
import TopNav from './components/TopNav';
import NowPlayingBar from './components/NowPlayingBar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import RandomPage from './pages/RandomPage';
import BedtimePage from './pages/BedtimePage';
import MysteryPage from './pages/MysteryPage';
import SettingsPage from './pages/SettingsPage';

function RouteOutlet() {
  const route = useStore((s) => s.route);
  switch (route) {
    case 'home':
      return <HomePage />;
    case 'search':
      return <SearchPage />;
    case 'random':
      return <RandomPage />;
    case 'bedtime':
      return <BedtimePage />;
    case 'mystery':
      return <MysteryPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <HomePage />;
  }
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

export default function App() {
  const theme = useStore((s) => s.theme);
  const lang = useStore((s) => s.lang);
  const tr = makeT(lang);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = theme;
    html.lang = lang;
    const dark = isDarkMode(theme);
    // color-scheme tells the UA to theme native scrollbars/inputs correctly
    html.style.colorScheme = theme === 'auto' ? 'light dark' : dark ? 'dark' : 'light';
    setMeta('theme-color', dark ? '#1a1310' : '#fff7ed');
  }, [theme, lang]);

  return (
    <ConfigProvider theme={getThemeConfig(theme)} locale={ANTD_LOCALES[lang]}>
      <a className="sl-skip" href="#sl-main">
        {lang === 'zh' ? '跳到主要内容' : 'Skip to main content'}
      </a>
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        <TopNav tr={tr} />
        <Content
          id="sl-main"
          style={{ padding: '20px 20px 32px', maxWidth: 1100, width: '100%', margin: '0 auto' }}
        >
          <RouteOutlet />
        </Content>
        <Footer style={{ background: 'transparent', padding: 0 }}>
          <NowPlayingBar tr={tr} />
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}
