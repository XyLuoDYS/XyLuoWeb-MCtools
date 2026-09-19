<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useDetailsAnim } from '@/composables/useDetailsAnim'

/* 常见问题的开合过渡：原生 <details> 是瞬时的，这里补上高度动画 */
const faqRoot = ref(null)
useDetailsAnim(faqRoot, { selector: 'details.faq' })

/* 条款正文的权威版本在仓库根目录 LICENSE-ASSETS.md，
   本页是它的网页呈现 —— 改条款时两处都要动，别只改一边。 */
const REPO = 'https://github.com/XyLuoDYS/XyLuoWeb-MCtools'
const ASSETS_DOC = `${REPO}/blob/main/LICENSE-ASSETS.md`
const LICENSE_DOC = `${REPO}/blob/main/LICENSE`

const CREDIT_TEXT = `贴图素材来源：XyLuoDYS\n${REPO}`
const MODIFIED_TEXT = `基于 XyLuoDYS 的贴图修改（${REPO}）`

const UPDATED = '2026-09-19'
const VERSION = 'v1.0'

/* ---------------- 目录 ---------------- */
const toc = [
  { id: 'overview', label: '素材分类总表' },
  { id: 'mine', label: 'A 类 · 自绘贴图' },
  { id: 'vanilla', label: 'B 类 · MC 原版素材' },
  { id: 'images', label: 'C 类 · 站点插画' },
  { id: 'fonts', label: 'D 类 · 字体' },
  { id: 'contribute', label: '贡献贴图' },
  { id: 'faq', label: '常见问题' },
  { id: 'disclaimer', label: '免责声明' }
]

const activeId = ref(toc[0].id)

/* 用滚动位置算高亮，而不是 IntersectionObserver ——
   目录项密集时 IO 的"哪个正在交叉"会来回跳，按「已滚过的最新一节」判定更稳。 */
let ticking = false
function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    const probe = 132 // 导航栏 60 + 呼吸余量
    let current = toc[0].id
    for (const t of toc) {
      const el = document.getElementById(t.id)
      if (el && el.getBoundingClientRect().top <= probe) current = t.id
    }
    // 滚到底时强制点亮最后一项（末节常常太短、永远够不到 probe 线）
    const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4
    if (atBottom) current = toc[toc.length - 1].id
    activeId.value = current
  })
}

function goto(id) {
  const el = document.getElementById(id)
  if (!el) return
  // 偏移按「导航栏 + （窄屏时的）sticky 目录条」实测高度算，别写死数字 ——
  // 两栏布局下目录在左、不占纵向空间；收单列后它变成吸附在导航栏下方的横条，
  // 用同一个固定值会让标题被盖住。
  const nav = document.querySelector('.navbar')
  const navH = nav ? nav.getBoundingClientRect().height : 60
  const tocDom = document.querySelector('.lic-toc')
  const list = tocDom ? tocDom.querySelector('.toc-list') : null
  const horizontal = list ? getComputedStyle(list).flexDirection === 'row' : false
  const tocH = horizontal && tocDom ? tocDom.getBoundingClientRect().height : 0
  const y = el.getBoundingClientRect().top + window.scrollY - (navH + tocH + 18)
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
  // 立即点亮，不等滚动结束（scroll 监听有 rAF 延迟，点完会有一瞬没反馈）
  activeId.value = id
}

onMounted(() => {
  nextTick(onScroll)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})

/* ---------------- 复制 ---------------- */
/* 剪贴板 API 需要安全上下文（https / localhost）。
   本地用 IP 或 http 打开时会拿到 undefined，所以要留 execCommand 兜底。 */
async function copyText(text, label) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.top = '-1000px'
      ta.setAttribute('readonly', '')
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    ElMessage.success({ message: `${label}已复制`, duration: 1400 })
  } catch (e) {
    ElMessage.error({ message: '复制失败，请手动选中复制', duration: 2000 })
  }
}

/* ---------------- 数据表 ---------------- */
const classes = [
  {
    key: 'A',
    name: '自绘贴图',
    path: 'mine/',
    owner: 'XyLuoDYS（原创绘制）',
    scope: '仅限非商业使用；可自由修改；可打包进 MC 资源包',
    anchor: 'mine',
    tone: 'ok'
  },
  {
    key: 'B',
    name: '原版素材',
    path: 'vanilla/',
    owner: 'Mojang / Microsoft',
    scope: '版权非本仓库所有，作者无权对其授权',
    anchor: 'vanilla',
    tone: 'warn'
  },
  {
    key: 'C',
    name: '站点插画',
    path: 'public/images/',
    owner: 'XyLuoDYS（AI 生成，无第三方著作权）',
    scope: '与 A 类相同：仅限非商业使用',
    anchor: 'images',
    tone: 'ok'
  },
  {
    key: 'D',
    name: '字体',
    path: 'public/fonts/',
    owner: '各字体原作者',
    scope: '依各自原始授权（CC0 / OFL，均可商用）',
    anchor: 'fonts',
    tone: 'ok'
  },
  {
    key: 'E',
    name: '网页代码（非素材，附此对照）',
    path: 'src/',
    owner: 'XyLuoDYS（由 AI 生成）',
    scope: 'MIT 协议：可自由使用、修改、商用',
    anchor: 'overview',
    tone: 'ok'
  }
]

const scenarios = [
  { s: '自己电脑上随便用 / 自己玩', ok: true, note: '完全自由' },
  { s: '做免费的资源包，公开下载', ok: true, note: '需署名' },
  { s: '打包进自己服务器的资源包（免费服务器）', ok: true, note: '需署名' },
  { s: '只接受捐赠、且捐赠不换取任何权益的服务器', ok: true, note: '视为非商业' },
  { s: '免费整合包 / 地图 / 小游戏里使用', ok: true, note: '需署名' },
  { s: '视频、直播、图文教程里用到', ok: true, note: '见下方说明' },
  { s: '改色 / 重绘后发布自己的版本', ok: true, note: '仍需非商用 + 署名' },
  { s: '放进 Wiki、攻略站做配图', ok: true, note: '需署名' },
  { s: '作为付费资源包 / 付费模组的一部分', ok: false, note: '需单独授权' },
  { s: '用于营利性服务器（卖道具 / 会员 / 点券）', ok: false, note: '需单独授权' },
  { s: '做付费会员专属资源包', ok: false, note: '需单独授权' },
  { s: '印成实体周边出售', ok: false, note: '需单独授权' },
  { s: '上传到素材站供他人付费下载', ok: false, note: '需单独授权' },
  { s: '把贴图集合起来当素材包出售', ok: false, note: '即使改过也不行' },
  { s: 'NFT / 数字藏品', ok: false, note: '一律禁止' },
  { s: '声称是自己从零画的', ok: false, note: '一律禁止' }
]

