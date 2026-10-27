/** 图标手改覆盖：鱼 / 星星 / 彩虹修正 + 现有自定义符号 + 常用补充。 */
import { SYMBOLS } from './symbols.js'

const FISH = `
  <path d="M5.8 12C5.8 8.4 9.4 5.6 14 5.6C18.2 5.6 21 8.4 21 12C21 15.6 18.2 18.4 14 18.4C9.4 18.4 5.8 15.6 5.8 12Z"/>
  <path d="M5.8 12L2.2 8.4L3.8 12L2.2 15.6Z"/>
  <path d="M16.6 10.2h.01"/>
  <path d="M11.7 9.4c1.4 1.7 1.4 3.5 0 5.2"/>
  <path d="M10.8 6.2c.2 1 .8 1.8 1.7 2.2"/>
  <path d="M10.8 17.8c.2-1 .8-1.8 1.7-2.2"/>
`

const STAR = `
  <path d="M12 3L14.23 8.93L20.56 9.22L15.61 13.17L17.29 19.28L12 15.8L6.71 19.28L8.39 13.17L3.44 9.22L9.77 8.93Z"/>
`

const RAINBOW = `
  <path d="M2.2 20.5A9.8 9.8 0 0 1 21.8 20.5"/>
  <path d="M5.8 20.5A6.2 6.2 0 0 1 18.2 20.5"/>
  <path d="M8.4 20.5A3.6 3.6 0 0 1 15.6 20.5"/>
  <path d="M2.2 20.5V22.4"/>
  <path d="M21.8 20.5V22.4"/>
`

export const ICON_OVERRIDES = {
  fish: {
    body: FISH.trim(),
    keywords: ['鱼', 'fish', '海', '水', '海洋'],
  },
  star: {
    body: STAR.trim(),
    keywords: ['星星', 'star', '星', '夜', '愿望'],
  },
  rainbow: {
    body: RAINBOW.trim(),
    keywords: ['彩虹', 'rainbow', '天气', '希望'],
  },
}

function scaledSymbol(id, sourceId, keywords, group = '自定义') {
  const symbol = SYMBOLS[sourceId]
  if (!symbol) return null
  const body = symbol.svg
    .replace(/\s+stroke-width="[^"]*"/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return {
    id,
    label: symbol.label,
    group,
    keywords: [id, symbol.label, ...keywords],
    viewBox: '0 0 200 200',
    strokeWidth: 1.75,
    body,
  }
}

export const CUSTOM_ICONS = [
  scaledSymbol('glow-stick', 'glow-stick', ['偶像', '应援', '演唱会', 'idol']),
  scaledSymbol('sakura', 'sakura', ['日本', '樱花', 'spring', 'japan']),
  scaledSymbol('whale-tail', 'whale-tail', ['deepseek', '鲸鱼', '鲸尾', 'whale']),
  scaledSymbol('chip', 'chip', ['ai', '人工智能', '芯片', '算法', '模型']),
  scaledSymbol('skyline', 'skyline', ['城市', '建筑', 'city', 'urban']),
  scaledSymbol('water-wave', 'wave', ['水', '海浪', '声波', 'wave', 'sound']),
  scaledSymbol('mountain', 'mountain', ['山', '自然', 'mountain', 'nature']),
  scaledSymbol('orbit', 'orbit', ['宇宙', '轨道', 'space', 'orbit']),
  scaledSymbol('paper-plane', 'plane', ['旅行', '纸飞机', 'travel', 'paper plane']),
].filter(Boolean)

export const EXTRA_ICONS = [
  {
    id: 'newspaper',
    label: '报纸',
    group: '补充',
    keywords: ['报纸', 'newspaper', '新闻', '头版'],
    viewBox: '0 0 24 24',
    strokeWidth: 1.75,
    body: `
      <path d="M4 4h13a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4Z"/>
      <path d="M7 8h8M7 12h8M7 16h5"/>
      <path d="M19 8h1v10a2 2 0 0 1-2 2"/>
    `,
  },
  {
    id: 'pen-nib',
    label: '钢笔尖',
    group: '补充',
    keywords: ['书写', '钢笔', 'pen', 'write', '编辑'],
    viewBox: '0 0 24 24',
    strokeWidth: 1.75,
    body: `
      <path d="M12 3 5 10l-1 5 5-1 7-7-4-4Z"/>
      <path d="M10 13 5 18"/>
      <circle cx="13.2" cy="8.2" r="1"/>
    `,
  },
  {
    id: 'map-pin',
    label: '地点',
    group: '补充',
    keywords: ['地点', '位置', 'map', 'location', '城市'],
    viewBox: '0 0 24 24',
    strokeWidth: 1.75,
    body: `
      <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/>
      <circle cx="12" cy="9" r="2.5"/>
    `,
  },
  {
    id: 'ticket',
    label: '票根',
    group: '补充',
    keywords: ['票', '活动', 'ticket', 'event', '电影'],
    viewBox: '0 0 24 24',
    strokeWidth: 1.75,
    body: `
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/>
      <path d="M14 6v12"/>
    `,
  },
  {
    id: 'film',
    label: '胶片',
    group: '补充',
    keywords: ['电影', '胶片', 'film', 'cinema', '影像'],
    viewBox: '0 0 24 24',
    strokeWidth: 1.75,
    body: `
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>
    `,
  },
  {
    id: 'robot',
    label: '机器人',
    group: '补充',
    keywords: ['机器人', 'ai', 'robot', '科技', '模型'],
    viewBox: '0 0 24 24',
    strokeWidth: 1.75,
    body: `
      <rect x="4" y="8" width="16" height="11" rx="3"/>
      <path d="M12 8V5"/>
      <circle cx="12" cy="3.5" r="1.5"/>
      <circle cx="9" cy="13" r="1.2"/>
      <circle cx="15" cy="13" r="1.2"/>
      <path d="M8 16h2M14 16h2M2 12v3M22 12v3"/>
    `,
  },
]
