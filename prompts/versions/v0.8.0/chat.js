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
  VARIANTS,
  buildLayout,
} from '../config/presets.js'
import {
  clampRect,
  findNewOverlaps,
  normalizeDesignLayout,
  rectOf,
  rememberDesignLayout,
  swapLayoutSlots,
} from '../config/designLayout.js'
import { clampText, clamp, round, charLen } from '../lib/format.js'
import { cleanText } from './validate.js'

const TREATMENTS = ['original', 'halftone_mono', 'duotone']
const TEXT_LIMITS = {
  headline: 15,
  subhead: 25,
  caption: 30,
  caption_secondary: 30,
  poster_note: 30,
  pullquote: 24,
}
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
- content.headline ≤15 字；content.subhead ≤25 字；content.caption ≤30 字；content.caption_secondary ≤30 字；content.poster_note ≤30 字；content.pullquote ≤24 字
- content.body_blocks：2–4 段，合计 120–220 字；只有用户要求重写正文时才提供
- layout_moves：对当前格式的版块做小幅微调，dx / dy 为百分比点（-${MOVE_LIMITS.dx}..${MOVE_LIMITS.dx}），dw 为宽度的百分比点（-${MOVE_LIMITS.dw}..${MOVE_LIMITS.dw}）
- layout_swaps：互换两个板块的完整占位矩形，例如 [["headline","pullquote"]]；用户要求「交换位置」时优先使用，不要用两段方向相反的 layout_moves

# 硬规则

