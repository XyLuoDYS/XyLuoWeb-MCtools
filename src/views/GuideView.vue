<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useDetailsAnim } from '@/composables/useDetailsAnim'

const route = useRoute()

/* 折叠块的开合过渡：原生 <details> 是瞬时的，这里补上高度动画。
   教程页的折叠块（.fold）和常见问题（.faq）都要，所以 selector 写两个 */
const foldRoot = ref(null)
useDetailsAnim(foldRoot, { selector: 'details.fold, details.faq' })

/* ============================================================
   站内使用教程页（/guide）——「我要改教程内容」看这段就够了
   ============================================================
   1) 正文在下方的 <template> 里，每节一个 <section id="…" class="card sec">：
        id="start"       一、快速上手
        id="mccolor"     二、颜色代码生成
        id="mcmenu"      三、贴图菜单生成
        id="contribute"  四、贡献自己的贴图  ← 贴图库那个提示链接指向这里，别改这个 id
        id="rules"       五、贴图制作规范
        id="faq"         六、常见问题
      段落写 <p>…</p>；步骤写 <div class="step"><span class="step-no">1</span>
      <div class="step-body"><div class="step-head">小标题</div><p>…</p></div></div>
     可直接用的小组件：.ui（界面示意，见第 4 条）、.callout（info / warn / primary）、
     .steps、.step-list、.code（命令行块）、.check-list（打勾清单）、
     .tbl-wrap > .gd-table（表格）
   2) 数据在下面：
        sections  —— 顶部章节快捷跳转按钮（增删章节要和 <section id> 一起改）
        checklist —— 第四节的自查清单（数组，元素支持内联 HTML）
        faq       —— 第六节的问答（数组，改 q / a 两个字段就行）
        MC16 / FX_BTNS / ALIGN_OPS —— 只给界面示意的示意图用，和工具页逻辑无关
        UPDATED   —— 页头「最后更新」的日期，改完内容顺手更新一下
   3) 加一节：先加 <section id="xxx">，再到 sections 里加 { id: 'xxx', label: '…' }。
      标题里那个中文序号（一 / 二 / 三…）是手写的，记得接着往下排。
   4) 界面示意：这一页**不贴界面截图**，界面是用真实页面元素画出来的 ——
      见 <template> 里的 .ui 块，样式见 <style> 的「界面示意」那一节。
      控件右上角浮一个小圆号（.ui-n.abs），下面配一份 .ui-legend 说明列表逐条对应。
      要补新的界面区域时：照着工具页真实的控件和文案把界面画一遍，编号 + 说明别落下。
      ⚠️ 唯一的例外是第三节开头那张**真实导出的成品图**（.demo-shot）——
         那是「效果示例」不是「界面示意」，用真图才有说服力。
         图放 public/tutorial/，**别放 public/images/**（那边声明了「全部是 AI 生成图」）。
      （历史：v1 用 CDP 截的真截图当界面示意，被否掉了 —— 又小又暗、还跟主题脱节。）
   5) 改完跑一次 npm run build，public/ 下的东西才会同步进 dist/。
   ============================================================ */

const REPO = 'https://github.com/XyLuoDYS/XyLuoWeb-MCtools'
const UPDATED = '2026-09-19'

const sections = [
  { id: 'start', label: '快速上手' },
  { id: 'mccolor', label: '颜色代码生成' },
  { id: 'mcmenu', label: '贴图菜单生成' },
  { id: 'contribute', label: '贡献自己的贴图' },
  { id: 'rules', label: '贴图制作规范' },
  { id: 'faq', label: '常见问题' }
]

/* ---------- 界面示意用的静态数据 ----------
   这一页不贴网页截图，而是用真实的页面元素把界面「画」出来（清楚、跟亮暗主题、
   界面微调也不会过时）。下面这些只服务于示意图，和工具页本身的逻辑无关。 */

/* 颜色页「旧版 16 色」色板 */
const MC16 = [
  { code: '0', name: '黑色', hex: '#000000' },
  { code: '1', name: '深蓝', hex: '#0000AA' },
  { code: '2', name: '深绿', hex: '#00AA00' },
  { code: '3', name: '湖蓝', hex: '#00AAAA' },
  { code: '4', name: '深红', hex: '#AA0000' },
  { code: '5', name: '深紫', hex: '#AA00AA' },
  { code: '6', name: '金色', hex: '#FFAA00' },
  { code: '7', name: '灰色', hex: '#AAAAAA' },
  { code: '8', name: '深灰', hex: '#555555' },
  { code: '9', name: '蓝色', hex: '#5555FF' },
  { code: 'a', name: '绿色', hex: '#55FF55' },
  { code: 'b', name: '天蓝', hex: '#55FFFF' },
  { code: 'c', name: '红色', hex: '#FF5555' },
  { code: 'd', name: '粉色', hex: '#FF55FF' },
  { code: 'e', name: '黄色', hex: '#FFFF55' },
  { code: 'f', name: '白色', hex: '#FFFFFF' }
]

/* 颜色页「效果」快捷按钮 */
const FX_BTNS = [
  { label: 'B', tip: '加粗' },
  { label: 'I', tip: '斜体' },
  { label: 'U', tip: '下划线' },
  { label: 'S', tip: '删除线' },
  { label: '乱', tip: '乱码' }
]

/* 贴图菜单页：多选时的对齐按钮 */
const ALIGN_OPS = [
  { label: '左对齐', icon: '⇤' },
  { label: '水平居中', icon: '⇹' },
  { label: '右对齐', icon: '⇥' },
  { label: '顶对齐', icon: '⇡' },
  { label: '垂直居中', icon: '⇕' },
  { label: '底对齐', icon: '⇣' }
]

/* 锚点跳转：顶部导航栏是 sticky 的，滚动时要把它让出来，否则标题被压在栏下面 */
function goto(id) {
  const el = document.getElementById(id)
  if (!el) return
  const nav = document.querySelector('.navbar')
  const navH = nav ? nav.getBoundingClientRect().height : 60
  const y = el.getBoundingClientRect().top + window.scrollY - (navH + 18)
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
}

/* ---------------- 点图放大（灯箱） ----------------
   不开新标签页，直接在屏幕正中放大看。遮罩是 Teleport 到 body 的，
   Esc / 点空白处 / 右上角 ✕ 都能关；打开期间锁住页面滚动。 */
const zoomSrc = ref('')
// 打开前的 body overflow，关闭时原样还回去，别把别人的滚动锁踩掉
let prevBodyOverflow = ''

function openZoom(src) {
  zoomSrc.value = src
  prevBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}
function closeZoom() {
  zoomSrc.value = ''
  document.body.style.overflow = prevBodyOverflow
}
function onZoomKey(e) {
  if (e.key === 'Escape' && zoomSrc.value) closeZoom()
}

/* 带 #contribute 从别的页面跳进来时的兜底定位。
   路由的 scrollBehavior 是在 DOM 更新之前跑的，而本页是懒加载组件 ——
   第一次跳进来那一刻锚点元素还没被插进 DOM，那次滚动会直接落空（实测 scrollY 停在 0）。
   manual 改 hash 时同一个 scrollBehavior 又是好的，所以这里只补一次兜底，不改路由。 */
