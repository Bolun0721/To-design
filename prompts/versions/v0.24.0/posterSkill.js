/**
 * 内置海报设计 skill —— 只作用于「海报（4:5）」格式，按模式注入生成 / 设计提示词。
 *
 * 与 designSkill.js 的分工：
 *   designSkill = 通用编辑设计素养，两种生成提示词都注入；
 *   posterSkill = 海报专属的构图、字号、安全区、艺术字覆盖、图案语言与踩坑速查，
 *                 仅在 format === 'poster' 时注入，不污染报纸模式。
 *
 * 单一数据源：POSTER_ASSETS（frozen，零依赖、随 Git 走）
 *   ① 模型可见目录   → buildPosterCatalog()
 *   ② 校验白名单     → buildPosterWhitelist()
 *   ③ patch 字段白名单（同源派生，见 assets.patchFields）
 *   ④ 输出后自检     → auditPosterScheme()（非致命，进「生成摘要」的警告）
 *
 * 版式 / 配色 / 字体 / 艺术字全部引用 config 里的 id，不复制定义、不写死色值；
 * 新增一套版式或一款艺术字，只要 config 里加了，目录与白名单自动跟随。
 * 海报文案长度、构图提示、踩坑点在本文件集中维护，改一处即可。
 */
import {
  COLOR_PRESETS,
  FONT_PAIRINGS,
  FORMATS,
  HEADLINE_PX,
  HEADLINE_SCALES,
  VARIANTS,
  buildLayout,
} from '../config/presets.js'
import { ART_FONTS, artFontForVariant } from '../config/artFonts.js'
import { getPosterTemplate } from '../config/posterTemplates.js'

export const POSTER_FORMAT = 'poster'

/* ---------- 九套版式在海报上的构图提示（一正一反，避免互相抢活） ---------- */

const TEMPLATE_HINTS = {
  classic_broadsheet: {
    focus: '全幅主图压中段，标题在上、注记在下',
    when: '纪念留存 / 打印上墙 / 一张照片讲完整故事',
    notWhen: '需要强冲击 / 无照片 / 活动信息密集',
  },
  tabloid_bold: {
    focus: '主图满版出血，标题反白压在图上',
    when: '活动传播 / 社交分享 / 要一眼抓住',
    notWhen: '正式纪念 / 极简展陈 / 浅色照片',
  },
  minimal_masthead: {
    focus: '居中窄图，标题居中，大留白',
    when: '展陈 / 画册 / 留白优先',
    notWhen: '信息密集 / 需要视觉冲击',
  },
  constructivism: {
    focus: '斜切分区，超大标题压边被 viewBox 裁',
    when: '宣言 / 力量 / 高对比 / 纪念日',
    notWhen: '温情日常 / 家庭合影 / 柔和照片',
  },
  bauhaus: {
    focus: '左文右图，圆形主图，三原色积木',
    when: '几何与秩序 / 展览 / 教学 / 年轻品牌',
    notWhen: '怀旧老照片 / 抒情散文',
  },
  de_stijl: {
    focus: '粗细黑线切分，三原色矩形平涂',
    when: '理性网格 / 品牌规范 / 结构感',
    notWhen: '情感叙事 / 大段文字',
  },
  nasa_punk: {
    focus: '硬件面板，主图占中段，标签与编号环绕',
    when: '技术工程 / 复古未来 / 装备与数据',
    notWhen: '柔和生活 / 文艺抒情',
  },
  swiss_style: {
    focus: '12 栏网格，巨字左压，窄图右挂',
    when: '客观专业 / 机构 / 学术',
    notWhen: '夸张促销 / 手工感',
  },
  cassette_futurism: {
    focus: '主图进显像管，标题在下，屏与按键',
    when: '电子游戏 / 夜生活 / 复古科技',
    notWhen: '明亮日常 / 纸感纪念',
  },
}

/* ---------- 模块标签（只用于提示词可读性，不参与渲染） ---------- */