const faqs = [
  {
    q: '我可以在自己的 MC 服务器里用这些贴图吗？',
    a: [
      '可以，只要你的服务器不是以营利为目的',
      '免费服务器 ✅',
      '只接受无条件捐赠（捐赠不换取任何权益）的服务器 ✅',
      '出售道具 / 会员 / 点券 / 称号的服务器 ❌（需单独授权）',
      '需要付费才能进入的服务器 ❌（需单独授权）'
    ]
  },
  {
    q: '我可以把贴图打包进资源包发给玩家吗？',
    a: [
      '可以。无论是私人使用、公开免费下载，还是作为你服务器的强制 / 推荐资源包，都没问题',
      '记得在资源包说明里保留署名 —— 放进 pack.mcmeta 的 description，或附一个 LICENSE.txt 都可以'
    ]
  },
  {
    q: '我可以改颜色 / 重绘后发布吗？',
    a: [
      '可以，修改完全自由（改色、裁剪、加笔、合成、改分辨率……）',
      '但有两个前提：① 修改后的版本同样不得商用（不能"改一下再卖"）；② 记得保留署名，建议补一句「基于 XyLuoDYS 的贴图修改」'
    ]
  },
  {
    q: '署名要怎么做？',
    a: [
      '放在「发布物中能被人看到的地方」即可，形式不限',
      '常见位置：资源包的 LICENSE.txt / pack.mcmeta 描述、整合包说明、README、视频简介、作品说明页、Wiki 页面底部'
    ],
    credit: true
  },
  {
    q: '我想贡献贴图，要怎么做？',
    a: [
      '超欢迎呀 ✨ 三步就够：',
      '① Fork 本仓库；② 把你画的 PNG 放进 mine/ 目录；③ 提 PR，并在描述里确认「是你自己画的 + 同意贡献者条款」',
      '尺寸、命名等具体要求见仓库根目录的 CONTRIBUTING.md'
    ]
  },
  {
    q: '我想商用，怎么申请？',
    a: [
      '请提 Issue 说明用途，作者会给予书面授权',
      '小规模、非营利性质的组织（如学校社团、公益服务器）通常很容易拿到免费授权，别不好意思问呀～'
    ],
    issue: true
  },
  {
    q: '我发现有人违反了这个条款，怎么办？',
    a: ['欢迎提 Issue 告知。请附上对方的使用场景与链接，作者会核实后处理']
  },
  {
    q: '我不小心侵权了，怎么办？',
    a: [
      '别慌，主动联系整改就好',
      '请提 Issue 说明情况，把相关素材下架或补上署名后即可，作者通常不会追究善意的无意误用'
    ]
  },
  {
    q: '我能不能把 mine/ 的贴图改以 MIT / CC0 之类的许可发布？',
    a: [
      '不能。本条款明确禁止再许可（Sublicense）',
      '你可以在自己的项目里使用这些贴图，但不能替作者重新定义它们的授权条款'
    ]
  },
  {
    q: '网页代码是 AI 生成的，那我可以随便用吗？',
    a: [
      '可以。代码由 AI 生成，不存在第三方代码的著作权问题，作者对整理后的成果享有权利，并以 MIT 协议开放给你',
      'MIT 允许自由使用、修改、商用，唯一要求是保留版权与许可声明（随代码保留 LICENSE 文件即可）',
      '但请分清：代码归代码、素材归素材 —— mine/ 贴图与 public/images/ 插画仍然只能非商业使用，不会因为"代码是 MIT"就一起放开'
    ]
  },
  {
    q: '这些条款会变吗？',
    a: [
      '作者保留随时修订本条款的权利',
      '修订不影响已按旧条款合法发布的使用（不溯及既往），但新获取的版本适用当时的最新条款'
    ]
  }
]
</script>