onMounted(async () => {
  window.addEventListener('keydown', onZoomKey)
  if (!route.hash) return
  const id = decodeURIComponent(route.hash.slice(1))
  if (!id) return
  await nextTick()
  // 等两帧，避开"DOM 已插入但还没 layout"的中间态
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  const el = document.getElementById(id)
  if (!el) return
  const nav = document.querySelector('.navbar')
  const navH = nav ? nav.getBoundingClientRect().height : 60
  const top = el.getBoundingClientRect().top + window.scrollY - (navH + 18)
  // router 已经滚到位的话就别再动，免得"跳一下"
  if (Math.abs(window.scrollY - top) > 40) {
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', onZoomKey)
  // 组件被切走时如果灯箱还开着，把滚动锁解开，否则整站都滚不动了
  if (zoomSrc.value) document.body.style.overflow = prevBodyOverflow
})

/* 贡献流程两条路线共用的自查项 */
const checklist = [
  '文件名只用小写字母、数字、下划线和连字符，扩展名必须是<b>小写</b>的 <code>.png</code>',
  '贴图是<b>自己画的</b>，或者你已经拿到了原作者的授权',
  '只往 <code>mine/</code> 里放东西，<b>不要改别人的贴图</b>，也不要顺手改代码',
  '单张图不要太大，建议控制在 256×256 以内',
  '愿意按<a href="/terms">素材授权条款</a>的 A 类授权：谁都能免费使用、自由修改、打包进资源包，但不能拿去卖'
]

const faq = [
  {
    q: 'PNG 已经放进 mine/ 了，为什么贴图库里还是没出现？',
    a: '按顺序检查三件事：一是扩展名，工具<b>只认小写的 <code>.png</code></b>，<code>.PNG</code> / <code>.jpg</code> 都不会被读进来；二是位置，文件要放在项目根目录的 <code>mine/</code> 下（子文件夹也支持）；三是刷新一下页面，本地开发时 Vite 会热更新，浏览器缓存偶尔会拖后腿'
  },
  {
    q: '为什么贴图库里没有 MC 原版贴图了？',
    a: 'MC 原版贴图是拿来当<b>容器底图</b>的，不是拿来当贴图素材的，所以它们统一放在画布上方的「容器底图」下拉框里选。贴图库只放你自己的贴图，避免拖错东西'
  },
  {
    q: '贴图拖到画布上看着糊糊的，怎么办？',
    a: '把画布缩放调成<b>整数倍</b>（1× / 2× / 3×）。非整数倍缩放时浏览器会重采样，像素画的边缘就会发虚。画布下方有缩放控件，也可以点「适应」让它自动找一个合适的整数倍'
  },
  {
    q: '这些贴图我能拿去做服务器菜单 / 卖整合包吗？',
    a: '放进菜单、打包进资源包发给玩家、自己改颜色改细节，都没问题。但<b>不能用来营利</b> —— 比如做成付费资源包出售。想商用需要单独找作者拿授权，细节看<a href="/terms">素材授权条款</a>'
  },
  {
    q: '导出的 PNG 用什么分辨率好？',
    a: '在左栏「输出设置」里调。默认会按画布尺寸的整数倍导出，平时用 2 倍到 4 倍就够清晰了；要放进 MC 实际使用时，最好和游戏里的界面尺寸对齐'
  },
  {
    q: '我提的 Pull Request 一直没人理？',
    a: '维护者不一定天天在线，一般几天内会看。如果超过一周没动静，可以在 PR 下面留个言，或者开一条 Issue 说明情况'
  }
]
</script>

<template>
  <div ref="foldRoot" class="page-container guide">
    <!-- ============ 页头 ============ -->
    <header class="gd-hero card">
      <div class="chip hero-chip">
        <el-icon><Reading /></el-icon>
        使用教程
      </div>
      <h1 class="hero-title">从零开始用这个工具站</h1>
      <p class="hero-lead">
        这一页把站里的工具从头讲一遍：<strong>颜色代码怎么写</strong>、<strong>贴图菜单怎么拼</strong>，
        还有一篇很详细的<strong>贴图贡献指南</strong> ——
        想让自己的作品出现在贴图库里被所有人用到，看第四节就够了
      </p>
      <div class="hero-meta">
        <span class="chip">最后更新 {{ UPDATED }}</span>
        <span class="chip">阅读约 15 分钟</span>
        <a class="chip chip-link" :href="REPO + '/issues'" target="_blank" rel="noopener">
          <el-icon><ChatDotSquare /></el-icon>
          遇到问题
        </a>
      </div>

      <!-- 章节快捷跳转 -->
      <nav class="gd-nav" aria-label="章节导航">
        <button v-for="s in sections" :key="s.id" class="gd-nav-btn" @click="goto(s.id)">
          {{ s.label }}
        </button>
      </nav>
    </header>

    <!-- ============ 一、快速上手 ============ -->
    <section id="start" class="card sec">
      <h2 class="sec-title"><span class="sec-no">一</span>快速上手</h2>
      <p class="sec-lead">
        这个站是几个给 MC 玩家和服主用的小工具，<b>打开就能用，不用注册也不用登录</b>。
        第一次来只要记住三件事：
      </p>

      <div class="start-cards">
        <div class="sc">
          <span class="sc-n">1</span>
          <b>工具在顶栏上</b>
          <p>「颜色代码生成」和「贴图菜单生成」就是两个工具页，点一下直接进去</p>
        </div>
        <div class="sc">
          <span class="sc-n">2</span>
          <b>右上角能换主题</b>
          <p>彩色圆点换主题色，太阳 / 月亮切亮暗。默认是深色，你的选择会被记住</p>
        </div>
        <div class="sc">
          <span class="sc-n">3</span>
          <b>东西不会上传</b>
          <p>文字和贴图全在你自己的浏览器里处理，不会发到任何服务器</p>
        </div>
      </div>

      <div class="ui">
        <span class="ui-tag">顶栏</span>
        <div class="ui-bar">
          <span class="ui-brand"><span class="ui-brand-x" />XyLuoDYS <em>工具站</em></span>
          <span class="ui-tabs">
            <span class="ui-tab on">首页</span>
            <span class="ui-tab">颜色代码生成</span>
            <span class="ui-tab">贴图菜单生成</span>
            <span class="ui-tab">使用教程</span>
            <span class="ui-tab">素材条款</span>
          </span>
          <span class="ui-act">
            <span class="ui-ico ui-ico-theme"><span class="ui-theme-dot" /></span>
            <span class="ui-ico"><el-icon><Moon /></el-icon></span>
          </span>
        </div>
      </div>

      <details class="fold">
        <summary>
          <span class="fold-num">?</span>
          顶栏每一项是干什么的
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <ul class="ui-legend">
            <li>
              <span class="ui-k">首页</span>
              <div>
                默认落地页。三个小组件挂着：<b>时钟</b>跟着系统时间走、
                <b>你知道吗</b>每次刷新随机给一条 MC 冷知识、
                <b>MC 新闻</b>拉不到数据时会显示内置的备用内容（不会空着）
              </div>
            </li>
            <li>
              <span class="ui-k">颜色代码生成</span>
              <div>给聊天、告示牌、物品名上色。看第二节</div>
            </li>
            <li>
              <span class="ui-k">贴图菜单生成</span>
              <div>拼一张菜单图。看第三节</div>
            </li>
            <li>
              <span class="ui-k">使用教程</span>
              <div>就是本页</div>
            </li>
            <li>
              <span class="ui-k">素材条款</span>
              <div>贴图和插画能不能商用、要不要署名，都写在那儿</div>
            </li>
            <li>
              <span class="ui-k">彩色圆点</span>
              <div>
                换<b>主题色</b>。面板里有 8 个 MC 风格预设色（绿宝石 / 钻石 / 下界 / 金锭 / 红石 /
                青金 / 粉红羊 / 铜锭）、一个自由取色器，还有一个<b>背景强度</b>滑块 ——
                往右拖背景插画更清晰，往左拖更护眼（暗色模式下滑块是禁用的）。
                换完立刻生效，而且会记住
              </div>
            </li>
            <li>
              <span class="ui-k">太阳 / 月亮</span>
              <div>
                深色和亮色一键切换。网站<b>默认深色</b>；切到亮色后底色、卡片、文字、边框、弹层会
                <b>整套</b>换掉，不是简单反色。同样会记住
              </div>
            </li>
          </ul>
          <div class="callout info" style="margin-bottom: 0">
            <el-icon class="callout-icon"><InfoFilled /></el-icon>
            <div>
              <strong>窗口窄了怎么办？</strong>
              导航条可以左右滑动；再窄一点左边的站名会收成一个方块标，把空间让给导航。手机上用也正常
            </div>
          </div>
        </div>
      </details>
    </section>

    <!-- ============ 二、颜色代码生成 ============ -->
    <section id="mccolor" class="card sec">
      <h2 class="sec-title"><span class="sec-no">二</span>颜色代码生成</h2>

      <p class="sec-lead">
        这个工具是做什么的：把游戏里的一段文字上色。比如你想在服务器公告里打出这样的效果 ——
      </p>

      <div class="demo-chat">
        <span class="demo-name">&lt;Steve&gt;</span>
        <span class="dc-gold" style="font-weight:700">公告</span>
        <span class="dc-gray">»</span>
        <span class="dc-yellow">今天</span>
        <span class="dc-green" style="font-weight:700">20:00</span>
        <span class="dc-green">开服</span>
      </div>

      <p class="sec-lead">
        它背后其实是一串「看不见的代码」：<code>§6§l公告 §r§7» §e今天 §a20:00 开服</code>。
        这个工具就是帮你把这串代码拼出来，不用手写
      </p>

      <div class="quickstart">
        <div class="qs-head"><el-icon><MagicStick /></el-icon> 先跑通一遍：三步做出你的第一段彩色文字</div>
        <ol class="qs-steps">
          <li><b>写文字</b> —— 在「输入文字」框里打上你要的那句话</li>
          <li><b>选字</b> —— 用鼠标<b>拖过</b>想上色的那几个字（想整句一个颜色就点「全选」）</li>
          <li><b>点颜色</b> —— 点一个色块，右边聊天框立刻变色；满意了点「复制」</li>
        </ol>
        <div class="qs-foot">
          就这三步，已经能用了。下面的细节按你动手的顺序排，用到哪块点开哪块就行
        </div>
      </div>

      <h3 class="sub-title">细节讲解（用到哪块点哪块）</h3>

      <!-- 第一步：输入文字 -->
      <details class="fold" open>
        <summary>
          <span class="fold-num">1</span>
          输入文字 —— 先把要上色的字打进去
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <div class="ui">
            <span class="ui-tag">右栏 · 输入文字</span>
            <div class="ui-card">
              <div class="ui-head">
                <span class="ui-title">输入文字</span>
                <span class="ui-chip">17 个字符</span>
              </div>
              <div class="ui-input">公告 » 今天 20:00 开服<span class="ui-n abs">1</span></div>
            </div>
          </div>
          <ul class="ui-legend">
            <li>
              <span class="ui-n">1</span>
              <div>
                <b>输入框</b> —— 想给什么文字上色就写在这儿，边打边看就行。
                标题右边会实时显示一共多少个字符。文字改短的话，超出去的选区会自动收掉
              </div>
            </li>
          </ul>
        </div>
      </details>

      <!-- 第二步：选取字符 -->
      <details class="fold">
        <summary>
          <span class="fold-num">2</span>
          选取字符 —— 告诉工具「这几只要上色」
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <p class="sec-lead">
            <b>这一步最关键</b>：颜色和效果只会作用在<b>被选中的字</b>上。
            一个字都没选的话，点色块是不会有反应的 —— 这是新手最容易卡住的地方
          </p>

          <div class="ui">
            <span class="ui-tag">右栏 · 选取字符</span>
            <div class="ui-card">
              <div class="ui-head">
                <span class="ui-title">选取字符</span>
                <span class="ui-mini">全选<span class="ui-n abs">2</span></span>
                <span class="ui-mini">多选<span class="ui-n abs">3</span></span>
              </div>
              <div class="ui-note">单击 · 拖动框选 · Ctrl 多选 · 点间隙插入</div>
              <div class="ui-chars">
                <span class="ui-gap"><span class="ui-n abs">5</span></span>
                <span class="ui-char on">公</span>
                <span class="ui-char on">告</span>
                <span class="ui-char"> </span>
                <span class="ui-char">»</span>
                <span class="ui-char"> </span>
                <span class="ui-gap"><span class="ui-rbadge">R</span><span class="ui-n abs">6</span></span>
                <span class="ui-char">今</span>
                <span class="ui-char">天</span>
                <span class="ui-n abs in">4</span>
              </div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">2</span>
              <div><b>全选</b> —— 一次选中所有字，再点一下取消。整句要一个颜色时最省事</div>
            </li>
            <li>
              <span class="ui-n">3</span>
              <div>
                <b>多选</b> —— 给「不连着的几个字」上色时开它。
                默认是「单击选一个、拖动框选一片」；开了多选后变成<b>点一下选中、再点一下取消</b>，
                可以一个个攒起来
              </div>
            </li>
            <li>
              <span class="ui-n">4</span>
              <div>
                <b>字符区</b> —— 显示选中的状态。选中的字会高亮。
                <b>拖动</b>可以框选一片，<b>单击</b>选一个，按住 <kbd>Ctrl</kbd> 点可以加选 / 减选
              </div>
            </li>
            <li>
              <span class="ui-n">5</span>
              <div>
                <b>字符之间的竖线</b> —— 点一下会在那个位置放一个<b>插入点</b>，
                用途是往文字中间插一个「重置标记」（见下一节）
              </div>
            </li>
            <li>
              <span class="ui-n">6</span>
              <div>
                <b>R 标记（重置）</b> —— 表示「从这里开始，前面的颜色和效果全部清掉」，
                游戏里对应 <code>§r</code>。再点一下可以去掉
              </div>
            </li>
          </ul>
        </div>
      </details>

      <!-- 第三步：点颜色 -->
      <details class="fold">
        <summary>
          <span class="fold-num">3</span>
          点颜色 —— 16 色、自定义颜色和渐变
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <div class="ui">
            <span class="ui-tag">左栏 · 颜色（旧版 16 色）</span>
            <div class="ui-card">
              <div class="ui-head">
                <span class="ui-title">颜色</span>
                <span class="ui-chip">已选 2 个字符</span>
              </div>
              <div class="ui-seg sm">
                <span class="ui-seg-pill" />
                <span class="ui-seg-btn on">旧版 16 色<span class="ui-n abs">7</span></span>
                <span class="ui-seg-btn">自定义颜色<span class="ui-n abs">8</span></span>
              </div>
              <div class="ui-note">选中字符后，<b>点击色块立即上色</b><span class="ui-n abs">9</span></div>
              <div class="ui-swatches">
                <span
                  v-for="c in MC16"
                  :key="c.code"
                  class="ui-sw"
                  :style="{ background: c.hex }"
                  :title="`${c.name}（${c.code}）`"
                >
                  <span class="ui-sw-code">{{ c.code }}</span>
                </span>
              </div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">7</span>
              <div>
                <b>旧版 16 色</b>（默认）—— 传统色板，<code>&amp;0</code>~<code>&amp;f</code> 这套代码
                <b>所有版本都认</b>，做告示牌、物品名最稳。每个色块左下角那个字符就是它的代码
              </div>
            </li>
            <li>
              <span class="ui-n">8</span>
              <div>
                <b>自定义颜色</b> —— 想用 <code>#RRGGBB</code> 这种十六进制颜色、或者想做渐变，就切到这里。
                要注意它需要服务端支持（1.16+ 原版或装了插件），老服务器可能显示不出来，
                这种时候换回 16 色
              </div>
            </li>
            <li>
              <span class="ui-n">9</span>
              <div>
                <b>色块</b> —— 点一下就上色，颜色<strong>立刻</strong>作用到选中的字上，不用再点「应用」。
                鼠标悬停能看到颜色名和代码
              </div>
            </li>
          </ul>

          <div class="ui">
            <span class="ui-tag">左栏 · 自定义颜色（单色 + 渐变）</span>
            <div class="ui-card">
              <div class="ui-head">
                <span class="ui-title">颜色</span>
                <span class="ui-chip">已选 2 个字符</span>
              </div>
              <div class="ui-seg sm">
                <span class="ui-seg-pill" />
                <span class="ui-seg-btn">旧版 16 色<span class="ui-n abs">7</span></span>
                <span class="ui-seg-btn on">自定义颜色<span class="ui-n abs">8</span></span>
              </div>
              <div class="ui-glabel">输出格式</div>
              <div class="ui-select">#RRGGBB 格式<span class="ui-caret">▾</span><span class="ui-n abs">10</span></div>
              <div class="ui-note">
                <b>点击条子空白处</b>创建颜色点 · <b>点击颜色点</b>选中编辑 · <b>按住拖动</b>调整位置 · <b>Ctrl+点击</b>多选
              </div>
              <div class="ui-track">
                <span class="ui-track-fill" />
                <span class="ui-gstop" style="left: 0%; background: #55FF55" />
                <span class="ui-gstop" style="left: 50%; background: #FFAA00" />
                <span class="ui-gstop" style="left: 100%; background: #FF5555" />
                <span class="ui-n abs">11</span>
              </div>
              <div class="ui-scale"><span>0%</span><span>50%</span><span>100%</span></div>

              <div class="ui-glabel">快速模板</div>
              <div class="ui-gp-grid">
                <span class="ui-gp" style="background: linear-gradient(90deg,#55FF55,#FFFF55)">清新</span>
                <span class="ui-gp" style="background: linear-gradient(90deg,#FFAA00,#FF5555)">火焰</span>
                <span class="ui-gp" style="background: linear-gradient(90deg,#55FFFF,#5555FF)">海洋</span>
                <span class="ui-gp" style="background: linear-gradient(90deg,#FF55FF,#AA00AA)">梦幻</span>
                <span class="ui-n abs">12</span>
              </div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">10</span>
              <div>
                <b>输出格式下拉</b> —— 同样是十六进制颜色，不同服务器 / 插件的写法不一样。
                这里选目标写法（共 11 种），下面生成的代码就按这个来。不知道选哪个就先留默认
              </div>
            </li>
            <li>
              <span class="ui-n">11</span>
              <div>
                <b>渐变条</b> —— 整条就是一段渐变的预览。在上面<b>空白处点一下</b>新建一个颜色点，
                <b>拖动</b>圆点改位置，<b>点中圆点</b>下面会展开编辑器（改颜色、用滑块精调位置、删除）。
                按住 <kbd>Ctrl</kbd> 点可以选多个点一起改。渐变只对<b>自定义颜色</b>模式有效
              </div>
            </li>
            <li>
              <span class="ui-n">12</span>
              <div>
                <b>快速模板</b> —— 配好的常用渐变（清新 / 火焰 / 海洋……），点一下直接套上，再慢慢调
              </div>
            </li>
          </ul>

          <div class="ui">
            <span class="ui-tag">左栏 · 我的预设</span>
            <div class="ui-card">
              <div class="ui-head">
                <span class="ui-title">我的预设</span>
                <span class="ui-btn primary sm"><el-icon><Star /></el-icon> 存为预设<span class="ui-n abs">13</span></span>
              </div>
              <div class="ui-presets">
                <span class="ui-preset"><span class="ui-preset-bar" style="background: linear-gradient(90deg,#55FF55,#FFAA00)" />清新绿<span class="ui-preset-x">×</span><span class="ui-n abs">14</span></span>
                <span class="ui-preset"><span class="ui-preset-bar" style="background: #FF5555" />服务器名<span class="ui-preset-x">×</span></span>
              </div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">13</span>
              <div><b>存为预设</b> —— 把当前调好的渐变（或单色）存下来，存在浏览器本地，关掉页面也不会丢</div>
            </li>
            <li>
              <span class="ui-n">14</span>
              <div><b>预设条目</b> —— 点一下套用；右上角的 <b>×</b> 是删除（删了不能恢复）</div>
            </li>
          </ul>
        </div>
      </details>

      <!-- 第四步：字体效果 -->
      <details class="fold">
        <summary>
          <span class="fold-num">4</span>
          加字体效果 —— 加粗、斜体、下划线那些
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <p class="sec-lead">
            选中字符之后，「选取字符」卡片下面会冒出一排按钮，这就是字体效果。
            <b>点一下开、再点一下关</b>，可以叠着用（比如同时加粗 + 下划线）
          </p>

          <div class="ui">
            <span class="ui-tag">选中字符时 · 效果工具栏</span>
            <div class="ui-card">
              <div class="ui-actions">
                <span class="ui-glabel">效果</span>
                <span v-for="f in FX_BTNS" :key="f.label" class="ui-btn sm">{{ f.label }}</span>
                <span class="ui-btn sm"><el-icon><Brush /></el-icon> 清色</span>
                <span class="ui-btn sm">反选</span>
                <span class="ui-btn sm">清空</span>
                <span class="ui-glabel">替换</span>
                <span class="ui-input sm">新字符…</span>
                <span class="ui-colorbox" style="background: #FFAA00" />
                <span class="ui-n abs">15</span>
              </div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">15</span>
              <div>
                <b>这一排按钮</b>：
                <ul class="ui-sublist">
                  <li><b>B</b> 加粗（<code>§l</code>）</li>
                  <li><b>I</b> 斜体（<code>§o</code>）</li>
                  <li><b>U</b> 下划线（<code>§n</code>）</li>
                  <li><b>S</b> 删除线（<code>§m</code>）</li>
                  <li><b>乱</b> 乱码 / 随机跳字（<code>§k</code>），右边预览框里能实时看到它在跳</li>
                  <li><b>清色</b> —— 只清掉颜色，字体效果保留（比如「加粗」还在）</li>
                  <li><b>反选 / 清空</b> —— 只在多选模式下出现</li>
                  <li><b>替换</b> —— 输入新字符，选中的字实时被替换掉，颜色和效果跟着走</li>
                  <li><b>取色器</b>（只选中一个字时出现）—— 给这个字单独精调颜色</li>
                </ul>
              </div>
            </li>
          </ul>

          <div class="ui">
            <span class="ui-tag">点到字符间隙时 · 换成插入点工具栏</span>
            <div class="ui-card">
              <div class="ui-actions">
                <span class="ui-glabel">插入点 · 第 3 个字符前</span>
                <span class="ui-btn sm">重置</span>
                <span class="ui-btn sm">取消</span>
                <span class="ui-n abs">16</span>
              </div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">16</span>
              <div>
                <b>插入点工具栏</b> —— 点到字符间隙之后，原来那排效果按钮会换成这个。
                <b>重置</b>在这里插一个 <code>§r</code>（从那往后恢复默认样式），<b>取消</b>退出插入点状态
              </div>
            </li>
          </ul>
        </div>
      </details>

      <!-- 第五步：看预览、复制 -->
      <details class="fold">
        <summary>
          <span class="fold-num">5</span>
          看预览、复制代码
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <div class="ui">
            <span class="ui-tag">右栏 · 预览 + 输出</span>
            <div class="ui-card">
              <div class="ui-head">
                <span class="ui-title">MC 聊天框预览</span>
                <span class="ui-colorbox" style="background: #1a1a1a"><span class="ui-n abs">17</span></span>
                <span class="ui-mini dim">恢复<span class="ui-n abs">18</span></span>
              </div>
              <div class="ui-chat"><span class="ui-chat-name">&lt;Steve&gt;</span> <b style="color:#FFAA00">公告</b> <span style="color:#AAAAAA">»</span> <span style="color:#FFFF55">今天</span> <b style="color:#55FF55">20:00</b> <span style="color:#55FF55">开服</span></div>

              <div class="ui-head mt">
                <span class="ui-title">输出代码</span>
                <span class="ui-seg xs">
                  <span class="ui-seg-btn on">§</span>
                  <span class="ui-seg-btn">&amp;</span>
                  <span class="ui-n abs">19</span>
                </span>
                <span class="ui-btn primary sm"><el-icon><DocumentCopy /></el-icon> 复制<span class="ui-n abs">20</span></span>
              </div>
              <pre class="ui-code">§6§l公告 §r§7» §e今天 §a20:00 开服</pre>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">17</span>
              <div>
                <b>预览底色</b> —— 聊天框预览的背景色。有些颜色在黑底上好看、在白底上就糊了，
                换个底色能提前发现。调乱了点旁边的「恢复」
              </div>
            </li>
            <li>
              <span class="ui-n">18</span>
              <div><b>恢复</b> —— 把预览底色改回默认（已经是默认时它是灰的，点不动）</div>
            </li>
            <li>
              <span class="ui-n">19</span>
              <div>
                <b>§ / &amp; 切换</b> —— 决定生成的代码里用哪个符号。游戏里其实是 <code>§</code>，
                但写配置文件时 <code>&amp;</code> 更常见（很多插件会自动转），按你要粘贴的地方选
              </div>
            </li>
            <li>
              <span class="ui-n">20</span>
              <div><b>复制</b> —— 把代码拷进剪贴板，粘到游戏、配置或插件里就能用</div>
            </li>
          </ul>
        </div>
      </details>

      <!-- 另一种玩法 -->
      <details class="fold">
        <summary>
          <span class="fold-num">6</span>
          另一种玩法：把别人给的代码拿来改
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <div class="ui">
            <span class="ui-tag">页头 · 两个模式</span>
            <div class="ui-seg">
              <span class="ui-seg-pill" />
              <span class="ui-seg-btn on"><el-icon><EditPen /></el-icon> 可视化编辑<span class="ui-n abs">21</span></span>
              <span class="ui-seg-btn"><el-icon><Upload /></el-icon> 粘贴代码解析<span class="ui-n abs">22</span></span>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">21</span>
              <div><b>可视化编辑</b> —— 默认模式，上面讲的全是这个模式</div>
            </li>
            <li>
              <span class="ui-n">22</span>
              <div>
                <b>粘贴代码解析</b> —— 反过来用：把别人给你的代码粘进去，页面把它拆开、
                还原出每个字原本的颜色和效果，改完再换格式导出。接手别人的配置时特别省事。
                切过去之后是一个大粘贴框，下面三个按钮：
                <ul class="ui-sublist">
                  <li><b>解析并编辑</b> —— 读懂粘贴框里的代码，然后自动切回可视化编辑继续改</li>
                  <li><b>示例</b> —— 塞一段示例代码进去先看看</li>
                  <li><b>清空</b> —— 清掉粘贴框</li>
                </ul>
                能自动认出来的格式：<code>&amp;</code> / <code>§</code> 单字符代码、
                <code>&amp;#RRGGBB</code>、<code>&amp;x&amp;R&amp;R…</code>、<code>\u00A7x…</code>、
                <code>&lt;#RRGGBB&gt;</code>、<code>&lt;g:#A:#B&gt;</code>、<code>{#RRGGBB}</code>、
                <code>[COLOR=#RRGGBB]</code> 和 MiniMessage
              </div>
            </li>
          </ul>
        </div>
      </details>
    </section>

    <!-- ============ 三、贴图菜单生成 ============ -->
    <section id="mcmenu" class="card sec">
      <h2 class="sec-title"><span class="sec-no">三</span>贴图菜单生成</h2>

      <p class="sec-lead">
        这个工具是做什么的：拿一个 MC 原版容器当背景，把你画的按钮贴图摆上去，最后导出一张菜单图。
        大概长这样 ——
      </p>

      <figure class="demo-shot">
        <button
          type="button"
          class="ds-zoom"
          title="点一下放大看"
          @click="openZoom('/tutorial/mc-menu-demo.png')"
        >
          <img
            src="/tutorial/mc-menu-demo.png"
            alt="贴图菜单工具导出的一张成品：MC 箱子底图上面摆了三个自绘按钮"
            width="704"
            height="888"
          />
          <span class="ds-hint"><el-icon><ZoomIn /></el-icon> 点一下放大</span>
        </button>
        <figcaption>这是一张<b>真实导出的成品</b></figcaption>
      </figure>

      <p class="sec-lead">
        上面这个示意里，<b>灰底是原版容器贴图</b>，<b>三个按钮是你自己的贴图</b>。
        工具做的事就是让你把它们拼到一起、调好位置，然后导出成 PNG
      </p>

      <div class="quickstart">
        <div class="qs-head"><el-icon><PictureFilled /></el-icon> 先跑通一遍：四步做出第一张菜单</div>
        <ol class="qs-steps">
          <li><b>选底图</b> —— 左栏「输出设置」里挑一个容器当背景</li>
          <li><b>拖贴图</b> —— 把右栏「贴图库」里的贴图<b>拖进</b>左边画布</li>
          <li><b>摆位置</b> —— 直接拖到合适的地方；想更精确就用方向键或右侧参数框</li>
          <li><b>导出</b> —— 点左下角「导出 PNG」，浏览器直接下载</li>
        </ol>
        <div class="qs-foot">
          已经出图了。下面按这四步的顺序讲每个控件，用到哪块点开哪块
        </div>
      </div>

      <h3 class="sub-title">细节讲解（用到哪块点哪块）</h3>

      <!-- 第一步：选底图 -->
      <details class="fold" open>
        <summary>
          <span class="fold-num">1</span>
          选一个容器当底图
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <div class="ui">
            <span class="ui-tag">左栏 · 输出设置</span>
            <div class="ui-card">
              <div class="ui-head">
                <span class="ui-title">输出设置</span>
                <span class="ui-chip">底图 176 × 222</span>
              </div>
              <div class="ui-row">
                <span class="ui-row-k">容器底图</span>
                <span class="ui-select grow">Generic 54<span class="ui-caret">▾</span><span class="ui-n abs">1</span></span>
              </div>
              <div class="ui-row">
                <span class="ui-row-k">底图范围</span>
                <span class="ui-seg sm">
                  <span class="ui-seg-btn on">自动裁切<span class="ui-n abs">2</span></span>
                  <span class="ui-seg-btn">完整贴图<span class="ui-n abs">3</span></span>
                </span>
              </div>
              <div class="ui-row">
                <span class="ui-row-k">导出分辨率</span>
                <span class="ui-num">352<span class="ui-n abs">4</span></span>
                <span class="ui-times">×</span>
                <span class="ui-num">444</span>
                <span class="ui-unit">px</span>
                <span class="ui-seg xs">
                  <span class="ui-seg-btn">×1</span>
                  <span class="ui-seg-btn on">×2<span class="ui-n abs">5</span></span>
                  <span class="ui-seg-btn">×3</span>
                  <span class="ui-seg-btn">×4</span>
                </span>
              </div>
              <div class="ui-row">
                <span class="ui-row-k">锁定比例</span>
                <span class="ui-switch on"><span class="ui-switch-knob" /><span class="ui-n abs">6</span></span>
                <span class="ui-note-inline">按底图 2 倍导出</span>
              </div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">1</span>
              <div>
                <b>容器底图</b> —— 就是选一个 MC 原版容器当背景，一共 23 种（箱子、漏斗、信标、
                村民交易界面……）。下拉框<b>可以直接打字搜索</b>，每个选项左边还有小缩略图。
                选完之后画布会按它真实的像素尺寸铺好。
                <b>MC 原版贴图只能在这里选</b>，贴图库里没有它们
              </div>
            </li>
            <li>
              <span class="ui-n">2</span>
              <div>
                <b>自动裁切</b>（默认）—— 自动把容器贴图四周的透明留白裁掉，对齐 MC 真实 GUI 尺寸。
                这样你摆的坐标和游戏里是一致的
              </div>
            </li>
            <li>
              <span class="ui-n">3</span>
              <div>
                <b>完整贴图</b> —— 不裁，连透明边一起保留。想让画布大一圈、或者要在透明区里摆东西时用
              </div>
            </li>
            <li>
              <span class="ui-n">4</span>
              <div>
                <b>导出宽 / 高</b> —— 导出 PNG 的实际像素尺寸。上面「底图 176 × 222」是底图的真实尺寸，
                这里填的是你要导出多大，两者可以不一样
              </div>
            </li>
            <li>
              <span class="ui-n">5</span>
              <div>
                <b>×1 / ×2 / ×3 / ×4</b> —— 快捷倍数，点一下就把宽高按底图的 N 倍填好，不用自己算。
                放进游戏里用 ×2 到 ×4 就够清晰了
              </div>
            </li>
            <li>
              <span class="ui-n">6</span>
              <div>
                <b>锁定比例</b> —— 开着的时候改宽会自动算高，图像不会被拉变形。
                右边那行小字会告诉你当前相当于底图的几倍
              </div>
            </li>
          </ul>
        </div>
      </details>

      <!-- 第二步：拖贴图 -->
      <details class="fold">
        <summary>
          <span class="fold-num">2</span>
          把贴图拖进画布
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <div class="ui">
            <span class="ui-tag">右栏 · 贴图库</span>
            <div class="ui-card">
              <div class="ui-head">
                <span class="ui-title">贴图库</span>
                <span class="ui-contribute">想贡献贴图？<span class="ui-n abs">7</span></span>
                <span class="ui-chip">4 个</span>
              </div>
              <div class="ui-libhead"><span>我的贴图</span><span class="ui-count">4</span></div>
              <div class="ui-libgrid">
                <span class="ui-libitem">公会<span class="ui-n abs">8</span></span>
                <span class="ui-libitem">服装</span>
                <span class="ui-libitem">称号</span>
                <span class="ui-libitem">领地</span>
              </div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">8</span>
              <div>
                <b>贴图条目</b> —— <b>拖</b>到画布上想放的位置，或者<b>单击</b>让它落到画布正中央。
                已经用过的贴图会高亮，方便你看哪些还没用。鼠标悬停能看到名字
              </div>
            </li>
            <li>
              <span class="ui-n">7</span>
              <div>
                <b>想贡献贴图？</b>（那个虚线小胶囊）—— 点一下跳到本页第四节，
                讲怎么把自己的 PNG 提交进这个贴图库
              </div>
            </li>
          </ul>

          <div class="callout warn">
            <el-icon class="callout-icon"><WarningFilled /></el-icon>
            <div>
              <strong>贴图库里为什么没有 MC 原版贴图？</strong>
              原版贴图的用途是当<b>容器底图</b>，不是当贴图素材，所以它们统一放在「容器底图」下拉框里。
              贴图库只保留你自己的贴图，拖的时候不会拿错
            </div>
          </div>
        </div>
      </details>

      <!-- 第三步：摆位置 -->
      <details class="fold">
        <summary>
          <span class="fold-num">3</span>
          摆位置、调大小
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <p class="sec-lead">
            把贴图拖到画布上之后，<b>单击选中它</b>，「贴图参数」卡片就会显示它的详细设置。
            大字提示：<b>方向键可以微调 1 像素</b>，按住 <kbd>Shift</kbd> 是 10 像素
          </p>

          <div class="ui">
            <span class="ui-tag">右栏 · 贴图参数（选中一个）</span>
            <div class="ui-card">
              <div class="ui-head">
                <span class="ui-title">贴图参数</span>
                <span class="ui-chip">Button Primary</span>
              </div>
              <div class="ui-param-grid">
                <span class="ui-pf"><span>X 坐标</span><span class="ui-num grow">24<span class="ui-n abs">9</span></span></span>
                <span class="ui-pf"><span>Y 坐标</span><span class="ui-num grow">96</span></span>
                <span class="ui-pf"><span>宽度</span><span class="ui-num grow">64</span></span>
                <span class="ui-pf"><span>高度</span><span class="ui-num grow">20</span></span>
              </div>
              <div class="ui-row">
                <span class="ui-switch on"><span class="ui-switch-knob" /><span class="ui-n abs">10</span></span>
                <span class="ui-note-inline">改尺寸时保持原比例</span>
              </div>
              <div class="ui-actions">
                <span class="ui-btn sm">居中<span class="ui-n abs">11</span></span>
                <span class="ui-btn sm">水平翻转<span class="ui-n abs">12</span></span>
                <span class="ui-btn sm">垂直翻转<span class="ui-n abs">13</span></span>
                <span class="ui-btn sm">上移一层<span class="ui-n abs">14</span></span>
                <span class="ui-btn sm">下移一层<span class="ui-n abs">15</span></span>
                <span class="ui-btn sm">复制<span class="ui-n abs">16</span></span>
                <span class="ui-btn sm danger">删除<span class="ui-n abs">17</span></span>
              </div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">9</span>
              <div>
                <b>X / Y / 宽度 / 高度</b> —— 精确到像素地摆位置、定尺寸。
                <b>X、Y 是贴图左上角在画布里的坐标</b>（原点在左上角），改完立刻生效。
                想避开「差一像素」的错位，用这里输数字最准，比拖动稳
              </div>
            </li>
            <li>
              <span class="ui-n">10</span>
              <div><b>保持原比例</b> —— 开着时改宽会自动算高，贴图不会被拉扁。想故意拉伸就关掉它</div>
            </li>
            <li>
              <span class="ui-n">11</span>
              <div><b>居中</b> —— 把这张贴图挪到画布正中间。快捷键 <kbd>C</kbd></div>
            </li>
            <li>
              <span class="ui-n">12</span>
              <div>
                <b>水平翻转</b> —— 左右镜像（把「→」变「←」）。做对称按钮时有用。
                快捷键 <kbd>F</kbd>。按下去是亮的就是翻转状态
              </div>
            </li>
            <li>
              <span class="ui-n">13</span>
              <div><b>垂直翻转</b> —— 上下镜像。快捷键 <kbd>Shift</kbd> + <kbd>F</kbd></div>
            </li>
            <li>
              <span class="ui-n">14</span>
              <div><b>上移一层</b> —— 往前挪一层，盖住和它重叠的贴图。快捷键 <kbd>]</kbd></div>
            </li>
            <li>
              <span class="ui-n">15</span>
              <div><b>下移一层</b> —— 往后挪一层。快捷键 <kbd>[</kbd></div>
            </li>
            <li>
              <span class="ui-n">16</span>
              <div>
                <b>复制</b> —— 原地旁边复制出一样的一张贴图。做一排同样的按钮时不用反复从贴图库拖。
                快捷键 <kbd>Ctrl</kbd> + <kbd>D</kbd>
              </div>
            </li>
            <li>
              <span class="ui-n">17</span>
              <div><b>删除</b> —— 删掉这张贴图。红色按钮，删了不能撤销</div>
            </li>
          </ul>

          <div class="ui">
            <span class="ui-tag">左栏 · 输出设置（对齐吸附那一行）</span>
            <div class="ui-card">
              <div class="ui-row">
                <span class="ui-row-k">对齐吸附</span>
                <span class="ui-num">2<span class="ui-n abs">18</span></span>
                <span class="ui-unit">px</span>
                <span class="ui-switch on"><span class="ui-switch-knob" /><span class="ui-n abs">19</span></span>
              </div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">18</span>
              <div>
                <b>对齐吸附步长</b> —— 拖动时坐标会按这个整数倍跳动，默认 2px。
                设成 1 就是每个像素都能停；设大一点（8、16）可以让贴图自动对齐到网格，
                排版更整齐、不会出现差一像素的错位
              </div>
            </li>
            <li>
              <span class="ui-n">19</span>
              <div><b>吸附开关</b> —— 关掉之后就能停在任意整数像素上，不再跳动</div>
            </li>
          </ul>
        </div>
      </details>

      <!-- 第四步：导出 -->
      <details class="fold">
        <summary>
          <span class="fold-num">4</span>
          导出这张图
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <div class="ui">
            <span class="ui-tag">左下角 · 三个操作按钮</span>
            <div class="ui-card">
              <div class="ui-actions">
                <span class="ui-chip">3 个贴图</span>
                <span class="ui-btn">删除选中<span class="ui-n abs">20</span></span>
                <span class="ui-btn">清空画布<span class="ui-n abs">21</span></span>
                <span class="ui-btn primary">导出 PNG<span class="ui-n abs">22</span></span>
              </div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">22</span>
              <div>
                <b>导出 PNG</b> —— 把画布上现在的样子导出成一张 PNG，浏览器直接下载。
                导出时按钮会转圈显示「导出中…」。<strong>这张图就是最终成品</strong>
              </div>
            </li>
            <li>
              <span class="ui-n">20</span>
              <div><b>删除选中</b> —— 删掉当前选中的贴图，没选中时是灰的。也可以直接按 <kbd>Delete</kbd></div>
            </li>
            <li>
              <span class="ui-n">21</span>
              <div><b>清空画布</b> —— 一次删掉所有贴图（底图不变）。画布本来就是空的话，它点不动</div>
            </li>
          </ul>
        </div>
      </details>

      <!-- 进阶：画布缩放 -->
      <details class="fold">
        <summary>
          <span class="fold-num">5</span>
          进阶：把画布放大看清楚
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <div class="ui">
            <span class="ui-tag">画布卡片 · 右上角工具条</span>
            <div class="ui-card">
              <div class="ui-head">
                <span class="ui-title">画布</span>
                <span class="ui-mini">−<span class="ui-n abs">23</span></span>
                <span class="ui-zoom">2×<span class="ui-n abs">24</span></span>
                <span class="ui-mini">＋<span class="ui-n abs">25</span></span>
                <span class="ui-mini wide">适应<span class="ui-n abs">26</span></span>
                <span class="ui-mini wide">快捷键<span class="ui-n abs">27</span></span>
              </div>
              <div class="ui-note">拖动贴图库里的贴图到画布 · 单击选中 · Ctrl/Shift 单击多选 · 拖动移动 · 右下角圆点缩放</div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">23</span>
              <div><b>缩小一档</b> —— 只影响你看画布的放大倍数，不影响导出的图。快捷键 <kbd>−</kbd></div>
            </li>
            <li>
              <span class="ui-n">24</span>
              <div>
                <b>当前倍数</b> —— <b>永远是整数倍</b>（1× / 2× / 3×…），
                因为非整数倍缩放会让像素画的边缘发虚
              </div>
            </li>
            <li>
              <span class="ui-n">25</span>
              <div><b>放大一档</b> —— 快捷键 <kbd>+</kbd></div>
            </li>
            <li>
              <span class="ui-n">26</span>
              <div>
                <b>适应</b> —— 按当前窗口大小自动挑一个合适的整数倍。窗口变了它还会自己跟着调；
                但只要你手动按过 ＋ / −，它就不再插手。快捷键 <kbd>0</kbd>
              </div>
            </li>
            <li>
              <span class="ui-n">27</span>
              <div>
                <b>快捷键</b> —— 弹出全部键盘快捷键的清单。快捷键 <kbd>?</kbd>。
                完整表在下面「键盘快捷键」那一节
              </div>
            </li>
          </ul>
        </div>
      </details>

      <!-- 进阶：多选 -->
      <details class="fold">
        <summary>
          <span class="fold-num">6</span>
          进阶：一次调整好几个贴图
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <p class="sec-lead">
            按住 <kbd>Ctrl</kbd> 点其他贴图可以加选，按住 <kbd>Shift</kbd> 点是选一段。
            选中多个之后拖动其中任意一个，<b>整组会一起移动</b>，组内相对位置不会散。
            同时「贴图参数」卡片会变成批量工具：
          </p>

          <div class="ui">
            <span class="ui-tag">右栏 · 贴图参数（选中多个）</span>
            <div class="ui-card">
              <div class="ui-head">
                <span class="ui-title">贴图参数</span>
                <span class="ui-chip">已选 4 个</span>
              </div>
              <div class="ui-note">已选中 <b>4</b> 个贴图 · 拖动任意一个会<b>整组一起移动</b></div>
              <div class="ui-align-grid">
                <span v-for="a in ALIGN_OPS" :key="a.label" class="ui-btn sm">
                  <span class="ui-align-icon">{{ a.icon }}</span>{{ a.label }}
                </span>
                <span class="ui-n abs">28</span>
              </div>
              <div class="ui-actions">
                <span class="ui-btn sm">水平分布<span class="ui-n abs">29</span></span>
                <span class="ui-btn sm">垂直分布</span>
                <span class="ui-btn sm">整组居中</span>
                <span class="ui-btn sm">水平翻转</span>
                <span class="ui-btn sm">垂直翻转</span>
                <span class="ui-btn sm">置顶<span class="ui-n abs">30</span></span>
                <span class="ui-btn sm">置底</span>
                <span class="ui-btn sm">复制</span>
                <span class="ui-btn sm danger">删除</span>
              </div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">28</span>
              <div>
                <b>六个对齐按钮</b> —— 让多张贴图按同一条基准线对齐，不用手工微调：
                左对齐 / 水平居中 / 右对齐 / 顶对齐 / 垂直居中 / 底对齐。
                做「一列按钮」或「一排图标」时，先大致拖好再点一下对齐，比一个个输坐标快得多
              </div>
            </li>
            <li>
              <span class="ui-n">29</span>
              <div>
                <b>水平 / 垂直分布</b> —— 把选中的贴图在一个方向上<b>等间距</b>排开，
                间距由最外侧两张决定。排一排等距按钮时很好用
              </div>
            </li>
            <li>
              <span class="ui-n">30</span>
              <div>
                <b>置顶 / 置底</b> —— 一步把选中的贴图全挪到最上层或最下层，不用一层层爬。
                快捷键 <kbd>Ctrl</kbd> + <kbd>]</kbd> 和 <kbd>Ctrl</kbd> + <kbd>[</kbd>
              </div>
            </li>
          </ul>
        </div>
      </details>

      <!-- 进阶：图层 -->
      <details class="fold">
        <summary>
          <span class="fold-num">7</span>
          进阶：用图层卡片管理前后顺序
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <div class="ui">
            <span class="ui-tag">右栏 · 图层</span>
            <div class="ui-card">
              <div class="ui-head">
                <span class="ui-title">图层</span>
                <span class="ui-mini wide">全选<span class="ui-n abs">31</span></span>
              </div>
              <div class="ui-note">列表<b>最上面 = 画布最上层</b> · 按住 Ctrl 单击多选 · 按住 Shift 单击选一段</div>
              <div class="ui-layers">
                <div class="ui-lyr on">
                  <span class="ui-lyr-idx">3</span>
                  <span class="ui-lyr-thumb" />
                  <span class="ui-lyr-info"><b>Button Primary</b><span>64 × 20</span></span>
                  <span class="ui-lyr-ops">
                    <span class="ui-lyr-op">↑<span class="ui-n abs">32</span></span>
                    <span class="ui-lyr-op">↓</span>
                    <span class="ui-lyr-op danger">✕<span class="ui-n abs">33</span></span>
                  </span>
                </div>
                <div class="ui-lyr">
                  <span class="ui-lyr-idx">2</span>
                  <span class="ui-lyr-thumb" />
                  <span class="ui-lyr-info"><b>Icon Chest</b><span>16 × 16</span></span>
                  <span class="ui-lyr-ops">
                    <span class="ui-lyr-op">↑</span>
                    <span class="ui-lyr-op">↓</span>
                    <span class="ui-lyr-op danger">✕</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ul class="ui-legend">
            <li>
              <span class="ui-n">31</span>
              <div><b>全选</b> —— 一下选中画布上所有贴图。快捷键 <kbd>Ctrl</kbd> + <kbd>A</kbd></div>
            </li>
            <li>
              <span class="ui-n">32</span>
              <div>
                <b>↑ / ↓</b> —— 这一层往上 / 往下挪一层。
                <b>图层和贴图参数是联动的</b>：在这里点一行，画布上对应的贴图就选中了
              </div>
            </li>
            <li>
              <span class="ui-n">33</span>
              <div><b>✕</b> —— 删掉这一层。和「贴图参数」里的删除是同一件事</div>
            </li>
          </ul>

          <div class="callout info">
            <el-icon class="callout-icon"><InfoFilled /></el-icon>
            <div>
              <strong>顺序怎么看：</strong>
              列表<b>越靠上 = 画面越靠前</b>。比如「Button Primary」排在「Icon Chest」上面，
              就是按钮盖住图标。想换遮挡关系，把上面的往下挪（点 ↓）就行
            </div>
          </div>
        </div>
      </details>

      <!-- 快捷键 -->
      <details class="fold">
        <summary>
          <span class="fold-num">8</span>
          键盘快捷键速查表
          <el-icon class="fold-arrow"><ArrowRight /></el-icon>
        </summary>
        <div class="fold-body">
          <p class="sec-lead">排熟了之后用键盘比点按钮快很多。画布卡片右上角的「快捷键」按钮随时能打开这份清单</p>
          <div class="tbl-wrap">
            <table class="gd-table">
              <thead>
                <tr>
                  <th>分组</th>
                  <th>按键</th>
                  <th>作用</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>选择</td>
                  <td><kbd>单击</kbd> / <kbd>Ctrl</kbd>+<kbd>单击</kbd> / <kbd>Shift</kbd>+<kbd>单击</kbd></td>
                  <td>选中 / 加选减选 / 选中一段范围</td>
                </tr>
                <tr>
                  <td>选择</td>
                  <td><kbd>Ctrl</kbd>+<kbd>A</kbd> / <kbd>Esc</kbd></td>
                  <td>全选 / 取消选择</td>
                </tr>
                <tr>
                  <td>位置</td>
                  <td><kbd>方向键</kbd> / <kbd>Shift</kbd>+<kbd>方向键</kbd></td>
                  <td>微调 1px / 微调 10px</td>
                </tr>
                <tr>
                  <td>位置</td>
                  <td><kbd>C</kbd></td>
                  <td>居中（多选时整组居中）</td>
                </tr>
                <tr>
                  <td>编辑</td>
                  <td><kbd>Ctrl</kbd>+<kbd>D</kbd> / <kbd>Delete</kbd></td>
                  <td>复制选中 / 删除选中</td>
                </tr>
                <tr>
                  <td>编辑</td>
                  <td><kbd>F</kbd> / <kbd>Shift</kbd>+<kbd>F</kbd></td>
                  <td>水平翻转 / 垂直翻转</td>
                </tr>
                <tr>
                  <td>层级</td>
                  <td><kbd>]</kbd> / <kbd>[</kbd> / <kbd>Ctrl</kbd>+<kbd>]</kbd> / <kbd>Ctrl</kbd>+<kbd>[</kbd></td>
                  <td>上移一层 / 下移一层 / 移到最上层 / 移到最下层</td>
                </tr>
                <tr>
                  <td>画布</td>
                  <td><kbd>+</kbd> / <kbd>−</kbd> / <kbd>0</kbd> / <kbd>?</kbd></td>
                  <td>放大 / 缩小 / 适应窗口 / 开关快捷键面板</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </details>

      <div class="callout warn">
        <el-icon class="callout-icon"><WarningFilled /></el-icon>
        <div>
          <strong>贴图库是空的？</strong>
          因为它只显示你自己放进 <code>mine/</code> 文件夹的贴图。
          想往里加图，看下面第四节
        </div>
      </div>
    </section>

    <!-- ============ 四、贡献自己的贴图 ============ -->
    <section id="contribute" class="card sec">
      <h2 class="sec-title"><span class="sec-no">四</span>贡献自己的贴图</h2>
      <p class="sec-lead strong">
        想让自己的作品出现在贴图库里、被所有人下载使用？整个过程其实就三步：
        <strong>把 PNG 传上 GitHub → 发起 Pull Request → 等合并</strong>。
        下面把每一步都拆开写了，第一次提 PR 也完全跟得上
      </p>

      <div class="callout primary">
        <el-icon class="callout-icon"><MagicStick /></el-icon>
        <div>
          <strong>先说原理，你就明白为什么这么简单了：</strong>
          贴图库的内容是在<b>编译时扫描 <code>mine/</code> 文件夹</b>得到的，
          没有数据库、也没有清单文件要维护。所以「贡献一张贴图」= 往 <code>mine/</code> 里加一个
          <code>.png</code> 文件，然后让这个改动合并到主仓库
        </div>
      </div>

      <h3 class="sub-title">方式 A：在 GitHub 网页上传（不用装任何软件）</h3>
      <p class="sec-lead">推荐第一次贡献用这条路，全程点点鼠标就行</p>

      <div class="steps">
        <div class="step">
          <span class="step-no">1</span>
          <div class="step-body">
            <div class="step-head">准备好 GitHub 账号</div>
            <p>
              没有账号的话先到 <a :href="REPO.replace(/\/[^/]+$/, '')" target="_blank" rel="noopener">github.com</a> 注册一个，免费。
              已经有账号的直接跳到下一步
            </p>
          </div>
        </div>

        <div class="step">
          <span class="step-no">2</span>
          <div class="step-body">
            <div class="step-head">Fork 一份仓库到你自己的账号下</div>
            <p>
              打开<a :href="REPO" target="_blank" rel="noopener">项目仓库</a>，点右上角的
              <b>Fork</b> 按钮，再点 <b>Create fork</b>
            </p>
            <p>
              Fork 的意思是：把别人的仓库<b>复制一份到你自己的账号下</b>。
              你在自己那份里怎么改都行，改坏了也不会影响原项目 —— 这就是为什么贡献要先 Fork
            </p>
          </div>
        </div>

        <div class="step">
          <span class="step-no">3</span>
          <div class="step-body">
            <div class="step-head">把 PNG 上传到 mine/ 目录</div>
            <ol class="step-list ordered">
              <li>打开你 Fork 出来的那份仓库（地址是 <code>github.com/你的用户名/...</code>）</li>
              <li>点进 <code>mine/</code> 文件夹</li>
              <li>点右上角的 <b>Add file</b> → <b>Upload files</b></li>
              <li>把你的 PNG 拖进上传区（可以一次拖好几张）</li>
              <li>拉到页面底部，在 Commit changes 的输入框里写一句说明，比如 <code>add: 我的按钮贴图</code></li>
              <li>点绿色的 <b>Commit changes</b> 按钮</li>
            </ol>
          </div>
        </div>

        <div class="step">
          <span class="step-no">4</span>
          <div class="step-body">
            <div class="step-head">发起 Pull Request</div>
            <p>
              回到你那份仓库的首页，这时会看到一条提示说你的分支比原仓库多了一次提交。
              点 <b>Contribute</b> → <b>Open pull request</b>
            </p>
            <p>
              Pull Request（简称 PR）的意思是：<b>向原仓库作者申请「我在自己那份里做的改动，请合并进正式项目」</b>。
              标题写清楚你加了什么，描述里简单说明贴图是自己画的、大概是什么用途。
              确认无误后点 <b>Create pull request</b>
            </p>
          </div>
        </div>

        <div class="step">
          <span class="step-no">5</span>
          <div class="step-body">
            <div class="step-head">等合并</div>
            <p>
              维护者会看你的 PR。审核通过合并之后，你的贴图就会出现在网站贴图库里，
              所有人都能用到它。合并时 GitHub 会通知你，不需要你再做什么
            </p>
          </div>
        </div>
      </div>

      <h3 class="sub-title">方式 B：用 Git 命令行（要改好几张图时更顺手）</h3>
      <p class="sec-lead">电脑上装了 Git 的话，这条路的步骤更少</p>

      <pre class="code"><code># 1. 先按方式 A 的第 2 步 Fork 一份，然后克隆<b>你自己</b>的那份
git clone https://github.com/你的用户名/XyLuoWeb-MCtools.git
cd XyLuoWeb-MCtools

# 2. 把画好的贴图复制进 mine/ 目录
cp ~/我的贴图/*.png mine/

# 3. 提交并推送到你自己的仓库
git add mine/
git commit -m "add: 我的按钮贴图"
git push

# 4. 回到 GitHub 页面，点 Contribute → Open pull request 发起 PR</code></pre>

      <div class="callout info">
        <el-icon class="callout-icon"><InfoFilled /></el-icon>
        <div>
          <strong>想先在本机看一眼效果？</strong>
          直接把 PNG 丢进本地项目的 <code>mine/</code> 文件夹，页面会立刻热更新，
          贴图库里马上就能看到它。确认满意了再提交，比来回改 PR 省事得多
        </div>
      </div>

      <h3 class="sub-title">提交前的自查清单</h3>
      <ul class="check-list">
        <li v-for="(c, i) in checklist" :key="i">
          <el-icon class="check-box"><Select /></el-icon>
          <span v-html="c" />
        </li>
      </ul>

      <div class="callout warn">
        <el-icon class="callout-icon"><WarningFilled /></el-icon>
        <div>
          <strong>提交 PR 代表你同意授权条款。</strong>
          授权之后<b>著作权还是你的</b> —— 你照样可以在自己的群里、店铺里、别的地方用甚至卖自己的作品；
          只不过同时允许本项目把它免费开放给所有人（可用、可改、可打包进资源包，不能商用）。
          授权是永久的、不可撤销的，所以点提交之前请想清楚。
          完整条款见<a href="/terms">素材授权条款</a>
        </div>
      </div>
    </section>

    <!-- ============ 五、贴图制作规范 ============ -->
    <section id="rules" class="card sec">
      <h2 class="sec-title"><span class="sec-no">五</span>贴图制作规范</h2>
      <p class="sec-lead">
        想让自己画的贴图顺利通过审核、在菜单里也好看，照着下面这份表做基本不会出错
      </p>

      <div class="tbl-wrap">
        <table class="gd-table">
          <thead>
            <tr>
              <th>项目</th>
              <th>建议做法</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>文件格式</td>
              <td>PNG，扩展名必须<b>全小写</b> <code>.png</code> —— 工具只认小写，<code>.PNG</code> 会被忽略</td>
            </tr>
            <tr>
              <td>尺寸</td>
              <td>单张控制在 256×256 以内；像素画尽量用 16 / 32 / 64 这样的整数尺寸</td>
            </tr>
            <tr>
              <td>文件名</td>
              <td>用 <code>button_primary.png</code> 这种小写 + 下划线或连字符的写法，<b>不要出现中文和空格</b></td>
            </tr>
            <tr>
              <td>背景</td>
              <td>做成<b>透明背景</b>，放到菜单上才不会盖住底图的纹理</td>
            </tr>
            <tr>
              <td>画风</td>
              <td>和 MC 的像素风保持一致，别混进高清渐变图或带抗锯齿的大图</td>
            </tr>
            <tr>
              <td>版权</td>
              <td>必须是自己画的，或者已经拿到原作者的明确授权，<b>不要提交网上随手找的图</b></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="callout info">
        <el-icon class="callout-icon"><InfoFilled /></el-icon>
        <div>
          <strong>文件名会直接变成贴图库里显示的名字。</strong>
          <code>button_primary.png</code> 到贴图库里会显示成「Button Primary」，
          下划线和连字符自动变空格。所以起名时尽量挑看得懂的词，别用 <code>aaa1.png</code> 这种
        </div>
      </div>
    </section>

    <!-- ============ 六、常见问题 ============ -->
    <section id="faq" class="card sec">
      <h2 class="sec-title"><span class="sec-no">六</span>常见问题</h2>

      <div class="faq-list">
        <details v-for="(f, i) in faq" :key="i" class="faq">
          <summary>
            <span class="faq-idx">Q{{ i + 1 }}</span>
            <span class="faq-q" v-html="f.q" />
            <el-icon class="faq-arrow"><ArrowRight /></el-icon>
          </summary>
          <div class="faq-a" v-html="f.a" />
        </details>
      </div>
    </section>

    <!-- ============ 还是没解决？ ============ -->
    <section class="card sec end-card">
      <h2 class="sec-title"><span class="sec-no">?</span>还是没解决？</h2>
      <p class="sec-lead">
        教程里没写到的，欢迎直接提问。提 Issue 的时候把「你想做什么 / 实际发生了什么 / 截图」
        写清楚，能快很多
      </p>
      <div class="end-actions">
        <a class="btn primary" :href="REPO + '/issues/new'" target="_blank" rel="noopener">
          <el-icon><ChatDotSquare /></el-icon>
          去 GitHub 提问
        </a>
        <router-link class="btn" to="/terms">
          <el-icon><Document /></el-icon>
          看素材授权条款
        </router-link>
        <router-link class="btn" to="/mcmenu">
          <el-icon><PictureFilled /></el-icon>
          去拼一张菜单
        </router-link>
      </div>
    </section>
    <!-- 点图放大：遮罩 + 屏幕中央看大图。
         Teleport 到 body，免得被卡片的 overflow / stacking 影响 -->
    <Teleport to="body">
      <Transition name="lb">
        <div
          v-if="zoomSrc"
          class="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="查看大图"
          @click="closeZoom"
        >
          <img :src="zoomSrc" alt="菜单成品大图" @click.stop />
          <button class="lb-close" type="button" title="关闭（Esc）" @click="closeZoom">
            <el-icon><Close /></el-icon>
          </button>
          <div class="lb-tip">点空白处或按 Esc 关闭</div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ============ 页头 ============ */
.gd-hero {
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
  max-width: 780px;
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

/* 章节快捷跳转 */
.gd-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--card-border);
}
.gd-nav-btn {
  padding: 7px 14px;
  border-radius: 9px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  color: var(--text-secondary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}
.gd-nav-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 8%, var(--card-bg));
}

