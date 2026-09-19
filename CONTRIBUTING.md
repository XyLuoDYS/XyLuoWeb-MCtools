# 贡献指南（CONTRIBUTING） | Contributing Guide (CONTRIBUTING)

本文件为**中英对照**：**中文在前，英文紧随其后**。
This document is **bilingual**: **Chinese first, with the English text immediately below.**

本文由作者以中文起草，**中英文如有歧义，以中文为准**。
It was drafted in Chinese by the author; **in case of any discrepancy, the Chinese version prevails**.

感谢你愿意为这个项目出一份力呀，提交之前请先花两分钟读完本文，尤其是**素材相关的三条红线**。
Thank you for wanting to help with this project! Please spend two minutes reading this document before you submit — especially the three asset red lines.

---

## 一、快速开始 | 1. Quick Start

```bash
# 1. Fork 本仓库，然后克隆你自己的 fork
#    Fork this repository, then clone your own fork
git clone https://github.com/<your-username>/XyLuoWeb-MCtools.git
cd XyLuoWeb-MCtools

# 2. 安装依赖 / Install dependencies
npm install

# 3. 启动开发服务器（默认 http://localhost:5173）
#    Start the dev server (defaults to http://localhost:5173)
npm run dev

# 4. 构建产物验证（改完最好跑一次）
#    Verify the build (worth running after any change)
npm run build
```

## 二、目录结构速览 | 2. Directory Overview

```
src/
  views/         页面级组件（HomeView / McColorToolView / McMenuToolView）
                 page-level components
  components/    公共组件（NavBar / ToolCard / widgets/）
                 shared components
  composables/   可复用逻辑（useLayoutAnim / usePillSlider）
                 reusable logic
  config/        配置（images.js —— 图片路径在这里改）
                 config (images.js — image paths live here)
  styles/        global.css —— 全局设计变量与 Element Plus 覆盖
                 global design tokens and Element Plus overrides
  router/        History 模式路由（需 SPA 回退，见 README）
                 History-mode routing (needs SPA fallback, see README)
mine/            作者自绘贴图（工具页"我的贴图"分组）← 欢迎投稿！
                 hand-drawn textures ("My Textures" group) ← contributions welcome!
vanilla/         Minecraft 原版容器贴图（仅作对齐参考，版权归 Mojang）
                 vanilla MC container textures (alignment reference; (c) Mojang)
public/          静态资源（images / fonts）/ static assets (images / fonts)
```

## 三、素材规范与红线（请务必阅读） | 3. Asset Rules and Red Lines (Must Read)

### 三条红线 | 3.1 The Three Red Lines

**这三条违反其一，PR 就无法合并** —— 不是不欢迎你，是版权上真的收不了：
**Violating any one of these three means the PR cannot be merged** — it is not that you are unwelcome; it is that the copyright position simply does not allow it.

#### 不要提交 Minecraft 原版素材 | Do not submit vanilla Minecraft assets

`vanilla/` 下的贴图版权归 Mojang / Microsoft。**不要把游戏内新贴图、解包资源、其它整合包的素材提交进来**。要新增贴图，请在 `mine/` 下放**你自己画的**。
The copyright in the textures under `vanilla/` belongs to Mojang / Microsoft. **Do not submit new in-game textures, unpacked game resources, or assets taken from other modpacks.** To add a texture, put **one you drew yourself** under `mine/`.

#### 不要提交来源不明的图片 | Do not submit images of unknown provenance

从图库、动漫站、Pixiv、Pinterest 等处随手存的图，**版权不属于你**，不能提交到 `public/images/`。要么自己画，要么用 AI 生成，要么用明确可商用的免费素材（并注明来源与授权）。
Images casually saved from galleries, anime sites, Pixiv, Pinterest and the like are **not yours to license** and must not be submitted to `public/images/`. Either draw them yourself, generate them with AI, or use free material that explicitly permits commercial use (with the source and license stated).

