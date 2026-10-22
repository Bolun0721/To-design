/**
 * 设计预设白名单 —— 移植自 newspaper-design-presets.json。
 * 色值、字体、版式全部集中在这里，前端渲染是确定性的：
 * LLM 只负责选择 preset key 与写稿，绝不自由生成色值。
 */

export const COLOR_PRESETS = {
  classic_serious: {
    id: 'classic_serious',
    name: '经典严肃',
    source: 'Editorial Black, White & Red',
    background: '#FFFFFF',
    text: '#1A1A1A',
    accent: '#C8102E',
    secondary: '#4A4A4A',
    muted: '#9E9E9E',
    usage: '强图形冲击版式（classic_broadsheet 默认）',
  },
  financial_daily: {
    id: 'financial_daily',
    name: '财经日报',
    source: 'aimeos / pagible-themes-news',
    background: '#E9ECEE',
    text: '#262A2C',
    accent: '#8B1538',
    secondary: '#0D4851',
    muted: '#6B7276',
    usage: '财经/商业日报（tabloid_bold 默认）',
  },
  newsprint_single_accent: {
    id: 'newsprint_single_accent',
    name: '新闻纸单色',
    source: 'dsh-theme-newsprint',
    background: '#F5F3ED',
    text: '#1F0909',
    accent: '#065588',
    secondary: '#3D3533',
    muted: '#8A8378',
    usage: '全篇仅一个强调色，最克制（minimal_masthead 默认）',
  },
  soft_editorial: {
    id: 'soft_editorial',
    name: '柔和特稿',
    source: 'beautiful-html-templates soft-editorial',
    background: '#F7F2E9',
    text: '#2B2622',
    accent: '#B08968',
    secondary: '#7D8C7A',
    muted: '#A89F8D',
    usage: '生活方式 / 特稿版',
  },
  warm_clay: {
    id: 'warm_clay',
    name: '暖陶',
    source: 'Anthropic 品牌色系',
    background: '#FAF7F2',
    text: '#1F1B18',
    accent: '#C15F3C',
    secondary: '#5C554E',
    muted: '#A69C92',
    usage: '评论 / 专栏版',
  },
  constructivism_red: {
    id: 'constructivism_red',
    name: '构成主义红黑',
    source: 'Russian Constructivism · Rodchenko / Lissitzky',
    background: '#E9E0CC',
    text: '#1B1816',
    accent: '#D4291F',
    secondary: '#1B1816',
    muted: '#8A7A62',
    tertiary: '#F3E8D1',
    usage: '构成主义：斜切、红黑大字',
  },
  bauhaus_primary: {
    id: 'bauhaus_primary',
    name: '包豪斯原色',
    source: 'Bauhaus Dessau · Bayer / Moholy-Nagy',
    background: '#F1ECE1',
    text: '#171717',
    accent: '#E2412C',
    secondary: '#2F57B0',
    muted: '#8A8275',
    tertiary: '#F2C230',
    quaternary: '#171717',
    usage: '包豪斯：红黄蓝几何',
  },
  nasa_cream: {
    id: 'nasa_cream',
    name: 'NASA 米灰',
    source: 'NASA Graphics Standards Manual · 1970s',
    background: '#ECE5D6',
    text: '#2B2F33',
    accent: '#D63A2C',
    secondary: '#4C5A68',
    muted: '#7A7F4E',
    tertiary: '#D2A85E',
    quaternary: '#A8432F',
    usage: 'NASA 朋克：硬件面板、彩条、编号',
  },
  destijl_primary: {
    id: 'destijl_primary',
    name: '风格派原色',
    source: 'De Stijl · Mondrian / Rietveld',
    background: '#F4F1EA',
    text: '#1A1A1A',
    accent: '#D0302A',
    secondary: '#1D3F8C',
    muted: '#6B6B6B',
    tertiary: '#EBC226',
    quaternary: '#1A1A1A',
    usage: '风格派：粗黑线、红黄蓝矩形',
  },
  swiss_red: {
    id: 'swiss_red',
    name: '瑞士红',
    source: 'International Typographic Style',
    background: '#F7F5F0',
    text: '#111111',
    accent: '#DA291C',
    secondary: '#555555',
    muted: '#8A8A8A',
    tertiary: '#111111',
    quaternary: '#DA291C',
    usage: '瑞士风格：网格、无衬线、单红',
  },
  cassette_dark: {
    id: 'cassette_dark',
    name: '卡带黑绿',
    source: 'Cassette Futurism · CRT / tape deck',
    background: '#12140F',
    text: '#DCE8D2',
    accent: '#FFB23E',
    secondary: '#74FF9A',
    muted: '#7A8B6E',
    tertiary: '#FF6B3D',
    quaternary: '#74FF9A',
    usage: '卡带未来：黑底显像管、琥珀/荧光绿',
  },
}

