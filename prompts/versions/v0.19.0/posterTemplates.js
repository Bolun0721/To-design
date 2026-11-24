/**
 * 海报专用模板（与报纸的 9 套 VARIANTS 分开）。
 *
 * 一套模板 = 一张 800×1000 的构图配方：
 * - slot：文字槽位（百分比矩形 + 字号 + 行高 + 颜色角色）；
 * - hero：主图 / 图案视觉区（无照片时由图案配方填充）；
 * - decor：色块、斜切、分隔线、网格等静态装饰（代码画，不用模型）；
 * - recipe：默认图案配方；artFont：允许的艺术字（超大的字体不再使用）。
 *
 * 模型只能选 template + variant，不能给坐标；坐标全部来自这里。
 */
import { FORMATS } from './presets.js'

export const POSTER_W = FORMATS.poster.width
export const POSTER_H = FORMATS.poster.height

/** 艺术字体积上限：超过它的字体不进海报链路（如 fpl-constructivism 2.5MB）。 */
export const POSTER_ART_FONT_MAX_BYTES = 400 * 1024

export const POSTER_ART_FONTS = {
  bauhaus: { label: '包豪斯', family: 'FPL Bauhaus', file: '/fonts/fpl-bauhaus.otf', bytes: 20396 },
  de_stijl: { label: '风格派', family: 'FPL Stencil', file: '/fonts/fpl-stencil.ttf', bytes: 23796 },
  nasa_punk: { label: 'NASA 朋克', family: 'FPL Nasa', file: '/fonts/fpl-nasa.otf', bytes: 67384 },
  cassette_futurism: { label: '卡带未来', family: 'FPL Cassette', file: '/fonts/fpl-cassette.ttf', bytes: 79908 },
  swiss_style: { label: '瑞士风格', family: 'FPL Swiss', file: '/fonts/fpl-swiss.ttf', bytes: 171680 },
}

export const USABLE_POSTER_ART_FONT_IDS = Object.keys(POSTER_ART_FONTS)

export const POSTER_VARIANTS = ['quiet', 'loud']

/**
 * 海报字体栈：拉丁用本地 vendored webfont（导出可嵌入），
 * 中文用系统字体（SVG 转图片时光栅化器直接取系统字体，导出与预览一致）。
 * 报纸仍使用 presets.js 里的原字体栈。
 */
export const POSTER_FONT_STACKS = {
  serif_serif: {
    head: '"Playfair Display", "Songti SC", "SimSun", Georgia, serif',
    body: '"PT Serif", "Songti SC", "SimSun", Georgia, serif',
  },
  serif_sans: {
    head: '"Playfair Display", "Songti SC", "SimSun", Georgia, serif',
    body: '"Source Sans 3", "PingFang SC", "Microsoft YaHei", Arial, sans-serif',
  },
  superfamily: {
    head: '"Source Serif 4", "Songti SC", "SimSun", Georgia, serif',
    body: '"Source Serif 4", "Songti SC", "SimSun", Georgia, serif',
  },
  grotesk: {
    head: '"Source Sans 3", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
    body: '"Source Sans 3", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
  },
  terminal_mono: {
    head: '"IBM Plex Mono", "Cascadia Code", "PingFang SC", "Microsoft YaHei", monospace',
    body: '"IBM Plex Mono", "Cascadia Code", "PingFang SC", "Microsoft YaHei", monospace',
  },
}

