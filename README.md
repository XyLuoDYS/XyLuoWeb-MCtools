# XyLuoDYStoolWeb · MC 工具站

一个为 Minecraft 玩家与服主准备的小工具集合，基于 **Vue 3 + Vite + Element Plus** 构建。

## 功能

| 页面 | 路由 | 说明 |
|---|---|---|
| 首页 | `/` | 工具导航 + 时钟 / 小知识 / 新闻等小组件 |
| 颜色代码生成 | `/mccolor` | 可视化调色或粘贴代码解析，生成 MC 颜色代码 |
| 贴图菜单生成 | `/mcmenu` | 选容器底图 → 拖贴图排版 → 导出 PNG 界面预览图 |

## 快速开始

```bash
npm install
npm run dev      # 开发服务器 http://localhost:5173
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
```

## 技术栈

Vue 3（`<script setup>`）· Vite 5 · Element Plus · Pinia · Vue Router（hash 模式）

## 目录结构

```
src/
  views/         页面级组件
  components/    公共组件（NavBar / ToolCard / widgets）
  composables/   可复用逻辑（useLayoutAnim / usePillSlider）
  config/        配置（images.js —— 图片路径在这里改）
  styles/        global.css —— 全局设计变量与 Element Plus 覆盖
  router/        路由
mine/            自绘贴图（往这里丢 PNG，工具页会自动列出）
vanilla/         Minecraft 原版容器贴图（用于尺寸对齐参考）
public/          静态资源（images / fonts）
```

## 自定义

- **换背景图 / Hero 图**：把图片放进 `public/images/`，然后编辑 `src/config/images.js`。
  留空则自动从网络图库拉取。
- **加自己的贴图**：把 PNG 丢进 `mine/`，工具页「我的贴图」分组会自动出现，无需改配置。

## 授权协议

本项目采用**分层授权**，请注意区分：

| 内容 | 协议 |
|---|---|
| **源代码**（`src/` 等） | [MIT](./LICENSE) —— 可自由使用、修改、商用 |
| **作者自绘贴图**（`mine/`） | [LICENSE-ASSETS](./LICENSE-ASSETS.md) —— **仅限非商业使用，禁止商用** |
| **Minecraft 原版贴图**（`vanilla/`） | 版权归 Mojang / Microsoft，使用须遵守 [Minecraft 使用准则](https://www.minecraft.net/usage-guidelines) |
| **插画**（`public/images/`） | 版权归**画师 Ashima**，本仓库不授予许可，**请勿商用** |
| **字体**（`public/fonts/`） | 均为可自由使用字体（CC0 / OFL），详见 [LICENSE-ASSETS 第四节](./LICENSE-ASSETS.md) |

简言之：**代码随便用，但 `mine/` 里的原创贴图不能拿去商用，
`public/images/` 里的插画（画师 Ashima 作品）也不在本仓库授权范围内。**

只想取用代码的话，直接把 `src/` 拿走即可，完全没有版权负担。
若要整体使用本项目，请**删除或替换** `public/images/` 下的插画。

## 贡献

欢迎提交 Issue 和 Pull Request！
提交前请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)，特别是其中的**素材红线**与**贡献者授权条款**。

## 免责声明

本项目为个人非官方作品，与 **Mojang Studios / Microsoft 无任何关联**，
未获得其批准、认可或支持。

> NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.