/* ============ 章节 ============ */
.sec {
  margin-top: 18px;
  padding: 22px 26px 24px;
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
.sec-lead {
  font-size: 14px;
  line-height: 1.85;
  color: var(--text-secondary);
  margin-bottom: 10px;
}
.sec-lead.strong {
  color: var(--text);
}
.sec-lead strong {
  color: var(--text);
}
.sec-lead code {
  font-family: Consolas, monospace;
  font-size: 0.94em;
}
.sub-title {
  font-size: 15px;
  font-weight: 700;
  margin: 24px 0 8px;
  padding-left: 10px;
  border-left: 3px solid var(--primary);
}

/* ============ 快速上手引导块 ============ */
.start-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
  margin: 14px 0;
}
.sc {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 13px 14px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
}
.sc-n {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: var(--primary);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
.sc b {
  font-size: 13.5px;
  color: var(--text);
}
.sc p {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text-secondary);
}

/* 效果示例：聊天框 */
.demo-chat {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 12px 0;
  padding: 11px 14px;
  border-radius: 9px;
  background: #1a1a1a;
  font-family: Consolas, monospace;
  font-size: 14px;
  color: #e6e6e6;
}
.demo-name {
  color: #AAAAAA;
}
.dc-gold {
  color: #FFAA00;
}
.dc-gray {
  color: #AAAAAA;
}
.dc-yellow {
  color: #FFFF55;
}
.dc-green {
  color: #55FF55;
}