const BLOCK_LABELS = {
  masthead: '报头',
  dateline: '日期栏',
  headline: '主标题',
  subhead: '副标题',
  byline: '署名',
  hero: '主图',
  secondary: '子图',
  caption: '图注',
  secondaryCaption: '子图注',
  posterNote: '海报注记',
  pullquote: '引语',
  footer: '页脚',
  scrim: '压图罩',
}

/* ---------- 由 config 派生九套版式的海报参数 ---------- */

function buildPosterTemplates() {
  return Object.values(VARIANTS).map((variant) => {
    const blocks = buildLayout(variant.id, 'poster')
    const hero = blocks.find((block) => block.type === 'image' && !block.slot)
    const artFont = artFontForVariant(variant.id)
    const hint = TEMPLATE_HINTS[variant.id] || {
      focus: variant.tagline,
      when: '通用',
      notWhen: '需要更强视觉语言时换一套',
    }
    return {
      id: variant.id,
      name: variant.name,
      en: variant.en,
      focus: hint.focus,
      when: hint.when,
      notWhen: hint.notWhen,
      headlinePx: HEADLINE_PX.poster[variant.id] ?? HEADLINE_PX.poster.classic_broadsheet,
      artFont: artFont || '',
      artFontLabel: artFont ? ART_FONTS[artFont]?.label || artFont : '',
      blocks: blocks.map((block) => block.id),
      blockLabels: blocks.map((block) => BLOCK_LABELS[block.id] || block.id),
      hasNote: blocks.some((block) => block.type === 'note'),
      // 主图占版心面积（%），给模型一个「图大字小 / 图小字大」的量化线索
      heroShare: hero ? Math.round((hero.w * hero.h) / 100) : 0,
      defaultPreset: variant.defaultPreset,
      defaultFont: variant.defaultFont,
      defaultColumns: variant.defaultColumns,
      defaultScale: variant.defaultHeadlineScale,
      defaultTreatment: variant.defaultTreatment,
    }
  })
}

/* ---------- 踩坑点：蒸馏自 Poster_skill_dir 三套手写海报的实测记录 ---------- */

const POSTER_PITFALLS = [
  {
    id: 'font_fallback',
    title: '字体静默回退',
    symptom: '写了系统里没有的字体名，实际落到别的字体，字宽一变整版错位',
    fix: '只用白名单 font_pairing，不手写第四个字体名；导出前确认字体已加载',
  },
  {
    id: 'cjk_in_art_font',
    title: '中文进艺术字',
    symptom: '艺术字与等宽字体都没有 CJK 字形，中文变方框或缺字',
    fix: '艺术字只填英文与数字；中文标题永远走 font_pairing',
  },
  {
    id: 'tracking_overflow',
    title: '字距顶出容器',
    symptom: '中文大字号加 letter-spacing 后溢出色块，压到描边',
    fix: '≥40px 标题字距 ≤4，≤16px 小字 ≤1；加大字距必须同步减字',
  },
  {
    id: 'grid_too_dark',
    title: '网格线抢标题',
    symptom: '网格用实黑或深灰，第一眼先看到格子而不是标题',
    fix: '网格 1px、透明度 ≤15%；只有分区线才用实色',
  },
  {
    id: 'rotate_anchor',
    title: '旋转字定位偏移',
    symptom: '斜排 / 竖排文字靠 text-anchor 居中，视觉上偏出基线',
    fix: '按左基线手动落点，旋转前先算好起点，不靠 middle 兜底',
  },
  {
    id: 'pattern_seam',
    title: '斜纹接缝白线',
    symptom: 'pattern 单元尺寸不是整数，拼接处出现半像素白线',
    fix: 'pattern 单元宽高取整数（16 / 8 这类整齐数值）',
  },
  {
    id: 'bottom_edge',
    title: '底部元素贴边',
    symptom: '注记、装饰码、页脚离外框太近，被出血或裁切吃掉',
    fix: '页脚距底 ≥4%，注记与装饰码再上移一档；最后 5% 只放页脚',
  },
  {
    id: 'fake_qr',
    title: '装饰码冒充二维码',
    symptom: '用方块码做装饰却写「扫码」，实际扫不出来',
    fix: '装饰码只当版式元素，不写扫码文案；要能扫就用真二维码',
  },
  {
    id: 'filter_export',
    title: '依赖 CSS filter',
    symptom: '半调 / 双色调 / 辉光用 CSS filter 实现，导出时全部丢失',
    fix: '效果烘焙进图片像素或 SVG 本身，生成与导出走同一条路径',
  },
  {
    id: 'crop_text',
    title: '出血裁掉字',
    symptom: '巨字压边被裁切，裁掉的是可读内容而不是装饰',
    fix: '只裁装饰与重复字；标题主体必须留在安全区内',
  },
  {
    id: 'accent_sprawl',
    title: '强调色失控',
    symptom: '强调色从标题漫到标签、箭头、按钮，画面散成噪点',
    fix: '一处主强调 + 一处小标记；同尺寸强调块 ≤3 处，其余用墨色与纸色',
  },
  {
    id: 'poster_crammed',
    title: '海报塞成报纸',
    symptom: '留白被长正文与多张卡片填满，3 秒读不完',
    fix: '海报最多 3 个信息块（标题 / 图 / 注记），正文留给报纸视图',
  },
]

