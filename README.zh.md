# Soundlings

[English](README.md) | 简体中文

> 365 开源计划 #009 · 面向 3–10 岁儿童的离线零追踪声音板

100% 离线、零追踪，面向 3–10 岁儿童的声音板。
**React 19 + Ant Design 6 + Vite + TypeScript**。
暖橙色调、大圆角控件，专为儿童使用习惯设计。
**89 个音频素材**，涵盖 6 个分类（交通工具、动物、环境音、家居、乐器、自然），
所有文件均使用开放许可证。

## 快速开始

```bash
git clone https://github.com/rockbenben/soundlings && cd soundlings
npm install
npm run dev          # http://localhost:5173
```

打包构建：

```bash
npm run build        # → dist/
npm run preview      # 本地预览 dist/
```

## 功能

- 6 个分类，点击即播；长按多变体卡片可打开变体菜单
  （多变体卡片底部有点状指示）
- 跨标签（中 + 英）、iconKey、分类的搜索
- 三种模式：
  - **随机** — 持续洗牌，带骰子动画首屏
  - **睡前** — 循环播放环境音 + 睡眠定时（15 / 30 / 60 分钟）
  - **猜声音** — 听音猜物小测验，带得分标签
- 睡眠定时（5 / 15 / 30 / 60 分钟），带 mm:ss 倒计时角标
- 主题：浅色 / 深色 / 自动（设置）
- 中文 / English（顶栏 🌐 一键切换）
- 跳过到主内容、`prefers-reduced-motion`、`prefers-contrast: more`

## 仓库结构

```
index.html              — Vite 入口
package.json            — npm 脚本（build / typecheck / audio:audit / audio:credits）
vite.config.ts          — base="./"，构建产物可部署到任意子路径

src/
  main.tsx              — 启动：catalog.load() → React 渲染
  App.tsx               — ConfigProvider（主题 + locale）+ Layout
  theme.ts              — antd 主题 token（暖橙色、大圆角）
  store.ts              — 与框架无关的响应式单例
  player.ts             — HTMLAudioElement 包装层
  catalog.ts            — manifest 加载与搜索
  actions.ts            — playSound / stopAll / toggleLoop / navigate（唯一播放入口）
  icons.ts              — 每个 iconKey 对应的 emoji
  hooks.ts              — useStore() 基于 useSyncExternalStore
  i18n/                 — en.json + zh.json 与 antd locale 接线
  components/           — TopNav, SoundCard, NowPlayingBar, SleepTimerButton, VariantMenu
  pages/                — Home, Search, Random, Bedtime, Mystery, Settings
  styles.css            — 设计 token 与卡片 / 播放条样式

public/assets/
  manifest.json         — 预设目录（90+ 变体）
  LICENSES.json         — 每文件来源 + 许可证元数据（机器可读）
  audio/<category>/*.mp3
  icon/                 — favicon + PWA 应用图标

scripts/                — Python + bash 维护脚本（见下表）
.github/                — workflow + issue / PR 模板
```

## npm 脚本

| 脚本 | 说明 |
|---|---|
| `npm run dev` | Vite 开发服务器，支持 HMR |
| `npm run build` | `tsc -b` 后执行 `vite build` → `dist/` |
| `npm run preview` | 本地预览构建后的 `dist/` |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run audio:audit` | 许可证合规检查（CI 闸门） |
| `npm run audio:credits` | 从 `LICENSES.json` 重新生成 `CREDITS.md` |
| `npm run audio:health` | 音频文件健康度（时长、平均 dB、静音段） |

## scripts/

| 文件 | 用途 |
|---|---|
| `audit_licenses.py` | 强制 4 条许可证不变式，由 CI 调用 |
| `generate_credits.py` | 从 `LICENSES.json` 渲染 `CREDITS.md` |
| `audit_audio.py` | 报告每个文件的时长 / 响度 / 静音段 |
| `verify_matches.py` | 启发式标签校验，标记来源不匹配的文件 |
| `fetch_freesound.py` | 从 Freesound 批量拉取 CC0 声音（`FREESOUND_TOKEN`） |
| `replace_by_id.py` | 按 Freesound ID 替换一个或多个文件 |
| `normalize_loudness.sh` | 将所有 mp3 重编码为 mono 44.1 kHz 128 kbps、–10 LUFS |

## 添加一段声音

1. 把规范化后的 mp3 放进 `public/assets/audio/<category>/`
   （mono、44.1 kHz、128 kbps；`scripts/normalize_loudness.sh` 会处理这些）。
2. 在 `public/assets/LICENSES.json` 中新增条目，包含 `name`、
   `attribution`、`url`。优先使用 **CC0 1.0**，**CC BY 4.0** 也允许。
3. 在 `public/assets/manifest.json` 中追加预设 / 变体。变体的
   `license` 字段必须引用新的 LICENSES key。
4. 在 `src/icons.ts` 为新的 `iconKey` 添加 emoji（否则会回退为 🔊）。
5. 执行 `npm run audio:audit && npm run audio:credits`，两者均需通过。

## 隐私

除加载站点自身的静态资源外没有任何网络请求。无埋点、无 SDK。
localStorage 只保存 `lang` 与 `theme`。详见 [`PRIVACY.md`](PRIVACY.md)。

## 许可证

代码：**MIT**（见 [`LICENSE`](LICENSE)）。

音频：**88 × CC0 1.0** + **1 × CC BY 4.0**（`rainy_night.mp3`，
署名来自 Freesound 上的 *newlocknew*）。每文件机器可读的元数据见
`public/assets/LICENSES.json`；人类可读的署名见 [`CREDITS.md`](CREDITS.md)，
并在应用内 **设置 → 音频署名** 中展示。

由 `scripts/audit_licenses.py`（CI 闸门）强制的 4 条许可证不变式：

1. 每个 manifest 变体引用的 license key 必须存在于 `LICENSES.json`。
2. `LICENSES.json` 不能有孤儿条目。
3. 不允许不兼容的许可证家族（CC BY-SA / CC BY-NC / CC BY-ND）。
4. 每个非 CC0 条目都必须带 `attribution` 与 `url`。

## 浏览器支持

构建目标为 `es2022`，覆盖 Chrome 94+、Edge 94+、Safari 16.4+
和 Firefox 93+ —— 所有支持模块顶层 `await` 的浏览器。更老的浏览器
会显示 `<noscript>` 兜底页，或直接无法加载 bundle。

## 产物结构

Vite 构建会输出两个 JS chunk：

| Chunk | 内容 | 体积（gzip） | 缓存周期 |
|---|---|---|---|
| `antd-*.js` | Ant Design 6 + React（peer dep 引入）+ antd locale | ~190 KB | 极少变化 |
| `index-*.js` | Soundlings 应用代码 | ~15 KB | 每次发版 |

这样切分意味着新增声音或修复 UI bug 只会让小的应用 chunk 失效，
用户保留缓存的 antd bundle。

## 部署

推送到 `main` 会触发 `.github/workflows/deploy-web.yml`：执行
许可证审计、类型检查、构建，并将 `dist/` 发布到 `gh-pages` 分支。

## 贡献

详见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

## 关于 365 开源计划

本项目是 [365 开源计划](https://github.com/rockbenben/365opensource) 的第 009 个项目。

一个人 + AI，一年 300+ 个开源项目。[提交你的需求 →](https://my.feishu.cn/share/base/form/shrcnI6y7rrmlSjbzkYXh6sjmzb)