/* 效果示例：真实导出的成品图（不是示意图）
   放在 public/tutorial/，不要塞进 public/images/（那边声明了「全部由 AI 生成」） */
.demo-shot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 14px 0;
  padding: 20px 18px 16px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
}
/* 用 button 而不是 <a>：点了是在本页放大，不是跳到新标签页 */
.ds-zoom {
  position: relative;
  display: block;
  padding: 0;
  border: 0;
  background: none;
  font-family: inherit;
  line-height: 0;
  border-radius: 6px;
  cursor: zoom-in;
}
.ds-zoom img {
  display: block;
  width: 100%;
  /* 原图 704×888，按正好一半显示，缩放是整数关系、像素不会发虚 */
  max-width: 352px;
  height: auto;
  border-radius: 6px;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}
.ds-zoom:hover img {
  transform: scale(1.015);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
.ds-hint {
  position: absolute;
  left: 50%;
  bottom: 9px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.62);
  color: #fff;
  font-size: 11.5px;
  line-height: 1.7;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}
.ds-zoom:hover .ds-hint {
  opacity: 1;
}
.demo-shot figcaption {
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text-muted);
  text-align: center;
}
.demo-shot figcaption b {
  color: var(--text-secondary);
}

/* ============ 点图放大（灯箱） ============
   Teleport 到 body，但这套样式照样命中 —— scoped 属性会跟着元素一起过去 */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: grid;
  place-items: center;
  padding: 46px 22px;
  background: rgba(0, 0, 0, 0.74);
  backdrop-filter: blur(7px);
  cursor: zoom-out;
}
.lightbox img {
  display: block;
  width: auto;
  height: auto;
  /* 原图 704×888：屏幕够高就 1:1 显示，不够高才等比缩下来。
     ⚠️ 这里要用 100%（= grid 内容区，已经扣掉 padding）而不是 92vw ——
     92vw 在窄屏下比内容区还宽，图片会溢出 grid area，
     而 grid 的对齐在溢出时会退化成 start（左对齐），图就不居中了（实测偏右 6px） */
  max-width: min(704px, 100%);
  max-height: 86vh;
  border-radius: 8px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
  cursor: default;
}
.lb-close {
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.26);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 17px;
  cursor: pointer;
  transition: background 0.18s ease;
}
.lb-close:hover {
  background: rgba(255, 255, 255, 0.22);
}
.lb-tip {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  white-space: nowrap;
}
.lb-enter-active,
.lb-leave-active {
  transition: opacity 0.22s ease;
}
.lb-enter-active img {
  transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
}
.lb-enter-from,
.lb-leave-to {
  opacity: 0;
}
.lb-enter-from img {
  transform: scale(0.9);
}