/* ---------- 输出前自检（模型侧执行，也用于 auditPosterScheme 的口径） ---------- */

const POSTER_SELF_CHECKS = [
  '三秒内能说出唯一主角是谁？',
  '主标题是否 ≤9 字、≤2 行，且没有出安全区？',
  '是否只有一个强调色，面积 ≤10%？',
  '艺术字是否英文、是否与版式匹配、有没有盖过中文标题？',
  '图注与注记是否共用一条左基线，且没被装饰压住？',
  '文字与装饰是否都距页边 ≥5%？',
  '有没有编造人名、机构、日期、数字或活动？',
  '三套方案是换了构图，还是只换了配色？',
]

/* ---------- patch 字段白名单（原则二：对话只改这些字段） ---------- */

const PATCH_FIELDS = [
  'layout_variant',
  'color_preset',
  'font_pairing',
  'style.columns',
  'style.headline_scale',
  'style.image_treatment',
  'style.art_font',
  'content.headline',
  'content.subhead',
  'content.caption',
  'content.caption_secondary',
  'content.poster_note',
  'content.pullquote',
  'content.art_words',
  'content.body_blocks',
]

/* ---------- 单一数据源 ---------- */

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const key of Object.keys(value)) deepFreeze(value[key])
  }
  return value
}

export const POSTER_ASSETS = deepFreeze({
  version: '1.0.0',
  canvas: {
    format: POSTER_FORMAT,
    ratio: '4:5',
    width: FORMATS.poster.width,
    height: FORMATS.poster.height,
    // 自定义坐标时的最小安全距（%）；模板自带 4–8% 边距
    safe: { side: 5, top: 4, bottom: 5 },
  },
  contentRules: {
    headline: 15,
    subhead: 25,
    caption: 30,
    captionSecondary: 30,
    posterNote: 30,
    pullquote: 24,
    artWords: 3,
    body: { min: 60, max: 120 },
    recommendations: { headline: 9, subhead: 18 },
    allowFacts: false,
    fallback: 'placeholder',
  },
  paletteRoles: [
    { role: 'paper', from: 'background', use: '底色与大面积留白' },
    { role: 'ink', from: 'text', use: '标题与正文' },
    { role: 'accent', from: 'accent', use: '唯一强调色，面积 ≤10%' },
    { role: 'secondary', from: 'secondary', use: '次级色块与分区线' },
    { role: 'muted', from: 'muted', use: '标注、图注、页脚' },
    { role: 'tertiary', from: 'tertiary', use: '仅几何 / 系统三式的第三色' },
    { role: 'invert', from: 'background（压在 text 上）', use: '深底反白' },
  ],
  contrast: { bodyText: 4.5, largeText: 3 },
  templates: buildPosterTemplates(),
  blockLabels: BLOCK_LABELS,
  pitfalls: POSTER_PITFALLS,
  selfChecks: POSTER_SELF_CHECKS,
  patchFields: PATCH_FIELDS,
})

