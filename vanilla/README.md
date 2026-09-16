# Minecraft 原版容器贴图

本目录下的贴图取自 **Minecraft（我的世界）** 游戏本体资源，用于「贴图菜单生成」工具页中
**按原版容器真实尺寸对齐 / 预览导出效果**（例如 `generic_54.png` = 176×222，
`hopper.png` = 176×133，`beacon.png` = 230×219）。

## ⚠️ 版权声明（请务必阅读）

这些贴图的著作权、商标权及相关权利均归 **Mojang Studios 与 Microsoft** 所有。

- 本仓库作者**不享有**这些素材的任何权利，**无权**对其授予任何许可；
- 根目录 [LICENSE-ASSETS.md](../LICENSE-ASSETS.md) 中"禁止商用"的条款**不适用于本目录**
  （作者无此权限，亦不为此承担责任）；
- 你对这些素材的任何使用，必须自行遵守
  [Minecraft 使用准则（Minecraft Usage Guidelines）](https://www.minecraft.net/usage-guidelines)
  与 [Minecraft EULA](https://www.minecraft.net/eula)。

其核心限制包括：**未经 Mojang / Microsoft 书面许可，不得将 Minecraft 的名称、品牌、
素材用于商业用途**；不得再分发游戏文件或其修改版。

本仓库收录这些文件**仅为演示工具功能**，不构成对游戏资源的再分发许可。

> ⚠️ 使用本工具导出的成品中若包含原版贴图，该成品能否商用同样受上述准则约束。
> 如需完全规避版权风险，请改用 `mine/` 下的自绘贴图。

## 目录结构

```
vanilla/container/
  ├── generic_54.png          玩家背包 176×222
  ├── hopper.png              漏斗 176×133
  ├── beacon.png              信标 230×219
  ├── villager.png            村民交易 276×166
  ├── gamemode_switcher.png   游戏模式切换 125×75
  ├── ...                     其它原版容器
  └── creative_inventory/     创造模式标签页贴图
      ├── tab_inventory.png
      ├── tab_items.png
      └── tab_item_search.png
```

## 如何新增

往本目录丢 PNG 即可被工具识别（文件名为显示名）。但请注意：
**新增文件同样受 Mojang 版权约束，请勿在此放置任何非 Mojang 来源的素材。**
若你自制了想用的贴图，请放到根目录的 [`mine/`](../mine/) 下。