export const COLOR_PRESET_IDS = Object.keys(COLOR_PRESETS)

const CJK_SERIF = '"Noto Serif SC", "Songti SC", "STSong", "SimSun", Georgia, serif'
const CJK_SANS = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif'

export const FONT_PAIRINGS = {
  serif_serif: {
    id: 'serif_serif',
    name: '衬线标题 + 衬线正文',
    headline: `"Playfair Display", ${CJK_SERIF}`,
    body: `"PT Serif", ${CJK_SERIF}`,
    note: '传统报头 + 长文阅读',
  },
  serif_sans: {
    id: 'serif_sans',
    name: '衬线标题 + 无衬线正文',
    headline: `"Playfair Display", ${CJK_SERIF}`,
    body: `"Source Sans 3", ${CJK_SANS}`,
    note: '精炼展示 + 现代阅读',
  },
  superfamily: {
    id: 'superfamily',
    name: '单一超级家族',
    headline: `"Source Serif 4", ${CJK_SERIF}`,
    body: `"Source Serif 4", ${CJK_SERIF}`,
    note: '仅靠字重 / 字号建层级，最克制',
  },
  grotesk: {
    id: 'grotesk',
    name: '无衬线超级家族',
    headline: `"Source Sans 3", ${CJK_SANS}`,
    body: `"Source Sans 3", ${CJK_SANS}`,
    note: '几何无衬线，适合构成主义 / 包豪斯 / 瑞士',
  },
  terminal_mono: {
    id: 'terminal_mono',
    name: '等宽终端',
    headline: `"IBM Plex Mono", "Courier New", ${CJK_SANS}`,
    body: `"IBM Plex Mono", "Courier New", ${CJK_SANS}`,
    note: '等宽字，适合 NASA 朋克 / 卡带未来',
  },
}

export const FONT_PAIRING_IDS = Object.keys(FONT_PAIRINGS)

export const FORMATS = {
  newspaper: {
    id: 'newspaper',
    label: '报纸',
    en: 'BROADSHEET',
    width: 794,
    height: 1123,
    size: 'A4 · 210 × 297 mm',
    hint: '适合打印留存、正式纪念',
  },
  poster: {
    id: 'poster',
    label: '海报',
    en: 'POSTER',
    width: 800,
    height: 1000,
    size: '4 : 5 · 800 × 1000',
    hint: '适合社交分享、展陈',
  },
}

export const FORMAT_IDS = Object.keys(FORMATS)

const newspaperClassic = [
  { id: 'masthead', type: 'masthead', x: 5, y: 3.0, w: 90 },
  { id: 'dateline', type: 'dateline', x: 5, y: 11.0, w: 90 },
  { id: 'headline', type: 'headline', x: 5, y: 14.4, w: 90 },
  { id: 'subhead', type: 'subhead', x: 5, y: 27.6, w: 90 },
  { id: 'byline', type: 'byline', x: 5, y: 33.2, w: 90 },
  { id: 'hero', type: 'image', x: 5, y: 36.3, w: 63, h: 23.2 },
  { id: 'caption', type: 'caption', x: 5, y: 60.1, w: 63 },
  { id: 'secondary', type: 'image', x: 70, y: 36.3, w: 25, h: 23.2, slot: 'secondary' },
  { id: 'secondaryCaption', type: 'caption', x: 70, y: 60.1, w: 25, slot: 'secondary' },
  { id: 'body', type: 'body', x: 5, y: 63.9, w: 90, h: 20.2 },
  { id: 'pullquote', type: 'pullquote', x: 5, y: 86.3, w: 90 },
  { id: 'footer', type: 'footer', x: 5, y: 95.7, w: 90 },
]

