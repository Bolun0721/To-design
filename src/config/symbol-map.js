/** 抽象概念 → 图标象征表。模型和前端兜底共用。 */
import { getIcon } from './icon-library.js'

export const CONCEPTS = [
  { name: '偶像', keywords: ['偶像', '应援', '演唱会', 'idol'], primary: 'glow-stick', secondary: 'sparkles' },
  { name: '日本', keywords: ['日本', '樱花', '东京', 'japan', 'sakura'], primary: 'sakura', secondary: 'sun' },
  { name: 'DeepSeek', keywords: ['deepseek', '鲸鱼', '鲸尾', 'whale', '深海'], primary: 'whale-tail', secondary: 'water-wave' },
  { name: 'AI', keywords: ['ai', '人工智能', '模型', '算法', '智能'], primary: 'chip', secondary: 'robot' },
  { name: '咖啡', keywords: ['咖啡', 'coffee', '手冲', '杯'], primary: 'coffee', secondary: 'book' },
  { name: '城市', keywords: ['城市', '建筑', '都市', 'city', 'urban'], primary: 'skyline', secondary: 'map-pin' },
  { name: '旅行', keywords: ['旅行', '出发', '旅行', 'travel', 'trip'], primary: 'plane', secondary: 'globe' },
  { name: '音乐', keywords: ['音乐', '声音', 'music', 'sound', '播客'], primary: 'music', secondary: 'headphones' },
  { name: '阅读', keywords: ['阅读', '书', 'read', 'book', '故事'], primary: 'book', secondary: 'coffee' },
  { name: '时间', keywords: ['时间', '下午', '早上', 'time', 'clock'], primary: 'clock', secondary: 'calendar' },
  { name: '夜晚', keywords: ['夜晚', '月亮', 'night', 'moon'], primary: 'moon', secondary: 'star' },
  { name: '庆祝', keywords: ['庆祝', '胜利', '奖杯', 'celebration', 'trophy'], primary: 'trophy', secondary: 'sparkles' },
  { name: '爱', keywords: ['爱', '喜欢', 'heart', 'love'], primary: 'heart', secondary: 'sparkles' },
  { name: '天气', keywords: ['天气', '晴', '雨', 'weather', 'rain'], primary: 'sun', secondary: 'cloud' },
  { name: '彩虹', keywords: ['彩虹', '希望', 'rainbow'], primary: 'rainbow', secondary: 'sun' },
  { name: '摄影', keywords: ['摄影', '照片', 'camera', 'photo'], primary: 'camera', secondary: 'film' },
  { name: '科技', keywords: ['科技', '电脑', '互联网', 'tech', 'laptop'], primary: 'laptop', secondary: 'gear' },
  { name: '自然', keywords: ['自然', '山', '户外', 'nature', 'mountain'], primary: 'mountain', secondary: 'cloud' },
  { name: '宇宙', keywords: ['宇宙', '太空', 'space', 'orbit'], primary: 'orbit', secondary: 'rocket' },
  { name: '写作', keywords: ['写作', '编辑', '书写', 'write', 'pen'], primary: 'pen-nib', secondary: 'newspaper' },
].map((item) => ({
  ...item,
  primary: getIcon(item.primary) ? item.primary : 'orbit',
  secondary: getIcon(item.secondary) ? item.secondary : 'star',
}))

/** 从文本中挑 1–3 个最相关的图标；未知文本给一个中性的轨道/星图。 */
export function pickConceptIcons(text = '', limit = 3) {
  const lower = String(text).toLowerCase()
  const hits = []
  for (const concept of CONCEPTS) {
    const index = concept.keywords
      .map((word) => lower.indexOf(String(word).toLowerCase()))
      .filter((value) => value >= 0)
      .sort((a, b) => a - b)[0]
    if (index != null) {
      hits.push({ ...concept, index })
    }
  }
  hits.sort((a, b) => a.index - b.index)
  const ids = []
  for (const hit of hits) {
    if (!ids.includes(hit.primary)) ids.push(hit.primary)
    if (hit.secondary && ids.length < limit && !ids.includes(hit.secondary)) ids.push(hit.secondary)
    if (ids.length >= limit) break
  }
  return ids.length ? ids.slice(0, limit) : ['orbit', 'star']
}

export const CONCEPT_TABLE_TEXT = CONCEPTS.map(
  (concept) => `- ${concept.name} → ${concept.primary}${concept.secondary ? ` + ${concept.secondary}` : ''}`,
).join('\n')
