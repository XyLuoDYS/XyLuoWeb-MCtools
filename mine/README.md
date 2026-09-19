# 我的贴图（`mine/`） | Hand-drawn Textures (`mine/`)

这是「MC 贴图菜单生成」工具页的**自绘贴图**目录（位于项目根目录）。
This is the **hand-drawn texture** directory (at the repository root) for the "MC Texture Menu Generator" tool page.

把你画的按钮 / 图标贴图（PNG）直接丢进这个目录，工具页的「贴图库 → 我的贴图」分组就会自动列出，**不需要改任何配置**。子目录也会被递归扫描。
Drop the button / icon textures (PNG) you have drawn into this directory and they will automatically appear under the "Texture Library → My Textures" group on the tool page. **No configuration changes are needed.** Sub-directories are scanned recursively.

本文件为**中英对照**：**中文在前，英文紧随其后**。
This document is **bilingual**: **Chinese first, with the English text immediately below.**

## 当前收录 | Currently Included

| 文件 File | 尺寸 Size |
| --- | --- |
| `公会.png` | 53×35 |
| `服装.png` | 35×53 |
| `称号.png` | 35×35 |
| `领地.png` | 35×35 |

---

## 使用规则 | Usage Rules

- 格式必须是 **小写 `.png`**（`.jpg`、`.PNG` 不会被识别）
  The format must be **lowercase `.png`** (`.jpg` and `.PNG` are not recognised).
- 文件名会成为界面显示名：`button_primary.png` → `Button Primary`；`公会.png` → `公会`（中文原样保留）
  The file name becomes the display name in the UI: `button_primary.png` → `Button Primary`; `公会.png` → `公会` (Chinese characters are kept as-is).
- 建议按贴图原始像素尺寸绘制（16×16、32×32、35×35…），工具里可以再等比缩放
  Draw at the texture's native pixel size (16×16, 32×32, 35×35…) — the tool can scale it proportionally afterwards.
- 透明背景会被保留；放置时按原始尺寸，超过画布时自动等比缩小
  Transparent backgrounds are preserved. Textures are placed at their native size and are automatically downscaled (preserving aspect ratio) if they exceed the canvas.

---

## 本目录的授权条款 | License Terms for This Directory

本目录下的贴图**由作者 XyLuoDYS 原创绘制**，采用**[XyLuoDYS 非商业素材许可 v1.0](../LICENSE-ASSETS.md)**：
The textures in this directory are **original works drawn by the author, XyLuoDYS**, and are released under the **[XyLuoDYS Non-Commercial Asset License v1.0](../LICENSE-ASSETS.md)**.

### 允许（免费，无需申请） | Permitted (free, no application required)

- 在**任何非商业场景**下使用（个人 / 团队 / 服务器 / 整合包 / 地图）
  Use in **any non-commercial context** (personal, team, server, modpack, map…)
- **复制、分发**原图（非商业目的）
  **Copy and redistribute** the original images (for non-commercial purposes)
- **打包进 Minecraft 资源包**：私人使用、公开免费下载、**你服务器的资源包**，都可以
  **Bundle into Minecraft resource packs**: private use, public free downloads, and **your own server's resource pack** are all fine
- **自由修改**：改色、裁剪、加笔、重绘、合成、改分辨率 —— 完全自由
  **Modify freely**: recolour, crop, paint over, redraw, composite, change resolution — completely unrestricted
- 修改后**公开发布**自己的版本（仍需遵守下面的非商业限制）
  **Publicly release** your modified version (still subject to the non-commercial restriction below)
- 用于视频、直播、图文教程、Wiki 配图等
  Use in videos, live streams, written/illustrated tutorials, wiki illustrations, etc.
- **向本目录贡献你自己画的贴图**（非常欢迎！）
  **Contribute textures you have drawn yourself** to this directory (very welcome!)

### 禁止 | Prohibited

- **任何形式的商业使用**：出售 / 转售 / 租赁 / 按次收费
  **Any commercial use whatsoever**: selling, reselling, renting, or charging per use
- 作为**付费资源包、付费模组、付费整合包**的一部分
  Inclusion in a **paid resource pack, paid mod, or paid modpack**
- 作为**付费会员专属**内容
  Use as **paid members-only / subscriber-exclusive** content
- 用于**营利性服务器**（出售道具、会员、点券、称号、赞助位等）
  Use on a **for-profit server** (selling items, memberships, in-game currency, titles, sponsor slots, etc.)
- 印制成**实体周边**出售
  Printing onto **physical merchandise** for sale
- 上传到**素材站**供他人付费下载
  Uploading to **asset marketplaces** for others to pay for and download
- 把贴图集起来**当素材包出售**（即使改过也不行）
  Assembling the textures into a **texture pack for resale** (not even if modified)
- 以其它许可（尤其"可商用"的许可）**再许可（Sublicense）**
  **Sublicensing** under any other terms — especially permissive, commercially usable licenses such as MIT or CC0
- 声称是你**从零原创**的（自作発言）
  Claiming you **created them from scratch**
- 移除或篡改**署名**
  Removing or altering the **attribution** notice
- 用于 NFT / 数字藏品
  Use in NFTs / digital collectibles

**衍生作品同样受约束**：你可以自由修改，但修改版**同样不得商用**，也不能通过"改一下再卖"绕开限制。
**Derivative works are bound by the same terms.** You may modify freely, but the modified version **may not be used commercially either** — "tweak it and sell it" is not a way around the restriction.

