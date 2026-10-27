/** 自由模式图案：图标库组合 + 模型加元素 + 符号兜底。 */
import { resolveStyle } from '../config/presets.js'
import { pickConceptIcons } from '../config/symbol-map.js'
import { getIcon } from '../config/icon-library.js'
import { composeArtwork } from '../lib/composeArtwork.js'
import { buildArtwork, isSafeArtwork, svgToPngDataUrl } from '../lib/svg.js'

function schemeText(scheme, description = '') {
  return [
    description,
    scheme?.content?.headline,
    scheme?.content?.subhead,
    scheme?.content?.pullquote,
    scheme?.content?.poster_note,
    ...(scheme?.content?.body_blocks || []).map((block) => block.text),
    scheme?.design_rationale,
  ]
    .filter(Boolean)
    .join(' ')
}

function compositionForCount(count) {
  if (count <= 1) return 'center'
  if (count === 2) return 'duo'
  return 'triad'
}

export function buildFallbackArtwork(scheme, description = '') {
  const text = schemeText(scheme, description)
  const symbols = pickConceptIcons(text, 2).filter((id) => getIcon(id))
  const composed = composeArtwork({
    symbols,
    composition: compositionForCount(symbols.length),
    style: null,
    variant: scheme.layout_variant,
    fallbackText: text,
  })
  const palette = resolveStyle(scheme).palette
  return buildArtwork(composed.svg, palette, {
    symbols: composed.symbols,
    concept: scheme?.content?.headline || '自由线条',
    alt: scheme?.content?.headline || '自由模式线条图案',
    source: 'fallback',
  })
}

export function attachFallbackArtworks(schemes, description = '') {
  return (schemes || []).map((scheme) => {
    if (isSafeArtwork(scheme.artwork?.dataUrl)) return scheme
    return { ...scheme, artwork: buildFallbackArtwork(scheme, description) }
  })
}

function buildPlanArtwork(item, scheme, description) {
  const palette = resolveStyle(scheme).palette
  const text = schemeText(scheme, description)
  const symbols = Array.isArray(item.symbols) ? item.symbols.filter((id) => getIcon(id)) : []
  if (!symbols.length) return null
  const composed = composeArtwork({
    symbols,
    composition: item.composition,
    style: item.style,
    extraElements: item.extra_elements || item.extraElements || [],
    variant: scheme.layout_variant,
    fallbackText: text,
  })
  return buildArtwork(composed.svg, palette, {
    symbols: composed.symbols,
    concept: item.concept,
    alt: item.alt,
    source: 'model',
  })
}

/**
 * 把模型返回的图标组合合并到 schemes；某张无效时用符号库兜底，不影响另外两套。
 */
export function normalizeModelArtworks(payload, schemes, description = '') {
  const list = Array.isArray(payload?.artworks)
    ? payload.artworks
    : Array.isArray(payload)
      ? payload
      : []
  const byId = new Map()
  for (const item of list) {
    if (!item || typeof item !== 'object' || !item.id) continue
    const scheme = schemes.find((entry) => entry.id === item.id)
    if (!scheme) continue
    let artwork = buildPlanArtwork(item, scheme, description)
    // 兼容旧的原始 SVG 返回。
    if (!artwork && typeof item.svg === 'string') {
      artwork = buildArtwork(item.svg, resolveStyle(scheme).palette, {
        symbols: Array.isArray(item.symbols) ? item.symbols.slice(0, 3) : [],
        concept: item.concept,
        alt: item.alt,
        source: 'model',
      })
    }
    if (artwork) byId.set(item.id, artwork)
  }

  let warnings = 0
  const next = schemes.map((scheme) => {
    const incoming = byId.get(scheme.id)
    if (incoming) return { ...scheme, artwork: incoming }
    warnings += 1
    return {
      ...scheme,
      artwork: isSafeArtwork(scheme.artwork?.dataUrl)
        ? scheme.artwork
        : buildFallbackArtwork(scheme, description),
    }
  })
  return { schemes: next, warnings }
}

/** 为导出准备 PNG；预览继续使用原始 SVG。 */
export async function rasterizeArtworks(schemes) {
  return Promise.all(
    (schemes || []).map(async (scheme) => {
      const artwork = scheme.artwork
      if (!artwork || artwork.pngDataUrl || !isSafeArtwork(artwork.dataUrl)) return scheme
      try {
        const pngDataUrl = await svgToPngDataUrl(artwork.dataUrl)
        return pngDataUrl ? { ...scheme, artwork: { ...artwork, pngDataUrl } } : scheme
      } catch {
        return scheme
      }
    }),
  )
}