export const POSTER_TEMPLATES = {
  poster_editorial: {
    id: 'poster_editorial',
    name: '编辑海报',
    en: 'THE EDITORIAL',
    tagline: '巨标题 · 中段主图 · 大量留白',
    when: '纪念留存 / 一张照片讲完整故事 / 打印上墙',
    notWhen: '强冲击 / 无照片 / 信息密集活动',
    palette: 'newsprint_single_accent',
    font: 'serif_serif',
    artFont: '',
    recipe: 'halftone_stars',
    newspaperVariant: 'classic_broadsheet',
    safe: { side: 8, top: 5, bottom: 6 },
    variants: {
      quiet: {
        hero: { x: 8, y: 38, w: 84, h: 36 },
        artBox: { x: 8, y: 38, w: 84, h: 36 },
        slots: {
          masthead: { x: 8, y: 5.5, w: 52, size: 13, weight: 700, tracking: 2.5, color: 'ink', maxLines: 1 },
          issue: { x: 64, y: 5.5, w: 28, size: 11, weight: 500, tracking: 1.5, color: 'muted', maxLines: 1, align: 'right' },
          artWord: { x: 8, y: 9.6, w: 60, size: 11, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 8, y: 13.4, w: 84, size: 72, weight: 800, tracking: -0.6, lineHeight: 1.06, maxLines: 2, color: 'ink' },
          subhead: { x: 8, y: 30.2, w: 62, size: 17, weight: 400, tracking: 0.2, lineHeight: 1.55, maxLines: 2, color: 'secondary' },
          caption: { x: 8, y: 75.4, w: 70, size: 12, weight: 400, tracking: 0.2, maxLines: 1, color: 'muted' },
          note: { x: 8, y: 81.4, w: 56, size: 12, weight: 700, tracking: 1.2, maxLines: 1, color: 'accent' },
          footer: { x: 8, y: 92.6, w: 84, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'rule', x: 8, y: 36.4, w: 84, thickness: 1, color: 'ink', opacity: 0.35 },
          { kind: 'rule', x: 8, y: 91.2, w: 84, thickness: 0.6, color: 'ink', opacity: 0.22 },
        ],
      },
      loud: {
        hero: { x: 0, y: 33, w: 100, h: 40 },
        artBox: { x: 0, y: 33, w: 100, h: 40 },
        slots: {
          masthead: { x: 8, y: 5, w: 52, size: 13, weight: 700, tracking: 2.5, color: 'ink', maxLines: 1 },
          issue: { x: 64, y: 5, w: 28, size: 11, weight: 500, tracking: 1.5, color: 'muted', maxLines: 1, align: 'right' },
          artWord: { x: 8, y: 8.8, w: 60, size: 11, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 6, y: 12, w: 88, size: 92, weight: 900, tracking: -1.4, lineHeight: 1.02, maxLines: 2, color: 'ink' },
          subhead: { x: 8, y: 30, w: 60, size: 16, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'secondary' },
          caption: { x: 8, y: 74.6, w: 70, size: 12, weight: 400, tracking: 0.2, maxLines: 1, color: 'muted' },
          note: { x: 8, y: 80.4, w: 56, size: 12, weight: 700, tracking: 1.2, maxLines: 1, color: 'accent' },
          footer: { x: 8, y: 92.6, w: 84, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'rule', x: 8, y: 32, w: 84, thickness: 1.4, color: 'ink', opacity: 0.5 },
          { kind: 'rule', x: 8, y: 91.2, w: 84, thickness: 0.6, color: 'ink', opacity: 0.22 },
        ],
      },
    },
  },

  poster_swiss: {
    id: 'poster_swiss',
    name: '瑞士网格',
    en: 'THE SWISS',
    tagline: '十二栏 · 巨字左压 · 窄图右挂',
    when: '机构 / 专业 / 学术 / 客观叙述',
    notWhen: '手作 / 复古 / 夸张促销',
    palette: 'swiss_red',
    font: 'grotesk',
    artFont: 'swiss_style',
    recipe: 'halftone_gradient',
    newspaperVariant: 'swiss_style',
    safe: { side: 7, top: 5, bottom: 6 },
    variants: {
      quiet: {
        hero: { x: 66, y: 12, w: 27, h: 40 },
        artBox: { x: 66, y: 12, w: 27, h: 40 },
        slots: {
          masthead: { x: 7, y: 5, w: 40, size: 11, weight: 700, tracking: 2.4, color: 'ink', maxLines: 1 },
          issue: { x: 47, y: 5, w: 46, size: 10, weight: 500, tracking: 1.6, color: 'muted', maxLines: 1, align: 'right' },
          artWord: { x: 7, y: 8.6, w: 40, size: 10, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 7, y: 12, w: 57, size: 68, weight: 700, tracking: -1.6, lineHeight: 1.02, maxLines: 2, color: 'ink' },
          subhead: { x: 7, y: 33, w: 52, size: 15, weight: 400, tracking: 0.2, lineHeight: 1.6, maxLines: 3, color: 'secondary' },
          caption: { x: 66, y: 53.2, w: 27, size: 11, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'muted' },
          note: { x: 7, y: 72, w: 40, size: 12, weight: 700, tracking: 1, maxLines: 1, color: 'accent' },
          footer: { x: 7, y: 92.6, w: 86, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'block', x: 66, y: 12, w: 27, h: 40, color: 'muted', opacity: 0.14 },
          { kind: 'rule', x: 7, y: 10.4, w: 86, thickness: 1.2, color: 'ink', opacity: 0.7 },
          { kind: 'rule', x: 7, y: 78, w: 86, thickness: 0.8, color: 'ink', opacity: 0.3 },
          { kind: 'grid', x: 7, y: 10.4, w: 86, h: 66, columns: 12, color: 'muted', opacity: 0.07 },
        ],
      },
      loud: {
        hero: { x: 62, y: 30, w: 32, h: 46 },
        artBox: { x: 62, y: 30, w: 32, h: 46 },
        slots: {
          masthead: { x: 7, y: 4.6, w: 40, size: 11, weight: 700, tracking: 2.4, color: 'ink', maxLines: 1 },
          issue: { x: 47, y: 4.6, w: 46, size: 10, weight: 500, tracking: 1.6, color: 'muted', maxLines: 1, align: 'right' },
          artWord: { x: 7, y: 8.2, w: 40, size: 10, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 7, y: 11, w: 54, size: 88, weight: 700, tracking: -2.2, lineHeight: 0.98, maxLines: 2, color: 'ink' },
          subhead: { x: 7, y: 33, w: 42, size: 15, weight: 400, tracking: 0.2, lineHeight: 1.6, maxLines: 4, color: 'secondary' },
          caption: { x: 62, y: 77.4, w: 32, size: 11, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'muted' },
          note: { x: 7, y: 82.5, w: 40, size: 12, weight: 700, tracking: 1, maxLines: 1, color: 'accent' },
          footer: { x: 7, y: 92.6, w: 86, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'block', x: 62, y: 30, w: 32, h: 46, color: 'muted', opacity: 0.14 },
          { kind: 'rule', x: 7, y: 10, w: 86, thickness: 1.4, color: 'ink', opacity: 0.75 },
          { kind: 'rule', x: 7, y: 86, w: 86, thickness: 1, color: 'ink', opacity: 0.4 },
          { kind: 'block', x: 7, y: 88.4, w: 9, h: 1.4, color: 'accent', opacity: 1 },
          { kind: 'grid', x: 7, y: 10, w: 86, h: 74, columns: 12, color: 'muted', opacity: 0.06 },
        ],
      },
    },
  },

  poster_diagonal: {
    id: 'poster_diagonal',
    name: '斜切宣言',
    en: 'THE DIAGONAL',
    tagline: '两条斜线 · 巨字压边 · 三色平涂',
    when: '宣言 / 力量 / 高对比 / 纪念日',
    notWhen: '温情日常 / 家庭合影 / 柔和照片',
    palette: 'constructivism_red',
    font: 'grotesk',
    artFont: 'de_stijl',
    recipe: 'diagonal_split',
    newspaperVariant: 'constructivism',
    safe: { side: 6, top: 4, bottom: 6 },
    variants: {
      quiet: {
        hero: { x: 54, y: 30, w: 40, h: 34 },
        artBox: { x: 54, y: 30, w: 40, h: 34 },
        slots: {
          masthead: { x: 6, y: 4, w: 56, size: 13, weight: 700, tracking: 2.4, color: 'ink', maxLines: 1 },
          issue: { x: 68, y: 4, w: 26, size: 11, weight: 500, tracking: 1.6, color: 'ink', maxLines: 1, align: 'right' },
          artWord: { x: 6, y: 7.8, w: 52, size: 10, weight: 700, tracking: 3.4, color: 'ink', maxLines: 1, upper: true },
          headline: { x: 5, y: 28, w: 48, size: 60, weight: 900, tracking: -1.2, lineHeight: 1.02, maxLines: 2, color: 'paper', rotate: -7 },
          subhead: { x: 6, y: 50, w: 40, size: 15, weight: 500, tracking: 0.2, lineHeight: 1.5, maxLines: 3, color: 'paper', rotate: -7 },
          caption: { x: 54, y: 66.5, w: 40, size: 11, weight: 400, tracking: 0.2, maxLines: 1, color: 'paper' },
          note: { x: 6, y: 74.5, w: 44, size: 12, weight: 700, tracking: 1.2, maxLines: 2, color: 'paper' },
          footer: { x: 6, y: 92, w: 88, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'paper' },
        },
        decor: [
          { kind: 'polygon', points: [[0, 30], [100, 12], [100, 56], [0, 74]], color: 'accent', opacity: 1 },
          { kind: 'polygon', points: [[0, 74], [100, 56], [100, 100], [0, 100]], color: 'ink', opacity: 1 },
          { kind: 'rule', x: 0, y: 29.4, w: 100, thickness: 1.2, color: 'ink', opacity: 0.9 },
          { kind: 'polygon', points: [[70, 0], [100, 0], [100, 12]], color: 'ink', opacity: 1 },
        ],
      },
      loud: {
        hero: { x: 58, y: 34, w: 38, h: 38 },
        artBox: { x: 58, y: 34, w: 38, h: 38 },
        slots: {
          masthead: { x: 6, y: 4, w: 56, size: 13, weight: 700, tracking: 2.4, color: 'ink', maxLines: 1 },
          issue: { x: 68, y: 4, w: 26, size: 11, weight: 500, tracking: 1.6, color: 'ink', maxLines: 1, align: 'right' },
          artWord: { x: 6, y: 7.8, w: 52, size: 10, weight: 700, tracking: 3.4, color: 'ink', maxLines: 1, upper: true },
          headline: { x: 4, y: 34, w: 50, size: 84, weight: 900, tracking: -2, lineHeight: 0.98, maxLines: 2, color: 'paper', rotate: -8 },
          subhead: { x: 6, y: 54, w: 40, size: 15, weight: 500, tracking: 0.2, lineHeight: 1.5, maxLines: 3, color: 'paper', rotate: -8 },
          caption: { x: 58, y: 76.5, w: 38, size: 11, weight: 400, tracking: 0.2, maxLines: 1, color: 'paper' },
          note: { x: 6, y: 80, w: 42, size: 12, weight: 700, tracking: 1.2, maxLines: 2, color: 'paper' },
          footer: { x: 6, y: 92, w: 88, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'paper' },
        },
        decor: [
          { kind: 'polygon', points: [[0, 34], [100, 8], [100, 62], [0, 88]], color: 'accent', opacity: 1 },
          { kind: 'polygon', points: [[0, 88], [100, 62], [100, 100], [0, 100]], color: 'ink', opacity: 1 },
          { kind: 'rule', x: 0, y: 33.2, w: 100, thickness: 1.4, color: 'ink', opacity: 0.9 },
          { kind: 'polygon', points: [[64, 0], [100, 0], [100, 8]], color: 'ink', opacity: 1 },
        ],
      },
    },
  },
}