/* ---------- ① 模型可见目录 ---------- */

const HEADLINE_RANGE = {
  min: Math.min(...POSTER_ASSETS.templates.map((tpl) => tpl.headlinePx)),
  max: Math.max(...POSTER_ASSETS.templates.map((tpl) => tpl.headlinePx)),
}

export function buildPosterCatalog(assets = POSTER_ASSETS) {
  const { canvas, contentRules } = assets
  const scaleText = Object.entries(HEADLINE_SCALES)
    .map(([id, scale]) => `${id}×${scale.factor}`)
    .join(' / ')
  const covered = assets.templates.filter((tpl) => tpl.artFont)
  const fallback = assets.templates.filter((tpl) => !tpl.artFont)
  return [
    `海报画布：${canvas.ratio} · ${canvas.width}×${canvas.height}；文字左右 ≥${canvas.safe.side}%、顶 ≥${canvas.safe.top}%、底 ≥${canvas.safe.bottom}%（主图与色块可出血）。`,
    `标题字号为 large 档，档位换算 ${scaleText}。`,
    '海报版式（id｜构图｜标题字号｜主图面积｜艺术字｜适用；不适用）：',
    ...assets.templates.map(
      (tpl) =>
        `- ${tpl.id}｜${tpl.name}｜${tpl.focus}｜道具 ${tpl.blockLabels.join('→')}｜标题 ${
          tpl.headlinePx
        }px｜主图 ${tpl.heroShare}%｜${
          tpl.artFont ? `艺术字 ${tpl.artFont}` : '无艺术字（英文装饰词走标题字体）'
        }｜适用 ${tpl.when}；不适用 ${tpl.notWhen}`,
    ),
    `有艺术字的版式：${covered.map((tpl) => tpl.id).join(' / ')}；无艺术字、art_font 必须为 none：${fallback
      .map((tpl) => tpl.id)
      .join(' / ')}。`,
    `文案：主标题 ≤${contentRules.headline} 字（海报建议 ≤${contentRules.recommendations.headline} 字）、副标题 ≤${
      contentRules.subhead
    } 字（建议 ≤${contentRules.recommendations.subhead} 字）、图注 ≤${contentRules.caption} 字、注记 ≤${
      contentRules.posterNote
    } 字、引语 ≤${contentRules.pullquote} 字、英文装饰词 0–${
      contentRules.artWords
    } 个；正文只写 ${contentRules.body.min}–${contentRules.body.max} 字给报纸视图。`,
    '文案红线：用户没给的人名、机构、日期、数字、活动一律不补；日期用系统给的当前日期。',
    '输出：只回填白名单 id 与 content；不输出 hex、SVG、path 或自定义坐标（设计模式的百分比坐标除外）。',
  ].join('\n')
}

/* ---------- ② 校验白名单 + ③ patch 字段 ---------- */

export function buildPosterWhitelist(assets = POSTER_ASSETS) {
  return {
    templates: new Set(assets.templates.map((tpl) => tpl.id)),
    presets: new Set(Object.keys(COLOR_PRESETS)),
    fonts: new Set(Object.keys(FONT_PAIRINGS)),
    artFonts: new Set(Object.keys(ART_FONTS)),
    posterBlocks: new Set(assets.templates.flatMap((tpl) => tpl.blocks)),
    patchFields: new Set(assets.patchFields),
  }
}

/* ---------- 资产自检：目录 / 白名单 / 覆盖矩阵与 config 一致（测试与 CI 调用） ---------- */

function estimateTokens(text) {
  const zh = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const rest = text.replace(/[\u4e00-\u9fa5]/g, '').length
  return zh + Math.ceil(rest / 4)
}