const newspaperTabloid = [
  { id: 'hero', type: 'image', x: 0, y: 0, w: 100, h: 40 },
  { id: 'scrim', type: 'scrim', x: 0, y: 20, w: 100, h: 20 },
  { id: 'masthead', type: 'masthead', x: 5, y: 3.2, w: 90, tone: 'invert' },
  { id: 'headline', type: 'headline', x: 5, y: 25.6, w: 90, tone: 'invert' },
  { id: 'caption', type: 'caption', x: 5, y: 37.0, w: 55, tone: 'invert' },
  { id: 'subhead', type: 'subhead', x: 5, y: 42.6, w: 90 },
  { id: 'byline', type: 'byline', x: 5, y: 48.1, w: 90 },
  { id: 'body', type: 'body', x: 5, y: 51.4, w: 90, h: 20.0 },
  { id: 'pullquote', type: 'pullquote', x: 0, y: 76.0, w: 100, h: 13.2 },
  { id: 'footer', type: 'footer', x: 5, y: 95.6, w: 90 },
]

const newspaperMinimal = [
  { id: 'masthead', type: 'masthead', x: 5, y: 4.0, w: 90, align: 'center' },
  { id: 'dateline', type: 'dateline', x: 5, y: 10.6, w: 90, align: 'center' },
  { id: 'headline', type: 'headline', x: 8, y: 14.2, w: 84, align: 'center' },
  { id: 'subhead', type: 'subhead', x: 12, y: 21.2, w: 76, align: 'center' },
  { id: 'hero', type: 'image', x: 22, y: 26.2, w: 56, h: 29.4 },
  { id: 'caption', type: 'caption', x: 22, y: 56.4, w: 56, align: 'center' },
  { id: 'body', type: 'body', x: 10, y: 60.8, w: 80, h: 20.8 },
  { id: 'pullquote', type: 'pullquote', x: 10, y: 83.4, w: 80, align: 'center' },
  { id: 'footer', type: 'footer', x: 5, y: 95.8, w: 90, align: 'center' },
]

const posterClassic = [
  { id: 'masthead', type: 'masthead', x: 8, y: 5.4, w: 84 },
  { id: 'headline', type: 'headline', x: 8, y: 11.4, w: 84 },
  { id: 'subhead', type: 'subhead', x: 8, y: 28.0, w: 78 },
  { id: 'hero', type: 'image', x: 8, y: 35.0, w: 84, h: 39.6 },
  { id: 'caption', type: 'caption', x: 8, y: 75.8, w: 84 },
  { id: 'footer', type: 'footer', x: 8, y: 87.5, w: 84 },
]

const posterTabloid = [
  { id: 'hero', type: 'image', x: 0, y: 0, w: 100, h: 100 },
  { id: 'scrim', type: 'scrim', x: 0, y: 0, w: 100, h: 100 },
  { id: 'masthead', type: 'masthead', x: 7, y: 5.0, w: 86, tone: 'invert' },
  { id: 'headline', type: 'headline', x: 7, y: 10.5, w: 86, tone: 'invert' },
  { id: 'subhead', type: 'subhead', x: 7, y: 86.0, w: 80, tone: 'invert' },
  { id: 'caption', type: 'caption', x: 7, y: 95.2, w: 86, tone: 'invert' },
]

const posterMinimal = [
  { id: 'masthead', type: 'masthead', x: 8, y: 6.0, w: 84, align: 'center' },
  { id: 'hero', type: 'image', x: 18, y: 15.0, w: 64, h: 44.0 },
  { id: 'headline', type: 'headline', x: 10, y: 63.0, w: 80, align: 'center' },
  { id: 'subhead', type: 'subhead', x: 15, y: 77.0, w: 70, align: 'center' },
  { id: 'caption', type: 'caption', x: 15, y: 85.4, w: 70, align: 'center' },
  { id: 'footer', type: 'footer', x: 8, y: 93.0, w: 84, align: 'center' },
]

/* ---------- 六种经典设计风格（构成主义 / 包豪斯 / NASA 朋克 / 风格派 / 瑞士 / 卡带未来） ---------- */