<template>
  <div ref="faqRoot" class="page-container license">
    <!-- ============ 页头 ============ -->
    <header class="lic-hero card">
      <div class="hero-main">
        <div class="chip hero-chip">
          <el-icon><Document /></el-icon>
          素材授权 · {{ VERSION }}
        </div>
        <h1 class="hero-title">素材授权条款</h1>
        <p class="hero-lead">
          <strong>网页代码（由 AI 生成）随你商用</strong>；<code>mine/</code> 里的贴图和
          <code>public/images/</code> 里的插画，可以<strong>免费用、免费改、打包进资源包发给玩家</strong>，
          但不能拿去赚钱
        </p>
        <div class="hero-meta">
          <span class="chip">最后更新 {{ UPDATED }}</span>
          <span class="chip">版权持有者 XyLuoDYS</span>
          <a class="chip chip-link" :href="ASSETS_DOC" target="_blank" rel="noopener">
            <el-icon><Link /></el-icon>
            仓库原文
          </a>
        </div>
      </div>

      <!-- 四张速览卡 -->
      <div class="quick-grid">
        <div class="quick ok">
          <div class="quick-head">
            <el-icon><PictureFilled /></el-icon>
            自绘贴图
          </div>
          <div class="quick-body">
            <span class="tag-yes">免费用</span>
            <span class="tag-yes">随便改</span>
            <span class="tag-yes">进资源包</span>
            <span class="tag-no">不能卖</span>
          </div>
          <div class="quick-foot">mine/</div>
        </div>

        <div class="quick ok">
          <div class="quick-head">
            <el-icon><MagicStick /></el-icon>
            站点插画
          </div>
          <div class="quick-body">
            <span class="tag-yes">免费用</span>
            <span class="tag-yes">随便改</span>
            <span class="tag-yes">进资源包</span>
            <span class="tag-no">不能卖</span>
          </div>
          <div class="quick-foot">public/images/ · AI 生成</div>
        </div>

        <div class="quick warn">
          <div class="quick-head">
            <el-icon><WarningFilled /></el-icon>
            MC 原版素材
          </div>
          <div class="quick-body">
            <p>版权归 <strong>Mojang / Microsoft</strong>，本站无权授权，请遵守官方使用准则</p>
          </div>
          <div class="quick-foot">vanilla/</div>
        </div>

        <div class="quick ok">
          <div class="quick-head">
            <el-icon><Cpu /></el-icon>
            代码与字体
          </div>
          <div class="quick-body">
            <span class="tag-yes">代码 MIT 可商用</span>
            <span class="tag-yes">字体 CC0 / OFL</span>
            <span class="tag-info">代码由 AI 生成</span>
          </div>
          <div class="quick-foot">src/ · public/fonts/</div>
        </div>
      </div>
    </header>

    <!-- ============ 目录 + 正文 ============ -->
    <div class="lic-layout">
      <aside class="lic-toc card" aria-label="页面目录">
        <div class="toc-title">目录</div>
        <nav class="toc-list">
          <button
            v-for="t in toc"
            :key="t.id"
            class="toc-item"
            :class="{ active: activeId === t.id }"
            @click="goto(t.id)"
          >
            {{ t.label }}
          </button>
        </nav>
      </aside>

      <main class="lic-body">
        <!-- ---------- 一、分类总表 ---------- -->
        <section id="overview" class="card sec">
          <h2 class="sec-title"><span class="sec-no">一</span>素材分类与适用条款</h2>
          <p class="sec-lead">
            本仓库的素材<strong>按来源分层授权</strong> —— 不同来源的素材，作者能给你的授权范围是不一样的
          </p>

          <div class="tbl-wrap">
            <table class="lic-table">
              <thead>
                <tr>
                  <th>类别</th>
                  <th>位置</th>
                  <th>版权归属</th>
                  <th>授权范围</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in classes" :key="c.key">
                  <td>
                    <span class="cls-badge" :class="c.tone">{{ c.key }}</span>
                    <button class="cls-link" @click="goto(c.anchor)">{{ c.name }}</button>
                  </td>
                  <td><code>{{ c.path }}</code></td>
                  <td>{{ c.owner }}</td>
                  <td>{{ c.scope }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="callout warn">
            <el-icon class="callout-icon"><Warning /></el-icon>
            <div>
              <strong>为什么不能一句话「全站禁止商用」了事？</strong>
              因为 <code>vanilla/</code> 的版权是 Mojang 的，本仓库作者<strong>没有资格</strong>
              替 Mojang 附加任何限制。硬写"禁止商用"不但无法律效力，还会误导使用者。
              所以必须<strong>按来源分开写</strong>
            </div>
          </div>

          <div class="callout info">
            <el-icon class="callout-icon"><Cpu /></el-icon>
            <div>
              <strong>网页代码由 AI 生成</strong>
              <code>src/</code> 下的网页代码（Vue 组件、样式表、脚本、配置文件）
              <strong>由 AI 生成</strong>，作者负责需求设计、整理与维护 ——
              因此不存在第三方代码的著作权问题，可放心随本项目一同使用、修改与再分发。
              代码本身仍以 <strong>MIT 协议</strong>授权：可自由使用、修改、商用，只需保留版权与许可声明。
              <br />
              请注意区分：<code>mine/</code> 贴图是<strong>作者手绘</strong>，
              <code>public/images/</code> 插画<strong>由 AI 生成</strong>，
              这两类素材都<strong>仅限非商业使用</strong>（详见下面各节）
            </div>
          </div>
        </section>

        <!-- ---------- 二、A 类 ---------- -->
        <section id="mine" class="card sec">
          <h2 class="sec-title">
            <span class="sec-no">二</span>A 类：自绘贴图（<code>mine/</code>）
            <span class="sec-badge ok">仅限非商业</span>
          </h2>
          <p class="sec-lead">
            <code>mine/</code> 目录下的全部贴图（<code>公会.png</code>、<code>服装.png</code>、
            <code>称号.png</code>、<code>领地.png</code> 及后续新增的）
            <strong>由本仓库作者 XyLuoDYS 原创绘制</strong>，版权归作者所有
          </p>
          <p class="sec-lead">
            本条款的目的很简单：<strong>让 MC 社区的大家免费用得开心，但不希望有人拿它去赚钱</strong>
          </p>

          <h3 class="sub-title ok">✅ 你可以做的（无需申请、无需付费）</h3>

          <div class="perm-grid">
            <div class="perm">
              <div class="perm-head">使用与分发</div>
              <ul>
                <li>在<strong>任何非商业场景</strong>下免费使用（个人、团队、服务器、整合包、地图、作品集……）</li>
                <li><strong>复制、分发原图</strong>（非商业目的）</li>
                <li>
                  <strong>打包进 Minecraft 资源包</strong>（材质包）：私人资源包 / 公开免费下载的资源包 /
                  你运营的 MC 服务器的强制·推荐·可选资源包
                </li>
                <li>放进整合包、地图存档、皮肤站等<strong>免费发布</strong>的作品里</li>
                <li>用于视频、直播、图文教程、Wiki 配图等（见下方场景对照表）</li>
              </ul>
            </div>
            <div class="perm">
              <div class="perm-head">修改与二次创作</div>
              <ul>
                <li><strong>自由修改</strong>：改色、调亮暗、加笔、裁剪、重绘、拼接、做成不同分辨率</li>
                <li>把多张 <code>mine/</code> 贴图合成一张新贴图</li>
                <li>在修改版基础上继续二次创作</li>
                <li>把修改后的版本<strong>公开发布</strong>（仍需遵守非商业限制）</li>
              </ul>
            </div>
            <div class="perm">
              <div class="perm-head">参与贡献</div>
              <ul>
                <li>通过 <strong>Pull Request 向 <code>mine/</code> 贡献你自己画的贴图</strong>（非常欢迎！）</li>
                <li>提议修改现有贴图的配色 / 造型</li>
              </ul>
            </div>
          </div>

          <h3 class="sub-title">🎫 你<strong>不需要</strong>做的</h3>
          <ul class="tick-list cross">
            <li><strong>不需要</strong>付费</li>
            <li><strong>不需要</strong>事先申请授权</li>
            <li>
              <strong>不需要</strong>在服务器 / 资源包里加"必须署名"的强制弹窗
              <span class="hint">（但署名仍然是必须的，只是不限定形式）</span>
            </li>
          </ul>

          <h3 class="sub-title">📌 你必须做的</h3>

          <div class="must">
            <div class="must-head">
              <span class="must-no">①</span>
              保留署名
            </div>
            <p>
              在<strong>发布物中能被人看到的地方</strong>（资源包说明、README、资源包内
              <code>LICENSE.txt</code>、视频简介、作品说明页……）注明来源。推荐直接用下面这行现成文案：
            </p>
            <div class="code-box">
              <pre>{{ CREDIT_TEXT }}</pre>
              <button class="btn sm" @click="copyText(CREDIT_TEXT, '署名文案')">
                <el-icon><CopyDocument /></el-icon>
                复制
              </button>
            </div>
            <p class="hint">
              放在哪里都行，形式不限，<strong>核心是"别让人以为这是你画的"</strong>
            </p>
          </div>

          <div class="must">
            <div class="must-head">
              <span class="must-no">②</span>
              修改后建议标注
              <span class="opt">非强制，但很感谢</span>
            </div>
            <p>如果你改过这些贴图，推荐补一句：</p>
            <div class="code-box">
              <pre>{{ MODIFIED_TEXT }}</pre>
              <button class="btn sm" @click="copyText(MODIFIED_TEXT, '标注文案')">
                <el-icon><CopyDocument /></el-icon>
                复制
              </button>
            </div>
          </div>

          <div class="must">
            <div class="must-head">
              <span class="must-no">③</span>
              衍生作品必须沿用「非商业」限制
            </div>
            <p>
              你可以自由修改，但<strong>不能通过"改一下再卖"绕开非商业限制</strong>。
              你对贴图的修改版、合成版、二次创作版，<strong>同样只能用于非商业用途</strong>，
              并且同样需要保留署名
            </p>
            <p class="hint">换句话说：修改权是给你的，不是给"转卖者"的</p>
          </div>

          <h3 class="sub-title no">❌ 你不能做的</h3>

          <p class="sec-lead">
            「<strong>商业使用</strong>」指<strong>以获取直接或间接经济利益为目的</strong>的任何使用，包括但不限于：
          </p>
          <ul class="tick-list cross">
            <li><strong>出售、转售、租赁</strong>贴图本身，或按次 / 按期收费提供</li>
            <li>作为<strong>付费资源包</strong>、<strong>付费模组</strong>、<strong>付费整合包</strong>的一部分</li>
            <li>
              作为<strong>付费会员 / 订阅专属内容</strong>
              （Patreon、爱发电付费档、Discord 付费频道等）
            </li>
            <li>
              用于<strong>营利性 MC 服务器</strong>：出售道具 / 权限 / 称号 / 职业 / 经验加成、
              出售会员 / VIP / 点券 / 月卡、需付费才能进入、出售赞助商位或以服务器为载体做商业推广
            </li>
            <li>用于<strong>付费素材站 / 素材合集</strong>、付费课程、付费图包</li>
            <li>用于广告物料、商业宣传、品牌营销</li>
            <li>用于众筹、赞助、商业提案中作为卖点素材</li>
            <li>印制成<strong>实体周边</strong>（亚克力、贴纸、抱枕、海报等）出售</li>
            <li>用于 <strong>NFT / 数字藏品</strong>等任何形式的代币化发行</li>
            <li>
              <strong>再许可（Sublicense）</strong>：不得把本贴图以其它许可条款对外授权，
              尤其不得改以「可商用」的许可（如 MIT、CC0、CC BY）发布
            </li>
            <li><strong>冒充原创</strong>：不得声称这些贴图是你从零开始独立创作的</li>
            <li><strong>移除或篡改署名</strong>信息</li>
            <li>
              <strong>打包成素材包转卖</strong>：即使做了修改，也不得以「素材合集」为主要卖点出售
            </li>
            <li>违反公序良俗的用途（诽谤中伤、违法活动等）</li>
          </ul>

          <h3 class="sub-title">🎮 场景对照表（最常用，直接查这里）</h3>
          <div class="tbl-wrap">
            <table class="lic-table scenario">
              <thead>
                <tr>
                  <th>使用场景</th>
                  <th class="c">允许？</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in scenarios" :key="row.s">
                  <td>{{ row.s }}</td>
                  <td class="c">
                    <span class="verdict" :class="row.ok ? 'ok' : 'no'">
                      {{ row.ok ? '✅' : '❌' }}
                    </span>
                  </td>
                  <td :class="{ muted: !row.ok }">{{ row.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="callout info">
            <el-icon class="callout-icon"><InfoFilled /></el-icon>
            <div>
              <strong>关于视频 / 直播</strong>：贴图只是视频里的<strong>辅助元素</strong>
              （不是你在卖的东西），所以 B 站 / YouTube 的<strong>平台广告分成不影响</strong>你使用。
              但如果是<strong>以贴图为核心卖点的付费教程 / 付费素材</strong>，
              那就属于商业使用，需要单独授权
            </div>
          </div>

          <div class="callout primary">
            <el-icon class="callout-icon"><ChatDotRound /></el-icon>
            <div>
              <strong>想商用怎么办？</strong>
              完全理解有些项目需要商业化。请通过 <strong>仓库 Issue</strong> 联系作者，说明你的用途，
              作者会视情况给予<strong>书面授权</strong>（可能免费、也可能收取授权费，视具体场景而定）。
              <strong>未经书面授权的商业使用，视为侵权。</strong>
              <br />
              通常来说，小规模、非营利性质的组织（如学校社团、公益服务器）很容易拿到免费授权，
              别不好意思问呀～
              <div class="btn-row">
                <a class="btn sm" :href="`${REPO}/issues`" target="_blank" rel="noopener">
                  <el-icon><Link /></el-icon>
                  前往提 Issue
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- ---------- 三、B 类 ---------- -->
        <section id="vanilla" class="card sec">
          <h2 class="sec-title">
            <span class="sec-no">三</span>B 类：Minecraft 原版素材（<code>vanilla/</code>）
            <span class="sec-badge warn">版权归 Mojang</span>
          </h2>
          <p class="sec-lead">
            <code>vanilla/</code> 目录下的贴图（<code>generic_54.png</code>、<code>hopper.png</code>、
            <code>beacon.png</code> 等各容器界面贴图）取自 <strong>Minecraft（我的世界）</strong>
            游戏本体资源，其著作权、商标权及相关权利<strong>归 Mojang Studios 与 Microsoft 所有</strong>
          </p>
          <p class="sec-lead strong">
            本仓库作者不享有这些素材的任何权利，也无权对你授予任何许可
          </p>
          <ul class="tick-list">
            <li>本仓库<strong>无法</strong>对 B 类素材授予任何许可；</li>
            <li>
              本页第二节的「禁止商用」条款<strong>不适用于</strong> B 类素材
              （作者无权附加此限制，也不为此承担责任）；
            </li>
            <li>
              你对 B 类素材的任何使用，<strong>必须自行遵守</strong>
              <a class="inline-link" href="https://www.minecraft.net/usage-guidelines" target="_blank" rel="noopener">
                Minecraft 使用准则（Usage Guidelines）
              </a>
              与
              <a class="inline-link" href="https://www.minecraft.net/eula" target="_blank" rel="noopener">
                Minecraft EULA
              </a>；
            </li>
            <li>
              上述准则的核心限制包括：<strong>未经 Mojang / Microsoft 书面许可，不得将 Minecraft 的
              名称、品牌、素材用于商业用途</strong>，也不得再分发游戏文件或其修改版；
            </li>
            <li>
              本仓库收录这些文件<strong>仅为演示工具功能</strong>（按原版容器真实尺寸对齐、预览导出效果），
              <strong>不构成对游戏资源的再分发许可</strong>
            </li>
          </ul>
          <div class="callout warn">
            <el-icon class="callout-icon"><Warning /></el-icon>
            <div>
              使用本工具导出的成品中若包含原版贴图，该成品的商用可行性同样受上述准则约束。
              <strong>如需完全规避版权风险，请改用 <code>mine/</code> 下的自绘贴图</strong>
            </div>
          </div>
        </section>

        <!-- ---------- 四、C 类 ---------- -->
        <section id="images" class="card sec">
          <h2 class="sec-title">
            <span class="sec-no">四</span>C 类：站点插画（<code>public/images/</code>）
            <span class="sec-badge ok">AI 生成</span>
          </h2>
          <p class="sec-lead">
            <code>public/images/</code> 下的站点配图（<code>index.png</code> Hero 大图、
            <code>card-mccolor.png</code>、<code>card-mcmenu.png</code> 工具卡片封面、
            <code>bg/bg.png</code> 全站背景）
            <strong>均为作者使用 AI 图像生成模型（GPT Image）产出的图片</strong>
          </p>
          <p class="sec-lead">
            由于不是任何画师的手绘作品，<strong>不存在第三方画师的著作权问题</strong>，
            版权归属与授权能力等同于作者原创素材
          </p>
          <ul class="tick-list">
            <li>
              这些图片的使用条件与 <a class="inline-link" href="#mine" @click.prevent="goto('mine')">A 类</a>
              <strong>完全一致</strong>：可免费用、可改、可打包进资源包，但不得商用；
            </li>
            <li>
              署名方式同上：<code>插画素材来源：XyLuoDYS（{{ REPO }}）</code>
            </li>
            <li>尺寸、比例与替换方式见仓库 <code>public/images/README.md</code></li>
          </ul>

          <div class="callout warn">
            <el-icon class="callout-icon"><Warning /></el-icon>
            <div>
              <strong>本项目的历史提醒</strong>：本仓库早期曾使用某位画师的插画作品，
              因该画师明确声明「禁止转载、禁止二次利用」，已于 2026-09 全部下架并替换为 AI 生成图。
              因此<strong>请勿</strong>再向 <code>public/images/</code> 提交任何来自第三方画师、图库、
              动漫站的转载图 —— 那会让整个仓库的素材授权变得不干净
            </div>
          </div>

          <div class="callout info">
            <el-icon class="callout-icon"><InfoFilled /></el-icon>
            <div>
              <strong>本站不请求任何第三方图库</strong>
              <code>public/images/</code> 是站点配图的<strong>唯一来源</strong>。
              早期版本曾有一处运行时降级逻辑（<code>src/utils/animeImage.js</code>），
              在本地图片缺失时向 nekos.best / waifu.pics / pic.re 请求图片 ——
              那些图多为第三方画师作品、授权无法核实，
              <strong>该逻辑已于 2026-09 彻底移除</strong>
            </div>
          </div>
        </section>

        <!-- ---------- 五、D 类 ---------- -->
        <section id="fonts" class="card sec">
          <h2 class="sec-title">
            <span class="sec-no">五</span>D 类：字体（<code>public/fonts/</code>）
            <span class="sec-badge ok">可商用</span>
          </h2>
          <div class="tbl-wrap">
            <table class="lic-table">
              <thead>
                <tr>
                  <th>文件</th>
                  <th>版权 / 授权</th>
                  <th class="c">可否商用</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>Mojang-Regular.ttf</code></td>
                  <td>
                    Copyright (c) b.tenthousand 2013，通过 FontStruct 制作，
                    采用 <strong>Creative Commons CC0 1.0 公共领域奉献</strong>
                  </td>
                  <td class="c"><span class="verdict ok">✅</span></td>
                </tr>
                <tr>
                  <td><code>gnu-unifont-full.ttf</code></td>
                  <td>
                    Copyright (c) 2016 Roman Czyborra, Paul Hardy, Qianqian Fang, Andrew Miller 等，
                    <strong>SIL Open Font License 1.1</strong> +
                    <strong>GPL v2+（含字体嵌入例外）</strong> 双授权
                  </td>
                  <td class="c"><span class="verdict ok">✅</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="sec-lead">
            字体属于<strong>独立作品</strong>，其使用须遵守<strong>各自的原始授权</strong>，
            <strong>不受本页第二节限制</strong>
          </p>
          <div class="callout info">
            <el-icon class="callout-icon"><InfoFilled /></el-icon>
            <div>
              <code>Mojang-Regular.ttf</code> 只是<strong>同名</strong>，
              它是 FontStruct 上的社区复刻字体（CC0），
              <strong>不是</strong> Mojang 官方发布的字体文件。所以它可以自由商用，
              不适用第三节的限制
            </div>
          </div>
        </section>

        <!-- ---------- 六、贡献 ---------- -->
        <section id="contribute" class="card sec">
          <h2 class="sec-title"><span class="sec-no">六</span>贡献贴图</h2>
          <p class="sec-lead">
            非常欢迎大家向 <code>mine/</code> 投稿自绘贴图 ✨
            <strong>向本仓库提交 Pull Request，即视为你已阅读并同意以下条款</strong>
          </p>

          <h3 class="sub-title">原创保证</h3>
          <p class="sec-lead">
            你保证所提交的全部内容（代码、贴图、图片、文档）<strong>均为你的原创作品</strong>，
            或你已获得权利人的充分授权，可以按本条款提交。具体来说，你确认：
          </p>
          <ul class="tick-list">
            <li>
              贴图是你<strong>自己绘制</strong>的（不是从 Minecraft 原版、其它整合包、素材站、
              图库、Pixiv 等处拿来的）；
            </li>
            <li>你没有把 AI 生成图当作"自己手绘"提交；</li>
            <li>如果素材里包含第三方元素（字体、笔刷、参考图等），你已确认它们允许这样使用</li>
          </ul>

          <h3 class="sub-title">授权范围</h3>
          <ul class="tick-list">
            <li>
              <strong>代码贡献</strong>：以 <a class="inline-link" :href="LICENSE_DOC" target="_blank" rel="noopener">MIT 协议</a>
              授权给本项目，由项目作者随项目一同对外许可；
            </li>
            <li>
              <strong>素材贡献</strong>（如 <code>mine/</code> 下的贴图）：以本页第二节
              「仅限非商业使用」的条款授权给本项目，由项目作者统一对外许可；
            </li>
            <li>上述授权是<strong>永久、不可撤销、非独占、免版税</strong>的</li>
          </ul>

          <h3 class="sub-title ok">你保留的权利</h3>
          <ul class="tick-list">
            <li>你<strong>保留</strong>自己作品的<strong>著作权</strong>；</li>
            <li>
              你可以在<strong>自己的渠道</strong>自由使用、发布、售卖你的作品
              （本条款不限制你对自有作品的处置）；
            </li>
            <li>你可以同时在别的地方以别的许可发布同一张贴图（授权是<strong>非独占</strong>的）</li>
          </ul>

          <h3 class="sub-title">其他约定</h3>
          <ul class="tick-list">
            <li>
              <strong>不再单独主张</strong>：贡献被合并后，你不再就该贡献向本项目的使用者单独主张权利
            </li>
            <li>
              <strong>署名</strong>：项目作者会尽力在致谢中保留你的署名，
              但<strong>不承诺特定形式的署名位置</strong>
            </li>
            <li>
              <strong>不承诺收录</strong>：作者保留不合并、或日后移除某个贡献的权利
              （例如发现素材来源存疑时）。若你的贡献被移除，作者会尽量说明原因
            </li>
          </ul>

          <div class="callout info">
            <el-icon class="callout-icon"><InfoFilled /></el-icon>
            <div>
              如果你<strong>不同意</strong>上述条款，请不要提交 PR —— 欢迎改为提 Issue 反馈问题或建议，
              同样非常有价值！若你希望保留自己贴图的独立授权，请<strong>不要</strong>把它提交进本仓库，
              而是单独发布并在 Issue 中给出链接
            </div>
          </div>
        </section>

        <!-- ---------- 七、FAQ ---------- -->
        <section id="faq" class="card sec">
          <h2 class="sec-title"><span class="sec-no">七</span>常见问题</h2>
          <div class="faq-list">
            <details v-for="(f, i) in faqs" :key="i" class="faq">
              <summary>
                <span class="faq-q">{{ f.q }}</span>
                <el-icon class="faq-caret"><ArrowRight /></el-icon>
              </summary>
              <div class="faq-a">
                <p v-for="(line, j) in f.a" :key="j">{{ line }}</p>
                <div v-if="f.credit" class="code-box">
                  <pre>{{ CREDIT_TEXT }}</pre>
                  <button class="btn sm" @click="copyText(CREDIT_TEXT, '署名文案')">
                    <el-icon><CopyDocument /></el-icon>
                    复制
                  </button>
                </div>
                <div v-if="f.issue" class="btn-row">
                  <a class="btn sm" :href="`${REPO}/issues`" target="_blank" rel="noopener">
                    <el-icon><Link /></el-icon>
                    前往提 Issue
                  </a>
                </div>
              </div>
            </details>
          </div>
        </section>

        <!-- ---------- 八、免责 ---------- -->
        <section id="disclaimer" class="card sec">
          <h2 class="sec-title"><span class="sec-no">八</span>免责声明</h2>
          <ul class="tick-list">
            <li>本页由项目作者根据自身意图编写，<strong>不构成法律意见</strong></li>
            <li>涉及商业用途的决策，建议咨询专业法律人士</li>
            <li>本页未授予任何<strong>商标权、形象权或专利权</strong></li>
            <li>不得使用作者名称、仓库名称作为衍生产品的名称或商标</li>
            <li>本项目为个人非官方作品，与 Mojang Studios / Microsoft 无任何关联</li>
          </ul>
          <div class="official-note">
            NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.
          </div>

          <div class="cite">
            <div class="cite-title">附：如何引用本条款</div>
            <p>如果你想在自己的项目里转述本条款，可以这样写：</p>
            <blockquote>
              本素材采用 <strong>XyLuoDYS 非商业素材许可 v1.0</strong>
              （<a class="inline-link" :href="ASSETS_DOC" target="_blank" rel="noopener">LICENSE-ASSETS.md</a>），
              允许非商业使用与自由修改，禁止商业使用
            </blockquote>
            <div class="btn-row">
              <button
                class="btn sm"
                @click="copyText(`本素材采用 XyLuoDYS 非商业素材许可 v1.0（${ASSETS_DOC}），允许非商业使用与自由修改，禁止商业使用`, '引用文案')"
              >
                <el-icon><CopyDocument /></el-icon>
                复制引用文案
              </button>
            </div>
          </div>
        </section>

        <p class="foot-note">
          本页内容与仓库根目录的
          <a class="inline-link" :href="ASSETS_DOC" target="_blank" rel="noopener">LICENSE-ASSETS.md</a>
          保持一致，以该文件为最终版本
        </p>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ============ 页头 ============ */
.lic-hero {
  padding: 30px 32px 26px;
  background-image: var(--hero-gradient);
}
.hero-chip {
  align-self: flex-start;
  margin-bottom: 14px;
}
.hero-title {
  font-size: 32px;
  font-weight: 800;
  line-height: 1.25;
  margin-bottom: 12px;
}
.hero-lead {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-secondary);
  max-width: 760px;
}
.hero-lead strong {
  color: var(--text);
}
.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.chip-link {
  transition: all 0.2s ease;
}
.chip-link:hover {
  background: color-mix(in srgb, var(--primary) 14%, var(--chip-bg));
  color: var(--primary);
}

/* 速览卡 */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
  gap: 12px;
  margin-top: 22px;
}
.quick {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 13px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-left: 3px solid var(--card-border);
}
.quick.ok {
  border-left-color: #22c55e;
}
.quick.warn {
  border-left-color: #f59e0b;
}
.quick-head {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13.5px;
  font-weight: 700;
}
.quick.ok .quick-head .el-icon {
  color: #16a34a;
}
.quick.warn .quick-head .el-icon {
  color: #d97706;
}
.quick-body {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.6;
}
.quick-foot {
  font-size: 11.5px;
  color: var(--text-muted);
  font-family: Consolas, monospace;
  margin-top: auto;
}
.tag-yes,
.tag-no,
.tag-info {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}
.tag-yes {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}
.tag-no {
  background: rgba(239, 68, 68, 0.14);
  color: #b91c1c;
}
/* 「AI 生成」这类中性来源标注：用主题色，和"允许/禁止"的绿红区分开 */
.tag-info {
  background: color-mix(in srgb, var(--primary) 14%, transparent);
  color: var(--primary);
}
html.dark .tag-yes {
  color: #6ee7a0;
}
html.dark .tag-no {
  color: #fca5a5;
}

/* ============ 布局 ============ */
.lic-layout {
  display: grid;
  grid-template-columns: 208px minmax(0, 1fr);
  gap: 18px;
  margin-top: 18px;
  align-items: start;
}
.lic-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* ============ 目录 ============ */
.lic-toc {
  position: sticky;
  top: 78px;
  padding: 14px 10px;
  /* grid item 默认 min-width:auto —— 窄屏下目录变成横向滚动条后，
     它会把整个 grid 列顶宽（实测 826px > 视口 390），连带另一列的正文一起越界。
     必须显式归零，让 .toc-list 的 overflow-x 真正生效。 */
  min-width: 0;
}
.toc-title {
  font-size: 11.5px;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 0 10px 8px;
  text-transform: uppercase;
}
.toc-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.toc-item {
  position: relative;
  text-align: left;
  padding: 7px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
  line-height: 1.4;
  transition: color 0.18s ease, background-color 0.18s ease;
}
.toc-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 2px;
  height: 0;
  border-radius: 2px;
  background: var(--primary);
  transform: translateY(-50%);
  transition: height 0.22s ease;
}
.toc-item:hover {
  color: var(--text);
  background: var(--chip-bg);
}
.toc-item.active {
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  font-weight: 600;
}
.toc-item.active::before {
  height: 16px;
}

