/** 设计模式自定义版式：板块增删、绝对坐标与互换。 */
import { buildLayout } from './presets.js'
import { clamp } from '../lib/format.js'

export const EXTRA_BLOCK_TYPES = [
  'masthead',
  'dateline',
  'headline',
  'subhead',
  'byline',
  'caption',
  'body',
  'pullquote',
  'note',
  'footer',
]

const round1 = (value) => Math.round(value * 10) / 10

export function estimateBlockHeight(block) {
  if (block.h != null) return Number(block.h)
  switch (block.type) {
    case 'headline':
      return 8
    case 'subhead':
      return 4.5
    case 'caption':
      return 3
    case 'body':
      return 16
    case 'pullquote':
      return 7
    case 'note':
      return 3
    case 'masthead':
      return 5
    case 'dateline':
    case 'byline':
    case 'footer':
      return 2.5
    case 'image':
      return 20
    case 'scrim':
      return 100
    default:
      return 5
  }
}

export function rectOf(block) {
  return {
    x: Number(block.x) || 0,
    y: Number(block.y) || 0,
    w: Number(block.w) || 10,
    h: estimateBlockHeight(block),
  }
}

export function overlaps(a, b, gap = 0.4) {
  return (
    a.x + gap < b.x + b.w &&
    b.x + gap < a.x + a.w &&
    a.y + gap < b.y + b.h &&
    b.y + gap < a.y + a.h
  )
}

/** 百分比坐标，左上角定位；始终夹在纸张安全范围内。 */
export function clampRect(raw, base = {}) {
  const w = clamp(Number(raw.w ?? base.w) || 10, 6, 100)
  const x = clamp(Number(raw.x ?? base.x) || 0, 0, Math.max(0, 100 - w))
  const hasH = raw.h != null || base.h != null
  let h
  let y = clamp(Number(raw.y ?? base.y) || 0, 0, 96)
  if (hasH) {
    h = clamp(Number(raw.h ?? base.h), 2, 100)
    y = clamp(y, 0, Math.max(0, 100 - h))
  }
  return {
    x: round1(x),
    y: round1(y),
    w: round1(w),
    ...(hasH ? { h: round1(h) } : {}),
  }
}

function cleanId(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 32)
}

export function normalizeDesignLayout(raw, format) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const overrides = Array.isArray(source.layout_overrides)
    ? source.layout_overrides
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          block_id: cleanId(item.block_id),
          ...(item.x != null ? { x: Number(item.x) } : {}),
          ...(item.y != null ? { y: Number(item.y) } : {}),
          ...(item.w != null ? { w: Number(item.w) } : {}),
          ...(item.h != null ? { h: Number(item.h) } : {}),
        }))
        .filter((item) => item.block_id && Object.keys(item).length > 1)
        .slice(0, 12)
    : []

  const extraBlocks = Array.isArray(source.extra_blocks)
    ? source.extra_blocks
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => {
          const id = cleanId(item.id) || `extra-${index + 1}`
          const inferred = EXTRA_BLOCK_TYPES.find((type) => id.startsWith(type))
          let type = EXTRA_BLOCK_TYPES.includes(item.type) ? item.type : null
          if (!type && inferred) type = inferred
          // 模型有时把 footer 写成 note；用唯一 id 的语义兜底，避免渲染成海报注记。
          if (type === 'note' && inferred && inferred !== 'note') type = inferred
          const text = String(item.text || '')
            .replace(/<[^>]*>/g, '')
            .trim()
            .slice(0, 160)
          return {
            id,
            type,
            text,
            x: Number(item.x),
            y: Number(item.y),
            ...(item.w != null ? { w: Number(item.w) } : {}),
            ...(item.h != null ? { h: Number(item.h) } : {}),
            tone: item.tone === 'invert' ? 'invert' : undefined,
            align: item.align === 'center' ? 'center' : undefined,
          }
        })
        .filter((item) => item.type && Number.isFinite(item.x) && Number.isFinite(item.y))
        .slice(0, 4)
    : []

  const removed = Array.isArray(source.remove_blocks)
    ? source.remove_blocks.map(cleanId).filter(Boolean).slice(0, 6)
    : []

  if (!overrides.length && !extraBlocks.length && !removed.length) return null
  return { format, overrides, extra_blocks: extraBlocks, removed }
}