顺带说明：`public/images/` 里现有的站点插画（`index.png`、`card-*.png`、`bg/bg.png`）**均为 AI 生成的图片**，不存在第三方画师的著作权问题，可随本项目以「仅限非商业使用」的条件一同使用。详见 [`public/images/README.md`](./public/images/README.md)。
For reference: the site illustrations currently in `public/images/` (`index.png`, `card-*.png`, `bg/bg.png`) are **all AI-generated**, so no third-party illustrator's copyright is involved, and they may be used with this project under the "non-commercial only" condition. See [`public/images/README.md`](./public/images/README.md).

**但请不要把第三方画师的图（Pixiv / 图库 / 动漫站的转载图）替换进来** ——那会让整个仓库的素材授权变得不干净。本项目此前的插画就曾因此全部下架替换。
**However, do not replace them with images from third-party artists** (reposts from Pixiv, image galleries, anime sites). Doing so would taint the asset licensing of the whole repository — which is exactly why this project's previous illustrations were all taken down and replaced.

#### 不要提交第三方代码 | Do not submit third-party code

引入新的 npm 依赖是可以的（请在 PR 描述里说明理由）；但**不要**把从别处拷来的代码片段、字体文件、贴图擅自提交进来。
Adding new npm dependencies is fine (please explain why in the PR description), but **do not** copy in code snippets, font files or textures from elsewhere on your own initiative.

---

### 如何贡献贴图（`mine/`）—— 非常欢迎！ | 3.2 How to Contribute Textures (`mine/`) — Very Welcome!

`mine/` 目录就是给大家投稿自绘贴图用的只要是你**自己画的**，都欢迎提 PR。
The `mine/` directory exists precisely so people can contribute their own hand-drawn textures As long as you drew it yourself, a PR is welcome.

#### 技术规范 | 1. Technical Requirements

| 项目 Item | 要求 Requirement | 说明 Notes |
| --- | --- | --- |
| **格式 Format** | **PNG**（小写 `.png`）<br>**PNG** (lowercase `.png`) | 目前只扫描 PNG；`.jpg` / `.PNG` 不会被识别<br>Only PNG is scanned; `.jpg` and `.PNG` are not recognised |
| **透明通道 Alpha** | 建议保留（RGBA）<br>Recommended (RGBA) | 透明背景会被保留，放置到画布上不会出现白底<br>Transparency is preserved, so no white box appears on the canvas |
| **尺寸 Size** | 建议按**原始像素**绘制<br>Draw at **native pixel size** | 16×16、32×32、35×35、53×35 这类小尺寸最常见<br>Small sizes such as 16×16, 32×32, 35×35, 53×35 are the norm |
| **体积 File size** | 尽量 < 50 KB<br>Under 50 KB if possible | 像素画本来就小，太大通常是存了多余像素格式<br>Pixel art is inherently small; a large file usually means a wasteful colour format |
| **子目录 Sub-directories** | 支持 Supported | 会被**递归**扫描，可以按主题分文件夹<br>Scanned **recursively**; feel free to group by theme |

#### 命名规则 | 2. Naming Rules

文件名会**直接变成界面上的显示名**，转换规则是：
The file name **becomes the display name in the UI**. The conversion rule is:

- `_` 和 `-` → 替换成空格
  `_` and `-` → replaced with a space
- 每个单词首字母 → 大写
  The first letter of each word → capitalised

| 文件名 File name | 界面显示 Display |
| --- | --- |
| `button_primary.png` | `Button Primary` |
| `icon-shop.png` | `Icon Shop` |
| `公会.png` | `公会`（中文原样保留 / Chinese kept as-is） |

所以命名请取**一眼能看懂**的名字，别用 `1.png`、`未命名.png`、`最终版2.png` 这类。
So pick a **self-explanatory** name — avoid `1.png`, `untitled.png`, `final-v2.png` and the like.

#### 内容建议 | 3. Content Suggestions

- 适合：UI 按钮、图标、框体、标签、徽章、装饰边框等**界面用像素贴图**
  Good fit: **UI pixel textures** — buttons, icons, frames, labels, badges, decorative borders
- 风格：和现有贴图（`公会.png` / `服装.png` / `称号.png` / `领地.png`，35×35 ~ 53×35）协调更好
  Style: they will look better if they harmonise with the existing textures (`公会.png` / `服装.png` / `称号.png` / `领地.png`, 35×35 – 53×35)