/* ============ 正文区块 ============ */
.sec {
  padding: 22px 26px 24px;
  /* 锚点定位时给 sticky 导航栏留位置，否则标题会被压在栏下面 */
  scroll-margin-top: 78px;
}
.sec-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 19px;
  font-weight: 700;
  padding-bottom: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--card-border);
}
.sec-no {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
.sec-badge {
  font-size: 11.5px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 999px;
}
.sec-badge.ok {
  background: rgba(34, 197, 94, 0.14);
  color: #15803d;
}
.sec-badge.warn {
  background: rgba(245, 158, 11, 0.16);
  color: #b45309;
}
html.dark .sec-badge.ok {
  color: #6ee7a0;
}
html.dark .sec-badge.warn {
  color: #fbbf24;
}

.sec-lead {
  font-size: 14px;
  line-height: 1.85;
  color: var(--text-secondary);
  margin-bottom: 10px;
}
.sec-lead.strong {
  color: var(--text);
  font-weight: 600;
}
.sec-lead strong {
  color: var(--text);
}
.sec-lead code,
.sec-lead.strong code {
  font-family: Consolas, monospace;
}

.sub-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  margin: 22px 0 10px;
}
.sub-title.ok {
  color: #15803d;
}
.sub-title.no {
  color: #b91c1c;
}
html.dark .sub-title.ok {
  color: #6ee7a0;
}
html.dark .sub-title.no {
  color: #fca5a5;
}

