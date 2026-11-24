/**
 * 海报专用模板（与报纸的 9 套 VARIANTS 分开）。
 *
 * 一套模板 = 一张 800×1000 的构图配方：
 * - slot：文字槽位（百分比矩形 + 字号 + 行高 + 颜色角色）；
 * - hero：主图 / 图案视觉区（无照片时由图案配方填充）；
 * - decor：色块、斜切、分隔线、网格等静态装饰（代码画，不用模型）；
 * - recipe：默认图案配方；artFont：允许的艺术字（已做 latin 子集，体积可控）。
 *
 * 视觉参考：明日方舟官网档案/新闻页与《明日方舟：终末地》官网的
 * 工业排版语言（近黑/白纸、单一信号色、切角、点阵、细线、巨大空心字、
 * 技术字段、等高线）。只提炼结构，不使用官方字体、标志、图标、截图或文案。
 *
 * 模型只能选 template + variant，不能给坐标；坐标全部来自这里。
 */
import { FORMATS } from './presets.js'

export const POSTER_W = FORMATS.poster.width
export const POSTER_H = FORMATS.poster.height

/** 海报资产版本：模板 / 配方 / 字体子集共同构成；写进 SVG 与导出元数据，便于快照定位。 */
export const POSTER_ASSET_VERSION = '4.1.0'

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
  /* ------------------------------------------------------------------ */
  /* 1. 方舟档案：近黑 + 青色 + 点阵 + 巨大空心字 + 数据字段            */
  /* ------------------------------------------------------------------ */
  poster_ark_file: {
    id: 'poster_ark_file',
    name: '干员档案',
    en: 'OPERATOR FILE',
    tagline: '近黑档案 · 青色编号 · 数据栏',
    when: '人物档案 / 品牌履历 / 有明确时间地点的活动',
    notWhen: '温柔生活照 / 需要大量暖色 / 无信息的纯风景',
    palette: 'ark_night',
    font: 'grotesk',
    artFont: 'swiss_style',
    recipe: 'paper_grain',
    newspaperVariant: 'classic_broadsheet',
    demoArtWord: 'FIELD NOTES',
    grain: 0.08,
    safe: { side: 6, top: 4, bottom: 5 },
    variants: {
      quiet: {
        hero: { x: 58, y: 17, w: 36, h: 42 },
        heroShape: 'cut',
        heroCut: 6,
        photoFilter: 'mono',
        secondary: { x: 62, y: 46, w: 14, h: 10 },
        artBox: { x: 58, y: 17, w: 36, h: 42 },
        slots: {
          masthead: { x: 6, y: 4, w: 40, size: 12, weight: 700, tracking: 2.6, color: 'ink', maxLines: 1 },
          issue: { x: 66, y: 4, w: 28, size: 9, weight: 500, tracking: 2, color: 'accent', maxLines: 1, align: 'right' },
          kicker: { x: 6, y: 8, w: 52, size: 9, weight: 600, tracking: 2.4, color: 'accent', maxLines: 1, upper: true },
          artWord: { x: 6, y: 11, w: 52, size: 10, weight: 600, tracking: 3, color: 'tertiary', maxLines: 1, upper: true },
          headline: { x: 6, y: 15, w: 50, size: 64, weight: 900, tracking: -1.2, lineHeight: 1.02, maxLines: 3, color: 'ink' },
          subhead: { x: 6, y: 47, w: 46, size: 14, weight: 400, tracking: 0.2, lineHeight: 1.6, maxLines: 3, color: 'secondary' },
          caption: { x: 58, y: 60.5, w: 36, size: 9, weight: 400, tracking: 0.2, lineHeight: 1.4, maxLines: 2, color: 'muted' },
          info1: { x: 6, y: 80, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 2, color: 'ink' },
          info2: { x: 35, y: 80, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 2, color: 'ink' },
          info3: { x: 64, y: 80, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 2, color: 'ink' },
          ghost: { x: 4, y: 62, w: 92, size: 150, weight: 800, tracking: 1, lineHeight: 1, maxLines: 1, color: 'ink', outline: true, strokeWidth: 1.2, opacity: 0.1, upper: true },
          footer: { x: 6, y: 94, w: 86, size: 8.5, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'dots', x: 0, y: 0, w: 100, h: 100, cols: 28, rows: 38, r: 0.55, color: 'ink', opacity: 0.055 },
          { kind: 'triColor', x: 6, y: 6.4, w: 10, h: 0.35, gap: 1.2, opacity: 1 },
          { kind: 'rule', x: 6, y: 7.8, w: 86, thickness: 0.6, color: 'accent', opacity: 0.65 },
          { kind: 'block', x: 6, y: 15, w: 0.8, h: 22, color: 'accent', opacity: 0.9 },
          { kind: 'cutFrame', x: 57.4, y: 16.4, w: 37.2, h: 43.2, cut: 6, thickness: 1, color: 'accent', opacity: 0.5 },
          { kind: 'corners', x: 58, y: 17, w: 36, h: 42, len: 2.8, thickness: 1.2, color: 'accent', opacity: 0.7 },
          { kind: 'rule', x: 6, y: 76.5, w: 86, thickness: 0.5, color: 'ink', opacity: 0.25 },
          { kind: 'squares', x: 6, y: 77.4, size: 4, gap: 3, count: 3, color: 'accent', opacity: 0.9 },
          { kind: 'rule', x: 6, y: 92, w: 86, thickness: 0.5, color: 'ink', opacity: 0.2 },
        ],
      },
      loud: {
        hero: { x: 0, y: 0, w: 100, h: 100 },
        photoFilter: 'mono',
        secondary: { x: 78, y: 76, w: 16, h: 11 },
        artBox: { x: 0, y: 0, w: 100, h: 100 },
        slots: {
          masthead: { x: 6, y: 4, w: 40, size: 12, weight: 700, tracking: 2.6, color: 'ink', maxLines: 1 },
          issue: { x: 66, y: 4, w: 28, size: 9, weight: 500, tracking: 2, color: 'muted', maxLines: 1, align: 'right' },
          kicker: { x: 6, y: 8, w: 52, size: 9, weight: 600, tracking: 2.4, color: 'accent', maxLines: 1, upper: true },
          artWord: { x: 6, y: 11, w: 52, size: 10, weight: 600, tracking: 3, color: 'tertiary', maxLines: 1, upper: true },
          headline: { x: 6, y: 60, w: 84, size: 82, weight: 900, tracking: -1.4, lineHeight: 1, maxLines: 2, color: 'ink' },
          subhead: { x: 6, y: 82, w: 56, size: 13, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'secondary' },
          caption: { x: 64, y: 84, w: 30, size: 9, weight: 400, tracking: 0.2, maxLines: 2, color: 'muted' },
          info1: { x: 6, y: 90, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 1, color: 'ink' },
          info2: { x: 34, y: 90, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 1, color: 'ink' },
          info3: { x: 62, y: 90, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 1, color: 'ink' },
          ghost: { x: 4, y: 34, w: 92, size: 150, weight: 800, tracking: 1, lineHeight: 1, maxLines: 1, color: 'ink', outline: true, strokeWidth: 1.4, opacity: 0.18, upper: true },
          footer: { x: 6, y: 96, w: 86, size: 8.5, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'scrim', x: 0, y: 56, w: 100, h: 44, color: 'paper', opacity: 0.9 },
          { kind: 'dots', x: 0, y: 0, w: 100, h: 56, cols: 28, rows: 22, r: 0.55, color: 'ink', opacity: 0.06 },
          { kind: 'triColor', x: 6, y: 6.4, w: 10, h: 0.35, gap: 1.2, opacity: 1 },
          { kind: 'rule', x: 6, y: 55.2, w: 88, thickness: 1.2, color: 'accent', opacity: 0.9 },
          { kind: 'corners', x: 1.5, y: 1.5, w: 97, h: 53, len: 3, thickness: 1.2, color: 'ink', opacity: 0.5 },
          { kind: 'rule', x: 6, y: 88, w: 88, thickness: 0.5, color: 'ink', opacity: 0.3 },
          { kind: 'squares', x: 6, y: 87.2, size: 4, gap: 3, count: 3, color: 'accent', opacity: 0.9 },
        ],
      },
    },
  },

  /* ------------------------------------------------------------------ */
  /* 2. 终末地信号：白纸 + 蓝黄 + 切角画框 + 技术标注                  */
  /* ------------------------------------------------------------------ */
  poster_endfield_signal: {
    id: 'poster_endfield_signal',
    name: '终末信号',
    en: 'SIGNAL',
    tagline: '白场 · 蓝黄信号 · 切角画框',
    when: '产品发布 / 展览 / 干净明亮的生活方式照片',
    notWhen: '沉重公告 / 纯文字 / 需要旧纸质感',
    palette: 'endfield_paper',
    font: 'grotesk',
    artFont: 'swiss_style',
    recipe: 'grid_columns',
    newspaperVariant: 'minimal_masthead',
    demoArtWord: 'SIGNAL',
    grain: 0.03,
    safe: { side: 7, top: 4, bottom: 5 },
    variants: {
      quiet: {
        hero: { x: 8, y: 37, w: 84, h: 38 },
        heroShape: 'cut',
        heroCut: 6,
        secondary: { x: 70, y: 62, w: 18, h: 12 },
        artBox: { x: 8, y: 37, w: 84, h: 38 },
        slots: {
          masthead: { x: 8, y: 4, w: 40, size: 11, weight: 700, tracking: 2.8, color: 'ink', maxLines: 1 },
          issue: { x: 72.5, y: 9.8, w: 15, size: 8, weight: 600, tracking: 1.6, color: 'ink', maxLines: 1, align: 'right' },
          kicker: { x: 8, y: 8, w: 60, size: 9, weight: 600, tracking: 2.4, color: 'secondary', maxLines: 1, upper: true },
          artWord: { x: 8, y: 11, w: 60, size: 11, weight: 700, tracking: 3, color: 'secondary', maxLines: 1, upper: true },
          headline: { x: 8, y: 14.5, w: 80, size: 72, weight: 800, tracking: -1, lineHeight: 1.02, maxLines: 2, color: 'ink' },
          subhead: { x: 8, y: 30, w: 60, size: 14, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'muted' },
          caption: { x: 8, y: 77.5, w: 60, size: 10, weight: 400, tracking: 0.2, maxLines: 1, color: 'muted' },
          info1: { x: 8, y: 84, w: 24, size: 10, weight: 600, tracking: 0.8, maxLines: 2, color: 'ink' },
          info2: { x: 36, y: 84, w: 24, size: 10, weight: 600, tracking: 0.8, maxLines: 2, color: 'ink' },
          info3: { x: 64, y: 84, w: 24, size: 10, weight: 600, tracking: 0.8, maxLines: 2, color: 'ink' },
          footer: { x: 8, y: 93, w: 84, size: 10, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'triColor', x: 8, y: 6.4, w: 10, h: 0.35, gap: 1.2, opacity: 1 },
          { kind: 'rule', x: 8, y: 8.2, w: 84, thickness: 0.5, color: 'muted', opacity: 0.35 },
          { kind: 'rule', x: 8, y: 32, w: 84, thickness: 1, color: 'secondary', opacity: 0.6 },
          { kind: 'cutFrame', x: 7.4, y: 36.4, w: 85.2, h: 39.2, cut: 6, thickness: 1.2, color: 'secondary', opacity: 0.7 },
          { kind: 'block', x: 74, y: 9, w: 16, h: 5, color: 'accent', opacity: 1 },
          { kind: 'squares', x: 74, y: 15, size: 4, gap: 3, count: 3, color: 'secondary', opacity: 0.8 },
          { kind: 'dots', x: 62, y: 63, w: 26, h: 8, cols: 10, rows: 4, r: 1.1, color: 'secondary', opacity: 0.18 },
          { kind: 'rule', x: 8, y: 82.4, w: 84, thickness: 0.6, color: 'muted', opacity: 0.35 },
          { kind: 'block', x: 8, y: 83, w: 6, h: 1, color: 'accent', opacity: 1 },
          { kind: 'rule', x: 8, y: 91.4, w: 84, thickness: 0.5, color: 'muted', opacity: 0.25 },
        ],
      },
      loud: {
        hero: { x: 0, y: 0, w: 100, h: 100 },
        secondary: { x: 78, y: 72, w: 16, h: 11 },
        artBox: { x: 0, y: 0, w: 100, h: 100 },
        slots: {
          masthead: { x: 8, y: 5, w: 40, size: 11, weight: 700, tracking: 2.8, color: 'ink', maxLines: 1 },
          issue: { x: 74.5, y: 18, w: 16, size: 8, weight: 600, tracking: 1.6, color: 'ink', maxLines: 1, align: 'right' },
          kicker: { x: 8, y: 9, w: 60, size: 9, weight: 600, tracking: 2.4, color: 'secondary', maxLines: 1, upper: true },
          artWord: { x: 8, y: 12, w: 60, size: 11, weight: 700, tracking: 3, color: 'secondary', maxLines: 1, upper: true },
          headline: { x: 8, y: 57, w: 82, size: 80, weight: 800, tracking: -1.2, lineHeight: 1, maxLines: 2, color: 'ink' },
          subhead: { x: 8, y: 78, w: 58, size: 13, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'muted' },
          caption: { x: 66, y: 80, w: 28, size: 9, weight: 400, tracking: 0.2, maxLines: 2, color: 'muted' },
          info1: { x: 8, y: 87, w: 24, size: 10, weight: 600, tracking: 0.8, maxLines: 1, color: 'ink' },
          info2: { x: 36, y: 87, w: 24, size: 10, weight: 600, tracking: 0.8, maxLines: 1, color: 'ink' },
          info3: { x: 64, y: 87, w: 24, size: 10, weight: 600, tracking: 0.8, maxLines: 1, color: 'ink' },
          footer: { x: 8, y: 94, w: 84, size: 9, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'scrim', x: 0, y: 0, w: 100, h: 15, color: 'paper', opacity: 0.93 },
          { kind: 'scrim', x: 0, y: 52, w: 100, h: 48, color: 'paper', opacity: 0.9 },
          { kind: 'triColor', x: 8, y: 6.4, w: 10, h: 0.35, gap: 1.2, opacity: 1 },
          { kind: 'rule', x: 8, y: 14.6, w: 84, thickness: 1, color: 'secondary', opacity: 0.7 },
          { kind: 'block', x: 74, y: 17, w: 18, h: 5, color: 'accent', opacity: 1, layer: 'foreground' },
          { kind: 'corners', x: 1.5, y: 1.5, w: 97, h: 97, len: 3, thickness: 1.2, color: 'secondary', opacity: 0.45 },
          { kind: 'rule', x: 8, y: 85, w: 84, thickness: 0.8, color: 'secondary', opacity: 0.5 },
          { kind: 'block', x: 8, y: 90.5, w: 6, h: 1, color: 'accent', opacity: 1 },
          { kind: 'dots', x: 62, y: 56, w: 30, h: 16, cols: 12, rows: 7, r: 1.1, color: 'secondary', opacity: 0.16 },
        ],
      },
    },
  },

  /* ------------------------------------------------------------------ */
  /* 3. 方舟警戒：黑黄警戒条 + 斜切 + 巨大压缩标题                     */
  /* ------------------------------------------------------------------ */
  poster_ark_hazard: {
    id: 'poster_ark_hazard',
    name: '警戒通告',
    en: 'HAZARD',
    tagline: '黑黄警戒 · 斜切硬边 · 压缩巨字',
    when: '活动预告 / 强冲击 / 夜间或高反差照片',
    notWhen: '温和日常 / 浅色小清新 / 信息极少的独照',
    palette: 'ark_hazard',
    font: 'grotesk',
    artFont: 'constructivism',
    recipe: 'diagonal_split',
    newspaperVariant: 'tabloid_bold',
    demoArtWord: 'WARNING',
    grain: 0.1,
    safe: { side: 6, top: 4, bottom: 5 },
    variants: {
      quiet: {
        hero: { x: 0, y: 0, w: 100, h: 46 },
        photoFilter: 'mono',
        secondary: { x: 78, y: 52, w: 16, h: 11 },
        artBox: { x: 0, y: 0, w: 100, h: 46 },
        slots: {
          masthead: { x: 6, y: 4, w: 40, size: 11, weight: 700, tracking: 2.6, color: 'ink', maxLines: 1 },
          issue: { x: 62, y: 4, w: 26, size: 9, weight: 500, tracking: 2, color: 'ink', maxLines: 1, align: 'right' },
          kicker: { x: 6, y: 8, w: 44, size: 9, weight: 600, tracking: 2.2, color: 'accent', maxLines: 1, upper: true },
          artWord: { x: 6, y: 11, w: 50, size: 11, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 6, y: 50, w: 88, size: 68, weight: 900, tracking: -1.4, lineHeight: 1.02, maxLines: 2, color: 'ink' },
          subhead: { x: 6, y: 74, w: 56, size: 13, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'muted' },
          caption: { x: 64, y: 74, w: 30, size: 9, weight: 400, tracking: 0.2, maxLines: 2, color: 'muted' },
          info1: { x: 6, y: 85, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 2, color: 'ink' },
          info2: { x: 35, y: 85, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 2, color: 'ink' },
          info3: { x: 64, y: 85, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 2, color: 'ink' },
          ghost: { x: 4, y: 62, w: 92, size: 150, weight: 800, tracking: 1, lineHeight: 1, maxLines: 1, color: 'accent', outline: true, strokeWidth: 1.2, opacity: 0.16, upper: true },
          footer: { x: 6, y: 94, w: 86, size: 8.5, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'polygon', points: [[0, 40], [100, 32], [100, 36], [0, 44]], color: 'accent', opacity: 1, layer: 'foreground' },
          { kind: 'polygon', points: [[0, 45], [100, 37], [100, 38.2], [0, 46.2]], color: 'accent', opacity: 0.55, layer: 'foreground' },
          { kind: 'polygon', points: [[88, 0], [100, 0], [100, 6], [92, 6]], color: 'accent', opacity: 0.9, layer: 'foreground' },
          { kind: 'polygon', points: [[0, 0], [6, 0], [0, 8]], color: 'accent', opacity: 0.8, layer: 'foreground' },
          { kind: 'rule', x: 6, y: 83, w: 88, thickness: 1.2, color: 'accent', opacity: 0.9 },
          { kind: 'cutFrame', x: 4, y: 48, w: 92, h: 42, cut: 5, thickness: 0.8, color: 'muted', opacity: 0.2 },
          { kind: 'squares', x: 6, y: 84, size: 4, gap: 3, count: 3, color: 'accent', opacity: 0.9 },
        ],
      },
      loud: {
        hero: { x: 0, y: 0, w: 100, h: 100 },
        photoFilter: 'mono',
        secondary: { x: 78, y: 84, w: 16, h: 11 },
        artBox: { x: 0, y: 0, w: 100, h: 100 },
        slots: {
          masthead: { x: 6, y: 4, w: 40, size: 11, weight: 700, tracking: 2.6, color: 'ink', maxLines: 1 },
          issue: { x: 62, y: 4, w: 26, size: 9, weight: 500, tracking: 2, color: 'muted', maxLines: 1, align: 'right' },
          kicker: { x: 6, y: 8, w: 44, size: 9, weight: 600, tracking: 2.2, color: 'accent', maxLines: 1, upper: true },
          artWord: { x: 6, y: 11, w: 50, size: 11, weight: 700, tracking: 3, color: 'accent', maxLines: 1, upper: true },
          headline: { x: 6, y: 58, w: 88, size: 70, weight: 900, tracking: -1.6, lineHeight: 0.98, maxLines: 2, color: 'ink' },
          subhead: { x: 6, y: 84, w: 54, size: 12, weight: 400, tracking: 0.2, lineHeight: 1.4, maxLines: 2, color: 'muted' },
          info1: { x: 6, y: 91, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 1, color: 'ink' },
          info2: { x: 34, y: 91, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 1, color: 'ink' },
          info3: { x: 62, y: 91, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 1, color: 'ink' },
          ghost: { x: 4, y: 26, w: 92, size: 160, weight: 800, tracking: 1, lineHeight: 1, maxLines: 1, color: 'accent', outline: true, strokeWidth: 1.4, opacity: 0.18, upper: true },
          footer: { x: 6, y: 96, w: 86, size: 8.5, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'scrim', x: 0, y: 52, w: 100, h: 48, color: 'paper', opacity: 0.86 },
          { kind: 'polygon', points: [[0, 44], [100, 36], [100, 40], [0, 48]], color: 'accent', opacity: 1, layer: 'foreground' },
          { kind: 'polygon', points: [[0, 48], [100, 40], [100, 41.2], [0, 49.2]], color: 'accent', opacity: 0.5, layer: 'foreground' },
          { kind: 'rule', x: 6, y: 88, w: 88, thickness: 1.2, color: 'accent', opacity: 0.9 },
          { kind: 'corners', x: 1.5, y: 1.5, w: 97, h: 97, len: 3, thickness: 1.2, color: 'accent', opacity: 0.5 },
          { kind: 'cutFrame', x: 4, y: 54, w: 92, h: 38, cut: 5, thickness: 0.8, color: 'muted', opacity: 0.25 },
          { kind: 'squares', x: 6, y: 89.2, size: 4, gap: 3, count: 3, color: 'accent', opacity: 0.9 },
        ],
      },
    },
  },

  /* ------------------------------------------------------------------ */
  /* 4. 终末地勘测：暖纸 + 等高线 + 现场记录 + 切角照片                */
  /* ------------------------------------------------------------------ */
  poster_endfield_survey: {
    id: 'poster_endfield_survey',
    name: '勘测记录',
    en: 'SURVEY',
    tagline: '暖纸 · 等高线 · 现场记录',
    when: '旅行 / 场地 / 产品细节 / 有地点与时间的记录',
    notWhen: '强冲突公告 / 夜间演出 / 需要巨大标题',
    palette: 'endfield_field',
    font: 'grotesk',
    artFont: 'nasa_punk',
    recipe: 'contour',
    newspaperVariant: 'classic_broadsheet',
    demoArtWord: 'SURVEY',
    grain: 0.06,
    safe: { side: 6, top: 4, bottom: 5 },
    variants: {
      quiet: {
        hero: { x: 8, y: 25, w: 44, h: 40 },
        heroShape: 'cut',
        heroCut: 5,
        secondary: { x: 10, y: 52, w: 14, h: 10 },
        artBox: { x: 8, y: 25, w: 44, h: 40 },
        slots: {
          masthead: { x: 8, y: 4, w: 40, size: 11, weight: 700, tracking: 2.6, color: 'ink', maxLines: 1 },
          issue: { x: 64, y: 4, w: 28, size: 9, weight: 500, tracking: 2, color: 'muted', maxLines: 1, align: 'right' },
          kicker: { x: 8, y: 8, w: 60, size: 9, weight: 600, tracking: 2.4, color: 'secondary', maxLines: 1, upper: true },
          artWord: { x: 8, y: 11, w: 60, size: 10, weight: 700, tracking: 3, color: 'secondary', maxLines: 1, upper: true },
          headline: { x: 8, y: 14, w: 80, size: 54, weight: 800, tracking: -0.8, lineHeight: 1.04, maxLines: 2, color: 'ink' },
          subhead: { x: 8, y: 67, w: 40, size: 12, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'muted' },
          caption: { x: 8, y: 80, w: 40, size: 9, weight: 400, tracking: 0.2, maxLines: 2, color: 'muted' },
          info1: { x: 56, y: 29, w: 34, size: 10, weight: 600, tracking: 0.8, maxLines: 2, color: 'ink' },
          info2: { x: 56, y: 35, w: 34, size: 10, weight: 600, tracking: 0.8, maxLines: 2, color: 'ink' },
          info3: { x: 56, y: 41, w: 34, size: 10, weight: 600, tracking: 0.8, maxLines: 2, color: 'ink' },
          ghost: { x: 4, y: 71, w: 92, size: 140, weight: 800, tracking: 1, lineHeight: 1, maxLines: 1, color: 'muted', outline: true, strokeWidth: 1, opacity: 0.1, upper: true },
          footer: { x: 8, y: 94, w: 84, size: 9, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'contour', x: 0, y: 0, w: 100, h: 100, lines: 13, amplitude: 2.8, thickness: 0.8, color: 'muted', opacity: 0.16 },
          { kind: 'grid', x: 8, y: 25, w: 44, h: 40, columns: 8, color: 'ink', opacity: 0.08, layer: 'foreground' },
          { kind: 'triColor', x: 8, y: 6.4, w: 10, h: 0.35, gap: 1.2, opacity: 1 },
          { kind: 'cutFrame', x: 7.4, y: 24.4, w: 45.2, h: 41.2, cut: 5, thickness: 1.2, color: 'accent', opacity: 0.8 },
          { kind: 'vrule', x: 54, y: 25, h: 41, thickness: 0.8, color: 'muted', opacity: 0.4 },
          { kind: 'rule', x: 56, y: 27.5, w: 34, thickness: 0.6, color: 'muted', opacity: 0.45 },
          { kind: 'rule', x: 56, y: 33.5, w: 34, thickness: 0.6, color: 'muted', opacity: 0.35 },
          { kind: 'rule', x: 56, y: 39.5, w: 34, thickness: 0.6, color: 'muted', opacity: 0.35 },
          { kind: 'squares', x: 56, y: 28.6, size: 4, gap: 3, count: 2, color: 'accent', opacity: 1 },
          { kind: 'block', x: 56, y: 23, w: 5, h: 1.2, color: 'accent', opacity: 1 },
          { kind: 'dots', x: 56, y: 48, w: 34, h: 12, cols: 12, rows: 4, r: 1, color: 'muted', opacity: 0.22 },
          { kind: 'rule', x: 8, y: 84, w: 84, thickness: 0.5, color: 'muted', opacity: 0.3 },
          { kind: 'rule', x: 8, y: 92.4, w: 84, thickness: 0.5, color: 'muted', opacity: 0.25 },
        ],
      },
      loud: {
        hero: { x: 0, y: 0, w: 100, h: 100 },
        secondary: { x: 78, y: 78, w: 16, h: 11 },
        artBox: { x: 0, y: 0, w: 100, h: 100 },
        slots: {
          masthead: { x: 8, y: 5, w: 40, size: 11, weight: 700, tracking: 2.6, color: 'ink', maxLines: 1 },
          issue: { x: 64, y: 5, w: 28, size: 9, weight: 500, tracking: 2, color: 'muted', maxLines: 1, align: 'right' },
          kicker: { x: 8, y: 9, w: 60, size: 9, weight: 600, tracking: 2.4, color: 'secondary', maxLines: 1, upper: true },
          artWord: { x: 8, y: 12, w: 60, size: 10, weight: 700, tracking: 3, color: 'secondary', maxLines: 1, upper: true },
          headline: { x: 8, y: 56, w: 84, size: 76, weight: 800, tracking: -1, lineHeight: 1.02, maxLines: 2, color: 'ink' },
          subhead: { x: 8, y: 80, w: 54, size: 12, weight: 400, tracking: 0.2, lineHeight: 1.5, maxLines: 2, color: 'muted' },
          caption: { x: 64, y: 80, w: 28, size: 9, weight: 400, tracking: 0.2, maxLines: 2, color: 'muted' },
          info1: { x: 8, y: 88, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 1, color: 'ink' },
          info2: { x: 36, y: 88, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 1, color: 'ink' },
          info3: { x: 64, y: 88, w: 24, size: 9, weight: 600, tracking: 0.8, maxLines: 1, color: 'ink' },
          ghost: { x: 4, y: 27, w: 92, size: 150, weight: 800, tracking: 1, lineHeight: 1, maxLines: 1, color: 'accent', outline: true, strokeWidth: 1.3, opacity: 0.18, upper: true },
          footer: { x: 8, y: 94, w: 84, size: 9, weight: 400, tracking: 1, maxLines: 1, color: 'muted' },
        },
        decor: [
          { kind: 'scrim', x: 0, y: 0, w: 100, h: 14, color: 'paper', opacity: 0.92 },
          { kind: 'scrim', x: 0, y: 52, w: 100, h: 48, color: 'paper', opacity: 0.9 },
          { kind: 'contour', x: 0, y: 0, w: 100, h: 100, lines: 11, amplitude: 2.2, thickness: 1, color: 'muted', opacity: 0.18 },
          { kind: 'triColor', x: 8, y: 6.4, w: 10, h: 0.35, gap: 1.2, opacity: 1 },
          { kind: 'rule', x: 8, y: 14.5, w: 84, thickness: 1, color: 'secondary', opacity: 0.7 },
          { kind: 'block', x: 74, y: 17, w: 18, h: 5, color: 'accent', opacity: 1, layer: 'foreground' },
          { kind: 'cutFrame', x: 4, y: 54, w: 92, h: 38, cut: 5, thickness: 1.2, color: 'accent', opacity: 0.7 },
          { kind: 'corners', x: 1.5, y: 1.5, w: 97, h: 97, len: 3, thickness: 1.2, color: 'muted', opacity: 0.35 },
          { kind: 'rule', x: 8, y: 86, w: 84, thickness: 0.8, color: 'accent', opacity: 0.8 },
          { kind: 'squares', x: 8, y: 87.1, size: 4, gap: 3, count: 3, color: 'accent', opacity: 1 },
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


}

export const POSTER_TEMPLATE_IDS = Object.keys(POSTER_TEMPLATES)

export function getPosterTemplate(id) {
  return POSTER_TEMPLATES[id] || POSTER_TEMPLATES.poster_ark_file
}

export function resolvePosterVariant(template, variantId) {
  const id = template.variants[variantId] ? variantId : 'quiet'
  return { id, ...template.variants[id] }
}

export function posterTemplateForNewspaperVariant(variantId) {
  const hit = Object.values(POSTER_TEMPLATES).find((tpl) => tpl.newspaperVariant === variantId)
  return hit?.id || 'poster_ark_file'
}

export function newspaperVariantForPoster(templateId) {
  return getPosterTemplate(templateId).newspaperVariant
}

/** 三套海报的角度：标准与设计模式共用，只是内容角度不同。 */
export const POSTER_ANGLES = [
  {
    id: 'A',
    role: '档案秩序',
    hint: '冷静、可读、有档案感；第三人称，标题克制，信息完整。',
    templates: ['poster_ark_file', 'poster_endfield_signal'],
  },
  {
    id: 'B',
    role: '警戒冲击',
    hint: '短、狠、像一张现场通告；标题可以压迫画面，信息少而硬。',
    templates: ['poster_ark_hazard', 'poster_primary', 'poster_diagonal'],
  },
  {
    id: 'C',
    role: '勘测影像',
    hint: '像一页现场记录，也可以是一张电影感留白海报；时间地点和细节优先。',
    templates: ['poster_endfield_survey', 'poster_kino'],
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