/* 「先跑通一遍」——永远可见的主干 */
.quickstart {
  margin: 16px 0;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--primary) 40%, transparent);
  background: color-mix(in srgb, var(--primary) 7%, transparent);
}
.qs-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14.5px;
  font-weight: 700;
  color: var(--text);
}
.qs-head .el-icon {
  color: var(--primary);
}
.qs-steps {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--text-secondary);
}
.qs-steps b {
  color: var(--text);
}
.qs-steps code {
  font-family: Consolas, monospace;
  font-size: 0.93em;
}
.qs-foot {
  margin-top: 11px;
  padding-top: 9px;
  border-top: 1px dashed color-mix(in srgb, var(--primary) 30%, transparent);
  font-size: 12.5px;
  color: var(--text-muted);
}

/* 折叠块：主干只留步骤，细节收进这里 */
.fold {
  margin-top: 12px;
  border: 1px solid var(--card-border);
  border-radius: 10px;
  background: var(--card-bg);
  overflow: hidden;
}
.fold > summary {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 13px 15px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  list-style: none;
}
.fold > summary::-webkit-details-marker {
  display: none;
}
.fold > summary:hover {
  background: var(--chip-bg);
}
.fold-num {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 7px;
  background: color-mix(in srgb, var(--primary) 15%, transparent);
  color: var(--primary);
  font-size: 11.5px;
  font-weight: 700;
}
.fold-arrow {
  margin-left: auto;
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.2s ease;
}
.fold[open] .fold-arrow {
  transform: rotate(90deg);
}
.fold-body {
  padding: 2px 15px 16px;
  border-top: 1px solid var(--card-border);
}
.fold-body > p:first-child,
.fold-body > .sec-lead:first-child {
  margin-top: 12px;
}

