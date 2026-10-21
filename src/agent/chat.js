/**
 * 对话微调：把一句自然语言指令翻译成「最小改动」的 JSON patch。
 * 模型只被允许改白名单里的字段；坐标只允许小幅位移，版式骨架不动。
 */
import {
  COLOR_PRESETS,
  COLOR_PRESET_IDS,
  FONT_PAIRINGS,
  FONT_PAIRING_IDS,
  HEADLINE_SCALES,
} from '../config/presets.js'
import { clampText, clamp, round, charLen } from '../lib/format.js'
import { cleanText } from './validate.js'

const TREATMENTS = ['original', 'halftone_mono', 'duotone']
const TEXT_LIMITS = { headline: 15, subhead: 25, caption: 30, caption_secondary: 30, pullquote: 24 }
const MOVE_LIMITS = { dx: 12, dy: 12, dw: 15 }

export const CHAT_SUGGESTIONS = [
  '标题再大一点',
  '换成财经日报配色',
  '正文改成两栏',
  '标题往下挪一点',
  '副标题写得更克制',
]

export function buildChatSystemPrompt() {
  return `# 角色

你是「头版智造局」的版式编辑助手。用户会用一句自然语言要求微调**当前这一版**报纸或海报。
你的职责是执行「最小改动」：只改用户明确指出的部分，其余内容、版式、坐标保持原样。

# 可以改的字段（只能从这些字段里选）

- color_preset：整组换色，只能选 ${COLOR_PRESET_IDS.join(' / ')}
- font_pairing：只能选 ${FONT_PAIRING_IDS.join(' / ')}
- style.columns：1 / 2 / 3
- style.headline_scale：${Object.keys(HEADLINE_SCALES).join(' / ')}
- style.image_treatment：${TREATMENTS.join(' / ')}
- content.headline ≤15 字；content.subhead ≤25 字；content.caption ≤30 字；content.caption_secondary ≤30 字；content.pullquote ≤24 字
- content.body_blocks：2–4 段，合计 120–220 字；只有用户要求重写正文时才提供
- layout_moves：对当前格式的版块做小幅微调，dx / dy 为百分比点（-${MOVE_LIMITS.dx}..${MOVE_LIMITS.dx}），dw 为宽度的百分比点（-${MOVE_LIMITS.dw}..${MOVE_LIMITS.dw}）

# 硬规则

1. 不得修改 layout_variant（版式骨架）、不得改图片、不得新增版块、不得改日期。
2. 不得编造新闻、人物、数据、链接、图片 URL、HTML、Markdown。
3. 用户说「再大一点 / 再小一点」时，按当前档位只移动一档（medium → large → xlarge），不要跳档。
4. 用户要求不存在的能力（例如换成橙色、加二维码、换照片）时，patch 留空对象，reply 说明原因并给一个白名单内的替代建议。
5. 只输出一个 JSON 对象，不要 Markdown 围栏、注释或额外说明。
6. 尽量只改 1–3 个字段。reply 用中文，≤40 字，说清楚改了什么。
7. 保持编辑设计纪律：一个强调色、层级清楚、不堆装饰；不要引入渐变、圆角卡片、emoji。

# 输出结构

{
  "reply": "一句话说明改了什么",
  "patch": {
    "color_preset": "financial_daily",
    "font_pairing": "serif_sans",
    "style": { "columns": 2, "headline_scale": "xlarge", "image_treatment": "duotone" },
    "content": {
      "headline": "新的标题",
      "subhead": "新的副标题",
      "caption": "新的图注",
      "pullquote": "新的引语",
      "body_blocks": ["第一段", "第二段"]
    },
    "layout_moves": [
      { "block_id": "headline", "dx": 0, "dy": 2 }
    ]
  }
}

只填需要改的字段，其余省略。没有可改的内容就输出 { "reply": "…", "patch": {} }。`
}

export function buildChatUserPrompt({ scheme, format, instruction, history = [] }) {
  const brief = {
    name: scheme.name,
    layout_variant: scheme.layout_variant,
    color_preset: scheme.color_preset,
    font_pairing: scheme.font_pairing,
    style: scheme.style,
    content: scheme.content,
  }
  const blocks = (scheme.layouts?.[format] || []).map((b) => ({
    block_id: b.id,
    type: b.type,
    x: b.x,
    y: b.y,
    w: b.w,
    ...(b.h != null ? { h: b.h } : {}),
  }))
  const historyText = history.length
    ? history.map((m) => `${m.role === 'user' ? '用户' : '助手'}：${m.text}`).join('\n')
    : '（无）'

  return `【当前方案】
${JSON.stringify(brief, null, 2)}

【当前画布 · ${format === 'poster' ? '海报 4:5' : '报纸 A4'}】
${JSON.stringify(blocks, null, 2)}

【最近对话】
${historyText}

【本次指令】
${instruction}

只输出 JSON。`
}