export function assertPosterAssets(assets = POSTER_ASSETS, { maxCatalogTokens = 1200 } = {}) {
  const ids = assets.templates.map((tpl) => tpl.id)
  if (new Set(ids).size !== ids.length) throw new Error('POSTER_DUPLICATE_TEMPLATE_ID')

  for (const tpl of assets.templates) {
    if (!VARIANTS[tpl.id]) throw new Error(`POSTER_UNKNOWN_TEMPLATE: ${tpl.id}`)
    if (!tpl.when || !tpl.notWhen) throw new Error(`POSTER_MISSING_TRIGGER_HINT: ${tpl.id}`)
    if (!tpl.focus) throw new Error(`POSTER_MISSING_FOCUS: ${tpl.id}`)
    if (!(tpl.headlinePx >= 40 && tpl.headlinePx <= 90)) {
      throw new Error(`POSTER_BAD_HEADLINE_PX: ${tpl.id}`)
    }
    if (!tpl.blocks.length) throw new Error(`POSTER_EMPTY_LAYOUT: ${tpl.id}`)
    if (tpl.artFont && !ART_FONTS[tpl.artFont]) {
      throw new Error(`POSTER_UNKNOWN_ART_FONT: ${tpl.id}`)
    }
    if (!COLOR_PRESETS[tpl.defaultPreset]) {
      throw new Error(`POSTER_UNKNOWN_PRESET: ${tpl.id}.${tpl.defaultPreset}`)
    }
    if (!FONT_PAIRINGS[tpl.defaultFont]) {
      throw new Error(`POSTER_UNKNOWN_FONT: ${tpl.id}.${tpl.defaultFont}`)
    }
  }

  // 艺术字覆盖矩阵必须和 config 一致：有字体的版式数 + 回退数 = 版式总数
  const expectedCovered = Object.keys(ART_FONTS).filter((id) => VARIANTS[ART_FONTS[id].variant])
  const covered = assets.templates.filter((tpl) => tpl.artFont).map((tpl) => tpl.id)
  const fallback = assets.templates.filter((tpl) => !tpl.artFont).map((tpl) => tpl.id)
  if (covered.length !== expectedCovered.length) {
    throw new Error(`POSTER_ART_FONT_COVERAGE_DRIFT: ${covered.length} != ${expectedCovered.length}`)
  }
  if (covered.length + fallback.length !== assets.templates.length) {
    throw new Error('POSTER_ART_FONT_COVERAGE_INCOMPLETE')
  }

  const rules = assets.contentRules
  for (const key of ['headline', 'subhead', 'caption', 'posterNote', 'pullquote', 'artWords']) {
    if (!(rules[key] >= 1)) throw new Error(`POSTER_BAD_CONTENT_RULE: ${key}`)
  }
  if (!(rules.body.min > 0 && rules.body.max >= rules.body.min)) {
    throw new Error('POSTER_BAD_BODY_RANGE')
  }
  if (rules.allowFacts !== false) throw new Error('POSTER_CONTENT_RULES_MUST_FORBID_FACTS')

  for (const field of assets.patchFields) {
    if (/(^|\.)(x|y|w|h|block_id|svg|path|hex)$/i.test(field)) {
      throw new Error(`POSTER_PATCH_FIELD_NOT_ALLOWED: ${field}`)
    }
  }
  if (assets.pitfalls.length < 8) throw new Error('POSTER_TOO_FEW_PITFALLS')
  if (assets.selfChecks.length < 6) throw new Error('POSTER_TOO_FEW_SELF_CHECKS')

  const tokens = estimateTokens(buildPosterCatalog(assets))
  if (tokens > maxCatalogTokens) {
    throw new Error(`POSTER_CATALOG_TOO_LARGE: ${tokens} > ${maxCatalogTokens}`)
  }
  return { templates: assets.templates.length, catalogTokens: tokens, covered, fallback }
}

/* ---------- ④ 输出后自检：海报专属的软警告（进「生成摘要」） ---------- */

function charLen(value) {
  return Array.from(String(value ?? '')).length
}