const newspaperConstructivism = [
  { id: 'masthead', type: 'masthead', x: 5, y: 3.0, w: 90 },
  { id: 'dateline', type: 'dateline', x: 5, y: 8.8, w: 45 },
  { id: 'headline', type: 'headline', x: 4, y: 14.0, w: 52 },
  { id: 'subhead', type: 'subhead', x: 4, y: 36.0, w: 48 },
  { id: 'byline', type: 'byline', x: 4, y: 41.5, w: 48 },
  { id: 'hero', type: 'image', x: 58, y: 11.0, w: 38, h: 42.0 },
  { id: 'caption', type: 'caption', x: 58, y: 54.4, w: 38 },
  { id: 'body', type: 'body', x: 4, y: 47.5, w: 48, h: 17.0 },
  { id: 'pullquote', type: 'pullquote', x: 4, y: 75.0, w: 92 },
  { id: 'footer', type: 'footer', x: 4, y: 93.8, w: 92 },
]

const posterConstructivism = [
  { id: 'masthead', type: 'masthead', x: 6, y: 4.0, w: 88 },
  { id: 'headline', type: 'headline', x: 4, y: 13.0, w: 54 },
  { id: 'subhead', type: 'subhead', x: 4, y: 44.0, w: 50 },
  { id: 'hero', type: 'image', x: 55, y: 28.0, w: 41, h: 50.0 },
  { id: 'caption', type: 'caption', x: 55, y: 80.0, w: 41 },
  { id: 'footer', type: 'footer', x: 4, y: 92.8, w: 92 },
]

const newspaperBauhaus = [
  { id: 'masthead', type: 'masthead', x: 5, y: 3.0, w: 90 },
  { id: 'dateline', type: 'dateline', x: 5, y: 8.5, w: 40 },
  { id: 'headline', type: 'headline', x: 5, y: 11.5, w: 52 },
  { id: 'subhead', type: 'subhead', x: 5, y: 28.0, w: 46 },
  { id: 'byline', type: 'byline', x: 5, y: 33.5, w: 46 },
  { id: 'hero', type: 'image', x: 55, y: 9.0, w: 40, h: 36.0 },
  { id: 'caption', type: 'caption', x: 55, y: 46.5, w: 40 },
  { id: 'body', type: 'body', x: 5, y: 39.0, w: 48, h: 20.0 },
  { id: 'pullquote', type: 'pullquote', x: 55, y: 53.0, w: 40 },
  { id: 'footer', type: 'footer', x: 5, y: 93.8, w: 90 },
]

const posterBauhaus = [
  { id: 'masthead', type: 'masthead', x: 6, y: 4.0, w: 88 },
  { id: 'headline', type: 'headline', x: 5, y: 13.0, w: 60 },
  { id: 'hero', type: 'image', x: 58, y: 10.0, w: 37, h: 38.0 },
  { id: 'subhead', type: 'subhead', x: 5, y: 40.0, w: 50 },
  { id: 'caption', type: 'caption', x: 58, y: 50.0, w: 37 },
  { id: 'footer', type: 'footer', x: 5, y: 92.8, w: 90 },
]

const newspaperNasa = [
  { id: 'masthead', type: 'masthead', x: 5, y: 3.0, w: 90 },
  { id: 'dateline', type: 'dateline', x: 5, y: 8.8, w: 44 },
  { id: 'headline', type: 'headline', x: 5, y: 12.0, w: 55 },
  { id: 'subhead', type: 'subhead', x: 64, y: 12.0, w: 31 },
  { id: 'byline', type: 'byline', x: 64, y: 26.0, w: 31 },
  { id: 'hero', type: 'image', x: 5, y: 33.0, w: 55, h: 31.0 },
  { id: 'caption', type: 'caption', x: 5, y: 65.0, w: 55 },
  { id: 'pullquote', type: 'pullquote', x: 64, y: 33.0, w: 31 },
  { id: 'body', type: 'body', x: 5, y: 70.0, w: 90, h: 17.0 },
  { id: 'footer', type: 'footer', x: 5, y: 93.8, w: 90 },
]