export function buildDesignLayout(scheme, format, hasSub = false) {
  const base = buildLayout(scheme.layout_variant, format, hasSub)
  const design = scheme.design_layout
  if (!design || design.format !== format) return base

  const removed = new Set(design.removed || [])
  const overrideById = new Map(
    (design.overrides || []).map((item) => [item.block_id, item]),
  )
  const ids = new Set()
  const layout = []

  for (const block of base) {
    if (removed.has(block.id)) continue
    const override = overrideById.get(block.id)
    const next = override ? { ...block, ...clampRect(override, block) } : { ...block }
    ids.add(next.id)
    layout.push(next)
  }

  for (const block of design.extra_blocks || []) {
    if (ids.has(block.id)) continue
    const rect = clampRect(block, { x: 0, y: 0, w: 40 })
    layout.push({
      ...block,
      ...rect,
      custom: true,
      tone: block.tone,
      align: block.align,
    })
    ids.add(block.id)
  }

  return layout
}

/** 把当前布局回写为设计版式，保证对话改坐标后，后续换图 / 重排仍保留。 */
export function rememberDesignLayout(scheme, format) {
  const layout = scheme.layouts?.[format] || []
  const existing =
    scheme.design_layout && scheme.design_layout.format === format
      ? scheme.design_layout
      : { format, overrides: [], extra_blocks: [], removed: [] }

  const layoutIds = new Set(layout.map((block) => block.id))
  const extraById = new Map(
    (existing.extra_blocks || []).filter((item) => layoutIds.has(item.id)).map((item) => [item.id, item]),
  )
  const overrideById = new Map()
  const extras = []

  for (const block of layout) {
    const geometry = {
      x: block.x,
      y: block.y,
      w: block.w,
      ...(block.h != null ? { h: block.h } : {}),
    }
    if (block.custom || extraById.has(block.id)) {
      extras.push({
        ...(extraById.get(block.id) || {}),
        id: block.id,
        type: block.type,
        text: block.text || extraById.get(block.id)?.text || '',
        tone: block.tone,
        align: block.align,
        ...geometry,
      })
    } else {
      overrideById.set(block.id, { block_id: block.id, ...geometry })
    }
  }

  return {
    format,
    overrides: [...overrideById.values()],
    extra_blocks: extras,
    removed: [...(existing.removed || [])],
  }
}

/** 互换两个板块的完整占位矩形（x / y / w / h），避免两段相对位移造成重叠。 */
export function swapLayoutSlots(layout, idA, idB) {
  if (!idA || !idB || idA === idB) return false
  const a = layout.find((block) => block.id === idA)
  const b = layout.find((block) => block.id === idB)
  if (!a || !b) return false

  const aRect = rectOf(a)
  const bRect = rectOf(b)
  Object.assign(a, {
    x: round1(bRect.x),
    y: round1(bRect.y),
    w: round1(bRect.w),
    h: round1(bRect.h),
  })
  Object.assign(b, {
    x: round1(aRect.x),
    y: round1(aRect.y),
    w: round1(aRect.w),
    h: round1(aRect.h),
  })
  return true
}

/** 返回因为移动而产生的新重叠（原本就重叠的装饰关系不算）。 */
export function findNewOverlaps(layout, movedIds, originalRects) {
  const moved = new Set(movedIds)
  const hits = []
  for (const id of moved) {
    const block = layout.find((item) => item.id === id)
    const before = originalRects.get(id)
    if (!block || !before) continue
    const next = rectOf(block)
    for (const other of layout) {
      if (other.id === id || other.type === 'scrim') continue
      if (!overlaps(next, rectOf(other))) continue
      const beforeOther = originalRects.get(other.id)
      if (beforeOther && overlaps(before, beforeOther)) continue
      hits.push([id, other.id])
    }
  }
  return hits
}
