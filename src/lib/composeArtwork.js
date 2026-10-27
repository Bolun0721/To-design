/** 把图标库 + 构图 + 样式配方组合成 600×450 的线条 SVG。 */
import { getIcon } from '../config/icon-library.js'
import { pickConceptIcons } from '../config/symbol-map.js'
import { resolvePatternStyle } from '../config/pattern-styles.js'

export const COMPOSITIONS = ['center', 'duo', 'triad', 'horizon', 'vertical', 'scatter']

const LAYOUTS = {
  // 第一个 symbol 是主图案，刻意比其他图案大约 60%–90%，让主图不再空。
  center: [{ x: 0.5, y: 0.5, size: 0.98 }],
  duo: [
    { x: 0.31, y: 0.53, size: 0.64 },
    { x: 0.73, y: 0.38, size: 0.38 },
  ],
  triad: [
    { x: 0.39, y: 0.53, size: 0.6 },
    { x: 0.75, y: 0.28, size: 0.3 },
    { x: 0.74, y: 0.76, size: 0.26 },
  ],
  horizon: [
    { x: 0.5, y: 0.55, size: 0.6 },
    { x: 0.19, y: 0.28, size: 0.28 },
    { x: 0.81, y: 0.28, size: 0.24 },
  ],
  vertical: [
    { x: 0.5, y: 0.4, size: 0.64 },
    { x: 0.5, y: 0.8, size: 0.3 },
  ],
  scatter: [
    { x: 0.38, y: 0.5, size: 0.62 },
    { x: 0.16, y: 0.24, size: 0.28 },
    { x: 0.82, y: 0.72, size: 0.24 },
  ],
}

function normalizeSymbols(value, fallbackText) {
  const ids = Array.isArray(value) ? value.map(String).filter((id) => getIcon(id)) : []
  const unique = [...new Set(ids)].slice(0, 3)
  if (unique.length) return unique
  return pickConceptIcons(fallbackText, 2)
}

function normalizeComposition(value, symbolCount) {
  if (COMPOSITIONS.includes(value)) return value
  if (symbolCount <= 1) return 'center'
  if (symbolCount === 2) return 'duo'
  return 'triad'
}

function fillInfo(fill) {
  if (fill === 'soft-accent') return { color: '{{accent}}', opacity: 0.08 }
  if (fill === 'soft-ink') return { color: '{{ink}}', opacity: 0.06 }
  return { color: 'none', opacity: 0 }
}

function normalizeExtras(extras) {
  if (!Array.isArray(extras)) return []
  return extras
    .filter((item) => item && typeof item === 'object')
    .slice(0, 8)
    .map((item) => ({
      shape: ['line', 'circle', 'arc', 'rect', 'path'].includes(item.shape) ? item.shape : 'line',
      ...item,
    }))
}

function extraMarkup(extra) {
  const stroke =
    extra.stroke === 'accent'
      ? '{{accent}}'
      : extra.stroke === 'ink'
        ? '{{ink}}'
        : '{{muted}}'
  const opacity = Number.isFinite(Number(extra.opacity))
    ? Math.max(0, Math.min(1, Number(extra.opacity)))
    : 0.35
  const strokeWidth = Number.isFinite(Number(extra.strokeWidth))
    ? Math.max(0.5, Math.min(4, Number(extra.strokeWidth)))
    : 1.2
  const common = `stroke="${stroke}" fill="none" stroke-width="${strokeWidth}" opacity="${opacity}"`
  if (extra.shape === 'circle' || extra.shape === 'dot') {
    return `<circle cx="${Number(extra.cx) || 0}" cy="${Number(extra.cy) || 0}" r="${Math.max(2, Number(extra.r) || 8)}" ${common}/>`
  }
  if (extra.shape === 'rect') {
    return `<rect x="${Number(extra.x) || 0}" y="${Number(extra.y) || 0}" width="${Math.max(4, Number(extra.width) || 40)}" height="${Math.max(4, Number(extra.height) || 30)}" ${common}/>`
  }
  if (extra.shape === 'arc' || extra.shape === 'path') {
    if (typeof extra.d !== 'string') return ''
    return `<path d="${extra.d}" ${common}/>`
  }
  return `<line x1="${Number(extra.x1) || 0}" y1="${Number(extra.y1) || 0}" x2="${Number(extra.x2) || 0}" y2="${Number(extra.y2) || 0}" ${common}/>`
}

function frameMarkup(composition) {
  if (composition === 'vertical') {
    return '<path d="M60 54H540M60 396H540" stroke="{{muted}}" stroke-width="1" opacity="0.32"/>'
  }
  if (composition === 'horizon') {
    return '<path d="M40 390H560M40 402H560" stroke="{{muted}}" stroke-width="1" opacity="0.3"/>'
  }
  if (composition === 'triad') {
    return '<circle cx="300" cy="225" r="210" stroke="{{muted}}" stroke-width="1" opacity="0.18"/>'
  }
  return '<path d="M44 54H556M44 396H556" stroke="{{muted}}" stroke-width="1" opacity="0.25"/>'
}

/**
 * 返回 { svg, symbols, composition, style }。
 * 不做安全过滤；调用方统一交给 sanitizeSvg。
 */
export function composeArtwork({
  symbols,
  composition,
  style,
  extraElements = [],
  variant = 'classic_broadsheet',
  fallbackText = '',
} = {}) {
  const symbolIds = normalizeSymbols(symbols, fallbackText)
  const comp = normalizeComposition(composition, symbolIds.length)
  const patternStyle = resolvePatternStyle(variant, style)
  const fill = fillInfo(patternStyle.fill)
  const layout = LAYOUTS[comp] || LAYOUTS.center
  const extras = normalizeExtras(extraElements)

  const rendered = symbolIds.map((id, index) => {
    const icon = getIcon(id)
    const slot = layout[index % layout.length]
    const vb = icon.viewBox.split(/\s+/).map(Number)
    const vbSize = vb[2] || 24
    const size = Math.round((slot.size || 0.3) * 450)
    const x = Math.round((slot.x || 0.5) * 600 - size / 2)
    const y = Math.round((slot.y || 0.5) * 450 - size / 2)
    const scale = size / vbSize
    const strokeWidth = patternStyle.strokeWidth * (vbSize / 24)
    const transform = `translate(${x} ${y}) scale(${scale})`
    const shadowOffset = patternStyle.shadow * 2
    const shadow =
      patternStyle.shadow > 0
        ? `<g transform="translate(${x + shadowOffset} ${y + shadowOffset}) scale(${scale})" stroke="{{ink}}" fill="none" opacity="0.12" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${icon.body}</g>`
        : ''
    return `${shadow}<g transform="${transform}" fill="${fill.color}" fill-opacity="${fill.opacity}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${icon.body}</g>`
  })

  const extrasMarkup = extras.map(extraMarkup).filter(Boolean).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" fill="none" stroke="{{accent}}" opacity="${patternStyle.opacity}" stroke-linecap="round" stroke-linejoin="round">
    ${frameMarkup(comp)}
    ${rendered.join('\n')}
    ${extrasMarkup}
  </svg>`

  return {
    svg,
    symbols: symbolIds,
    composition: comp,
    style: patternStyle,
    extras,
  }
}