### 署名要求 | Attribution Requirement

使用时请保留署名（放在资源包说明、`pack.mcmeta` 描述、`LICENSE.txt`、README、视频简介等**能被人看到的地方**即可）：
Please keep the attribution when you use these textures. Anywhere visible works: a resource pack description, the `pack.mcmeta` description, a bundled `LICENSE.txt`, a README, a video description, and so on.

```
Texture assets by XyLuoDYS
https://github.com/XyLuoDYS/XyLuoWeb-MCtools
```

```
贴图素材来源：XyLuoDYS
https://github.com/XyLuoDYS/XyLuoWeb-MCtools
```

改过的话，推荐再补一句：
If you have modified them, adding one more line is appreciated:

```
Modified from textures by XyLuoDYS (https://github.com/XyLuoDYS/XyLuoWeb-MCtools)
```

```
基于 XyLuoDYS 的贴图修改（https://github.com/XyLuoDYS/XyLuoWeb-MCtools）
```

### 想商用？ | Need a Commercial License?

请通过仓库 [Issue](https://github.com/XyLuoDYS/XyLuoWeb-MCtools/issues) 联系作者申请书面授权。
Please open an [Issue](https://github.com/XyLuoDYS/XyLuoWeb-MCtools/issues) on the repository to request written permission from the author.

**不确定能不能用？** 先看看 [LICENSE-ASSETS 的场景对照表](../LICENSE-ASSETS.md)（含"我的服务器只收捐赠算不算商用"这类问题的答案），或者直接开 Issue 问一句～
**Not sure whether your use is allowed?** Check the scenario table in [LICENSE-ASSETS.md](../LICENSE-ASSETS.md) — it answers questions like "does a donation-only server count as commercial?" — or just open an Issue and ask.

---

## 想投稿贴图？ | Want to Contribute Textures?

**非常欢迎呀** 只要是你**自己画的**，都可以提 PR。
**Very welcome!** As long as you drew it yourself, feel free to open a PR.

**技术要求：**
**Technical requirements:**

| 项目 Item | 要求 Requirement |
| --- | --- |
| 格式 Format | 小写 `.png` / lowercase `.png` |
| 透明通道 Alpha | 建议保留（RGBA）/ keep it (RGBA) recommended |
| 尺寸 Size | 按原始像素绘制（16×16、32×32、35×35 等）<br>Native pixel size (16×16, 32×32, 35×35…) |
| 体积 File size | 尽量 < 50 KB / keep it under 50 KB if possible |
| 命名 Naming | 一眼能看懂，别用 `1.png`、`未命名.png`<br>Self-explanatory; avoid `1.png`, `untitled.png` |
| 子目录 Sub-directories | 支持，会递归扫描 / supported, scanned recursively |

**内容建议：** UI 按钮、图标、框体、标签、徽章、装饰边框等界面用像素贴图。和现有的 `公会` / `服装` / `称号` / `领地` 风格协调更好。
**Content suggestions:** pixel textures for UI — buttons, icons, frames, labels, badges, decorative borders. They will look better if they harmonise with the existing `公会` / `服装` / `称号` / `领地` style.

**不要提交：**
**Do not submit:**

- 含第三方角色形象的**同人二创**（即使是你画的，也涉及原 IP 版权）
  **Fan art** containing third-party characters (even if you drew it, the original IP rights are involved)
- AI 生成图冒充手绘（本目录**只收手绘**作品）
  AI-generated images passed off as hand-drawn work (this directory accepts **hand-drawn artwork only**)
- 截图、裁剪他人作品、素材站下载的图
  Screenshots, crops of other people's work, images downloaded from asset sites

**投稿即视为你确认：**
**By contributing, you confirm:**

1. 这些图是**你自己画的**（原创）；
   You drew these images **yourself** (they are original);
2. 你同意按 [LICENSE-ASSETS 第二节](../LICENSE-ASSETS.md) 的条款授权它们 —— 即**允许任何人免费使用与自由修改，禁止商业使用**。
   You agree to license them under [Section 2 of LICENSE-ASSETS](../LICENSE-ASSETS.md) — that is, **anyone may use and modify them free of charge, and commercial use is prohibited**.

你**仍然保留著作权**，也可以在自己的渠道自由使用、发布甚至售卖你的作品（授权是**非独占**的）。详见 [LICENSE-ASSETS 第六节](../LICENSE-ASSETS.md)。
You **retain the copyright** and may continue to use, publish or even sell your work through your own channels (the license is **non-exclusive**). See [Section 6 of LICENSE-ASSETS](../LICENSE-ASSETS.md).

操作步骤见 [CONTRIBUTING.md](../CONTRIBUTING.md)（含完整命令）。
For step-by-step instructions (including the full commands), see [CONTRIBUTING.md](../CONTRIBUTING.md).

---

原版容器贴图在项目根目录的 `vanilla/container/`，往里面加 PNG 也能被识别。**该目录版权归 Mojang / Microsoft**，作者无权对其授权，使用须遵守 [Minecraft 使用准则](https://www.minecraft.net/usage-guidelines)。想放自己画的贴图请放在**本目录**。
Vanilla container textures live in `vanilla/container/` at the repository root; PNGs added there are also picked up by the tool. **The copyright in that directory belongs to Mojang / Microsoft.** The author has no authority to license it, and any use must follow the [Minecraft Usage Guidelines](https://www.minecraft.net/usage-guidelines). Put textures you drew yourself in **this** directory instead.