/* ============ 界面示意 ============
   教程里不贴网页截图，而是用真实的页面元素把界面「画」出来：
   矢量清晰、自动跟亮暗主题、界面以后微调了也不会过时。
   .ui 是外壳，.ui-tag 是左上角标签，.ui-n 是编号徽标（.abs 版浮在控件右上角） */
.ui {
  position: relative;
  margin: 16px 0 6px;
  padding: 22px 18px 18px;
  border-radius: 12px;
  border: 1px dashed color-mix(in srgb, var(--primary) 34%, var(--card-border));
  background: color-mix(in srgb, var(--primary) 4%, var(--chip-bg));
}
.ui-tag {
  position: absolute;
  top: -9px;
  left: 14px;
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.6;
}

/* 编号徽标 */
.ui-n {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  flex-shrink: 0;
}
.ui-n.abs {
  position: absolute;
  top: -9px;
  right: -9px;
  z-index: 3;
  box-shadow: 0 0 0 2px var(--card-bg);
}
/* .in：改成贴在容器「内部」右上角 —— 上方就是别的元素、外面没地方放时用 */
.ui-n.abs.in {
  top: 3px;
  right: 3px;
  box-shadow: none;
}

/* 说明列表 */
.ui-legend {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.ui-legend > li {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--text-secondary);
}
.ui-legend .ui-n {
  margin-top: 3px;
}
.ui-legend b,
.ui-legend strong {
  color: var(--text);
}
.ui-legend code {
  font-family: Consolas, monospace;
  font-size: 0.93em;
}
.ui-sublist {
  margin: 5px 0 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 13px;
}
/* 导航项用文字胶囊当「编号」 */
.ui-k {
  flex-shrink: 0;
  min-width: 92px;
  margin-top: 2px;
  padding: 2px 9px;
  border-radius: 7px;
  background: var(--chip-bg);
  border: 1px solid var(--card-border);
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

/* ---- 顶栏 ---- */
.ui-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 12px;
  height: 50px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
}
.ui-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--text);
}
.ui-brand em {
  font-style: normal;
  color: var(--primary);
}
.ui-brand-x {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  flex-shrink: 0;
  /* 和真实顶栏一致：站点标志图案 + 主题色底（图案本身是白色） */
  background-color: var(--primary);
  background-image: url('/mark.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: auto 58%;
}
.ui-tabs {
  display: flex;
  align-items: center;
  gap: 3px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.ui-tab {
  padding: 5px 10px;
  border-radius: 7px;
  font-size: 12.5px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.ui-tab.on {
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 13%, transparent);
  font-weight: 600;
}
.ui-act {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.ui-ico {
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  display: grid;
  place-items: center;
  font-size: 14px;
  color: var(--text);
}
.ui-theme-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(128, 128, 128, 0.35);
  background: var(--primary);
}

/* ---- 卡片式示意 ---- */
.ui-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ui-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ui-head.mt {
  margin-top: 4px;
}
.ui-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}
.ui-title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 13px;
  margin-right: 7px;
  border-radius: 2px;
  background: var(--primary);
  vertical-align: -1px;
}
.ui-chip {
  padding: 1px 9px;
  border-radius: 999px;
  background: var(--chip-bg);
  border: 1px solid var(--card-border);
  font-size: 11.5px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.ui-note {
  position: relative;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-muted);
}
.ui-note b {
  color: var(--text-secondary);
}
.ui-note.mt {
  margin-top: 4px;
}
.ui-note-inline {
  font-size: 12px;
  color: var(--text-muted);
}
.ui-mini {
  position: relative;
  display: inline-grid;
  place-items: center;
  min-width: 26px;
  height: 26px;
  padding: 0 7px;
  border-radius: 7px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  font-size: 12.5px;
  color: var(--text-secondary);
}
.ui-mini.wide {
  min-width: auto;
  padding: 0 10px;
}
.ui-mini.dim {
  opacity: 0.45;
}
.ui-zoom {
  position: relative;
  display: inline-grid;
  place-items: center;
  min-width: 40px;
  height: 26px;
  padding: 0 7px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--primary);
  font-variant-numeric: tabular-nums;
}