code {
  background: var(--chip-bg);
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 0.88em;
  font-family: Consolas, 'Courier New', monospace;
  color: var(--text);
  word-break: break-word;
}
.inline-link {
  color: var(--primary);
  border-bottom: 1px solid color-mix(in srgb, var(--primary) 40%, transparent);
  transition: border-color 0.2s ease;
}
.inline-link:hover {
  border-bottom-color: var(--primary);
}
.hint {
  color: var(--text-muted);
  font-size: 12.5px;
}

/* ============ 表格 ============ */
.tbl-wrap {
  overflow-x: auto;
  border: 1px solid var(--card-border);
  border-radius: 10px;
  margin: 12px 0 4px;
}
.lic-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 520px;
}
.lic-table th,
.lic-table td {
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
  line-height: 1.65;
}
.lic-table thead th {
  background: var(--bg-soft);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  border-bottom: 1px solid var(--card-border);
}
.lic-table tbody tr + tr td {
  border-top: 1px solid var(--card-border);
}
.lic-table tbody tr:hover td {
  background: color-mix(in srgb, var(--primary) 5%, transparent);
}
.lic-table td {
  color: var(--text-secondary);
}
.lic-table .c {
  text-align: center;
}
.lic-table td.muted {
  color: var(--text-muted);
}
.cls-badge {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  margin-right: 7px;
  vertical-align: -3px;
}
.cls-badge.ok {
  background: rgba(34, 197, 94, 0.16);
  color: #15803d;
}
.cls-badge.warn {
  background: rgba(245, 158, 11, 0.18);
  color: #b45309;
}
html.dark .cls-badge.ok {
  color: #6ee7a0;
}
html.dark .cls-badge.warn {
  color: #fbbf24;
}
.cls-link {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
  border-bottom: 1px dashed color-mix(in srgb, var(--primary) 45%, transparent);
}
.verdict {
  font-size: 15px;
}