1. 不得修改 layout_variant（版式骨架）、不得改图片、不得新增版块、不得改日期。
2. 不得编造新闻、人物、数据、链接、图片 URL、HTML、Markdown。
3. 用户说「再大一点 / 再小一点」时，按当前档位只移动一档（medium → large → xlarge），不要跳档。
4. 用户要求不存在的能力（例如换成橙色、加二维码、换照片）时，patch 留空对象，reply 说明原因并给一个白名单内的替代建议。
5. 只输出一个 JSON 对象，不要 Markdown 围栏、注释或额外说明。
6. 尽量只改 1–3 个字段。reply 用中文，≤40 字，说清楚改了什么。
7. 保持编辑设计纪律：一个强调色、层级清楚、不堆装饰；不要引入渐变、圆角卡片、emoji。
8. 如果用户消息包含「【引用板块：名称（block_id）】」，优先只改该板块对应的 content 或 layout_moves，不要动其他板块。
9. 交换两个板块时使用 layout_swaps（原子交换占位矩形）；不要用两个相对位移模拟，否则大板块会在中途重叠。

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
    ],
    "layout_swaps": [["headline", "pullquote"]]
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
export function applyChatPatch(
  scheme,
  format,
  patch,
  { mode = 'standard', hasSub = false } = {},
) {
  if (!patch || typeof patch !== 'object') return { scheme, changed: false }
  const designMode = mode === 'design'
  const moveLimits = designMode ? { dx: 30, dy: 30, dw: 30 } : MOVE_LIMITS

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

  if (
    designMode &&
    VARIANTS[patch.layout_variant] &&
    patch.layout_variant !== next.layout_variant
  ) {
    next.layout_variant = patch.layout_variant
    next.layouts = {
      newspaper: buildLayout(patch.layout_variant, 'newspaper', hasSub),
      poster: buildLayout(patch.layout_variant, 'poster', hasSub),
    }
    changed = true
  }

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

  for (const key of [
    'headline',
    'subhead',
    'caption',
    'caption_secondary',
    'poster_note',
    'pullquote',
  ]) {
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
    if (designMode && content.body_blocks.length === 0) {
      if (next.content.body_blocks.length) {
        next.content.body_blocks = []
        changed = true
      }
    } else if (texts.length) {
      let budget = designMode ? 320 : 260
      const blocks = []
      for (const text of texts) {
        if (budget <= 0) break
        const value = clampText(text, Math.min(designMode ? 200 : 180, budget))
        budget -= charLen(value)
        if (value) blocks.push({ type: 'paragraph', text: value })
      }
      if (blocks.length && JSON.stringify(blocks) !== JSON.stringify(next.content.body_blocks)) {
        next.content.body_blocks = blocks
        changed = true
      }
    }
  }

  let layout = next.layouts[format]
  const originalRects = new Map(layout.map((block) => [block.id, rectOf(block)]))
  const originalGeometry = new Map(
    layout.map((block) => [block.id, { x: block.x, y: block.y, w: block.w, h: block.h }]),
  )
  const movedIds = new Set()
  let layoutTouched = false
  let warning = ''
  let design = null
  if (designMode && scheme.design_layout?.format === format) {
    design = {
      ...scheme.design_layout,
      overrides: [...(scheme.design_layout.overrides || [])],
      extra_blocks: [...(scheme.design_layout.extra_blocks || [])],
      removed: [...(scheme.design_layout.removed || [])],
    }
  }
  const ensureDesign = () => {
    if (!design) design = { format, overrides: [], extra_blocks: [], removed: [] }
    return design
  }

  /* 互换：原子交换完整占位矩形，不用两个相对位移 */
  if (Array.isArray(patch.layout_swaps)) {
    for (const pair of patch.layout_swaps.slice(0, 3)) {
      if (!Array.isArray(pair) || pair.length < 2) continue
      if (swapLayoutSlots(layout, String(pair[0]), String(pair[1]))) {
        changed = true
        layoutTouched = true
      }
    }
  }

  /* 设计模式：绝对坐标落点 */
  if (designMode && Array.isArray(patch.layout_placements)) {
    for (const placement of patch.layout_placements.slice(0, 8)) {
      if (!placement || typeof placement !== 'object') continue
      const block = layout.find((item) => item.id === placement.block_id)
      if (!block) continue
      const rect = clampRect(placement, block)
      const moved =
        rect.x !== block.x ||
        rect.y !== block.y ||
        rect.w !== block.w ||
        (rect.h != null && rect.h !== block.h)
      if (!moved) continue
      Object.assign(block, rect)
      movedIds.add(block.id)
      changed = true
      layoutTouched = true
    }
  }

  /* 设计模式：增删板块 */
  if (designMode && Array.isArray(patch.extra_blocks)) {
    const normalized = normalizeDesignLayout({ extra_blocks: patch.extra_blocks }, format)
    const ids = new Set(layout.map((block) => block.id))
    for (const extra of normalized?.extra_blocks || []) {
      if (ids.has(extra.id)) continue
      const rect = clampRect(extra, { x: 0, y: 0, w: 40 })
      layout.push({ ...extra, ...rect, custom: true })
      ensureDesign().extra_blocks.push(extra)
      ids.add(extra.id)
      changed = true
      layoutTouched = true
    }
  }

  if (designMode && Array.isArray(patch.remove_blocks)) {
    const remove = new Set(patch.remove_blocks.map((id) => String(id)))
    if (remove.size) {
      const kept = layout.filter((block) => !remove.has(block.id))
      if (kept.length !== layout.length) {
        layout = kept
        next.layouts[format] = layout
        const target = ensureDesign()
        target.removed = [...new Set([...target.removed, ...remove])]
        target.extra_blocks = target.extra_blocks.filter((block) => !remove.has(block.id))
        changed = true
        layoutTouched = true
      }
    }
  }

  if (Array.isArray(patch.layout_moves) && patch.layout_moves.length) {
    for (const move of patch.layout_moves.slice(0, designMode ? 8 : 6)) {
      if (!move || typeof move !== 'object') continue
      const block = layout.find((item) => item.id === move.block_id)
      if (!block) continue
      const dx = clamp(Number(move.dx) || 0, -moveLimits.dx, moveLimits.dx)
      const dy = clamp(Number(move.dy) || 0, -moveLimits.dy, moveLimits.dy)
      const dw = clamp(Number(move.dw) || 0, -moveLimits.dw, moveLimits.dw)
      if (!dx && !dy && !dw) continue

      const nextWidth = clamp(block.w + dw, 12, 100)
      const nextX = clamp(block.x + dx, 0, 100 - nextWidth)
      const nextY = clamp(block.y + dy, 0, 97)
      block.x = round(nextX, 1)
      block.y = round(nextY, 1)
      block.w = round(nextWidth, 1)
      movedIds.add(block.id)
      changed = true
      layoutTouched = true
    }
  }

  /* 新产生的重叠回退：保留模板里原本就有意的叠压，只拒绝移动造成的冲突 */
  if (movedIds.size) {
    const hits = findNewOverlaps(layout, [...movedIds], originalRects)
    if (hits.length) {
      const bad = new Set(hits.map(([id]) => id))
      for (const id of bad) {
        const block = layout.find((item) => item.id === id)
        const original = originalGeometry.get(id)
        if (!block || !original) continue
        block.x = original.x
        block.y = original.y
        block.w = original.w
        if (original.h != null) block.h = original.h
        else delete block.h
        movedIds.delete(id)
      }
      warning = '检测到板块重叠，已回退冲突的移动。'
    }
  }

  if (designMode && (layoutTouched || design)) {
    next.design_layout = rememberDesignLayout(next, format)
  }

  return {
    scheme: changed ? next : scheme,
    changed,
    ...(warning ? { warning } : {}),
  }
}
