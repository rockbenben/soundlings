import { theme as antdTheme, type ThemeConfig } from 'antd';
import type { ThemeMode } from './store';

// Warm orange palette for a kid-friendly feel.
// Lots of border-radius, generous sizing, playful but readable.
const SHARED_TOKEN: ThemeConfig['token'] = {
  colorPrimary: '#fb923c',          // amber-400 → warm orange
  colorInfo: '#fb923c',
  colorSuccess: '#22c55e',
  colorWarning: '#f59e0b',
  colorError: '#ef4444',
  colorLink: '#fb923c',
  borderRadius: 16,
  borderRadiusLG: 20,
  borderRadiusSM: 12,
  borderRadiusXS: 10,
  fontSize: 16,
  fontSizeLG: 18,
  fontSizeSM: 14,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  controlHeight: 40,
  controlHeightLG: 48,
  controlHeightSM: 32,
  wireframe: false,
};

const LIGHT: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    ...SHARED_TOKEN,
    colorBgBase: '#fffaf3',         // very light warm cream
    colorBgContainer: '#ffffff',
    colorBgLayout: '#fff7ed',       // orange-50
    colorTextBase: '#1c1917',       // stone-900
    colorBorder: '#fed7aa',         // orange-200
    colorBorderSecondary: '#ffedd5',
  },
  components: {
    Layout: {
      headerBg: 'transparent',
      bodyBg: '#fff7ed',
      footerBg: '#ffffff',
      headerHeight: 64,
      headerPadding: '0 24px',
    },
    Button: {
      borderRadius: 999,
      borderRadiusLG: 999,
      controlHeight: 44,
      controlHeightLG: 56,
      paddingInline: 22,
      fontWeight: 600,
    },
    Tabs: {
      itemSelectedColor: '#1c1917',
      itemActiveColor: '#1c1917',
      itemHoverColor: '#9a3412',
      inkBarColor: '#fb923c',
      titleFontSize: 17,
      horizontalItemPadding: '12px 18px',
      cardGutter: 8,
    },
    Input: {
      borderRadius: 16,
      controlHeight: 48,
    },
    Card: {
      borderRadiusLG: 20,
    },
    Modal: { borderRadiusLG: 24 },
    Drawer: { borderRadiusLG: 24 },
    Popover: { borderRadiusLG: 16 },
  },
};

const DARK: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    ...SHARED_TOKEN,
    colorPrimary: '#fb923c',
    colorBgBase: '#1a1310',
    colorBgContainer: '#251a14',
    colorBgLayout: '#1a1310',
    colorTextBase: '#fef3c7',       // warm cream text
    colorBorder: '#7c2d12',         // orange-900
    colorBorderSecondary: '#431407',
  },
  components: LIGHT.components, // same component overrides
};

export function getThemeConfig(mode: ThemeMode): ThemeConfig {
  if (mode === 'light') return LIGHT;
  if (mode === 'dark') return DARK;
  // auto
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return DARK;
  }
  return LIGHT;
}

export function isDarkMode(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}