- 不要：包含第三方角色形象的**同人二创**（即使是你画的，也涉及原 IP 版权）
  Avoid: **fan art** depicting third-party characters (even if you drew it, the original IP rights are involved)
- 不要：AI 生成图冒充手绘（本项目 `mine/` 只收**手绘**作品）
  Avoid: AI-generated images passed off as hand-drawn work (`mine/` accepts **hand-drawn artwork only**)
- 不要：截图、裁剪他人作品、素材站下载的图
  Avoid: screenshots, crops of other people's work, images downloaded from asset sites

#### 提交时的授权确认 | 4. License Confirmation on Submission

**往 `mine/` 丢图 = 你确认这两件事：**
**Dropping an image into `mine/` means you confirm two things:**

1. 这些图是**你自己画的**（原创）；
   You drew these images **yourself** (they are original);
2. 你同意按 [LICENSE-ASSETS 第二节](./LICENSE-ASSETS.md) 的条款授权它们 —— 即 **允许任何人免费使用与自由修改，禁止商业使用**。
   You agree to license them under [Section 2 of LICENSE-ASSETS](./LICENSE-ASSETS.md) — that is, **anyone may use and modify them free of charge, and commercial use is prohibited**.

你**仍然保留著作权**，也可以在自己的渠道自由使用/发布/售卖你提交的贴图。授权是**非独占**的。详见 [LICENSE-ASSETS 第六节](./LICENSE-ASSETS.md)。
You **retain the copyright** and may continue to use, publish or even sell the textures you contributed through your own channels. The license is **non-exclusive**. See [Section 6 of LICENSE-ASSETS](./LICENSE-ASSETS.md).

#### 提交步骤 | 5. Submission Steps

Then open a PR on GitHub. **Please include this sentence in the PR description:**

```bash
# 1. Fork 本仓库并克隆 / Fork this repository and clone it
git clone https://github.com/<your-username>/XyLuoWeb-MCtools.git
cd XyLuoWeb-MCtools

# 2. 启动开发服务器，确认贴图能正常出现在「贴图库 → 我的贴图」分组
#    Start the dev server and confirm the texture shows up under
#    "Texture Library → My Textures"
npm run dev

# 3. 把 PNG 放进 mine/ 目录（可建子目录）
#    dev server 会自动热更新，刷新页面即可看到
#    Put the PNG into mine/ (sub-directories allowed).
#    The dev server hot-reloads; just refresh the page.

# 4. 提交并推送 / Commit and push
git checkout -b add-my-textures
git add mine/
git commit -m "feat(mine): 新增 xxx 贴图 / add xxx texture"
git push origin add-my-textures
```

然后到 GitHub 上开 PR。**PR 描述里请写一句：**

我确认这些贴图由我本人绘制，并同意按 LICENSE-ASSETS 第二节授权。
I confirm that I drew these textures myself and agree to license them under Section 2 of LICENSE-ASSETS.

#### 想先问问再动手？ | 6. Want to Ask First?

欢迎先开 Issue 贴个预览图问问大家意见，比改完再返工省事多啦～
Feel free to open an Issue with a preview image to get feedback first — that saves a lot of rework compared with finishing and then having to redo it.

---

## 四、贡献者授权条款（重要） | 4. Contributor License Terms (Important)

**向本仓库提交 Pull Request，即视为你同意以下条款。**
**By submitting a pull request to this repository, you are deemed to accept the following terms.**

1. **原创保证**：你保证所提交的全部内容（代码、贴图、图片、文档）均为你的原创作品，或你已获得权利人的充分授权可以按本条款提交。素材中若含第三方元素（字体、笔刷、参考图等），你已确认其允许这样使用。
   **Originality.** You warrant that everything you submit (code, textures, images, documentation) is your own original work, or that you have obtained sufficient authorisation from the rights holder to submit it under these terms. Where your submission contains third-party elements (fonts, brushes, reference images, etc.), you have confirmed that they may be used in this way.

2. **代码贡献授权**：你的代码贡献将以 **[MIT 协议](./LICENSE)** 授权给本项目，由项目作者随项目一同对外许可。
   **Code contributions.** Your code contributions are licensed to this project under the **[MIT License](./LICENSE)**, and the project author licenses them outwards as part of the project.