/* ============ 清单 ============ */
.tick-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0;
}
.tick-list li {
  position: relative;
  padding-left: 24px;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--text-secondary);
}
.tick-list li::before {
  content: '·';
  position: absolute;
  left: 8px;
  top: -1px;
  font-size: 17px;
  color: var(--primary);
  font-weight: 700;
}
.tick-list.cross li::before {
  content: '✕';
  font-size: 11px;
  left: 7px;
  top: 5px;
  color: #ef4444;
}
.tick-list strong {
  color: var(--text);
}

/* ============ 权限三栏 ============ */
.perm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin: 10px 0;
}
.perm {
  background: var(--bg-soft);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 12px 14px;
}
.perm-head {
  font-size: 13.5px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text);
}
.perm ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.perm li {
  position: relative;
  padding-left: 15px;
  font-size: 12.8px;
  line-height: 1.7;
  color: var(--text-secondary);
}
.perm li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 9px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--primary);
}
.perm li strong {
  color: var(--text);
}

/* ============ 「你必须做的」 ============ */
.must {
  position: relative;
  background: var(--bg-soft);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 13px 16px;
  margin-bottom: 10px;
}
.must-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
}
.must-no {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: color-mix(in srgb, var(--primary) 16%, transparent);
  color: var(--primary);
  font-size: 12px;
}
.must .opt {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-muted);
}
.must p {
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--text-secondary);
}
.must p strong {
  color: var(--text);
}

