/**
 * 海报专用模板（与报纸的 9 套 VARIANTS 分开）。
 *
 * 一套模板 = 一张 800×1000 的构图配方：
 * - slot：文字槽位（百分比矩形 + 字号 + 行高 + 颜色角色）；
 * - hero：主图 / 图案视觉区（无照片时由图案配方填充）；
 * - decor：色块、斜切、分隔线、网格等静态装饰（代码画，不用模型）；
 * - recipe：默认图案配方；artFont：允许的艺术字（已做 latin 子集，体积可控）。
 *
 * 模型只能选 template + variant，不能给坐标；坐标全部来自这里。
 */
import { FORMATS } from './presets.js'

export const POSTER_W = FORMATS.poster.width
export const POSTER_H = FORMATS.poster.height

/** 海报资产版本：模板 / 配方 / 字体子集共同构成；写进 SVG 与导出元数据，便于快照定位。 */
export const POSTER_ASSET_VERSION = '3.0.0'

/** 艺术字体积上限：超过它的字体不进海报链路；现有 6 款子集后均小于 100KB。 */
export const POSTER_ART_FONT_MAX_BYTES = 400 * 1024

export const POSTER_ART_FONTS = {
  bauhaus: { label: '包豪斯', family: 'FPL Bauhaus', file: '/fonts/subset/fpl-bauhaus.otf', bytes: 17924 },
  constructivism: { label: '构成主义', family: 'FPL Constructivism', file: '/fonts/subset/fpl-constructivism.ttf', bytes: 28848 },
  de_stijl: { label: '风格派', family: 'FPL Stencil', file: '/fonts/subset/fpl-stencil.ttf', bytes: 8800 },
  nasa_punk: { label: 'NASA 朋克', family: 'FPL Nasa', file: '/fonts/subset/fpl-nasa.otf', bytes: 20220 },
  cassette_futurism: { label: '卡带未来', family: 'FPL Cassette', file: '/fonts/subset/fpl-cassette.ttf', bytes: 25660 },
  swiss_style: { label: '瑞士风格', family: 'FPL Swiss', file: '/fonts/subset/fpl-swiss.ttf', bytes: 96024 },
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
    demoArtWord: 'SLOW MORNING',
    grain: 0.05,
    safe: { side: 8, top: 5, bottom: 6 },
    variants: {
      quiet: {
        hero: { x: 8, y: 38, w: 84, h: 36 },
        secondary: { x: 70, y: 58, w: 20, h: 13 },
        artBox: { x: 8, y: 38, w: 84, h: 36 },
        slots: {
          masthead: { x: 8, y: 5.5, w: 52, size: 13, weight: 700, tracking: 2.5, color: 'ink', maxLines: 1 },
          issue: { x: 64, y: 5.5, w: 28, size: 11, weight: 500, tracking: 1.5, color: 'muted', maxLines: 1, align: 'right' },
          artWord: { x: 8, y: 9.6, w: 60, size: 11, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 8, y: 13.4, w: 84, size: 72, weight: 800, tracking: -0.6, lineHeight: 1.06, maxLines: 2, color: 'ink' },
          subhead: { x: 8, y: 30.2, w: 62, size: 17, weight: 400, tracking: 0.2, lineHeight: 1.55, maxLines: 2, color: 'secondary' },
          caption: { x: 8, y: 75.4, w: 70, size: 12, weight: 400, tracking: 0.2, maxLines: 1, color: 'muted' },
          info1: { x: 8, y: 83.6, w: 24, size: 12, weight: 700, tracking: 0.8, maxLines: 2, color: 'ink' },
          info2: { x: 38, y: 83.6, w: 24, size: 12, weight: 700, tracking: 0.8, maxLines: 2, color: 'ink' },
          info3: { x: 68, y: 83.6, w: 24, size: 12, weight: 700, tracking: 0.8, maxLines: 2, color: 'ink' },
          footer: { x: 8, y: 92.6, w: 84, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'frame', x: 5.5, y: 4, w: 89, h: 92, thickness: 0.8, color: 'ink', opacity: 0.28 },
          { kind: 'block', x: 6.2, y: 13.2, w: 1.1, h: 10, color: 'accent', opacity: 0.9 },
          { kind: 'rule', x: 8, y: 36.4, w: 84, thickness: 1, color: 'ink', opacity: 0.35 },
          { kind: 'rule', x: 8, y: 78.8, w: 84, thickness: 0.6, color: 'ink', opacity: 0.22 },
          { kind: 'corners', x: 8, y: 38, w: 84, h: 36, len: 3, thickness: 1.5, color: 'accent', opacity: 0.8 },
          { kind: 'badge', x: 88, y: 30.5, r: 3.1, text: '01', color: 'accent', textColor: 'paper', opacity: 1 },
          { kind: 'badge', x: 8, y: 81.5, r: 2, text: '01', color: 'accent', textColor: 'paper', opacity: 0.95 },
          { kind: 'badge', x: 38, y: 81.5, r: 2, text: '02', color: 'ink', textColor: 'paper', opacity: 0.9 },
          { kind: 'badge', x: 68, y: 81.5, r: 2, text: '03', color: 'ink', textColor: 'paper', opacity: 0.9 },
          { kind: 'rule', x: 8, y: 91.2, w: 84, thickness: 0.6, color: 'ink', opacity: 0.22 },
        ],
      },
      loud: {
        hero: { x: 0, y: 33, w: 100, h: 40 },
        secondary: { x: 80, y: 58, w: 16, h: 11 },
        artBox: { x: 0, y: 33, w: 100, h: 40 },
        slots: {
          masthead: { x: 8, y: 5, w: 52, size: 13, weight: 700, tracking: 2.5, color: 'ink', maxLines: 1 },
          issue: { x: 64, y: 5, w: 28, size: 11, weight: 500, tracking: 1.5, color: 'muted', maxLines: 1, align: 'right' },
          artWord: { x: 8, y: 8.8, w: 60, size: 11, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 6, y: 12, w: 88, size: 92, weight: 900, tracking: -1.4, lineHeight: 1.02, maxLines: 2, color: 'ink' },
          subhead: { x: 8, y: 30, w: 60, size: 16, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'secondary' },
          caption: { x: 8, y: 74.6, w: 70, size: 12, weight: 400, tracking: 0.2, maxLines: 1, color: 'muted' },
          info1: { x: 8, y: 83.8, w: 24, size: 12, weight: 700, tracking: 0.8, maxLines: 2, color: 'ink' },
          info2: { x: 38, y: 83.8, w: 24, size: 12, weight: 700, tracking: 0.8, maxLines: 2, color: 'ink' },
          info3: { x: 68, y: 83.8, w: 24, size: 12, weight: 700, tracking: 0.8, maxLines: 2, color: 'ink' },
          footer: { x: 8, y: 92.6, w: 84, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'frame', x: 5.5, y: 4, w: 89, h: 92, thickness: 0.8, color: 'ink', opacity: 0.28 },
          { kind: 'block', x: 4.8, y: 11.8, w: 1.1, h: 12, color: 'accent', opacity: 0.9 },
          { kind: 'rule', x: 8, y: 32, w: 84, thickness: 1.4, color: 'ink', opacity: 0.5 },
          { kind: 'rule', x: 8, y: 78.8, w: 84, thickness: 0.6, color: 'ink', opacity: 0.22 },
          { kind: 'corners', x: 1.5, y: 34, w: 97, h: 38, len: 3, thickness: 1.5, color: 'accent', opacity: 0.85 },
          { kind: 'badge', x: 88, y: 28.5, r: 3.2, text: '01', color: 'accent', textColor: 'paper', opacity: 1 },
          { kind: 'badge', x: 8, y: 81.5, r: 2, text: '01', color: 'accent', textColor: 'paper', opacity: 0.95 },
          { kind: 'badge', x: 38, y: 81.5, r: 2, text: '02', color: 'ink', textColor: 'paper', opacity: 0.9 },
          { kind: 'badge', x: 68, y: 81.5, r: 2, text: '03', color: 'ink', textColor: 'paper', opacity: 0.9 },
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
    demoArtWord: 'GRID 12',
    grain: 0.035,
    safe: { side: 7, top: 5, bottom: 6 },
    variants: {
      quiet: {
        hero: { x: 66, y: 12, w: 27, h: 40 },
        secondary: { x: 68, y: 16, w: 23, h: 11 },
        artBox: { x: 66, y: 12, w: 27, h: 40 },
        slots: {
          masthead: { x: 7, y: 5, w: 40, size: 11, weight: 700, tracking: 2.4, color: 'ink', maxLines: 1 },
          issue: { x: 47, y: 5, w: 46, size: 10, weight: 500, tracking: 1.6, color: 'muted', maxLines: 1, align: 'right' },
          artWord: { x: 7, y: 8.6, w: 40, size: 10, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 7, y: 12, w: 57, size: 68, weight: 700, tracking: -1.6, lineHeight: 1.02, maxLines: 2, color: 'ink' },
          subhead: { x: 7, y: 33, w: 52, size: 15, weight: 400, tracking: 0.2, lineHeight: 1.6, maxLines: 3, color: 'secondary' },
          caption: { x: 66, y: 53.2, w: 27, size: 11, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'muted' },
          note: { x: 7, y: 72, w: 40, size: 12, weight: 700, tracking: 1, maxLines: 1, color: 'accent' },
          info1: { x: 7, y: 83, w: 26, size: 11, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          info2: { x: 38, y: 83, w: 26, size: 11, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          info3: { x: 69, y: 83, w: 26, size: 11, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          footer: { x: 7, y: 92.6, w: 86, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'block', x: 66, y: 12, w: 27, h: 40, color: 'muted', opacity: 0.14 },
          { kind: 'rule', x: 7, y: 10.4, w: 86, thickness: 1.2, color: 'ink', opacity: 0.7 },
          { kind: 'rule', x: 7, y: 78, w: 86, thickness: 0.8, color: 'ink', opacity: 0.3 },
          { kind: 'rule', x: 7, y: 88.6, w: 86, thickness: 1.2, color: 'ink', opacity: 0.55 },
          { kind: 'vrule', x: 37, y: 78, h: 11, thickness: 0.8, color: 'muted', opacity: 0.4 },
          { kind: 'vrule', x: 68, y: 78, h: 11, thickness: 0.8, color: 'muted', opacity: 0.4 },
          { kind: 'badge', x: 7, y: 80.2, r: 1.8, text: '01', color: 'accent', textColor: 'paper', opacity: 1 },
          { kind: 'badge', x: 38, y: 80.2, r: 1.8, text: '02', color: 'ink', textColor: 'paper', opacity: 0.9 },
          { kind: 'badge', x: 69, y: 80.2, r: 1.8, text: '03', color: 'ink', textColor: 'paper', opacity: 0.9 },
          { kind: 'block', x: 7, y: 89.4, w: 9, h: 1.2, color: 'accent', opacity: 1 },
          { kind: 'bars', x: 80, y: 89, w: 13, h: 3.2, count: 18, color: 'ink', opacity: 0.55 },
          { kind: 'grid', x: 7, y: 10.4, w: 86, h: 66, columns: 12, color: 'muted', opacity: 0.07 },
        ],
      },
      loud: {
        hero: { x: 62, y: 30, w: 32, h: 46 },
        secondary: { x: 64, y: 36, w: 26, h: 12 },
        artBox: { x: 62, y: 30, w: 32, h: 46 },
        slots: {
          masthead: { x: 7, y: 4.6, w: 40, size: 11, weight: 700, tracking: 2.4, color: 'ink', maxLines: 1 },
          issue: { x: 47, y: 4.6, w: 46, size: 10, weight: 500, tracking: 1.6, color: 'muted', maxLines: 1, align: 'right' },
          artWord: { x: 7, y: 8.2, w: 40, size: 10, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 7, y: 11, w: 54, size: 88, weight: 700, tracking: -2.2, lineHeight: 0.98, maxLines: 2, color: 'ink' },
          subhead: { x: 7, y: 33, w: 42, size: 15, weight: 400, tracking: 0.2, lineHeight: 1.6, maxLines: 4, color: 'secondary' },
          caption: { x: 62, y: 77.4, w: 32, size: 11, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'muted' },
          note: { x: 7, y: 80.6, w: 40, size: 11, weight: 700, tracking: 1, maxLines: 1, color: 'accent' },
          info1: { x: 7, y: 87.6, w: 26, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          info2: { x: 38, y: 87.6, w: 26, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          info3: { x: 69, y: 87.6, w: 26, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          footer: { x: 7, y: 92.6, w: 86, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'block', x: 62, y: 30, w: 32, h: 46, color: 'muted', opacity: 0.14 },
          { kind: 'rule', x: 7, y: 10, w: 86, thickness: 1.4, color: 'ink', opacity: 0.75 },
          { kind: 'rule', x: 7, y: 84.8, w: 86, thickness: 0.8, color: 'ink', opacity: 0.35 },
          { kind: 'vrule', x: 37, y: 84.8, h: 7.4, thickness: 0.8, color: 'muted', opacity: 0.4 },
          { kind: 'vrule', x: 68, y: 84.8, h: 7.4, thickness: 0.8, color: 'muted', opacity: 0.4 },
          { kind: 'badge', x: 7, y: 86.4, r: 1.7, text: '01', color: 'accent', textColor: 'paper', opacity: 1 },
          { kind: 'badge', x: 38, y: 86.4, r: 1.7, text: '02', color: 'ink', textColor: 'paper', opacity: 0.9 },
          { kind: 'badge', x: 69, y: 86.4, r: 1.7, text: '03', color: 'ink', textColor: 'paper', opacity: 0.9 },
          { kind: 'block', x: 7, y: 92, w: 9, h: 1.1, color: 'accent', opacity: 1 },
          { kind: 'bars', x: 80, y: 91.4, w: 13, h: 3, count: 18, color: 'ink', opacity: 0.55 },
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
    artFont: 'constructivism',
    recipe: 'diagonal_split',
    newspaperVariant: 'constructivism',
    demoArtWord: 'MANIFESTO',
    grain: 0.16,
    safe: { side: 6, top: 4, bottom: 6 },
    variants: {
      quiet: {
        hero: { x: 54, y: 30, w: 40, h: 34 },
        secondary: { x: 74, y: 66, w: 16, h: 11 },
        artBox: { x: 54, y: 30, w: 40, h: 34 },
        slots: {
          masthead: { x: 6, y: 4, w: 56, size: 13, weight: 700, tracking: 2.4, color: 'ink', maxLines: 1 },
          issue: { x: 68, y: 4, w: 26, size: 11, weight: 500, tracking: 1.6, color: 'ink', maxLines: 1, align: 'right' },
          artWord: { x: 6, y: 7.8, w: 52, size: 10, weight: 700, tracking: 3.4, color: 'ink', maxLines: 1, upper: true },
          headline: { x: 5, y: 28, w: 48, size: 60, weight: 900, tracking: -1.2, lineHeight: 1.02, maxLines: 2, color: 'paper', rotate: -7 },
          subhead: { x: 6, y: 50, w: 40, size: 15, weight: 500, tracking: 0.2, lineHeight: 1.5, maxLines: 3, color: 'paper', rotate: -7 },
          caption: { x: 54, y: 66.5, w: 40, size: 11, weight: 400, tracking: 0.2, maxLines: 1, color: 'paper' },
          note: { x: 6, y: 74.5, w: 44, size: 12, weight: 700, tracking: 1.2, maxLines: 2, color: 'paper' },
          info1: { x: 6, y: 85.5, w: 26, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'paper' },
          info2: { x: 38, y: 85.5, w: 26, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'paper' },
          info3: { x: 70, y: 85.5, w: 24, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'paper' },
          footer: { x: 6, y: 92, w: 88, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'paper' },
        },
        decor: [
          { kind: 'polygon', points: [[0, 30], [100, 12], [100, 56], [0, 74]], color: 'accent', opacity: 1 },
          { kind: 'polygon', points: [[0, 74], [100, 56], [100, 100], [0, 100]], color: 'ink', opacity: 1 },
          { kind: 'rule', x: 0, y: 29.4, w: 100, thickness: 1.2, color: 'ink', opacity: 0.9 },
          { kind: 'polygon', points: [[70, 0], [100, 0], [100, 12]], color: 'ink', opacity: 1 },
          { kind: 'rule', x: 6, y: 83.5, w: 88, thickness: 0.8, color: 'paper', opacity: 0.45 },
          { kind: 'vrule', x: 36, y: 83.5, h: 7.5, thickness: 0.6, color: 'paper', opacity: 0.28 },
          { kind: 'vrule', x: 68, y: 83.5, h: 7.5, thickness: 0.6, color: 'paper', opacity: 0.28 },
          { kind: 'badge', x: 6, y: 81.6, r: 1.7, text: '01', color: 'accent', textColor: 'paper', opacity: 1 },
          { kind: 'badge', x: 38, y: 81.6, r: 1.7, text: '02', color: 'paper', textColor: 'ink', opacity: 0.9 },
          { kind: 'badge', x: 70, y: 81.6, r: 1.7, text: '03', color: 'paper', textColor: 'ink', opacity: 0.9 },
          { kind: 'corners', x: 54, y: 30, w: 40, h: 34, len: 3, thickness: 1.4, color: 'paper', opacity: 0.8 },
          { kind: 'badge', x: 92, y: 10.5, r: 3, text: '01', color: 'accent', textColor: 'paper', opacity: 1 },
        ],
      },
      loud: {
        hero: { x: 58, y: 34, w: 38, h: 38 },
        secondary: { x: 74, y: 66, w: 16, h: 11 },
        artBox: { x: 58, y: 34, w: 38, h: 38 },
        slots: {
          masthead: { x: 6, y: 4, w: 56, size: 13, weight: 700, tracking: 2.4, color: 'ink', maxLines: 1 },
          issue: { x: 68, y: 4, w: 26, size: 11, weight: 500, tracking: 1.6, color: 'ink', maxLines: 1, align: 'right' },
          artWord: { x: 6, y: 7.8, w: 52, size: 10, weight: 700, tracking: 3.4, color: 'ink', maxLines: 1, upper: true },
          headline: { x: 4, y: 34, w: 50, size: 84, weight: 900, tracking: -2, lineHeight: 0.98, maxLines: 2, color: 'paper', rotate: -8 },
          subhead: { x: 6, y: 54, w: 40, size: 15, weight: 500, tracking: 0.2, lineHeight: 1.5, maxLines: 3, color: 'paper', rotate: -8 },
          caption: { x: 58, y: 76.5, w: 38, size: 11, weight: 400, tracking: 0.2, maxLines: 1, color: 'paper' },
          note: { x: 6, y: 79.5, w: 42, size: 11, weight: 700, tracking: 1.2, maxLines: 1, color: 'paper' },
          info1: { x: 6, y: 87.5, w: 26, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'paper' },
          info2: { x: 38, y: 87.5, w: 26, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'paper' },
          info3: { x: 70, y: 87.5, w: 24, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'paper' },
          footer: { x: 6, y: 92, w: 88, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'paper' },
        },
        decor: [
          { kind: 'polygon', points: [[0, 34], [100, 8], [100, 62], [0, 88]], color: 'accent', opacity: 1 },
          { kind: 'polygon', points: [[0, 88], [100, 62], [100, 100], [0, 100]], color: 'ink', opacity: 1 },
          { kind: 'rule', x: 0, y: 33.2, w: 100, thickness: 1.4, color: 'ink', opacity: 0.9 },
          { kind: 'polygon', points: [[64, 0], [100, 0], [100, 8]], color: 'ink', opacity: 1 },
          { kind: 'rule', x: 6, y: 84.4, w: 88, thickness: 0.8, color: 'paper', opacity: 0.45 },
          { kind: 'vrule', x: 36, y: 84.4, h: 7.6, thickness: 0.6, color: 'paper', opacity: 0.28 },
          { kind: 'vrule', x: 68, y: 84.4, h: 7.6, thickness: 0.6, color: 'paper', opacity: 0.28 },
          { kind: 'badge', x: 6, y: 85.6, r: 1.7, text: '01', color: 'accent', textColor: 'paper', opacity: 1 },
          { kind: 'badge', x: 38, y: 85.6, r: 1.7, text: '02', color: 'paper', textColor: 'ink', opacity: 0.9 },
          { kind: 'badge', x: 70, y: 85.6, r: 1.7, text: '03', color: 'paper', textColor: 'ink', opacity: 0.9 },
          { kind: 'corners', x: 58, y: 34, w: 38, h: 38, len: 3, thickness: 1.4, color: 'paper', opacity: 0.8 },
          { kind: 'badge', x: 92, y: 10.5, r: 3, text: '01', color: 'accent', textColor: 'paper', opacity: 1 },
        ],
      },
    },
  },

  poster_kino: {
    id: 'poster_kino',
    name: '影像海报',
    en: 'THE KINO',
    tagline: '满版主图 · 上下压字 · 演职员条',
    when: '电影感 / 夜色 / 活动主视觉 / 强氛围',
    notWhen: '无照片 / 信息密集 / 明亮日常',
    palette: 'cassette_dark',
    font: 'grotesk',
    artFont: 'nasa_punk',
    recipe: 'paper_grain',
    newspaperVariant: 'cassette_futurism',
    demoArtWord: 'AFTER HOURS',
    grain: 0.1,
    safe: { side: 7, top: 4, bottom: 5 },
    variants: {
      quiet: {
        hero: { x: 0, y: 0, w: 100, h: 62 },
        secondary: { x: 76, y: 46, w: 17, h: 12 },
        artBox: { x: 0, y: 0, w: 100, h: 62 },
        slots: {
          masthead: { x: 8, y: 4, w: 50, size: 12, weight: 700, tracking: 2.4, color: 'ink', maxLines: 1 },
          issue: { x: 64, y: 4, w: 28, size: 10, weight: 500, tracking: 1.6, color: 'muted', maxLines: 1, align: 'right' },
          artWord: { x: 8, y: 8, w: 40, size: 10, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 8, y: 65, w: 84, size: 64, weight: 700, tracking: -0.6, lineHeight: 1.05, maxLines: 2, color: 'ink' },
          subhead: { x: 8, y: 79, w: 60, size: 15, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'ink' },
          info1: { x: 8, y: 85.4, w: 30, size: 11, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          info2: { x: 44, y: 85.4, w: 30, size: 11, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          caption: { x: 8, y: 89.2, w: 48, size: 10.5, weight: 400, tracking: 0.2, maxLines: 1, color: 'muted' },
          footer: { x: 8, y: 93.6, w: 84, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'block', x: 0, y: 0, w: 100, h: 9.5, color: 'paper', opacity: 0.72 },
          { kind: 'rule', x: 8, y: 64, w: 84, thickness: 1, color: 'muted', opacity: 0.35 },
          { kind: 'rule', x: 8, y: 83.6, w: 84, thickness: 0.7, color: 'muted', opacity: 0.35 },
          { kind: 'vrule', x: 42, y: 83.6, h: 6.4, thickness: 0.6, color: 'muted', opacity: 0.3 },
          { kind: 'squares', x: 8, y: 84.1, size: 5, gap: 3, count: 2, color: 'accent', opacity: 0.9 },
          { kind: 'squares', x: 44, y: 84.1, size: 5, gap: 3, count: 2, color: 'muted', opacity: 0.6 },
          { kind: 'corners', x: 1.5, y: 1.5, w: 97, h: 59, len: 3, thickness: 1.4, color: 'paper', opacity: 0.65 },
          { kind: 'badge', x: 90, y: 10, r: 2.8, text: '01', color: 'accent', textColor: 'paper', opacity: 1 },
          { kind: 'bars', x: 80, y: 89.6, w: 13, h: 3, count: 16, color: 'muted', opacity: 0.55 },
          { kind: 'rule', x: 8, y: 93, w: 84, thickness: 0.6, color: 'muted', opacity: 0.25 },
        ],
      },
      loud: {
        hero: { x: 0, y: 0, w: 100, h: 100 },
        secondary: { x: 74, y: 18, w: 17, h: 12 },
        artBox: { x: 0, y: 0, w: 100, h: 100 },
        artClip: 'hero',
        slots: {
          masthead: { x: 8, y: 4, w: 50, size: 12, weight: 700, tracking: 2.4, color: 'ink', maxLines: 1 },
          issue: { x: 64, y: 4, w: 28, size: 10, weight: 500, tracking: 1.6, color: 'ink', maxLines: 1, align: 'right' },
          artWord: { x: 8, y: 8, w: 40, size: 10, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 8, y: 55, w: 86, size: 84, weight: 700, tracking: -1.4, lineHeight: 1.02, maxLines: 2, color: 'ink' },
          subhead: { x: 8, y: 73.5, w: 60, size: 16, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'ink' },
          caption: { x: 8, y: 82.6, w: 48, size: 10.5, weight: 400, tracking: 0.2, maxLines: 1, color: 'muted' },
          info1: { x: 8, y: 87.4, w: 30, size: 11, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          info2: { x: 44, y: 87.4, w: 30, size: 11, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          footer: { x: 8, y: 94, w: 84, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'block', x: 0, y: 0, w: 100, h: 12, color: 'paper', opacity: 0.66 },
          { kind: 'block', x: 0, y: 52, w: 100, h: 48, color: 'paper', opacity: 0.86 },
          { kind: 'rule', x: 8, y: 53, w: 84, thickness: 1.2, color: 'accent', opacity: 0.8 },
          { kind: 'rule', x: 8, y: 85.6, w: 84, thickness: 0.7, color: 'muted', opacity: 0.35 },
          { kind: 'vrule', x: 42, y: 85.6, h: 6.4, thickness: 0.6, color: 'muted', opacity: 0.3 },
          { kind: 'squares', x: 8, y: 86.1, size: 5, gap: 3, count: 2, color: 'accent', opacity: 0.9 },
          { kind: 'squares', x: 44, y: 86.1, size: 5, gap: 3, count: 2, color: 'muted', opacity: 0.6 },
          { kind: 'corners', x: 1.5, y: 1.5, w: 97, h: 97, len: 3, thickness: 1.4, color: 'paper', opacity: 0.6 },
          { kind: 'badge', x: 90, y: 10, r: 3, text: '01', color: 'accent', textColor: 'paper', opacity: 1 },
          { kind: 'bars', x: 80, y: 91.6, w: 13, h: 2.6, count: 16, color: 'muted', opacity: 0.55 },
        ],
      },
    },
  },

  poster_primary: {
    id: 'poster_primary',
    name: '原色积木',
    en: 'THE PRIMARY',
    tagline: '红黄蓝色块 · 圆形主图 · 硬边几何',
    when: '几何与秩序 / 展览 / 教学 / 年轻品牌',
    notWhen: '怀旧老照片 / 抒情散文 / 大量小字',
    palette: 'bauhaus_primary',
    font: 'grotesk',
    artFont: 'bauhaus',
    recipe: 'dot_matrix',
    newspaperVariant: 'bauhaus',
    demoArtWord: 'BAUHAUS 01',
    grain: 0.03,
    safe: { side: 7, top: 4, bottom: 5 },
    variants: {
      quiet: {
        hero: { x: 64, y: 40, w: 28, h: 28 },
        secondary: { x: 72, y: 28, w: 14, h: 10 },
        artBox: { x: 64, y: 40, w: 28, h: 28 },
        heroShape: 'circle',
        artClip: 'hero',
        slots: {
          masthead: { x: 7, y: 4, w: 50, size: 12, weight: 700, tracking: 2.4, color: 'ink', maxLines: 1 },
          issue: { x: 60, y: 4, w: 33, size: 10, weight: 500, tracking: 1.6, color: 'paper', maxLines: 1, align: 'right' },
          artWord: { x: 7, y: 8, w: 40, size: 10, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 5, y: 14, w: 54, size: 60, weight: 900, tracking: -1, lineHeight: 1.02, maxLines: 2, color: 'paper' },
          subhead: { x: 7, y: 39, w: 48, size: 15, weight: 400, tracking: 0.2, lineHeight: 1.55, maxLines: 3, color: 'ink' },
          caption: { x: 60, y: 70.5, w: 33, size: 11, weight: 400, tracking: 0.2, maxLines: 1, color: 'ink' },
          info1: { x: 5.5, y: 84.2, w: 26, size: 11, weight: 700, tracking: 0.6, maxLines: 2, color: 'paper' },
          info2: { x: 36.5, y: 84.2, w: 26, size: 11, weight: 700, tracking: 0.6, maxLines: 2, color: 'paper' },
          info3: { x: 67.5, y: 84.2, w: 26, size: 11, weight: 700, tracking: 0.6, maxLines: 2, color: 'ink' },
          footer: { x: 7, y: 93, w: 86, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'block', x: 0, y: 10, w: 62, h: 24, color: 'accent', opacity: 1 },
          { kind: 'polygon', points: [[62, 0], [100, 0], [100, 20]], color: 'secondary', opacity: 1 },
          { kind: 'block', x: 4, y: 79, w: 29, h: 11, color: 'accent', opacity: 1 },
          { kind: 'block', x: 35, y: 79, w: 29, h: 11, color: 'secondary', opacity: 1 },
          { kind: 'block', x: 66, y: 79, w: 29, h: 11, color: 'tertiary', opacity: 1 },
          { kind: 'badge', x: 8, y: 81.2, r: 1.6, text: '01', color: 'paper', textColor: 'accent', opacity: 1 },
          { kind: 'badge', x: 39, y: 81.2, r: 1.6, text: '02', color: 'paper', textColor: 'secondary', opacity: 1 },
          { kind: 'badge', x: 70, y: 81.2, r: 1.6, text: '03', color: 'ink', textColor: 'tertiary', opacity: 1 },
          { kind: 'squares', x: 7, y: 35.2, size: 6, gap: 4, count: 4, color: 'ink', opacity: 1 },
          { kind: 'rule', x: 7, y: 36, w: 54, thickness: 2, color: 'ink', opacity: 0.85 },
          { kind: 'badge', x: 88, y: 14, r: 3, text: '01', color: 'ink', textColor: 'paper', opacity: 1 },
          { kind: 'corners', x: 63.5, y: 39.5, w: 29, h: 29, len: 2.6, thickness: 1.4, color: 'ink', opacity: 0.55 },
        ],
      },
      loud: {
        hero: { x: 62, y: 40, w: 32, h: 32 },
        secondary: { x: 74, y: 28, w: 14, h: 10 },
        artBox: { x: 62, y: 40, w: 32, h: 32 },
        heroShape: 'circle',
        artClip: 'hero',
        slots: {
          masthead: { x: 7, y: 3.6, w: 50, size: 12, weight: 700, tracking: 2.4, color: 'ink', maxLines: 1 },
          issue: { x: 60, y: 3.6, w: 33, size: 10, weight: 500, tracking: 1.6, color: 'paper', maxLines: 1, align: 'right' },
          artWord: { x: 7, y: 5.8, w: 40, size: 10, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 5, y: 12, w: 58, size: 76, weight: 900, tracking: -1.4, lineHeight: 1, maxLines: 2, color: 'paper' },
          subhead: { x: 7, y: 41, w: 48, size: 16, weight: 400, tracking: 0.2, lineHeight: 1.55, maxLines: 3, color: 'ink' },
          caption: { x: 62, y: 76, w: 32, size: 11, weight: 400, tracking: 0.2, maxLines: 1, color: 'ink' },
          info1: { x: 5.5, y: 84.2, w: 26, size: 11, weight: 700, tracking: 0.6, maxLines: 2, color: 'paper' },
          info2: { x: 36.5, y: 84.2, w: 26, size: 11, weight: 700, tracking: 0.6, maxLines: 2, color: 'paper' },
          info3: { x: 67.5, y: 84.2, w: 26, size: 11, weight: 700, tracking: 0.6, maxLines: 2, color: 'ink' },
          footer: { x: 7, y: 93, w: 86, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'block', x: 0, y: 8, w: 66, h: 30, color: 'accent', opacity: 1 },
          { kind: 'polygon', points: [[66, 0], [100, 0], [100, 22]], color: 'secondary', opacity: 1 },
          { kind: 'block', x: 4, y: 79, w: 29, h: 11, color: 'accent', opacity: 1 },
          { kind: 'block', x: 35, y: 79, w: 29, h: 11, color: 'secondary', opacity: 1 },
          { kind: 'block', x: 66, y: 79, w: 29, h: 11, color: 'tertiary', opacity: 1 },
          { kind: 'badge', x: 8, y: 81.2, r: 1.6, text: '01', color: 'paper', textColor: 'accent', opacity: 1 },
          { kind: 'badge', x: 39, y: 81.2, r: 1.6, text: '02', color: 'paper', textColor: 'secondary', opacity: 1 },
          { kind: 'badge', x: 70, y: 81.2, r: 1.6, text: '03', color: 'ink', textColor: 'tertiary', opacity: 1 },
          { kind: 'squares', x: 7, y: 39, size: 6, gap: 4, count: 4, color: 'ink', opacity: 1 },
          { kind: 'rule', x: 7, y: 40, w: 52, thickness: 2, color: 'ink', opacity: 0.85 },
          { kind: 'badge', x: 88, y: 12.5, r: 3, text: '01', color: 'ink', textColor: 'paper', opacity: 1 },
          { kind: 'corners', x: 61, y: 39, w: 34, h: 34, len: 2.6, thickness: 1.4, color: 'ink', opacity: 0.55 },
        ],
      },
    },
  },

  poster_zine: {
    id: 'poster_zine',
    name: '手作志',
    en: 'THE ZINE',
    tagline: '纸纹胶带 · 错位标题 · 白框照片',
    when: '手作 / 青年 / 活动 / 实验表达',
    notWhen: '正式纪念 / 财经 / 极简',
    palette: 'soft_editorial',
    font: 'superfamily',
    artFont: 'de_stijl',
    recipe: 'tape_strips',
    newspaperVariant: 'minimal_masthead',
    demoArtWord: 'PAPER CUT',
    grain: 0.12,
    safe: { side: 7, top: 4, bottom: 5 },
    variants: {
      quiet: {
        hero: { x: 40, y: 42, w: 52, h: 36 },
        secondary: { x: 70, y: 60, w: 18, h: 12 },
        artBox: { x: 40, y: 42, w: 52, h: 36 },
        slots: {
          masthead: { x: 7, y: 6, w: 40, size: 12, weight: 700, tracking: 2.2, color: 'ink', maxLines: 1 },
          issue: { x: 62, y: 6, w: 31, size: 10, weight: 500, tracking: 1.6, color: 'muted', maxLines: 1, align: 'right' },
          artWord: { x: 7, y: 10, w: 40, size: 10, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 6, y: 16, w: 76, size: 62, weight: 700, tracking: -0.8, lineHeight: 1.06, maxLines: 2, color: 'ink', rotate: 3 },
          subhead: { x: 9, y: 33, w: 54, size: 15, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'ink' },
          caption: { x: 40, y: 80, w: 52, size: 11, weight: 400, tracking: 0.2, maxLines: 1, color: 'muted' },
          info1: { x: 7, y: 87.4, w: 24, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          info2: { x: 34, y: 87.4, w: 24, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          info3: { x: 61, y: 87.4, w: 24, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          footer: { x: 7, y: 93.5, w: 60, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'block', x: 4, y: 3, w: 28, h: 5, color: 'accent', opacity: 0.6, rotate: -6 },
          { kind: 'block', x: 64, y: 4.4, w: 30, h: 4.6, color: 'secondary', opacity: 0.5, rotate: 4 },
          { kind: 'block', x: 6, y: 89.5, w: 22, h: 3.6, color: 'accent', opacity: 0.45, rotate: -4 },
          { kind: 'block', x: 37, y: 41, w: 56, h: 38, color: 'secondary', opacity: 0.14, rotate: -1.5 },
          { kind: 'frame', x: 40, y: 42, w: 52, h: 36, thickness: 2, color: 'ink', opacity: 0.4 },
          { kind: 'frame', x: 41.4, y: 43.4, w: 49.2, h: 33.2, thickness: 1, color: 'ink', opacity: 0.18 },
          { kind: 'rule', x: 40, y: 79, w: 52, thickness: 0.8, color: 'muted', opacity: 0.35 },
          { kind: 'rule', x: 7, y: 85.4, w: 78, thickness: 0.7, color: 'muted', opacity: 0.35 },
          { kind: 'badge', x: 8, y: 83.4, r: 1.7, text: '01', color: 'accent', textColor: 'paper', opacity: 1 },
          { kind: 'badge', x: 35, y: 83.4, r: 1.7, text: '02', color: 'secondary', textColor: 'paper', opacity: 1 },
          { kind: 'badge', x: 62, y: 83.4, r: 1.7, text: '03', color: 'ink', textColor: 'paper', opacity: 1 },
          { kind: 'bars', x: 84, y: 89.4, w: 10, h: 3.2, count: 14, color: 'ink', opacity: 0.55 },
        ],
      },
      loud: {
        hero: { x: 34, y: 44, w: 60, h: 38 },
        secondary: { x: 72, y: 62, w: 18, h: 12 },
        artBox: { x: 34, y: 44, w: 60, h: 38 },
        slots: {
          masthead: { x: 7, y: 4.4, w: 40, size: 12, weight: 700, tracking: 2.2, color: 'ink', maxLines: 1 },
          issue: { x: 62, y: 4.4, w: 31, size: 10, weight: 500, tracking: 1.6, color: 'muted', maxLines: 1, align: 'right' },
          artWord: { x: 7, y: 8.4, w: 40, size: 10, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 5, y: 11, w: 80, size: 84, weight: 700, tracking: -1.6, lineHeight: 1, maxLines: 2, color: 'ink', rotate: -3 },
          subhead: { x: 7, y: 37, w: 40, size: 15, weight: 400, tracking: 0.2, lineHeight: 1.55, maxLines: 3, color: 'ink' },
          caption: { x: 34, y: 84, w: 60, size: 11, weight: 400, tracking: 0.2, maxLines: 1, color: 'muted' },
          info1: { x: 7, y: 90.2, w: 24, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          info2: { x: 34, y: 90.2, w: 24, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          info3: { x: 61, y: 90.2, w: 24, size: 10.5, weight: 600, tracking: 0.6, maxLines: 2, color: 'ink' },
          footer: { x: 7, y: 94.6, w: 60, size: 9.5, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'block', x: 3, y: 2.6, w: 32, h: 5.2, color: 'accent', opacity: 0.62, rotate: -7 },
          { kind: 'block', x: 66, y: 3.2, w: 30, h: 4.6, color: 'secondary', opacity: 0.5, rotate: 5 },
          { kind: 'block', x: 5, y: 91.6, w: 26, h: 3.2, color: 'accent', opacity: 0.4, rotate: -5 },
          { kind: 'block', x: 31, y: 43, w: 64, h: 40, color: 'secondary', opacity: 0.14, rotate: -1.5 },
          { kind: 'frame', x: 34, y: 44, w: 60, h: 38, thickness: 2.4, color: 'ink', opacity: 0.42 },
          { kind: 'frame', x: 35.6, y: 45.6, w: 56.8, h: 34.8, thickness: 1, color: 'ink', opacity: 0.18 },
          { kind: 'rule', x: 34, y: 83, w: 60, thickness: 0.8, color: 'muted', opacity: 0.35 },
          { kind: 'rule', x: 7, y: 88.2, w: 78, thickness: 0.7, color: 'muted', opacity: 0.35 },
          { kind: 'badge', x: 8, y: 86.2, r: 1.7, text: '01', color: 'accent', textColor: 'paper', opacity: 1 },
          { kind: 'badge', x: 35, y: 86.2, r: 1.7, text: '02', color: 'secondary', textColor: 'paper', opacity: 1 },
          { kind: 'badge', x: 62, y: 86.2, r: 1.7, text: '03', color: 'ink', textColor: 'paper', opacity: 1 },
          { kind: 'bars', x: 84, y: 92.6, w: 10, h: 3, count: 14, color: 'ink', opacity: 0.55 },
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
    templates: ['poster_editorial', 'poster_kino'],
  },
  {
    id: 'B',
    role: '现代商业',
    hint: '品牌传播、社交分享；标题更短更狠，但不出格。',
    templates: ['poster_primary', 'poster_swiss'],
  },
  {
    id: 'C',
    role: '大胆传播',
    hint: '展陈、文艺表达；短句、留白、允许一点实验性。',
    templates: ['poster_diagonal', 'poster_zine'],
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