const posterNasa = [
  { id: 'masthead', type: 'masthead', x: 6, y: 4.0, w: 88 },
  { id: 'dateline', type: 'dateline', x: 6, y: 9.0, w: 50 },
  { id: 'headline', type: 'headline', x: 6, y: 12.0, w: 58 },
  { id: 'subhead', type: 'subhead', x: 67, y: 12.0, w: 27 },
  { id: 'hero', type: 'image', x: 6, y: 37.0, w: 88, h: 41.0 },
  { id: 'caption', type: 'caption', x: 6, y: 79.0, w: 58 },
  { id: 'footer', type: 'footer', x: 6, y: 92.8, w: 88 },
]

const newspaperDestijl = [
  { id: 'masthead', type: 'masthead', x: 5, y: 3.0, w: 37 },
  { id: 'dateline', type: 'dateline', x: 57, y: 3.0, w: 38, align: 'right' },
  { id: 'headline', type: 'headline', x: 5, y: 9.0, w: 52 },
  { id: 'hero', type: 'image', x: 58, y: 8.0, w: 37, h: 30.0 },
  { id: 'caption', type: 'caption', x: 58, y: 38.5, w: 37 },
  { id: 'subhead', type: 'subhead', x: 58, y: 44.0, w: 37 },
  { id: 'byline', type: 'byline', x: 5, y: 23.0, w: 52 },
  { id: 'body', type: 'body', x: 5, y: 28.0, w: 50, h: 21.0 },
  { id: 'pullquote', type: 'pullquote', x: 5, y: 59.0, w: 90 },
  { id: 'footer', type: 'footer', x: 5, y: 93.8, w: 90 },
]

const posterDestijl = [
  { id: 'masthead', type: 'masthead', x: 5, y: 4.0, w: 35 },
  { id: 'dateline', type: 'dateline', x: 57, y: 4.0, w: 38, align: 'right' },
  { id: 'headline', type: 'headline', x: 5, y: 10.0, w: 52 },
  { id: 'hero', type: 'image', x: 58, y: 9.0, w: 37, h: 35.0 },
  { id: 'subhead', type: 'subhead', x: 5, y: 42.0, w: 50 },
  { id: 'caption', type: 'caption', x: 58, y: 46.0, w: 37 },
  { id: 'footer', type: 'footer', x: 5, y: 92.8, w: 90 },
]

const newspaperSwiss = [
  { id: 'masthead', type: 'masthead', x: 5, y: 3.0, w: 90 },
  { id: 'dateline', type: 'dateline', x: 5, y: 8.8, w: 30 },
  { id: 'headline', type: 'headline', x: 5, y: 12.0, w: 60 },
  { id: 'hero', type: 'image', x: 65, y: 12.0, w: 30, h: 31.0 },
  { id: 'subhead', type: 'subhead', x: 5, y: 30.0, w: 60 },
  { id: 'byline', type: 'byline', x: 5, y: 35.5, w: 60 },
  { id: 'body', type: 'body', x: 5, y: 39.0, w: 60, h: 23.0 },
  { id: 'caption', type: 'caption', x: 65, y: 44.0, w: 30 },
  { id: 'pullquote', type: 'pullquote', x: 65, y: 51.0, w: 30 },
  { id: 'footer', type: 'footer', x: 5, y: 93.8, w: 90 },
]

const posterSwiss = [
  { id: 'masthead', type: 'masthead', x: 7, y: 5.0, w: 86 },
  { id: 'headline', type: 'headline', x: 7, y: 13.0, w: 58 },
  { id: 'hero', type: 'image', x: 66, y: 11.0, w: 27, h: 42.0 },
  { id: 'subhead', type: 'subhead', x: 7, y: 42.0, w: 52 },
  { id: 'caption', type: 'caption', x: 66, y: 55.0, w: 27 },
  { id: 'footer', type: 'footer', x: 7, y: 92.8, w: 86 },
]