3. **素材贡献授权**：你的非代码贡献（如 `mine/` 下的贴图）将以**[LICENSE-ASSETS 第二节](./LICENSE-ASSETS.md)** 的条款授权给本项目，即：**允许任何人免费使用、自由修改、打包进 MC 资源包，但禁止商业使用**，并由项目作者统一对外许可。
   **Asset contributions.** Your non-code contributions (such as textures under `mine/`) are licensed to this project under **[Section 2 of LICENSE-ASSETS](./LICENSE-ASSETS.md)**, i.e. **anyone may use and modify them free of charge and bundle them into MC resource packs, while commercial use is prohibited**, and the project author licenses them outwards on a unified basis.

4. **授权性质**：上述授权为**永久、不可撤销、非独占、免版税**的。
   **Nature of the grant.** The grants above are **perpetual, irrevocable, non-exclusive and royalty-free**.

5. **你保留的权利**：你**保留**自己作品的著作权，可以继续在自己的渠道自由使用、发布甚至售卖你的作品；也可以同时在别处以别的许可发布它（授权是**非独占**的）。
   **Rights you keep.** You **retain the copyright** in your work and may continue to use, publish and even sell it through your own channels; you may also publish it elsewhere under a different license at the same time (the grant is **non-exclusive**).

6. **不再单独主张**：贡献被合并后，你不再就该贡献向本项目的使用者单独主张权利。
   **No separate claims.** Once a contribution has been merged, you will not assert rights against users of this project in respect of that contribution.

7. **署名**：项目作者会尽力在致谢中保留你的署名，但**不承诺特定形式的署名位置**。
   **Attribution.** The project author will make a reasonable effort to keep your name in the credits, but **does not promise any particular form or placement** of credit.

8. **不承诺收录**：作者保留不合并、或日后移除某个贡献的权利（例如发现素材来源存疑时）。若你的贡献被移除，作者会尽量说明原因。
   **No guarantee of inclusion.** The author reserves the right not to merge a contribution, or to remove it later (for example if its provenance becomes questionable). If your contribution is removed, the author will try to explain why.

如果你**不同意**上述条款，请不要提交 PR（欢迎改为提 Issue 反馈问题或建议，同样很有价值）。若你希望保留自己贴图的独立授权，请**不要**把它提交进本仓库，而是单独发布并在 Issue 中给出链接。
If you **do not agree** with the terms above, please do not submit a PR. Opening an Issue with feedback or suggestions is very welcome instead and is just as valuable. If you want to keep independent licensing for your own textures, please **do not** submit them to this repository — publish them separately and link them in an Issue.

条款的完整版、以及「能不能用在服务器资源包里」这类常见问题，见 [LICENSE-ASSETS.md](./LICENSE-ASSETS.md)（含 FAQ 章节）。
The full terms, plus frequently asked questions such as "can I use these in a server resource pack?", are in [LICENSE-ASSETS.md](./LICENSE-ASSETS.md) (which includes an FAQ section).

## 五、代码风格约定 | 5. Code Style Conventions

- Vue 3 `<script setup>` + Composition API，**不要**用 Options API
  Vue 3 `<script setup>` + Composition API; **do not** use the Options API
- 缩进 2 空格，**不写分号**（沿用项目现有风格）
  2-space indentation, **no semicolons** (following the existing project style)
- 组件内样式用 `<style scoped>`；跨页面的公共样式放 `src/styles/global.css`
  Use `<style scoped>` inside components; put cross-page shared styles in `src/styles/global.css`
- **优先复用现有的 composable 与全局类**，不要另起一套：
  **Reuse the existing composables and global classes** rather than inventing new ones:
  - 卡片容器 → `.card` / `.panel-card`
    Card containers → `.card` / `.panel-card`
  - 按钮 → `.btn`（`.primary` / `.danger` / `.sm` / `.on`），**不要**混用 `el-button`
    Buttons → `.btn` (`.primary` / `.danger` / `.sm` / `.on`); **do not** mix in `el-button`
  - 输入框 → `.xy-field`；开关 → `.xy-switch`；下拉浮层 → `popper-class="xy-popper"`
    Inputs → `.xy-field`; switches → `.xy-switch`; dropdown poppers → `popper-class="xy-popper"`
  - 分段控件 → `src/composables/usePillSlider.js`
    Segmented controls → `src/composables/usePillSlider.js`
  - 卡片伸缩动画 → `src/composables/useLayoutAnim.js`
    Card expand/collapse animation → `src/composables/useLayoutAnim.js`
