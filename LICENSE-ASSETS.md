# 素材授权条款（LICENSE-ASSETS） | Asset License (LICENSE-ASSETS)

**本条款全称**：XyLuoDYS 非商业素材许可 v1.0
**Full name:** XyLuoDYS Non-Commercial Asset License v1.0

**适用范围**：本仓库中**除源代码以外**的全部素材（贴图、插画、字体等）
**Applies to:** all assets in this repository other than source code (textures, illustrations, fonts, etc.)

**源代码授权**：见 [LICENSE](./LICENSE)（MIT，可自由商用）
**Source code license:** see [LICENSE](./LICENSE) (MIT — commercial use permitted)

**版权持有者**：XyLuoDYS
**Copyright holder:** XyLuoDYS

**最后更新**：2026-09-19
**Last updated:** 2026-09-19

本文件为**中英对照**：**中文在前，英文紧随其后**。
This document is **bilingual**: **Chinese first, with the English text immediately below.**

本条款由作者以中文起草，**中英文如有歧义，以中文为准**。
It was drafted in Chinese by the author; **in case of any discrepancy, the Chinese version prevails**.

---

## 一句话摘要 | One-line Summary

**代码（由 AI 生成）随你商用；`mine/` 里的贴图和 `public/images/` 里的插画，可以免费用、免费改、打包进资源包发给玩家，但不能拿去赚钱。**
**The code (AI-generated) is yours to use commercially. The textures in `mine/` and the illustrations in `public/images/` are free to use, free to modify, and free to ship inside resource packs — but they may not be used to make money.**

---

## 一、素材分类与适用条款 | 1. Asset Categories and Applicable Terms

本仓库的素材**按来源分层授权**——不同来源的素材，作者能给你的授权范围是不一样的：
Assets in this repository are **licensed in tiers by origin** — the scope the author is able to grant you depends on where each asset came from:

| 类别<br>Category | 位置<br>Path | 版权归属<br>Copyright | 授权范围<br>Terms | 详见<br>See |
| --- | --- | --- | --- | --- |
| **A. 自绘贴图**<br>**Hand-drawn textures** | `mine/` | **XyLuoDYS**（原创绘制）<br>**XyLuoDYS** (original work) | **仅限非商业使用**；可自由修改；可打包进 MC 资源包<br>**Non-commercial only**; free to modify; may be bundled into MC resource packs | [第二节](#二a-类自绘贴图mine-仅限非商业使用--2-class-a-hand-drawn-textures-mine--non-commercial-use-only)<br>Section 2 |
| **B. 原版素材**<br>**Vanilla assets** | `vanilla/` | **Mojang / Microsoft** | 版权非本仓库所有，**作者无权对其授权**<br>Not owned by this repository; **the author cannot license it** | [第三节](#三b-类minecraft-原版素材vanilla-版权归-mojang--3-class-b-vanilla-minecraft-assets-vanilla--copyright-mojang)<br>Section 3 |
| **C. 站点插画**<br>**Site illustrations** | `public/images/` | **XyLuoDYS**（GPT Image 生成，无第三方著作权）<br>**XyLuoDYS** (GPT Image generated, no third-party copyright) | 与 A 类相同：**仅限非商业使用**<br>Same as Class A: **non-commercial only** | [第四节](#四c-类站点插画publicimages-ai-生成--4-class-c-site-illustrations-publicimages--ai-generated)<br>Section 4 |
| **D. 字体**<br>**Fonts** | `public/fonts/` | 各字体原作者<br>Each font's original author | 依各自原始授权（CC0 / OFL，**均可商用**）<br>Per each font's original license (CC0 / OFL — **commercial use allowed**) | [第五节](#五d-类字体publicfonts--5-class-d-fonts-publicfonts)<br>Section 5 |
| **E. 网页代码**（非素材，附此对照）<br>**Web code** (not an asset; listed for reference) | `src/`、`index.html`<br>`vite.config.js` | **XyLuoDYS**（**由 AI 生成**，不涉第三方人工代码）<br>**XyLuoDYS** (**AI-generated**; no third-party human-authored code) | [MIT](./LICENSE) —— 可自由使用、修改、**商用**，保留版权声明即可<br>[MIT](./LICENSE) — free to use, modify, **commercial use allowed**; just keep the notice | [LICENSE](./LICENSE)<br>LICENSE |

**为什么不能一句话「全站禁止商用」了事？**因为 `vanilla/` 的版权是 Mojang 的，本仓库作者**没有资格**替 Mojang 附加任何限制。硬写"禁止商用"不但无法律效力，还会误导使用者。所以必须**按来源分开写**。
**Why can't this just say "no commercial use anywhere"?** Because the copyright in `vanilla/` belongs to Mojang, and the author of this repository has **no standing** to impose restrictions on Mojang's behalf. Writing "no commercial use" over those files would be legally meaningless and would mislead users. Hence the terms must be **split by origin**.

---

## 二、A 类：自绘贴图（`mine/`）—— 仅限非商业使用 | 2. Class A: Hand-drawn Textures (`mine/`) — Non-commercial Use Only

`mine/` 目录下的全部贴图（`公会.png`、`服装.png`、`称号.png`、`领地.png` 及后续新增的）**由本仓库作者 XyLuoDYS 原创绘制**，版权归作者所有
All textures in the `mine/` directory (`公会.png`, `服装.png`, `称号.png`, `领地.png` and anything added later) are **original works drawn by the author of this repository, XyLuoDYS**, and the copyright belongs to the author.

本条款的目的很简单：**让 MC 社区的大家免费用得开心，但不希望有人拿它去赚钱**
The purpose of these terms is simple: **let everyone in the Minecraft community use them freely and happily, but discourage anyone from making money off them.**

### 你可以做的（无需申请、无需付费） | 2.1 What You May Do (no application, no fee)

#### 使用与分发 | Use and Distribution

- 在**任何非商业场景**下免费使用（个人、团队、服务器、整合包、地图、作品集……）
  Free use in **any non-commercial context** (personal, team, server, modpack, map, portfolio, …)
- **复制、分发原图**（非商业目的）
  **Copying and distributing the original images** (for non-commercial purposes)
- **打包进 Minecraft 资源包**（材质包），包括：
  **Bundling into Minecraft resource packs** (texture packs), including:
  - 自己使用的私人资源包
    private resource packs for your own use
  - **公开免费下载**的资源包
    resource packs released for **public free download**
  - **你运营的 MC 服务器**强制 / 推荐 / 可选资源包
    the mandatory / recommended / optional resource packs of **the MC server you run**
- 放进整合包、地图存档、皮肤站等**免费发布**的作品里
  Inclusion in works **released for free** such as modpacks, map saves and skin sites
- 用于视频、直播、图文教程、Wiki 配图等（详见下方场景对照表）
  Use in videos, live streams, written/illustrated tutorials, wiki illustrations, etc. (see the scenario table below)

#### 修改与二次创作 | Modification and Derivative Works

- **自由修改**：改色、调亮暗、加笔、裁剪、重绘、拼接、做成不同分辨率
  **Modify freely**: recolour, adjust brightness, paint over, crop, redraw, stitch together, render at a different resolution
- 把多张 `mine/` 贴图合成一张新贴图
  Combine several `mine/` textures into one new texture
- 在修改版基础上继续二次创作
  Build further derivative works on top of your modified version
- 把修改后的版本**公开发布**（仍需遵守非商业限制，见 2.3）
  **Publicly release** your modified version (still subject to the non-commercial restriction — see 2.3)

#### 参与贡献 | Contributing

- 通过 **Pull Request 向 `mine/` 贡献你自己画的贴图**（欢迎欢迎！详见[第六节](#六贡献者条款--6-contributor-terms)）
  **Contribute textures you drew yourself to `mine/` via a pull request** (very welcome! see [Section 6](#六贡献者条款--6-contributor-terms))
- 提议修改现有贴图的配色 / 造型
  Suggest changes to the colour scheme or shape of existing textures

### 你**不需要**做的 | 2.2 What You Do NOT Need to Do

- **不需要**付费
  You do **not** need to pay
- **不需要**事先申请授权
  You do **not** need to apply for permission in advance
- **不需要**在服务器 / 资源包里加"必须署名"的强制弹窗（但**署名仍然是必须的**，见 2.3——放在说明文档、资源包 `pack.mcmeta` 的 description、或资源包内附的 `LICENSE.txt` 里都算数）
  You do **not** need to add a mandatory "credit required" pop-up in your server or resource pack (Attribution is **still required**, though — see 2.3. Putting it in the documentation, the `pack.mcmeta` description, or a bundled `LICENSE.txt` inside the resource pack all count.)

### 你必须做的 | 2.3 What You MUST Do

#### 保留署名 | ① Keep the Attribution

在**发布物中能被人看到的地方**（资源包说明、README、资源包内 `LICENSE.txt`、视频简介、作品说明页……）注明来源，推荐使用下面这行现成文案：
State the source **somewhere visible in what you publish** (resource pack description, README, a `LICENSE.txt` inside the resource pack, video description, project page, …). The ready-made line below is recommended:

```
Texture assets by XyLuoDYS
https://github.com/XyLuoDYS/XyLuoWeb-MCtools
```

```
贴图素材来源：XyLuoDYS
https://github.com/XyLuoDYS/XyLuoWeb-MCtools
```

放在哪里都行，形式不限，**核心是"别让人以为这是你画的"**
Anywhere is fine and the form doesn't matter — **the point is that nobody should be led to believe you drew it.**

#### 修改后建议标注（非强制，但很感谢） | ② Marking Modified Versions (not required, but much appreciated)

如果你改过这些贴图，推荐补一句：
If you modified the textures, adding this line is recommended:

```
Modified from textures by XyLuoDYS (https://github.com/XyLuoDYS/XyLuoWeb-MCtools)
```

```
基于 XyLuoDYS 的贴图修改（https://github.com/XyLuoDYS/XyLuoWeb-MCtools）
```

#### 衍生作品必须沿用「非商业」限制 | ③ Derivative Works Must Carry the Same Non-commercial Restriction

你可以自由修改，但**不能通过"改一下再卖"绕开非商业限制**。你对贴图的修改版、合成版、二次创作版，**同样只能用于非商业用途**，并且同样需要保留署名
You may modify freely, but you **may not get around the non-commercial restriction by "tweaking it and selling it"**. Your modified, composited or derivative versions are **likewise restricted to non-commercial use** and must also keep the attribution.

换句话说：修改权是给你的，不是给"转卖者"的
In other words: the right to modify is granted to you, not to a reseller.

### 你不能做的（禁止事项） | 2.4 What You Must Not Do (Prohibitions)

#### 商业使用（本条款的核心红线） | Commercial Use (the core red line of these terms)

「**商业使用**」指**以获取直接或间接经济利益为目的**的任何使用，包括但不限于：
**"Commercial use"** means any use **aimed at obtaining a direct or indirect economic benefit**, including but not limited to:

- **出售、转售、租赁**贴图本身，或按次 / 按期收费提供
  **Selling, reselling or renting** the textures themselves, or charging per use or per period
- 作为**付费资源包**、**付费模组**、**付费整合包**的一部分
  Inclusion in a **paid resource pack**, **paid mod** or **paid modpack**
- 作为**付费会员 / 订阅专属内容**（Patreon、爱发电付费档、Discord 付费频道等）
  Use as **paid members-only / subscriber-exclusive** content (Patreon, paid tiers on Afdian, paid Discord channels, etc.)
- 用于**营利性 MC 服务器**，特别是：
  Use on a **for-profit MC server**, in particular:
  - 出售道具、权限、称号、职业、经验加成等换取金钱的服务器
    servers that sell items, permissions, titles, classes, XP boosts, etc. for money
  - 出售会员 / VIP / 点券 / 月卡的服务器
    servers that sell memberships / VIP / in-game currency / monthly passes
  - 需要付费购买才能进入的服务器
    servers you must pay to enter
  - 出售赞助商位、以服务器为载体做商业推广的
    servers that sell sponsor slots or use the server as a vehicle for commercial promotion
- 用于**付费素材站 / 素材合集**、付费课程、付费图包
  Use in **paid asset marketplaces / asset bundles**, paid courses or paid image packs
- 用于广告物料、商业宣传、品牌营销
  Use in advertising material, commercial promotion or brand marketing
- 用于众筹、赞助、商业提案中作为卖点素材
  Use as selling-point material in crowdfunding, sponsorship or commercial proposals
- 印制成**实体周边**（亚克力、贴纸、抱枕、海报等）出售
  Printing onto **physical merchandise** (acrylics, stickers, cushions, posters, etc.) for sale
- 用于 **NFT / 数字藏品**等任何形式的代币化发行
  Use in **NFTs / digital collectibles** or any other form of tokenised issuance

#### 其他禁止 | Other Prohibitions

- **再许可（Sublicense）**：不得把本贴图以**其它许可条款**对外授权，尤其不得改以「可商用」的许可（如 MIT、CC0、CC BY）发布
  **Sublicensing**: you must not license these textures out under **any other terms**, and in particular must not re-release them under a commercially permissive license (MIT, CC0, CC BY, etc.)
- **冒充原创**：不得声称这些贴图是你**从零开始独立创作**的
  **Claiming authorship**: you must not claim you **created these textures from scratch yourself**
- **移除或篡改署名**信息
  **Removing or altering attribution** information
- **打包成素材包转卖**：即使做了修改，也不得以「素材合集」为主要卖点出售
  **Bundling into an asset pack for resale**: even if modified, you must not sell them with the "asset collection" itself as the main selling point
- 违反公序良俗的用途（诽谤中伤、违法活动等）
  Uses that violate public order and decency (defamation, illegal activity, etc.)

### 场景对照表（最常用，直接查这里） | 2.5 Scenario Table (Most Common — Look Here First)

| 使用场景<br>Scenario | 允许？<br>Allowed? | 说明<br>Notes |
| --- | :---: | --- |
| 自己电脑上随便用 / 自己玩<br>Use on your own computer / for your own play | ✅ | 完全自由<br>Completely free |
| 做**免费的**资源包，公开下载<br>Make a **free** resource pack for public download | ✅ | 需署名<br>Attribution required |
| 打包进**自己服务器**的资源包（免费服务器）<br>Bundle into **your own server's** resource pack (free server) | ✅ | 需署名<br>Attribution required |
| **只接受捐赠、捐赠不换取任何权益**的服务器<br>Server that **accepts donations only, with no benefit in return** | ✅ | 视为非商业<br>Treated as non-commercial |
| 免费整合包 / 地图 / 小游戏里使用<br>Use in free modpacks / maps / minigames | ✅ | 需署名<br>Attribution required |
| 视频、直播、图文教程里用到<br>Use in videos, streams, written tutorials | ✅ | 见下方说明<br>See the note below |
| 改色 / 重绘后发布自己的版本<br>Recolour / redraw and release your own version | ✅ | 仍需**非商用** + 署名<br>Still **non-commercial** + attribution |
| 放进 Wiki、攻略站做配图<br>Use as an illustration on a wiki or guide site | ✅ | 需署名<br>Attribution required |
| 作为**付费**资源包 / 付费模组的一部分<br>Part of a **paid** resource pack / paid mod | ❌ | 需[单独授权](#想商用怎么办--26-what-if-you-need-commercial-use)<br>Requires [separate permission](#想商用怎么办--26-what-if-you-need-commercial-use) |
| 用于**营利性服务器**（卖道具 / 会员 / 点券）<br>Use on a **for-profit server** (selling items / memberships / currency) | ❌ | 需单独授权<br>Requires separate permission |
| 做**付费会员专属**资源包<br>Make a **paid members-only** resource pack | ❌ | 需单独授权<br>Requires separate permission |
| 印成实体周边出售<br>Print onto merchandise for sale | ❌ | 需单独授权<br>Requires separate permission |
| 上传到素材站供他人付费下载<br>Upload to an asset site for others to pay for | ❌ | 需单独授权<br>Requires separate permission |
| 把贴图集合起来当素材包出售<br>Assemble the textures into a pack for sale | ❌ | 即使改过也不行<br>Not even if modified |
| NFT / 数字藏品<br>NFTs / digital collectibles | ❌ | 一律禁止<br>Never allowed |
| 声称是自己从零画的<br>Claiming you drew them from scratch | ❌ | 一律禁止<br>Never allowed |

**关于视频 / 直播**：贴图只是视频里的**辅助元素**（不是你在卖的东西），所以 B 站 / YouTube 的**平台广告分成不影响**你使用。但如果是**以贴图为核心卖点的付费教程 / 付费素材**，那就属于商业使用，需要单独授权。
**On videos and live streams:** the textures are only an **incidental element** of the video — they are not what you are selling — so **platform ad revenue sharing** on Bilibili / YouTube **does not prevent you from using them**. However, if you make a **paid tutorial or paid asset pack whose main selling point is the textures**, that counts as commercial use and requires separate permission.

### 想商用怎么办？ | 2.6 What If You Need Commercial Use?

完全理解有些项目需要商业化。请通过 **仓库 Issue** 联系作者，说明你的用途，作者会视情况给予**书面授权**（可能免费、也可能收取授权费，视具体场景而定）。
Some projects do need to be commercialised — that is completely understandable. Please contact the author through a **repository Issue** explaining your intended use, and the author will grant **written permission** as appropriate (it may be free, or it may carry a licence fee, depending on the scenario).

**未经书面授权的商业使用，视为侵权。**
**Commercial use without written permission constitutes infringement.**

通常来说，**小规模、非营利性质的组织**（如学校社团、公益服务器）很容易拿到免费授权，别不好意思问呀～
As a rule, **small-scale, non-profit organisations** (school clubs, public-benefit servers) find it easy to obtain free permission — don't be shy about asking.

---

## 三、B 类：Minecraft 原版素材（`vanilla/`）—— 版权归 Mojang | 3. Class B: Vanilla Minecraft Assets (`vanilla/`) — Copyright Mojang

`vanilla/` 目录下的贴图（`generic_54.png`、`hopper.png`、`beacon.png` 等各容器界面贴图）取自 **Minecraft（我的世界）** 游戏本体资源，其著作权、商标权及相关权利**归 Mojang Studios 与 Microsoft 所有。**
The textures in the `vanilla/` directory (`generic_54.png`, `hopper.png`, `beacon.png` and the other container GUI textures) are taken from the **Minecraft** game assets. The copyright, trademark and related rights in them **belong to Mojang Studios and Microsoft.**

**本仓库作者不享有这些素材的任何权利，也无权对你授予任何许可。**
**The author of this repository holds no rights in these assets and is unable to grant you any license for them.**

因此：
Therefore:

- 本仓库**无法**对 B 类素材授予任何许可；
  This repository is **unable** to grant any license for Class B assets;
- 本文件第二节的「禁止商用」条款**不适用于** B 类素材（作者无权附加此限制，也不为此承担责任）；
  The "no commercial use" clause in Section 2 of this file **does NOT apply** to Class B assets (the author has no authority to impose it and accepts no liability for it);
- 你对 B 类素材的任何使用，**必须自行遵守** [Minecraft 使用准则（Usage Guidelines）](https://www.minecraft.net/usage-guidelines) 与 [Minecraft EULA](https://www.minecraft.net/eula)；
  Any use you make of Class B assets **must comply with** the [Minecraft Usage Guidelines](https://www.minecraft.net/usage-guidelines) and the [Minecraft EULA](https://www.minecraft.net/eula);
- 上述准则的核心限制包括：**未经 Mojang / Microsoft 书面许可，不得将 Minecraft 的名称、品牌、素材用于商业用途**，也不得再分发游戏文件或其修改版；
  The key restrictions in those guidelines include: **without written permission from Mojang / Microsoft you may not use the Minecraft name, brand or assets for commercial purposes**, and you may not redistribute game files or modified versions of them;
- 本仓库收录这些文件**仅为演示工具功能**（按原版容器真实尺寸对齐、预览导出效果），**不构成对游戏资源的再分发许可**。
  These files are included in this repository **solely to demonstrate the tool's features** (aligning to real vanilla container dimensions, previewing the export result) and **do not constitute a license to redistribute game assets**.

使用本工具导出的成品中若包含原版贴图，该成品的商用可行性同样受上述准则约束。**如需完全规避版权风险，请改用 `mine/` 下的自绘贴图。**
If a result exported with this tool contains vanilla textures, its commercial viability is likewise governed by the guidelines above. **To avoid copyright risk entirely, use the hand-drawn textures in `mine/` instead.**

---

## 四、C 类：站点插画（`public/images/`）—— AI 生成 | 4. Class C: Site Illustrations (`public/images/`) — AI-generated

`public/images/` 下的站点配图（`index.png` Hero 大图、`card-mccolor.png`、`card-mcmenu.png` 工具卡片封面、`bg/bg.png` 全站背景）**均为作者使用 AI 图像生成模型（GPT Image）产出的图片。**
The site images under `public/images/` (the `index.png` hero image, the `card-mccolor.png` and `card-mcmenu.png` tool card covers, and the `bg/bg.png` site-wide background) are **all produced by the author using an AI image generation model (GPT Image).**

由于不是任何画师的手绘作品，**不存在第三方画师的著作权问题**，版权归属与授权能力等同于作者原创素材。
Because they are not hand-drawn work by any illustrator, **no third-party illustrator's copyright is involved**, and the ownership and licensing capacity is equivalent to the author's own original assets.

因此：
Therefore:

- 这些图片的使用条件与[第二节 A 类](#二a-类自绘贴图mine-仅限非商业使用--2-class-a-hand-drawn-textures-mine--non-commercial-use-only)**完全一致**：**可免费用、可改、可打包进资源包，但不得商用**；
  The terms of use for these images are **identical** to [Section 2, Class A](#二a-类自绘贴图mine-仅限非商业使用--2-class-a-hand-drawn-textures-mine--non-commercial-use-only): **free to use, free to modify, may be bundled into resource packs, but not for commercial purposes**;
- 署名方式同上：`插画素材来源：XyLuoDYS（https://github.com/XyLuoDYS/XyLuoWeb-MCtools）`
  Attribution is as above: `Illustrations by XyLuoDYS (https://github.com/XyLuoDYS/XyLuoWeb-MCtools)`
- 尺寸、比例与替换方式见 [`public/images/README.md`](./public/images/README.md)。
  Sizes, aspect ratios and how to replace them are documented in [`public/images/README.md`](./public/images/README.md).

**本项目的历史提醒**：本仓库早期曾使用某位画师的插画作品，因该画师明确声明「禁止转载、禁止二次利用」，已于 2026-09 全部下架并替换为 AI 生成图。因此**请勿**再向 `public/images/` 提交任何来自第三方画师、图库、动漫站的转载图——那会让整个仓库的素材授权变得不干净。详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。
**A note on this project's history:** an earlier version of this repository used illustrations by an artist who explicitly stated that "reposting and secondary use are prohibited". All of them were taken down in 2026-09 and replaced with AI-generated images. Please therefore **do not** submit any reposted images from third-party artists, image galleries or anime sites to `public/images/` — doing so would taint the asset licensing of the whole repository. See [CONTRIBUTING.md](./CONTRIBUTING.md).

另需说明：早期版本的 `src/utils/animeImage.js` 含一处**运行时降级逻辑** ——本地图片未配置时会从第三方图库（nekos.best / waifu.pics / pic.re）拉取图片。**该逻辑已于 2026-09 彻底移除**：那些图库上的图片多为第三方画师的原创作品、授权状态无法核实，与本条款的立场相冲突。现在前端**只使用 `public/images/` 下的本地图片**，不发起任何第三方图库请求。
One more note: an earlier version of `src/utils/animeImage.js` contained a **runtime fallback** that fetched images from third-party APIs (nekos.best / waifu.pics / pic.re) when a local image was not configured. **That fallback was removed entirely in 2026-09**, because images on those APIs are mostly third-party artists' works whose licensing status cannot be verified, which conflicts with the position taken in these terms. The front end now uses **only the local files under `public/images/`** and makes no third-party image API requests.

---

## 五、D 类：字体（`public/fonts/`） | 5. Class D: Fonts (`public/fonts/`)

| 文件<br>File | 版权 / 授权<br>Copyright / License | 可否商用<br>Commercial? |
| --- | --- | --- |
| `Mojang-Regular.ttf` | Copyright (c) b.tenthousand 2013，通过 FontStruct 制作，采用 **Creative Commons CC0 1.0 公共领域奉献**<br>Copyright (c) b.tenthousand 2013, made with FontStruct, released under **Creative Commons CC0 1.0 Public Domain Dedication** | 可商用（CC0 无限制）<br>Yes (CC0, no restrictions) |
| `gnu-unifont-full.ttf` | Copyright (c) 2016 Roman Czyborra, Paul Hardy, Qianqian Fang, Andrew Miller et al., dual-licensed under the **SIL Open Font License 1.1** and **GPL v2+ (with font embedding exception)**<br>Copyright (c) 2016 Roman Czyborra, Paul Hardy, Qianqian Fang, Andrew Miller 等，**SIL Open Font License 1.1** + **GPL v2+（含字体嵌入例外）** 双授权 | 可商用（保留字体名称 "Unifont" 即可）<br>Yes (just keep the reserved font name "Unifont") |

字体属于**独立作品**，其使用须遵守**各自的原始授权**，**不受本文件第二节限制**。
Fonts are **independent works**. Their use is governed by **their own original licenses** and is **not subject to Section 2 of this file**.

`Mojang-Regular.ttf` 只是**同名**，它是 FontStruct 上的社区复刻字体（CC0），**不是** Mojang 官方发布的字体文件。所以它可以自由商用，不适用第三节的限制。
`Mojang-Regular.ttf` merely **shares a name**: it is a community recreation hosted on FontStruct (CC0) and is **not** an official Mojang-released font file. It may therefore be used commercially without restriction, and Section 3 does not apply to it.

---

## 六、贡献者条款 | 6. Contributor Terms

**欢迎向本仓库贡献内容！** 尤其是 `mine/` 下的自绘贴图，非常欢迎大家投稿
**You are very welcome to contribute to this repository!** Especially hand-drawn textures under `mine/` — contributions are warmly encouraged

**向本仓库提交 Pull Request，即视为你已阅读并同意以下条款。**
**By submitting a pull request to this repository, you are deemed to have read and accepted the following terms.**

### 原创保证 | 6.1 Warranty of Originality

你保证所提交的全部内容（代码、贴图、图片、文档）**均为你的原创作品**，或你已获得权利人的充分授权，可以按本条款提交。
You warrant that everything you submit (code, textures, images, documentation) is **your own original work**, or that you have obtained sufficient authorisation from the rights holder to submit it under these terms.

**具体来说，你确认：**
**Specifically, you confirm that:**

- 贴图是你**自己绘制**的（不是从 Minecraft 原版、其它整合包、素材站、图库、Pixiv 等处拿来的）；
  the textures were **drawn by you yourself** (not taken from vanilla Minecraft, other modpacks, asset sites, image galleries, Pixiv, etc.);
- 你没有把 AI 生成图当作"自己手绘"提交；
  you have not submitted AI-generated images as "your own hand-drawn work";
- 如果素材里包含第三方元素（字体、笔刷、参考图等），你已确认它们允许这样使用。
  where the material contains third-party elements (fonts, brushes, reference images, etc.), you have confirmed that they may be used in this way.

### 授权范围 | 6.2 Scope of the Grant

你同意：
You agree that:

1. **代码贡献**：以 **[MIT 协议](./LICENSE)** 授权给本项目，由项目作者随项目一同对外许可；
   **Code contributions** are licensed to this project under the **[MIT License](./LICENSE)**, and the project author licenses them outwards as part of the project;
2. **素材贡献**（如 `mine/` 下的贴图）：以 **[本文件第二节](#二a-类自绘贴图mine-仅限非商业使用--2-class-a-hand-drawn-textures-mine--non-commercial-use-only)「仅限非商业使用」的条款**授权给本项目，由项目作者统一对外许可；
   **Asset contributions** (such as textures under `mine/`) are licensed to this project under the **[non-commercial terms of Section 2](#二a-类自绘贴图mine-仅限非商业使用--2-class-a-hand-drawn-textures-mine--non-commercial-use-only) of this file**, and the project author licenses them outwards on a unified basis;
3. 上述授权是**永久、不可撤销、非独占、免版税**的。
   the grants above are **perpetual, irrevocable, non-exclusive and royalty-free**.

### 你保留的权利 | 6.3 Rights You Keep

- 你**保留**自己作品的**著作权**；
  You **retain the copyright** in your work;
- 你可以在**自己的渠道**自由使用、发布、售卖你的作品（本条款不限制你对自有作品的处置）；
  You may freely use, publish and sell your work through **your own channels** (these terms do not restrict how you deal with your own work);
- 你可以同时在别的地方以别的许可发布同一张贴图（授权是**非独占**的）。
  You may publish the same texture elsewhere under a different license at the same time (the grant is **non-exclusive**).

### 其他 | 6.4 Other

- **不再单独主张**：贡献被合并后，你不再就该贡献向本项目的使用者单独主张权利。
  **No separate claims.** Once a contribution has been merged, you will not assert rights against users of this project in respect of that contribution.
- **署名**：项目作者会尽力在致谢中保留你的署名，但**不承诺特定形式的署名位置**。
  **Attribution.** The project author will make a reasonable effort to keep your name in the credits, but **does not promise any particular form or placement** of credit.
- **不承诺收录**：作者保留不合并、或日后移除某个贡献的权利（例如发现素材来源存疑时）。若你的贡献被移除，作者会尽量说明原因。
  **No guarantee of inclusion.** The author reserves the right not to merge a contribution, or to remove it later (for example if its provenance becomes questionable). If your contribution is removed, the author will try to explain why.

如果你**不同意**上述条款，请不要提交 PR —— 欢迎改为提 Issue 反馈问题或建议，同样非常有价值！若你希望保留自己贴图的独立授权，请**不要**把它提交进本仓库，而是单独发布并在 Issue 中给出链接。
If you **do not agree** with the terms above, please do not submit a PR — opening an Issue with feedback or suggestions is very welcome instead and is just as valuable! If you want to keep independent licensing for your own textures, please **do not** submit them to this repository; publish them separately and link them in an Issue.

### 贡献贴图的具体做法 | 6.5 How to Contribute Textures in Practice

见 [CONTRIBUTING.md 第三节](./CONTRIBUTING.md)（含尺寸、命名、透明通道等要求）。
See [Section 3 of CONTRIBUTING.md](./CONTRIBUTING.md) (covering size, naming, transparency requirements and more).

---

## 七、常见问题（FAQ） | 7. Frequently Asked Questions (FAQ)

每条问题的中文回答在前，英文回答紧随其后。
The Chinese answer to each question comes first, with the English answer immediately below.

<details>
<summary><b>Q：我可以在自己的 MC 服务器里用这些贴图吗？ / Can I use these textures on my own MC server?</b></summary>

**可以**，只要你的服务器**不是以营利为目的**。
**Yes**, as long as your server is **not run for profit**.

- 免费服务器
  Free servers
- 只接受无条件捐赠（捐赠不换取任何权益）的服务器
  Servers that accept unconditional donations only (with nothing given in return)
- 出售道具 / 会员 / 点券 / 称号的服务器（需单独授权）
  Servers selling items / memberships / in-game currency / titles (separate permission required)
- 需要付费才能进入的服务器（需单独授权）
  Servers you must pay to enter (separate permission required)

</details>

<details>
<summary><b>Q：我可以把贴图打包进资源包发给玩家吗？ / Can I bundle the textures into a resource pack for players?</b></summary>

**可以。** 无论是私人使用、公开免费下载，还是作为你服务器的强制/推荐资源包，都没问题。记得在资源包说明里保留署名（放进 `pack.mcmeta` 的 description或附一个 `LICENSE.txt` 都可以）。
**Yes.** Whether for private use, for public free download, or as your server's mandatory/recommended resource pack, it is all fine. Just remember to keep the attribution in the resource pack documentation (the `pack.mcmeta` description or a bundled `LICENSE.txt` both work).

</details>

<details>
<summary><b>Q：我可以改颜色 / 重绘后发布吗？ / Can I recolour or redraw and then publish?</b></summary>

**可以**，修改完全自由（改色、裁剪、加笔、合成、改分辨率……）。
**Yes** — modification is completely unrestricted (recolour, crop, paint over, composite, change resolution…).

但有两个前提：
But there are two conditions:
1. 修改后的版本**同样不得商用**（不能"改一下再卖"）；
   The modified version **may not be used commercially either** ("tweak it and sell it" is not allowed);
2. 记得保留署名，建议补一句「基于 XyLuoDYS 的贴图修改」。
   Keep the attribution, and ideally add "Modified from textures by XyLuoDYS".

</details>

<details>
<summary><b>Q：署名要怎么做？ / How exactly do I give attribution?</b></summary>

Put it **somewhere visible in what you publish**; the form doesn't matter.

Common places: a resource pack's `LICENSE.txt` or `pack.mcmeta` description, a modpack description, a README, a video description, a project page, the footer of a wiki page.

```
Texture assets by XyLuoDYS
https://github.com/XyLuoDYS/XyLuoWeb-MCtools
```

放在**发布物中能被人看到的地方**即可，形式不限：

```
贴图素材来源：XyLuoDYS
https://github.com/XyLuoDYS/XyLuoWeb-MCtools
```

常见位置：资源包的 `LICENSE.txt` / `pack.mcmeta` 描述、整合包说明、README、视频简介、作品说明页、Wiki 页面底部。

</details>

<details>
<summary><b>Q：我想贡献贴图，要怎么做？ / I'd like to contribute textures — how?</b></summary>

超欢迎呀
Very welcome!

1. Fork 本仓库；
   Fork this repository;
2. 把你画的 PNG 放进 `mine/`；
   Put the PNGs you drew into `mine/`;
3. 提 PR，并在描述里确认：**是你自己画的 + 同意第六节的贡献者条款**。
   Open a PR and confirm in the description that **you drew them yourself and that you accept the contributor terms in Section 6**.

尺寸、命名等具体要求见 [CONTRIBUTING.md](./CONTRIBUTING.md)
For size, naming and other requirements, see [CONTRIBUTING.md](./CONTRIBUTING.md).

</details>

<details>
<summary><b>Q：我想商用，怎么申请？ / I need commercial use — how do I apply?</b></summary>

请提 **[Issue](https://github.com/XyLuoDYS/XyLuoWeb-MCtools/issues)** 说明用途，作者会给予书面授权。小规模、非营利性质的组织通常很容易拿到免费授权。
Please open an **[Issue](https://github.com/XyLuoDYS/XyLuoWeb-MCtools/issues)** explaining your intended use and the author will grant written permission. Small-scale, non-profit organisations can usually obtain free permission easily.

</details>

<details>
<summary><b>Q：我发现有人违反了这个条款，怎么办？ / I've found someone violating these terms — what should I do?</b></summary>

欢迎提 Issue 告知。请附上对方的使用场景与链接，作者会核实后处理。
Please open an Issue and let the author know. Include the scenario and a link so the author can verify and follow up.

</details>

<details>
<summary><b>Q：我不小心侵权了，怎么办？ / I infringed by accident — what now?</b></summary>

别慌，主动联系整改就好。请提 Issue 说明情况，把相关素材下架或补上署名后即可，作者通常不会追究善意的无意误用
Don't panic — just get in touch and fix it. Open an Issue explaining the situation and either take the material down or add the missing attribution, and that is that. The author will not normally pursue good-faith, unintentional misuse.

</details>

<details>
<summary><b>Q：我能不能把 <code>mine/</code> 的贴图改以 MIT / CC0 之类的许可发布？ / Can I re-release the <code>mine/</code> textures under MIT / CC0 or similar?</b></summary>

**不能。** 本条款明确禁止再许可（Sublicense）。你可以在自己的项目里**使用**这些贴图，但不能**替作者**重新定义它们的授权条款
**No.** These terms explicitly prohibit sublicensing. You may **use** the textures in your own projects, but you cannot **redefine their license terms on the author's behalf**.

</details>

<details>
<summary><b>Q：网页代码是 AI 生成的，我可以随便用吗？ / The web code is AI-generated — can I use it freely?</b></summary>

可以。代码由 AI 生成，**不涉及第三方的人工代码著作权**，本项目直接以 **[MIT 协议](./LICENSE)** 开放：自由使用、修改、分发，**甚至可以商用**（保留版权与许可声明即可）。
Yes. The code was generated by AI and **involves no third-party human-authored code**. This project is released directly under the **[MIT License](./LICENSE)**: free to use, modify and distribute, **including commercial use** (just keep the copyright and licence notice).

但请分清：**代码归代码，素材归素材**。代码的宽松授权**不会**延伸到 `mine/` 贴图与 `public/images/` 插画，那两类素材仍然是**仅限非商业使用**。
But mind the distinction: **code and assets are governed separately.** The permissive licence on the code does **not** extend to the `mine/` textures or the `public/images/` illustrations — both remain **non-commercial only**.

</details>

<details>
<summary><b>Q：这些条款会变吗？ / Can these terms change?</b></summary>

作者保留随时修订本条款的权利。修订**不影响**已按旧条款合法发布的使用（不溯及既往），但**新获取**的版本适用当时的最新条款。
The author reserves the right to revise these terms at any time. A revision **does not affect** uses that were lawfully published under the previous terms (there is no retroactive effect), but versions **newly obtained** after a revision are subject to the latest terms then in force.

</details>

---

## 八、免责声明 | 8. Disclaimer

- 本文件由项目作者根据自身意图编写，**不构成法律意见**。
  This document was written by the project author to express their own intent and **does not constitute legal advice**.
- 涉及商业用途的决策，建议咨询专业法律人士。
  For decisions involving commercial use, consulting a qualified legal professional is recommended.
- 本文件未授予任何**商标权、形象权或专利权**。
  This document grants no **trademark, personality or patent rights**.
- 不得使用作者名称、仓库名称作为衍生产品的名称或商标。
  The author's name and the repository name must not be used as the name or trademark of a derivative product.
- 本项目为个人非官方作品，与 Mojang Studios / Microsoft 无任何关联。
  This is an unofficial personal project, unaffiliated with Mojang Studios / Microsoft.

NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.

---

## 附：如何引用本条款 | Appendix: How to Reference These Terms

如果你想在自己的项目里转述本条款，可以这样写：
If you want to restate these terms in your own project, you can write:

本素材采用 **XyLuoDYS 非商业素材许可 v1.0**（[LICENSE-ASSETS.md](https://github.com/XyLuoDYS/XyLuoWeb-MCtools/blob/main/LICENSE-ASSETS.md)），允许非商业使用与自由修改，禁止商业使用。
This asset is licensed under the **XyLuoDYS Non-Commercial Asset License v1.0** ([LICENSE-ASSETS.md](https://github.com/XyLuoDYS/XyLuoWeb-MCtools/blob/main/LICENSE-ASSETS.md)): non-commercial use and free modification are permitted; commercial use is prohibited.
