# 站点图片资源说明（`public/images/`） | Site Image Assets (`public/images/`)

本目录下的图片**全部使用 AI 图像生成模型（GPT Image / GPT image2）生成**，不存在第三方画师的著作权问题。
Every image in this directory is **generated with an AI image model (GPT Image / GPT image2)**. There is no third-party illustrator's copyright involved.

本文件为**中英对照**：**中文在前，英文紧随其后**。
This document is **bilingual**: **Chinese first, with the English text immediately below.**

**授权条款**：与 `mine/` 自绘贴图相同 —— **免费用、免费改，但不得商用**。完整条款见根目录 [LICENSE-ASSETS.md 第四节](../../LICENSE-ASSETS.md)。商用请提 [Issue](https://github.com/XyLuoDYS/XyLuoWeb-MCtools/issues) 联系作者。
**License:** identical to the hand-drawn textures in `mine/` — **free to use, free to modify, but not for commercial purposes**. The full terms are in [Section 4 of LICENSE-ASSETS.md](../../LICENSE-ASSETS.md). For commercial use, please open an [Issue](https://github.com/XyLuoDYS/XyLuoWeb-MCtools/issues) to contact the author.

---

## 一、图片清单 | 1. Image Inventory

| 文件 File | 用途 Purpose | 尺寸 Size | 比例 Ratio | 在代码中的引用 Reference in code |
| --- | --- | --- | --- | --- |
| `index.png` | 首页 Hero 大图<br>Homepage hero image | 1536×1024 | 1.50 | `src/config/images.js` → `hero` |
| `card-mccolor.png` | 工具卡片封面（颜色代码生成）<br>Tool card cover (colour code generator) | 1774×887 | 2.00 | `src/config/images.js` → `card` |
| `card-mcmenu.png` | 工具卡片封面（贴图菜单生成）<br>Tool card cover (texture menu generator) | 1774×887 | 2.00 | `src/config/images.js` → `menu` |
| `bg/bg.png` | 全站背景图<br>Site-wide background | 1672×941 | 1.78 | `src/config/images.js` → `bg` |

`bg` 现在只有 **1 张**。它原本设计成**多图随机池**（每次刷新随机选一张），想恢复随机效果的话，往 `bg/` 里多丢几张，再把路径都填进 `src/config/images.js` 的 `bg` 数组即可。
`bg` currently contains **only one image**. It was originally designed as a **multi-image random pool** (a different image picked on each page load). To bring that back, drop more images into `bg/` and list all their paths in the `bg` array in `src/config/images.js`.

---

## 二、替换方法 | 2. How to Replace an Image

1. 把你的图片放进本目录；
   Put your image into this directory;
2. 编辑 [`src/config/images.js`](../../src/config/images.js) 里对应的路径。
   Edit the corresponding path in [`src/config/images.js`](../../src/config/images.js).

- `card` and `menu` are **two independent keys** — to make both cards use the same image, just point them at the same path.
- Leaving a key empty (`''`) or deleting it makes the front end fall back to the default paths in `src/utils/animeImage.js`. This project **never requests any third-party image API** — every image comes from this directory.

```js
export const LOCAL_IMAGES = {
  bg: ['/images/bg/bg.png'],      // 数组 = 随机池；也可写单个字符串
  hero: '/images/index.png',      // 首页 Hero
  card: '/images/card-mccolor.png', // 「颜色代码生成」卡片
  menu: '/images/card-mcmenu.png'   // 「贴图菜单生成」卡片
}
```

- `card` 和 `menu` 是**两个独立的键** —— 想让两张卡片用同一张图，填一样的路径即可。
- 把某个键留空 `''` 或直接删掉，前端会回退到 `src/utils/animeImage.js` 里的兜底路径。本项目**不请求任何第三方图库**，所有图片都来自本目录。

---

## 三、出图比例（换图前必看） | 3. Output Aspect Ratios (Read Before Replacing)

前端各处对图片的**显示区域比例**和图片**文件比例**并不相同，浏览器会用 `object-fit: cover`（背景图是 `background-size: cover`）自动裁切，所以**按显示区域比例出图，才不会被裁掉主体**。
Across the site, the **aspect ratio of the display area** differs from the **aspect ratio of the image file**. The browser crops automatically via `object-fit: cover` (and `background-size: cover` for the background), so **generate at the display area's aspect ratio** if you don't want the subject cropped.

| 位置 Placement | 显示区实测尺寸<br>Measured display area | 显示比例<br>Display ratio | 当前图片比例<br>Current image ratio | 实际裁切情况<br>Actual cropping |
| --- | --- | --- | --- | --- |
| Hero（首页大图）<br>Hero (homepage) | ~505×319<br>约 505×319 | **1.58 : 1** | 1.50 | 左右各裁一点点，几乎无损<br>Slight crop on both sides, nearly lossless |
| 工具卡片封面<br>Tool card cover | ~374×130<br>约 374×130 | **2.88 : 1** | 2.00 | **上下裁掉约 30%**<br>**~30% cropped top and bottom** |
| 全站背景<br>Site background | 随视口变化<br>Varies with viewport | 视口比例<br>Viewport ratio | 1.78 | 按 `cover` 铺满，边缘可能被裁<br>Filled with `cover`; edges may be cropped |

### 两条实用建议 | Two Practical Tips

1. **卡片封面是最"扁"的（2.88:1）**，但当前图是 2:1，所以上下会被裁掉不少。出图时请把**人脸 / 主体放在画面垂直方向的中间**，别贴顶也别贴底，否则裁完容易只剩半个头。
   **The card cover is by far the widest (2.88:1)**, while the current image is 2:1, so a fair amount is cropped top and bottom. Keep the **face / subject vertically centred** when generating — not flush against the top or bottom edge — or you may end up with only half a head after cropping.
2. **背景图**会被 `cover` 铺满 + 轻微模糊（`global.css` 里 `inset: -8px` + blur），所以细节看不清，**不用出太精细**，≥1920×1080 即可。
   **The background image** is stretched with `cover` plus a slight blur (`inset: -8px` + blur in `global.css`), so fine detail is invisible. **There is no need for high precision** — ≥1920×1080 is enough.

如果你懒得算比例，直接出 **2.88:1（例如 1774×616）** 的图给卡片用，就完全不会被裁了。
If you'd rather not do the maths, just generate at **2.88:1 (e.g. 1774×616)** for the card covers and nothing will be cropped at all.

---

## 四、生成与后处理流程（备查） | 4. Generation & Post-processing Pipeline (for reference)

当前图片的产出流程：
How the current images were produced:

1. **生成**：用 GPT Image（GPT image2）文生图，主题围绕「像素方块世界 + 二次元少女」，与站点的 Minecraft 工具定位保持一致；
   **Generation** — text-to-image with GPT Image (GPT image2), themed around "a pixel-block world + anime girls" to match the site's Minecraft tooling focus;
2. **尺寸**：Hero 出 3:2，卡片出 2:1，背景出 16:9；
   **Sizes** — hero at 3:2, card covers at 2:1, background at 16:9;
3. **裁切**：按上文第三节的显示比例做中心裁切（这一步没做完美，所以当前卡片图仍会被裁）；
   **Cropping** — centre-cropped to the display ratios listed in Section 3 above (this step was imperfect, which is why the current card images are still cropped);
4. **压缩**：PNG 格式，`optimize` 压缩。
   **Compression** — PNG with `optimize`.

原始生成图保存在项目根目录的 `.workbuddy/generated-images/`（该目录已在 `.gitignore` 中忽略，不会提交到仓库）。
The original generated images are kept in `.workbuddy/generated-images/` at the repository root (that directory is listed in `.gitignore` and is not committed).

---

## 五、请勿提交第三方图片 | 5. Do Not Submit Third-Party Images

`public/images/` **只收 AI 生成图**。

- **不要**提交从 Pixiv / 图库 / 动漫站 / 搜索引擎存的转载图 —— 版权不属于你；
  **Do not** submit reposted images from Pixiv, image galleries, anime sites or search engines — you do not hold the copyright;
- **不要**提交第三方画师的手绘作品（即使对方"只打了素材标签"也要确认说明里的条款）；
  **Do not** submit hand-drawn work by a third-party artist (even if they merely tagged it as "material", you must still check the terms in their description);
- 想贡献手绘贴图？请投到根目录的 [`mine/`](../../mine/README.md)，那里欢迎大家投稿。
  Want to contribute hand-drawn textures? Send them to [`mine/`](../../mine/README.md) at the repository root — contributions are welcome there.

An earlier version of this project used illustrations by an artist who explicitly stated "reposting and secondary use are prohibited". All of them were removed and replaced with AI-generated images. This red line really is enforced.

本项目早期曾使用某位画师的插画，因该画师明确声明「禁止转载、禁止二次利用」，已全部下架并替换为 AI 生成图。所以这条红线是真的会执行的。
`public/images/` accepts **AI-generated images only**.

---

## 六、补充说明：本项目不请求第三方图库 | 6. Note: No Third-Party Image APIs

本目录是站点配图的**唯一来源**。前端不会（也不再）向任何第三方图库请求图片。
This directory is the **sole source** of the site's images. The front end does not — and no longer — request images from any third-party API.

**历史**：早期版本的 `src/utils/animeImage.js` 有一处运行时降级逻辑，本地图片缺失时会依次向 nekos.best、waifu.pics、pic.re 请求图片。那些站点上的图片多为第三方画师的原创作品、**授权状态无法核实**，与本仓库的素材条款立场冲突，因此**该逻辑已于 2026-09 彻底移除**。
**History:** an earlier version of `src/utils/animeImage.js` had a runtime fallback that queried nekos.best, waifu.pics and pic.re when a local image was missing. Images on those sites are mostly third-party artists' original works whose **licensing status cannot be verified**, which conflicts with this repository's asset terms. **That fallback was removed entirely in 2026-09.**