- 新增动效**不需要**额外处理兼容，`global.css` 里已有 `prefers-reduced-motion` 总开关
  New animations **need no extra compatibility work** — `global.css` already contains a global `prefers-reduced-motion` switch

### 关于代码来源 | 5.1 About the Code's Origin

本项目的**网页代码由 AI 生成**（`src/` 下的 Vue 组件、样式表、脚本与配置文件），作者负责需求设计、整理与维护。
The **web code of this project was generated by AI** (Vue components, stylesheets, scripts and config files under `src/`). The author is responsible for the specification, curation and maintenance.

这不是「禁止改动」的意思 —— 恰恰相反，欢迎你改进它。说明这一点只是让你知道代码的由来，以及为什么它能用这么宽松的授权（[MIT](./LICENSE)，允许商用）。
This is not a "do not touch" notice — quite the opposite, improvements are welcome. It is mentioned simply so you know where the code came from, and why it can be licensed so permissively ([MIT](./LICENSE), commercial use allowed).

## 六、提交 PR 前请自检 | 6. Self-check Before Submitting a PR

- [ ] `npm run build` 能通过，控制台无报错
      `npm run build` passes with no errors in the console
- [ ] 页面能正常渲染，没有明显回归（建议 `npm run dev` 手动点一遍改动的功能）
      Pages render correctly with no obvious regressions (running `npm run dev` and manually exercising the changed features is recommended)
- [ ] 没有提交 `node_modules/`、`.env`、编辑器配置等无关文件
      No irrelevant files committed (`node_modules/`, `.env`, editor config, etc.)
- [ ] 没有提交来源不明的素材（见第三节红线）
      No assets of unknown provenance committed (see the red lines in Section 3)
- [ ] Commit message 简明描述改了什么（中文英文都可以）
      The commit message briefly describes what changed (Chinese or English are both fine)

**如果这个 PR 新增了 `mine/` 贴图，额外确认：**
**If this PR adds `mine/` textures, additionally confirm:**

- [ ] 格式是**小写 `.png`**，且<u>是我自己画的</u>
      The format is **lowercase `.png`** and <u>I drew it myself</u>
- [ ] 文件名一眼能看懂（它会直接变成界面显示名）
      The file name is self-explanatory (it becomes the UI display name)
- [ ] 保留透明通道，体积无明显异常
      Transparency is preserved and the file size is not obviously abnormal
- [ ] 已在 `npm run dev` 下确认贴图出现在「贴图库 → 我的贴图」分组里
      I have verified under `npm run dev` that the texture appears under "Texture Library → My Textures"
- [ ] 我同意按 [LICENSE-ASSETS 第二节](./LICENSE-ASSETS.md)（仅限非商业使用）授权
      I agree to license it under [Section 2 of LICENSE-ASSETS](./LICENSE-ASSETS.md) (non-commercial only)

## 七、PR 描述建议包含 | 7. What to Include in the PR Description

1. **改了什么**：一句话说清
   **What changed** — one sentence
2. **为什么改**：解决了什么问题 / 新增了什么能力
   **Why** — what problem it solves / what capability it adds
3. **怎么验证的**：截图、复现步骤或测试方式
   **How you verified it** — screenshots, reproduction steps or test method
4. **是否涉及素材**：如果新增了贴图 / 图片，请附一句授权确认，例如：
   **Whether assets are involved** — if you added textures or images, include a confirmation sentence, for example:

 我确认 `mine/` 下新增的贴图由我本人绘制，并同意按 LICENSE-ASSETS 第二节授权。
 I confirm that the textures added under `mine/` were drawn by me, and I agree to license them under Section 2 of LICENSE-ASSETS.

---

有任何不确定的地方，**先开 Issue 问一下**，比改完再返工省事多啦～谢谢你的贡献
If anything is unclear, **open an Issue and ask first** — that saves a lot of rework compared with finishing and then having to redo it. Thank you for your contribution
