/** 自由模式图案：模型 SVG 规范化 + 符号库兜底。 */
import { resolveStyle } from '../config/presets.js'
import { pickSymbols, buildFallbackSvg } from '../config/symbols.js'
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

export function buildFallbackArtwork(scheme, description = '') {
  const symbols = pickSymbols(schemeText(scheme, description))
  const palette = resolveStyle(scheme).palette
  const artwork = buildArtwork(buildFallbackSvg(symbols), palette, {
    symbols,
    concept: scheme?.content?.headline || '自由线条',
    source: 'fallback',
  })
  return artwork
}

export function attachFallbackArtworks(schemes, description = '') {
  return (schemes || []).map((scheme) => {
    if (isSafeArtwork(scheme.artwork?.dataUrl)) return scheme
    return { ...scheme, artwork: buildFallbackArtwork(scheme, description) }
  })
}

/**
 * 把模型 arts 合并到 schemes；某张无效时用符号库兜底，不影响另外两套。
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
    if (!scheme || !item.svg) continue
    const palette = resolveStyle(scheme).palette
    const artwork = buildArtwork(item.svg, palette, {
      alt: item.alt,
      symbols: Array.isArray(item.symbols) ? item.symbols.slice(0, 3) : [],
      concept: item.concept,
      source: 'model',
    })
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