function isPreset(value) {
  return Object.prototype.hasOwnProperty.call(COLOR_PRESETS, value)
}

/**
 * 应用 patch：所有越界值被夹紧或忽略，返回新的 scheme 与是否发生改动。
 * @returns {{ scheme: object, changed: boolean }}
 */
export function applyChatPatch(scheme, format, patch) {
  if (!patch || typeof patch !== 'object') return { scheme, changed: false }

  const next = {
    ...scheme,
    style: { ...scheme.style },
    content: {
      ...scheme.content,
      body_blocks: [...(scheme.content.body_blocks || [])],
    },
    layouts: {
      ...scheme.layouts,
      [format]: (scheme.layouts?.[format] || []).map((block) => ({ ...block })),
    },
  }
  let changed = false

  if (isPreset(patch.color_preset) && patch.color_preset !== next.color_preset) {
    next.color_preset = patch.color_preset
    next.style.accent_color = COLOR_PRESETS[patch.color_preset].accent
    changed = true
  }

  if (
    FONT_PAIRINGS[patch.font_pairing] &&
    patch.font_pairing !== next.font_pairing
  ) {
    next.font_pairing = patch.font_pairing
    changed = true
  }

  const style = patch.style && typeof patch.style === 'object' ? patch.style : {}

  if ([1, 2, 3].includes(Number(style.columns)) && Number(style.columns) !== next.style.columns) {
    next.style.columns = Number(style.columns)
    changed = true
  }
  if (HEADLINE_SCALES[style.headline_scale] && style.headline_scale !== next.style.headline_scale) {
    next.style.headline_scale = style.headline_scale
    changed = true
  }
  if (TREATMENTS.includes(style.image_treatment) && style.image_treatment !== next.style.image_treatment) {
    next.style.image_treatment = style.image_treatment
    changed = true
  }

  const content = patch.content && typeof patch.content === 'object' ? patch.content : {}

  for (const key of ['headline', 'subhead', 'caption', 'caption_secondary', 'pullquote']) {
    if (typeof content[key] !== 'string') continue
    const text = cleanText(content[key])
    if (key === 'headline' || key === 'subhead') {
      if (!text) continue
    }
    const value = clampText(text, TEXT_LIMITS[key])
    if (value !== next.content[key]) {
      next.content[key] = value
      changed = true
    }
  }

  if (Array.isArray(content.body_blocks)) {
    const texts = content.body_blocks
      .map((item) => cleanText(typeof item === 'string' ? item : item?.text))
      .filter(Boolean)
      .slice(0, 4)
    if (texts.length) {
      let budget = 260
      const blocks = []
      for (const text of texts) {
        if (budget <= 0) break
        const value = clampText(text, Math.min(180, budget))
        budget -= charLen(value)
        if (value) blocks.push({ type: 'paragraph', text: value })
      }
      if (blocks.length && JSON.stringify(blocks) !== JSON.stringify(next.content.body_blocks)) {
        next.content.body_blocks = blocks
        changed = true
      }
    }
  }

  if (Array.isArray(patch.layout_moves) && patch.layout_moves.length) {
    for (const move of patch.layout_moves.slice(0, 6)) {
      if (!move || typeof move !== 'object') continue
      const block = next.layouts[format].find((item) => item.id === move.block_id)
      if (!block) continue
      const dx = clamp(Number(move.dx) || 0, -MOVE_LIMITS.dx, MOVE_LIMITS.dx)
      const dy = clamp(Number(move.dy) || 0, -MOVE_LIMITS.dy, MOVE_LIMITS.dy)
      const dw = clamp(Number(move.dw) || 0, -MOVE_LIMITS.dw, MOVE_LIMITS.dw)
      if (!dx && !dy && !dw) continue

      const nextWidth = clamp(block.w + dw, 12, 100)
      const nextX = clamp(block.x + dx, 0, 100 - nextWidth)
      const nextY = clamp(block.y + dy, 0, 97)
      block.x = round(nextX, 1)
      block.y = round(nextY, 1)
      block.w = round(nextWidth, 1)
      changed = true
    }
  }

  return { scheme: changed ? next : scheme, changed }
}