export function auditPosterScheme(scheme, assets = POSTER_ASSETS) {
  const warnings = []
  if (!scheme) return warnings
  const tpl = assets.templates.find((item) => item.id === scheme.layout_variant)
  const posterTpl = scheme.poster?.template ? getPosterTemplate(scheme.poster.template) : null
  const posterVariant = posterTpl
    ? posterTpl.variants[scheme.poster.variant] || posterTpl.variants.quiet
    : null
  const hasNote = posterTpl ? Boolean(posterVariant?.slots?.note) : Boolean(tpl?.hasNote)
  const artFont = posterTpl ? posterTpl.artFont : tpl?.artFont
  const content = scheme.content || {}
  const rules = assets.contentRules
  const prefix = `方案 ${scheme.id || '?'}：`

  const headlineLen = charLen(content.headline)
  if (headlineLen > rules.recommendations.headline + 3) {
    warnings.push(
      `${prefix}主标题 ${headlineLen} 字，4:5 海报上会排到 3 行；建议压到 ${rules.recommendations.headline} 字以内。`,
    )
  }

  const subheadLen = charLen(content.subhead)
  if (subheadLen > rules.recommendations.subhead + 4) {
    warnings.push(
      `${prefix}副标题 ${subheadLen} 字，海报建议 ≤${rules.recommendations.subhead} 字，否则会挤到主图上。`,
    )
  }

  if (!content.caption) {
    warnings.push(`${prefix}主图缺图注；图注是海报的第二层信息，不要留空。`)
  }

  if (hasNote && !content.poster_note) {
    warnings.push(`${prefix}海报留白缺一条注记（时间 / 地点 / 版次 / 氛围短句）。`)
  }

  const artWords = Array.isArray(content.art_words) ? content.art_words : []
  if (artFont && artWords.length === 0) {
    warnings.push(
      `${prefix}该版式有艺术字字体（${artFont}），建议补 1–2 个英文装饰词，否则报头会偏空。`,
    )
  }

  const bodyChars = (Array.isArray(content.body_blocks) ? content.body_blocks : []).reduce(
    (sum, block) => sum + charLen(block?.text),
    0,
  )
  if (bodyChars > 0 && bodyChars < 40) {
    warnings.push(`${prefix}报纸备用正文只有 ${bodyChars} 字，切回报纸视图会显得空。`)
  }

  return warnings
}

/* ---------- 提示词：按模式生成，共用同一份资产 ---------- */

const STANDARD_BOUNDARY = `### 本模式输出边界（标准模板）
- 只回填 layout_variant / color_preset / font_pairing / style / content / design_rationale，不要多字段。
- 颜色由 color_preset 决定，不输出 hex；坐标由模板给，不输出 x / y / w / h。
- 艺术字由前端按版式自动匹配，不要输出 art_font；只写 art_words。
- 海报不渲染正文，但 body_blocks 仍要给 1–2 段（60–120 字），供报纸视图使用。`

const DESIGN_BOUNDARY = `### 本模式输出边界（设计 / 自由模式）
- 可以改 layout_variant / color_preset / font_pairing 与 style；art_font 只能填 none 或与该版式对应的 id（见目录），填错会被前端回退。
- 自定义板块坐标是百分比、左上角定位：0–100，x + w ≤ 100，y + h ≤ 100；页脚用 footer，不要用 note 代替。
- 主图占位用 hero；海报不渲染正文，但 body_blocks 仍要给 1–2 段（60–120 字）。
- 自由模式图案只给 symbols / composition / style 参数，不输出 SVG、坐标或文字。`

let cachedBody = ''