const newspaperCassette = [
  { id: 'masthead', type: 'masthead', x: 5, y: 3.0, w: 90 },
  { id: 'dateline', type: 'dateline', x: 5, y: 8.8, w: 50 },
  { id: 'headline', type: 'headline', x: 5, y: 12.0, w: 60 },
  { id: 'subhead', type: 'subhead', x: 5, y: 25.0, w: 60 },
  { id: 'hero', type: 'image', x: 5, y: 30.0, w: 60, h: 40.0 },
  { id: 'caption', type: 'caption', x: 5, y: 71.0, w: 60 },
  { id: 'byline', type: 'byline', x: 67, y: 13.0, w: 28 },
  { id: 'pullquote', type: 'pullquote', x: 67, y: 30.0, w: 28 },
  { id: 'body', type: 'body', x: 5, y: 76.0, w: 90, h: 13.0 },
  { id: 'footer', type: 'footer', x: 5, y: 93.8, w: 90 },
]

const posterCassette = [
  { id: 'masthead', type: 'masthead', x: 5, y: 4.0, w: 90 },
  { id: 'hero', type: 'image', x: 6, y: 13.0, w: 88, h: 43.0 },
  { id: 'headline', type: 'headline', x: 6, y: 59.0, w: 88 },
  { id: 'subhead', type: 'subhead', x: 6, y: 79.0, w: 80 },
  { id: 'caption', type: 'caption', x: 6, y: 91.0, w: 58 },
  { id: 'footer', type: 'footer', x: 6, y: 92.8, w: 88 },
]

export const VARIANTS = {
  classic_broadsheet: {
    id: 'classic_broadsheet',
    name: '经典大报',
    en: 'THE BROADSHEET',
    tagline: '双线报头 · 全幅主图 · 三栏正文',
    defaultPreset: 'classic_serious',
    defaultFont: 'serif_serif',
    defaultColumns: 3,
    defaultHeadlineScale: 'large',
    defaultTreatment: 'original',
    layouts: { newspaper: newspaperClassic, poster: posterClassic },
  },
  tabloid_bold: {
    id: 'tabloid_bold',
    name: '小报冲击',
    en: 'THE TABLOID',
    tagline: '满版大图 · 压图标题 · 强调色横幅',
    defaultPreset: 'financial_daily',
    defaultFont: 'serif_sans',
    defaultColumns: 2,
    defaultHeadlineScale: 'large',
    defaultTreatment: 'duotone',
    layouts: { newspaper: newspaperTabloid, poster: posterTabloid },
  },
  minimal_masthead: {
    id: 'minimal_masthead',
    name: '极简报头',
    en: 'THE MINIMAL',
    tagline: '居中窄图 · 细线分区 · 大留白',
    defaultPreset: 'newsprint_single_accent',
    defaultFont: 'superfamily',
    defaultColumns: 2,
    defaultHeadlineScale: 'medium',
    defaultTreatment: 'halftone_mono',
    layouts: { newspaper: newspaperMinimal, poster: posterMinimal },
  },
  constructivism: {
    id: 'constructivism',
    name: '构成主义',
    en: 'CONSTRUCTIVISM',
    tagline: '斜切红黑 · 巨字压边 · 几何冲突',
    defaultPreset: 'constructivism_red',
    defaultFont: 'grotesk',
    defaultColumns: 1,
    defaultHeadlineScale: 'large',
    defaultTreatment: 'duotone',
    layouts: { newspaper: newspaperConstructivism, poster: posterConstructivism },
  },
  bauhaus: {
    id: 'bauhaus',
    name: '包豪斯',
    en: 'BAUHAUS',
    tagline: '红黄蓝积木 · 圆形主图 · 秩序不对称',
    defaultPreset: 'bauhaus_primary',
    defaultFont: 'grotesk',
    defaultColumns: 2,
    defaultHeadlineScale: 'large',
    defaultTreatment: 'original',
    layouts: { newspaper: newspaperBauhaus, poster: posterBauhaus },
  },
  nasa_punk: {
    id: 'nasa_punk',
    name: 'NASA 朋克',
    en: 'NASA-PUNK',
    tagline: '硬件面板 · 功能标签 · 复古彩条',
    defaultPreset: 'nasa_cream',
    defaultFont: 'grotesk',
    defaultColumns: 3,
    defaultHeadlineScale: 'medium',
    defaultTreatment: 'original',
    layouts: { newspaper: newspaperNasa, poster: posterNasa },
  },
  de_stijl: {
    id: 'de_stijl',
    name: '风格派',
    en: 'DE STIJL',
    tagline: '粗黑线分格 · 三原色矩形 · 平涂',
    defaultPreset: 'destijl_primary',
    defaultFont: 'grotesk',
    defaultColumns: 2,
    defaultHeadlineScale: 'large',
    defaultTreatment: 'original',
    layouts: { newspaper: newspaperDestijl, poster: posterDestijl },
  },
  swiss_style: {
    id: 'swiss_style',
    name: '瑞士风格',
    en: 'SWISS STYLE',
    tagline: '模块网格 · 中性无衬线 · 一个强调红',
    defaultPreset: 'swiss_red',
    defaultFont: 'grotesk',
    defaultColumns: 3,
    defaultHeadlineScale: 'large',
    defaultTreatment: 'halftone_mono',
    layouts: { newspaper: newspaperSwiss, poster: posterSwiss },
  },
  cassette_futurism: {
    id: 'cassette_futurism',
    name: '卡带未来',
    en: 'CASSETTE FUTURISM',
    tagline: '黑底显像管 · 荧光绿 / 琥珀 · 扫描线',
    defaultPreset: 'cassette_dark',
    defaultFont: 'terminal_mono',
    defaultColumns: 3,
    defaultHeadlineScale: 'large',
    defaultTreatment: 'duotone',
    layouts: { newspaper: newspaperCassette, poster: posterCassette },
  },
}