export const POSTER_TEMPLATE_IDS = Object.keys(POSTER_TEMPLATES)

export function getPosterTemplate(id) {
  return POSTER_TEMPLATES[id] || POSTER_TEMPLATES.poster_editorial
}

export function resolvePosterVariant(template, variantId) {
  const id = template.variants[variantId] ? variantId : 'quiet'
  return { id, ...template.variants[id] }
}

export function posterTemplateForNewspaperVariant(variantId) {
  const hit = Object.values(POSTER_TEMPLATES).find((tpl) => tpl.newspaperVariant === variantId)
  return hit?.id || 'poster_editorial'
}

export function newspaperVariantForPoster(templateId) {
  return getPosterTemplate(templateId).newspaperVariant
}

/** 三套海报的角度：标准与设计模式共用，只是内容角度不同。 */
export const POSTER_ANGLES = [
  {
    id: 'A',
    role: '保守经典',
    hint: '正式、纪念、打印留存；第三人称报道腔，标题庄重。',
    templates: ['poster_editorial', 'poster_swiss'],
  },
  {
    id: 'B',
    role: '现代商业',
    hint: '品牌传播、社交分享；标题更短更狠，但不出格。',
    templates: ['poster_swiss', 'poster_diagonal'],
  },
  {
    id: 'C',
    role: '大胆传播',
    hint: '展陈、文艺表达；短句、留白、允许一点实验性。',
    templates: ['poster_diagonal', 'poster_editorial'],
  },
]

export function templateCatalogText(ids = POSTER_TEMPLATE_IDS) {
  return ids
    .map((id) => {
      const tpl = getPosterTemplate(id)
      return `- ${tpl.id}｜${tpl.name}｜${tpl.tagline}｜适合 ${tpl.when}；不适合 ${tpl.notWhen}｜默认配色 ${tpl.palette}｜默认字体 ${tpl.font}｜艺术字 ${tpl.artFont || '无（回退标题字体）'}`
    })
    .join('\n')
}