/* ============ 代码框 ============ */
.code-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 9px;
  padding: 9px 10px 9px 13px;
  margin: 9px 0;
}
.code-box pre {
  flex: 1;
  min-width: 0;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
}

/* ============ 按钮 ============ */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 13px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  color: var(--text);
  font-size: 12.5px;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;
}
.btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 10%, var(--chip-bg));
}
.btn.sm {
  padding: 5px 11px;
  font-size: 12px;
  flex-shrink: 0;
}
.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

/* ============ 提示块 ============ */
.callout {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.8;
  margin: 14px 0;
  background: var(--chip-bg);
  color: var(--text-secondary);
  border-left: 3px solid var(--text-muted);
}
.callout strong {
  color: var(--text);
}
.callout-icon {
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 15px;
}
.callout.warn {
  background: rgba(245, 158, 11, 0.1);
  border-left-color: #f59e0b;
}
.callout.warn .callout-icon {
  color: #d97706;
}
.callout.info {
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  border-left-color: var(--primary);
}
.callout.info .callout-icon {
  color: var(--primary);
}
.callout.primary {
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  border-left-color: var(--primary);
}
.callout.primary .callout-icon {
  color: var(--primary);
}

/* ============ FAQ ============ */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.faq {
  border: 1px solid var(--card-border);
  border-radius: 10px;
  background: var(--bg-soft);
  overflow: hidden;
  transition: border-color 0.2s ease;
}
.faq[open] {
  border-color: color-mix(in srgb, var(--primary) 45%, var(--card-border));
}
.faq summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
  list-style: none;
  user-select: none;
}
.faq summary::-webkit-details-marker {
  display: none;
}
.faq summary:hover {
  background: var(--chip-bg);
}
.faq-q {
  flex: 1;
  min-width: 0;
  line-height: 1.6;
}
.faq-caret {
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: 13px;
  transition: transform 0.24s ease, color 0.24s ease;
}
.faq[open] .faq-caret {
  transform: rotate(90deg);
  color: var(--primary);
}
.faq-a {
  padding: 2px 14px 13px;
  font-size: 13px;
  line-height: 1.85;
  color: var(--text-secondary);
  border-top: 1px solid var(--card-border);
  padding-top: 11px;
}
.faq-a p + p {
  margin-top: 5px;
}
.faq-a .code-box {
  background: var(--card-bg);
}