export const VARIANT_IDS = Object.keys(VARIANTS)

export const HEADLINE_PX = {
  newspaper: {
    classic_broadsheet: 56,
    tabloid_bold: 59,
    minimal_masthead: 42,
    constructivism: 64,
    bauhaus: 58,
    nasa_punk: 54,
    de_stijl: 60,
    swiss_style: 64,
    cassette_futurism: 54,
  },
  poster: {
    classic_broadsheet: 62,
    tabloid_bold: 64,
    minimal_masthead: 48,
    constructivism: 68,
    bauhaus: 64,
    nasa_punk: 60,
    de_stijl: 64,
    swiss_style: 70,
    cassette_futurism: 60,
  },
}

export const HEADLINE_SCALES = {
  medium: { label: '中', factor: 0.86 },
  large: { label: '大', factor: 1 },
  xlarge: { label: '特大', factor: 1.14 },
}

export function buildLayout(variantId, format) {
  const variant = VARIANTS[variantId] || VARIANTS.classic_broadsheet
  return (variant.layouts[format] || variant.layouts.newspaper).map((b) => ({ ...b }))
}

export function headlinePx(variantId, format, scale) {
  const base = HEADLINE_PX[format]?.[variantId] ?? HEADLINE_PX.newspaper.classic_broadsheet
  const factor = HEADLINE_SCALES[scale]?.factor ?? 1
  return Math.round(base * factor)
}

/* ---------- 颜色工具 ---------- */

export function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0')
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

export function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function channel(v) {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a, b) {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

export function isLight(hex) {
  return luminance(hex) > 0.42
}

export function hexHue(hex) {
  let { r, g, b } = hexToRgb(hex)
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (d === 0) return 0
  let h
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return (h * 60 + 360) % 360
}

export function resolveStyle(scheme) {
  const variant = VARIANTS[scheme.layout_variant] || VARIANTS.classic_broadsheet
  const preset = COLOR_PRESETS[scheme.color_preset] || COLOR_PRESETS[variant.defaultPreset]
  const font = FONT_PAIRINGS[scheme.font_pairing] || FONT_PAIRINGS[variant.defaultFont]
  const style = scheme.style || {}
  return {
    variant,
    preset,
    font,
    palette: {
      background: preset.background,
      text: preset.text,
      accent: style.accent_color || preset.accent,
      secondary: preset.secondary,
      muted: preset.muted,
      tertiary: preset.tertiary || preset.secondary,
      quaternary: preset.quaternary || preset.text,
    },
    columns: Number(style.columns) || variant.defaultColumns,
    headlineScale: style.headline_scale || variant.defaultHeadlineScale,
    imageTreatment: style.image_treatment || variant.defaultTreatment,
  }
}