/* ---- 分段控件 ---- */
.ui-seg {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 9px;
  background: var(--chip-bg);
  border: 1px solid var(--card-border);
  align-self: flex-start;
  max-width: 100%;
  flex-wrap: wrap;
}
.ui-seg-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 7px;
  font-size: 12.5px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.ui-seg-btn.on {
  background: var(--card-bg);
  color: var(--primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}
.ui-seg.sm .ui-seg-btn {
  padding: 4px 10px;
  font-size: 12px;
}
.ui-seg.xs .ui-seg-btn {
  padding: 3px 8px;
  font-size: 11.5px;
}
.ui-seg-pill {
  display: none;
}

/* ---- 色板 ---- */
.ui-swatches {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 5px;
}
.ui-sw {
  position: relative;
  aspect-ratio: 1;
  border-radius: 6px;
  border: 1px solid var(--card-border);
  display: grid;
  place-items: end center;
  padding-bottom: 2px;
}
.ui-sw-code {
  font-family: Consolas, monospace;
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.9);
}

/* ---- 下拉 / 输入 ---- */
.ui-select {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  font-size: 12.5px;
  color: var(--text);
  max-width: 220px;
}
.ui-select.grow {
  flex: 1;
  max-width: 260px;
}
.ui-caret {
  color: var(--text-muted);
  font-size: 10px;
}
.ui-input {
  position: relative;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 11px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  font-size: 13px;
  color: var(--text);
}
.ui-input.sm {
  height: 26px;
  padding: 0 9px;
  font-size: 12px;
  max-width: 132px;
  color: var(--text-muted);
}
.ui-num {
  position: relative;
  display: inline-grid;
  place-items: center;
  min-width: 46px;
  height: 28px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  font-size: 12.5px;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.ui-num.grow {
  flex: 1;
}
.ui-unit {
  font-size: 11.5px;
  color: var(--text-muted);
}
.ui-times {
  font-size: 12px;
  color: var(--text-muted);
}
.ui-glabel {
  font-size: 11.5px;
  color: var(--text-muted);
  font-weight: 600;
}

/* ---- 开关 ---- */
.ui-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 34px;
  height: 18px;
  padding: 2px;
  border-radius: 999px;
  background: var(--card-border);
  flex-shrink: 0;
}
.ui-switch.on {
  background: var(--primary);
}
.ui-switch-knob {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
}
.ui-switch.on .ui-switch-knob {
  transform: translateX(16px);
}