/* ============ 免责尾部 ============ */
.official-note {
  margin-top: 14px;
  padding: 10px 12px;
  border: 1px dashed var(--card-border);
  border-radius: 9px;
  font-size: 11.5px;
  line-height: 1.7;
  letter-spacing: 0.02em;
  color: var(--text-muted);
  font-family: Consolas, monospace;
  text-align: center;
}
.cite {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--card-border);
}
.cite-title {
  font-size: 14.5px;
  font-weight: 700;
  margin-bottom: 8px;
}
.cite p {
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--text-secondary);
}
.cite blockquote {
  margin: 10px 0 0;
  padding: 11px 15px;
  border-left: 3px solid var(--primary);
  background: color-mix(in srgb, var(--primary) 7%, transparent);
  border-radius: 0 9px 9px 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-secondary);
}
.cite blockquote strong {
  color: var(--text);
}

.foot-note {
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--text-muted);
  text-align: center;
  padding: 4px 10px 0;
}

/* ============ 响应式 ============ */
@media (max-width: 980px) {
  .lic-layout {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  /* 窄屏：目录变成横向可滑动的胶囊条，跟着导航栏粘住 */
  .lic-toc {
    position: sticky;
    top: 66px;
    z-index: 10;
    padding: 8px 10px;
    backdrop-filter: blur(12px);
  }
  .toc-title {
    display: none;
  }
  .toc-list {
    flex-direction: row;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .toc-list::-webkit-scrollbar {
    display: none;
  }
  .toc-item {
    padding: 6px 12px;
    white-space: nowrap;
    font-size: 12.5px;
    background: var(--chip-bg);
  }
  /* 横向排布时左侧竖条换成底部横条 */
  .toc-item::before {
    left: 50%;
    top: auto;
    bottom: 0;
    width: 0;
    height: 2px;
    transform: translateX(-50%);
  }
  .toc-item.active::before {
    width: 60%;
    height: 2px;
  }
  /* 收单列后目录条吸附在导航栏下方，锚点偏移要把它的高度一起算进去，
     否则直接打开 /terms#faq 时标题会被目录条盖住 */
  .sec {
    scroll-margin-top: 118px;
  }
}

@media (max-width: 640px) {
  .lic-hero {
    padding: 22px 18px 20px;
  }
  .hero-title {
    font-size: 25px;
  }
  .hero-lead {
    font-size: 14px;
  }
  .quick-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .sec {
    padding: 18px 16px 20px;
    scroll-margin-top: 112px;
  }
  .sec-title {
    font-size: 16.5px;
    gap: 8px;
  }
  .sub-title {
    font-size: 14px;
  }
  .perm-grid {
    grid-template-columns: 1fr;
  }
  .code-box {
    flex-direction: column;
    align-items: stretch;
  }
  .code-box .btn {
    justify-content: center;
  }
}

/* 触屏：hover 会粘在点过的元素上，去掉变色 */
@media (hover: none) {
  .chip-link:hover {
    background: var(--chip-bg);
    color: var(--text-secondary);
  }
  .toc-item:hover {
    color: var(--text-secondary);
    background: var(--chip-bg);
  }
  .toc-item.active:hover {
    color: var(--primary);
  }
  .btn:hover {
    border-color: var(--card-border);
    color: var(--text);
    background: var(--chip-bg);
  }
  .lic-table tbody tr:hover td {
    background: transparent;
  }
}
</style>