function posterSkillBody(assets = POSTER_ASSETS) {
  if (cachedBody && assets === POSTER_ASSETS) return cachedBody
  const { canvas, contentRules, contrast } = assets
  const covered = assets.templates.filter((tpl) => tpl.artFont)
  const fallback = assets.templates.filter((tpl) => !tpl.artFont)
  const body = `## 海报道具（内置 poster skill，仅 ${canvas.ratio} 海报注入）

海报不是缩小的报纸：一张海报只说一件事、只有一个主角、只有一个强调色。读者停留 3 秒，信息靠层级而不是字数。

### 1. 海报信息只用六类道具
报头 masthead → 主图 hero（+ 图注 caption）→ 主标题 headline → 副标题 subhead → 海报注记 posterNote → 页脚 footer，外加 0–${contentRules.artWords} 个英文装饰词 art_words。
海报不渲染正文；正文只写 ${contentRules.body.min}–${contentRules.body.max} 字给报纸视图用，不要塞进注记。

### 2. 阅读顺序（硬顺序）
主图 → 主标题 → 副标题 → 注记 / 图注 → 页脚。与这条线竞争的装饰一律删掉；装饰只允许出现在主图区域和页脚带。

### 3. 画布与安全区
- ${canvas.ratio} · ${canvas.width}×${canvas.height}，打印按 A4 缩排。
- 模板自带边距：文字左右 4–8%。自定义坐标时左右 ≥${canvas.safe.side}%、顶 ≥${canvas.safe.top}%、底 ≥${canvas.safe.bottom}%。
- 主图与色块可以出血；文字永远不进出血区；图注与注记距底 ≥4%；最后 5% 只放页脚。

### 4. 字号与网格
- 主标题字号由版式给（见目录，${HEADLINE_RANGE.min}–${HEADLINE_RANGE.max}px 区间）；一行 ≤7–8 个汉字，超过 9 字会在 4:5 上排到 3 行，宁可减字或换版式。
- 只允许三级字号：展示（主标题）/ 阅读（副标题、注记）/ 标注（图注、页脚）；不要出现第四级。
- 同类元素共用一条左基线；网格线与分区线 1px、透明度 ≤15%，实线只用于分区。

### 5. 配色
- 只从 color_preset 的角色取色：paper / ink / accent / secondary / muted（几何三式、系统三式另有 tertiary）；不输出 hex。
- 一个强调色，面积 ≤10%；60-30-10：纸 60、墨 30、强调 10。
- 强调色只落在四处：主标题、一块色、一条线、一个徽章；同尺寸强调块 ≤3 处。
- 正文对比度 ≥${contrast.bodyText}:1，大标题 ≥${contrast.largeText}:1；深底用纸色反白，不用灰字。

### 6. 字体与艺术字
- 字体搭配只有 5 组：serif_serif / serif_sans / superfamily / grotesk / terminal_mono。海报优先 grotesk、superfamily、serif_sans；terminal_mono 只给 NASA 朋克 / 卡带未来。
- 艺术字只覆盖 ${covered.length} 个版式（见目录），其余 ${fallback.length} 套没有艺术字：art_font 必须为 none，英文装饰词用标题字体渲染。
- 艺术字只吃英文与数字；中文标题永远走 font_pairing，不要指望艺术字兜中文。
- 字距：≥40px 标题 ≤4，≤16px 小字 ≤1；中文一加大字距就会顶出卡片与色块。

### 7. 图案与图标（自由模式）
- 94 枚图标、9 套图案配方；一套图案 1 个主象征 + 最多 2 个辅助，不要拼成插画。
- 线宽 0.8–3、投影 0–2、透明度 0.6–1；低于 0.6 显脏，高于 1 不存在。
- 同一画面只用一种几何语言：全直线 / 全圆 / 全斜切，不混用。
- 图案只是背景层：不描摹照片细节、不加文字、不做写实。

### 8. 文案契约
- 主标题 ≤${contentRules.headline} 字（海报建议 ≤${contentRules.recommendations.headline} 字）、副标题 ≤${contentRules.subhead} 字（建议 ≤${contentRules.recommendations.subhead} 字）、图注 ≤${contentRules.caption} 字、注记 ≤${contentRules.posterNote} 字、引语 ≤${contentRules.pullquote} 字；英文装饰词 0–${contentRules.artWords} 个，海报 2–3 个最稳。
- 用户没给的人名、机构、日期、数字、活动一律不补；日期用系统给的当前日期。
- 注记只写时间 / 地点 / 版次 / 氛围短句 / 英文小标签，不写第二段正文。
- 信息不足时留空或占位，不要编一个看起来像真的。

### 9. 三套方案的差异
结构差异 > 配色差异：主角大小、主图占比、标题位置、留白多少、信息块数量。可以同模板出两套，但构图逻辑必须变；只换颜色和字体名字不算差异。

### 海报版式目录（由 config 资产自动生成）
${buildPosterCatalog(assets)}

### 自检（输出前逐条过）
${assets.selfChecks.map((item, index) => `${index + 1}. ${item}`).join('\n')}

### 踩坑速查（Poster_skill_dir 三套手写海报实测）
${assets.pitfalls.map((item) => `- ${item.title}：${item.symptom} → ${item.fix}`).join('\n')}
`
  if (assets === POSTER_ASSETS) cachedBody = body
  return body
}

