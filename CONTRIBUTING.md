# 贡献指南（CONTRIBUTING）

感谢你愿意为这个项目出一份力呀 ✨
提交之前请先花两分钟读完本文，尤其是**素材相关的三条红线**。

---

## 一、快速开始

```bash
# 1. Fork 本仓库，然后克隆你自己的 fork
git clone https://github.com/<你的用户名>/XyLuoWeb-MCtools.git
cd XyLuoWeb-MCtools

# 2. 安装依赖
npm install

# 3. 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 4. 构建产物验证（改完最好跑一次）
npm run build
```

## 二、目录结构速览

```
src/
  views/         页面级组件（HomeView / McColorToolView / McMenuToolView）
  components/    公共组件（NavBar / ToolCard / widgets/）
  composables/   可复用逻辑（useLayoutAnim / usePillSlider）
  config/        配置（images.js —— 图片路径在这里改）
  styles/        global.css —— 全局设计变量与 Element Plus 覆盖
  router/        hash 模式路由
mine/            作者自绘贴图（工具页"我的贴图"分组）
vanilla/         Minecraft 原版容器贴图（用于对齐参考）
public/          静态资源（images / fonts）
```

## 三、⚠️ 素材红线（请务必阅读）

**这三条违反其一，PR 就无法合并** —— 不是不欢迎你，是版权上真的收不了：

### 🚫 不要提交 Minecraft 原版素材

`vanilla/` 下的贴图版权归 Mojang / Microsoft。**不要把游戏内新贴图、解包资源、
其它整合包的素材提交进来**。要新增贴图，请在 `mine/` 下放**你自己画的**。

### 🚫 不要提交来源不明的图片

从图库、动漫站、Pixiv、Pinterest 等处随手存的图，**版权不属于你**，不能提交到
`public/images/`。要么自己画，要么用明确可商用的免费素材（并注明来源与授权）。

> 顺带说明：`public/images/` 里现有的插画是**画师 Ashima 的作品**，版权归画师本人，
> 不在本仓库的授权范围内。**请勿在此基础上替换成其它第三方图片**，
> 也不要因为在仓库里能看到它们，就认为它们可以自由使用。

### 🚫 不要提交第三方代码

引入新的 npm 依赖是可以的（请在 PR 描述里说明理由）；但**不要**把从别处拷来的
代码片段、字体文件、贴图擅自提交进来。

### ✅ 新增自绘贴图的正确做法

把 PNG 丢进 `mine/` 目录即可，工具页会自动扫描并列出，不需要改任何配置。

- 文件名会成为显示名：`button_primary.png` → `Button Primary`
- 建议按原始像素尺寸绘制（16×16、32×32…）
- 透明背景会被保留
- 提交时请确认你同意以「仅限非商业使用」的条款授权这张贴图（见下）

---

## 四、贡献者授权条款（重要）

> **向本仓库提交 Pull Request，即视为你同意以下条款。**

1. **原创保证**：你保证所提交的全部内容（代码、贴图、图片、文档）均为你的原创作品，
   或你已获得权利人的充分授权可以按本条款提交。
2. **代码贡献授权**：你的代码贡献将以 **[MIT 协议](./LICENSE)** 授权给本项目，
   由项目作者随项目一同对外许可。你保留自己作品的著作权。
3. **素材贡献授权**：你的非代码贡献（如 `mine/` 下的贴图）将以
   **[LICENSE-ASSETS 第二节](./LICENSE-ASSETS.md)** 的条款授权给本项目，
   即：**允许非商业使用与二次创作，禁止商业使用**，并由项目作者统一对外许可。
4. **不再单独主张**：贡献被合并后，你不再就该贡献向本项目的使用者单独主张权利。
5. **署名**：项目作者会尽力在致谢中保留你的署名，但**不承诺特定形式的署名位置**。

如果你**不同意**上述条款，请不要提交 PR（欢迎改为提 Issue 反馈问题或建议，
同样很有价值）。若你希望保留自己贴图的独立授权，请**不要**把它提交进本仓库，
而是单独发布并在 Issue 中给出链接。

## 五、代码风格约定

- Vue 3 `<script setup>` + Composition API，**不要**用 Options API
- 缩进 2 空格，**不写分号**（沿用项目现有风格）
- 组件内样式用 `<style scoped>`；跨页面的公共样式放 `src/styles/global.css`
- **优先复用现有的 composable 与全局类**，不要另起一套：
  - 卡片容器 → `.card` / `.panel-card`
  - 按钮 → `.btn`（`.primary` / `.danger` / `.sm` / `.on`），**不要**混用 `el-button`
  - 输入框 → `.xy-field`；开关 → `.xy-switch`；下拉浮层 → `popper-class="xy-popper"`
  - 分段控件 → `src/composables/usePillSlider.js`
  - 卡片伸缩动画 → `src/composables/useLayoutAnim.js`
- 新增动效**不需要**额外处理兼容，`global.css` 里已有 `prefers-reduced-motion` 总开关

## 六、提交 PR 前请自检

- [ ] `npm run build` 能通过，控制台无报错
- [ ] 页面能正常渲染，没有明显回归（建议 `npm run dev` 手动点一遍改动的功能）
- [ ] 没有提交 `node_modules/`、`.env`、编辑器配置等无关文件
- [ ] 没有提交来源不明的素材（见第三节红线）
- [ ] Commit message 简明描述改了什么（中文英文都可以）

## 七、PR 描述建议包含

1. **改了什么**：一句话说清
2. **为什么改**：解决了什么问题 / 新增了什么能力
3. **怎么验证的**：截图、复现步骤或测试方式
4. **是否涉及素材**：如果新增了贴图/图片，请确认右上方的授权条款

---

有任何不确定的地方，**先开 Issue 问一下**，比改完再返工省事多啦～
谢谢你的贡献 ❤️
