# Minecraft 原版容器贴图 | Vanilla Minecraft Container Textures

本目录下的贴图取自 **Minecraft（我的世界）** 游戏本体资源，用于「贴图菜单生成」工具页中**按原版容器真实尺寸对齐 / 预览导出效果**（例如 `generic_54.png` = 176×222，`hopper.png` = 176×133，`beacon.png` = 230×219）。
The textures in this directory are taken from the **Minecraft** game assets. They are used by the "Texture Menu Generator" tool page to **align to the real vanilla container dimensions and preview the exported result** (e.g. `generic_54.png` = 176×222, `hopper.png` = 176×133, `beacon.png` = 230×219).

本文件为**中英对照**：**中文在前，英文紧随其后**。
This document is **bilingual**: **Chinese first, with the English text immediately below.**

## 版权声明（请务必阅读） | Copyright Notice (Please Read)

这些贴图的著作权、商标权及相关权利均归 **Mojang Studios 与 Microsoft** 所有。
The copyright, trademark and related rights in these textures belong to **Mojang Studios and Microsoft**.

- 本仓库作者**不享有**这些素材的任何权利，**无权**对其授予任何许可；
  The author of this repository **holds no rights** in these assets and is **unable to grant you any license** for them;
- 根目录 [LICENSE-ASSETS.md](../LICENSE-ASSETS.md) 第二节「禁止商用」的条款 **不适用于本目录**（作者无此权限，亦不为此承担责任）；
  The "no commercial use" clause in Section 2 of [LICENSE-ASSETS.md](../LICENSE-ASSETS.md) **does NOT apply** to this directory (the author has no authority to impose it and accepts no liability for it);
- 你对这些素材的任何使用，必须自行遵守 [Minecraft 使用准则（Minecraft Usage Guidelines）](https://www.minecraft.net/usage-guidelines) 与 [Minecraft EULA](https://www.minecraft.net/eula)。
  Any use you make of these assets must comply with the [Minecraft Usage Guidelines](https://www.minecraft.net/usage-guidelines) and the [Minecraft EULA](https://www.minecraft.net/eula).

其核心限制包括：**未经 Mojang / Microsoft 书面许可，不得将 Minecraft 的名称、品牌、素材用于商业用途**；不得再分发游戏文件或其修改版。
The key restriction is that **you may not use the Minecraft name, brand or assets for commercial purposes without written permission from Mojang / Microsoft**, and you may not redistribute game files or modified versions of them.

本仓库收录这些文件**仅为演示工具功能**，不构成对游戏资源的再分发许可。
These files are included in this repository **solely to demonstrate the tool's features**; their presence here does not constitute a license to redistribute game assets.

使用本工具导出的成品中若包含原版贴图，该成品能否商用同样受上述准则约束。如需完全规避版权风险，请改用 `mine/` 下的自绘贴图。
If a result exported with this tool contains vanilla textures, whether that result may be used commercially is likewise governed by the guidelines above. To avoid copyright risk entirely, use the hand-drawn textures in `mine/` instead.

## 目录结构 | Directory Layout

```
vanilla/container/
  ├── generic_54.png          玩家背包 176×222 / player inventory
  ├── hopper.png              漏斗 176×133 / hopper
  ├── beacon.png              信标 230×219 / beacon
  ├── villager.png            村民交易 276×166 / villager trading
  ├── gamemode_switcher.png   游戏模式切换 125×75 / gamemode switcher
  ├── ...                     其它原版容器 / other vanilla containers
  └── creative_inventory/     创造模式标签页贴图 / creative mode tab textures
      ├── tab_inventory.png
      ├── tab_items.png
      └── tab_item_search.png
```

## 如何新增 | Adding New Textures

往本目录丢 PNG 即可被工具识别（文件名为显示名）。但请注意：**新增文件同样受 Mojang 版权约束，请勿在此放置任何非 Mojang 来源的素材。**若你自制了想用的贴图，请放到根目录的 [`mine/`](../mine/) 下。
Dropping a PNG into this directory is enough for the tool to pick it up (the file name becomes the display name). Note, however, that **any new file is equally subject to Mojang's copyright — do not place assets from non-Mojang sources here.** If you have made your own textures, put them in [`mine/`](../mine/) at the repository root.