/** 完整 skill 文本（标准模板口径），用于界面「设计 Skill」面板展示。 */
export const POSTER_SKILL = `${posterSkillBody()}\n${STANDARD_BOUNDARY}`

/** 按画面格式与模式返回要注入的段落；非海报返回空串。 */
export function posterSkillSection({ format = 'newspaper', mode = 'standard' } = {}) {
  if (format !== POSTER_FORMAT) return ''
  const designLike = mode === 'design' || mode === 'free'
  const boundary = designLike ? DESIGN_BOUNDARY : STANDARD_BOUNDARY
  return `${posterSkillBody()}\n${boundary}`
}

/**
 * 对话微调（patch）用的海报护栏：比生成阶段短得多，
 * 只放对话里最容易越界的几条，避免把整份 skill 再塞一遍。
 */
export function posterChatGuard({ format = 'newspaper' } = {}) {
  if (format !== POSTER_FORMAT) return ''
  return `# 海报微调（仅 4:5 海报）
- 海报不渲染正文：不要为了「充实版面」加长 body_blocks，保留 1 段即可。
- 主标题建议 ≤9 字；改完要能在 4:5 上排成 ≤2 行，超长会挤到主图。
- 注记 poster_note ≤30 字，只写时间 / 地点 / 版次 / 氛围短句，不写第二段正文。
- 海报画布只读：不要输出 blocks 坐标、layout_moves、layout_placements、extra_blocks、remove_blocks，也不要改 layout_variant。
- 换风格时只改 poster：{ "template": "三套海报模板之一", "variant": "quiet 或 loud", "art": { "recipe": "配方 id", "params": {}, "seed": 0-9999 } }；模板 / 配方 id 只能是当前方案里已有的那套。
- 艺术字 art_font 不在可改字段里；英文装饰词保持与当前版式匹配。
- 留白是海报的一部分：用户要求「更满」时，优先放大主图或标题，而不是塞信息块。`
}

/** 界面「设计 Skill」面板的卡片文案。 */
const ART_FONT_COUNT = Object.keys(ART_FONTS).length
const ART_FONT_TEMPLATE_COUNT = POSTER_ASSETS.templates.filter((tpl) => tpl.artFont).length

export const POSTER_SKILL_BULLETS = [
  ['一页一事', '海报不是缩小的报纸：一个主角、一个强调色、3 秒读完。'],
  ['六类道具', '报头 / 主图+图注 / 标题 / 副标题 / 注记 / 页脚；正文只留给报纸视图。'],
  ['安全区', '文字左右 ≥5%、顶 ≥4%、底 ≥5%；主图与色块才可出血。'],
  ['字号级差', `主标题 ${HEADLINE_RANGE.min}–${HEADLINE_RANGE.max}px、一行 ≤7–8 字；只允许展示 / 阅读 / 标注三级。`],
  ['单强调色', '一个强调色 ≤10% 面积，只落在标题、色块、一条线、一个徽章。'],
  [
    '艺术字覆盖',
    `${ART_FONT_COUNT} 款艺术字只覆盖 ${ART_FONT_TEMPLATE_COUNT} 个版式；中文标题永不走艺术字字体。`,
  ],
  ['图案语言', '1 个主象征 + ≤2 个辅助；全直线 / 全圆 / 全斜切，不混用。'],
  ['踩坑速查', '字体回退、字距溢出、网格太重、旋转原点、接缝白线、底部贴边。'],
]

/** 海报面板用的版本信息，便于日志与快照命名。 */
export const POSTER_SKILL_VERSION = POSTER_ASSETS.version
