/** 自由模式图案提示词：只生成简单线性 SVG，颜色用 palette token。 */
import { SYMBOLS } from '../config/symbols.js'
import { VARIANTS } from '../config/presets.js'

const SYMBOL_LIST = Object.entries(SYMBOLS)
  .map(([id, symbol]) => `- ${id}｜${symbol.label}｜${symbol.keywords.slice(0, 4).join(' / ')}`)
  .join('\n')

const STYLE_LINES = {
  classic_broadsheet: '细线、双线、表格感、克制的编辑线条',
  tabloid_bold: '粗斜线、放射线、强对比、新闻冲击',
  minimal_masthead: '单线、大留白、少量圆形与细线',
  constructivism: '斜切、红黑对角线、几何块面',
  bauhaus: '圆、半圆、弧线、三原色几何',
  nasa_punk: '十字准星、坐标线、技术标注线',
  de_stijl: '粗黑网格、矩形分区、直线',
  swiss_style: '网格、箭头、极简模块线',
  cassette_futurism: '波形、像素线、扫描线',
}

const V = Object.values(VARIANTS)
const TEMPLATE_LIST = V.map(
  (variant) => `- ${variant.id}｜${variant.name}｜${STYLE_LINES[variant.id] || variant.tagline}`,
).join('\n')

export function buildArtSystemPrompt() {
  return `# 角色

你是「头版智造局」的线条图案设计师。为报纸/海报方案生成简单、可印刷、无填充的 SVG 线条图案。

# 输出

只输出一个 JSON 对象：

{
  "artworks": [
    {
      "id": "A",
      "concept": "鲸尾穿过樱花枝",
      "symbols": ["whale-tail", "sakura"],
      "alt": "鲸尾与樱花的线条图案",
      "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 600 450\\" fill=\\"none\\">...</svg>"
    }
  ]
}

# 硬规则

1. 必须为输入的 A / B / C 三套方案各生成一个 SVG；不要多、不要少。
2. 只用线条：fill="none" 为默认；允许极少量点、圆、短实线作为强调，但不要大面积填色。
3. 不要输出文字、字母、数字、logo、二维码；标题和图注由前端排版。
4. 不要输出 script、foreignObject、image、use、style、滤镜、渐变、动画、外链、base64、data URI。
5. 只用这些元素：svg / g / path / line / circle / ellipse / polyline / polygon / rect。
6. 每个 SVG 必须带 xmlns 和 viewBox="0 0 600 450"；控制在 6KB 以内。
7. 颜色只能用占位 token，不要写 hex：
   - stroke="{{ink}}"：结构线
   - stroke="{{accent}}"：主强调线
   - stroke="{{muted}}"：辅助线
   - fill="none" 为默认
8. 线条要适合报纸/海报印刷：主线条 2–5px，辅助线 1–2px，端点尽量 round，转折干净。
9. 三套图案必须在构图、象征物或线条节奏上不同；不要只换颜色。

# 抽象概念 → 象征图案

优先使用下面的符号库，用 symbol id 标记；也可以在此基础上自己组合线条，但不要画写实插画。

${SYMBOL_LIST}

- 偶像 → glow-stick
- 日本 → sakura
- DeepSeek → whale-tail
- AI / 模型 → chip
- 咖啡 → coffee
- 城市 → skyline
- 旅行 → plane
- 时间 → clock
- 音乐 / 声音 → wave
- 阅读 → book
- 宇宙 → orbit
- 摄影 → camera
- 自然 → mountain
- 夜晚 → moon

如果概念不在表里，用 1–2 个几何象征（圆、弧、轨道、波、网格）表达，不要硬画具体物。

# 九种模板的线条语言

${TEMPLATE_LIST}

- 颜色由前端按当前方案配色注入，你只写 token；
- 不要为了展示设计感堆满装饰，留白和一条主线的方向比细节数量重要。

# 自检

- 是 3 个 artworks，id 分别为 A/B/C？
- 每个都有 viewBox、xmlns、无填充、无文字、无外链？
- 抽象词是否用了象征图案，而不是写实插画？
- 三个图案是否真的不同？
- 是否只输出合法 JSON？

只输出 JSON。`
}

export function buildArtUserPrompt({ schemes = [], formatLabel = '报纸' } = {}) {
  const briefs = schemes.map((scheme) => ({
    id: scheme.id,
    template: scheme.layout_variant,
    template_name: V.find((variant) => variant.id === scheme.layout_variant)?.name,
    format: formatLabel,
    headline: scheme.content?.headline,
    subhead: scheme.content?.subhead,
    body_excerpt: (scheme.content?.body_blocks || [])
      .map((block) => block.text)
      .join('')
      .slice(0, 90),
    poster_note: scheme.content?.poster_note,
    design_rationale: scheme.design_rationale,
  }))

  return `【图案任务】请为下面三套方案各生成一张简单线条 SVG。

${JSON.stringify(briefs, null, 2)}

要求：
- A/B/C 各一张；
- 只画线条和少量点/圆弧，不填色、不写文字；
- 抽象名词用象征图案：偶像→荧光棒，日本→樱花，DeepSeek→鲸尾；
- 颜色只用 {{ink}} / {{accent}} / {{muted}} token；
- viewBox="0 0 600 450"；
- 只输出 {"artworks":[...]}。`
}