/* ---- 按钮 ---- */
.ui-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  font-size: 12.5px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.ui-btn.sm {
  padding: 4px 10px;
  font-size: 12px;
}
.ui-btn.primary {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.ui-btn.danger {
  color: #ef4444;
  border-color: color-mix(in srgb, #ef4444 40%, var(--card-border));
}
.ui-actions {
  /* relative 必须留着：不写的话，直接挂在这一行上的 .ui-n.abs 会
     一路找到最外层 .ui 去定位，徽标就跑到整个示意块的角上了 */
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin-top: 4px;
}

/* ---- 行式布局（输出设置） ---- */
.ui-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.ui-row-k {
  flex-shrink: 0;
  width: 82px;
  font-size: 12.5px;
  color: var(--text-secondary);
}

/* ---- 渐变条 / 快速模板 ---- */
.ui-track {
  position: relative;
  height: 22px;
  border-radius: 6px;
  border: 1px solid var(--card-border);
}
.ui-track-fill {
  position: absolute;
  inset: 0;
  border-radius: 6px;
  background: linear-gradient(90deg, #55FF55, #FFAA00, #FF5555);
}
.ui-gstop {
  position: absolute;
  top: 50%;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid #fff;
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}
.ui-scale {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  color: var(--text-muted);
  margin-top: -4px;
}
.ui-gp-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 6px;
}
.ui-gp {
  padding: 8px 4px;
  border-radius: 8px;
  font-size: 11.5px;
  color: #fff;
  text-align: center;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

/* ---- 预设 ---- */
.ui-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.ui-preset {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  font-size: 12px;
  color: var(--text-secondary);
}
.ui-preset-bar {
  width: 26px;
  height: 12px;
  border-radius: 4px;
}
.ui-preset-x {
  color: var(--text-muted);
  font-size: 13px;
}

/* ---- 字符区 ---- */
.ui-chars {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1px;
  padding: 7px 8px;
  border-radius: 9px;
  background: var(--chip-bg);
  min-height: 40px;
}
.ui-char {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 26px;
  padding: 0 3px;
  border-radius: 4px;
  font-size: 14px;
  color: var(--text);
}
.ui-char.on {
  background: color-mix(in srgb, var(--primary) 26%, transparent);
  color: var(--primary);
  font-weight: 700;
}
.ui-gap {
  position: relative;
  display: inline-block;
  width: 7px;
  height: 26px;
}
.ui-gap::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1px;
  height: 14px;
  background: var(--card-border);
  transform: translate(-50%, -50%);
}
.ui-rbadge {
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0 3px;
  border-radius: 3px;
  background: var(--primary);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
}

/* ---- 预览 / 输出 ---- */
.ui-chat {
  padding: 11px 13px;
  border-radius: 8px;
  background: #1a1a1a;
  font-family: Consolas, monospace;
  font-size: 13px;
  color: #e6e6e6;
}
.ui-chat-name {
  color: #AAAAAA;
}
.ui-colorbox {
  position: relative;
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  border: 1px solid var(--card-border);
}
.ui-code {
  margin: 0;
  padding: 10px 13px;
  border-radius: 8px;
  background: var(--chip-bg);
  border: 1px solid var(--card-border);
  font-family: Consolas, monospace;
  font-size: 12.5px;
  color: var(--text);
  overflow-x: auto;
}

/* ---- 贴图参数 ---- */
.ui-param-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
  gap: 8px;
}
.ui-pf {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11.5px;
  color: var(--text-muted);
}
.ui-align-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
  gap: 6px;
}
.ui-align-icon {
  font-size: 13px;
  color: var(--primary);
}

/* ---- 图层 ---- */
.ui-layers {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.ui-lyr {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 9px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
}
.ui-lyr.on {
  border-color: color-mix(in srgb, var(--primary) 55%, var(--card-border));
  background: color-mix(in srgb, var(--primary) 9%, var(--card-bg));
}
.ui-lyr-idx {
  width: 16px;
  font-size: 11px;
  color: var(--text-muted);
  font-family: Consolas, monospace;
  text-align: center;
}
.ui-lyr-thumb {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid var(--card-border);
  background: linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 45%, #888));
  flex-shrink: 0;
}
.ui-lyr-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  font-size: 12px;
  color: var(--text-secondary);
}
.ui-lyr-info b {
  color: var(--text);
  font-weight: 600;
}
.ui-lyr-info span {
  font-size: 10.5px;
  color: var(--text-muted);
  font-family: Consolas, monospace;
}
.ui-lyr-ops {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.ui-lyr-op {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  font-size: 12px;
  color: var(--text-secondary);
}
.ui-lyr-op.danger {
  color: #ef4444;
}

/* ---- 贴图库 ---- */
.ui-contribute {
  position: relative;
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px dashed color-mix(in srgb, var(--primary) 48%, transparent);
  color: var(--primary);
  font-size: 11.5px;
  white-space: nowrap;
}
.ui-libhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--card-border);
}
.ui-count {
  font-size: 10.5px;
  color: var(--text-muted);
  background: var(--chip-bg);
  padding: 1px 7px;
  border-radius: 999px;
}
.ui-libgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 7px;
}
.ui-libitem {
  position: relative;
  display: grid;
  place-items: center;
  height: 44px;
  border-radius: 9px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  font-size: 11.5px;
  color: var(--text-secondary);
}

/* ============ 步骤 ============ */
.steps {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 16px;
}
.step {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.step-no {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  margin-top: 1px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--primary) 14%, transparent);
  color: var(--primary);
  font-size: 12.5px;
  font-weight: 700;
}
.step-body {
  min-width: 0;
}
.step-head {
  font-size: 14.5px;
  font-weight: 700;
  margin-bottom: 5px;
}
.step-body p {
  font-size: 13.5px;
  line-height: 1.85;
  color: var(--text-secondary);
}
.step-body p + p {
  margin-top: 6px;
}
.step-body strong,
.step-body b {
  color: var(--text);
}
.step-body code {
  font-family: Consolas, monospace;
  font-size: 0.93em;
}
.step-list {
  margin: 6px 0 0;
  padding-left: 20px;
  font-size: 13.5px;
  line-height: 1.85;
  color: var(--text-secondary);
}
.step-list li {
  margin-bottom: 3px;
}
.step-list li b {
  color: var(--text);
}
.step-list.ordered {
  list-style: decimal;
}
kbd {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 5px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  font-family: Consolas, monospace;
  font-size: 0.88em;
  color: var(--text);
}

/* ============ 代码块 ============ */
.code {
  margin: 12px 0 16px;
  padding: 15px 18px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--chip-bg);
  overflow-x: auto;
  font-family: Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.85;
  color: var(--text);
}
.code code {
  font-family: inherit;
  white-space: pre;
}
.code b {
  color: var(--primary);
}

/* ============ 自查清单 ============ */
.check-list {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.check-list li {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--text-secondary);
}
.check-box {
  flex-shrink: 0;
  margin-top: 3px;
  color: #22c55e;
  font-size: 14px;
}
.check-list b {
  color: var(--text);
}
.check-list code {
  font-family: Consolas, monospace;
  font-size: 0.93em;
}
.check-list a {
  color: var(--primary);
}

/* ============ 表格 ============ */
.tbl-wrap {
  margin-top: 12px;
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--card-border);
}
.gd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.gd-table th {
  text-align: left;
  padding: 10px 14px;
  background: var(--chip-bg);
  font-weight: 700;
  white-space: nowrap;
}
.gd-table td {
  padding: 10px 14px;
  border-top: 1px solid var(--card-border);
  color: var(--text-secondary);
  line-height: 1.75;
}
.gd-table td:first-child {
  color: var(--text);
  font-weight: 600;
  white-space: nowrap;
}
.gd-table b {
  color: var(--text);
}
.gd-table code {
  font-family: Consolas, monospace;
  font-size: 0.94em;
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
.callout code {
  font-family: Consolas, monospace;
  font-size: 0.94em;
}
.callout a {
  color: var(--primary);
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
  margin-top: 12px;
}
.faq {
  border: 1px solid var(--card-border);
  border-radius: 10px;
  background: var(--card-bg);
  overflow: hidden;
}
.faq summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 600;
  list-style: none;
}
.faq summary::-webkit-details-marker {
  display: none;
}
.faq summary:hover {
  background: var(--chip-bg);
}
.faq-idx {
  flex-shrink: 0;
  font-family: Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--primary);
}
.faq-q {
  flex: 1;
  min-width: 0;
}
.faq-arrow {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.2s ease;
}
.faq[open] .faq-arrow {
  transform: rotate(90deg);
}
.faq-a {
  padding: 0 14px 13px 44px;
  font-size: 13px;
  line-height: 1.85;
  color: var(--text-secondary);
}
.faq-a b {
  color: var(--text);
}
.faq-a code {
  font-family: Consolas, monospace;
  font-size: 0.94em;
}
.faq-a a {
  color: var(--primary);
}

/* ============ 结尾 ============ */
.end-card {
  margin-bottom: 8px;
}
.end-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

/* ============ 窄屏 ============ */
@media (max-width: 820px) {
  .gd-hero {
    padding: 24px 20px 20px;
  }
  .hero-title {
    font-size: 26px;
  }
  .sec {
    padding: 18px 18px 20px;
  }
  .gd-table td:first-child {
    white-space: normal;
  }
}
@media (max-width: 560px) {
  .faq-a {
    padding-left: 14px;
  }
  .step {
    gap: 10px;
  }
}
</style>
