/**
 * 海报布局：把模板槽位 + 文案 + 配色/字体解析成以像素为单位的文字块、主图区、图案区与装饰。
 * 这里不产生任何 SVG 字符串，只输出结构化结果，便于测试与后续检查器复用。
 */
import { HEADLINE_SCALES, COLOR_PRESETS, resolveStyle } from '../../config/presets.js'
import {
  POSTER_H,
  POSTER_W,
  POSTER_FONT_STACKS,
  getPosterTemplate,
  resolvePosterVariant,
} from '../../config/posterTemplates.js'
import { fitText } from './text.js'

export function posterScaleFactor(scale) {
  return HEADLINE_SCALES[scale]?.factor ?? 1
}

export function posterPalette(scheme) {
  const st = resolveStyle(scheme)
  return {
    paper: st.palette.background,
    ink: st.palette.text,
    accent: st.palette.accent,
    secondary: st.palette.secondary,
    muted: st.palette.muted,
    tertiary: st.palette.tertiary,
    quaternary: st.palette.quaternary,
  }
}

export function posterFonts(scheme) {
  return POSTER_FONT_STACKS[scheme.font_pairing] || POSTER_FONT_STACKS.grotesk
}

function px(value, total) {
  return Math.round((Number(value) / 100) * total * 100) / 100
}

function pxBox(box) {
  return { x: px(box.x, POSTER_W), y: px(box.y, POSTER_H), w: px(box.w, POSTER_W), h: px(box.h, POSTER_H) }
}

function slotValues(scheme, template) {
  const content = scheme.content || {}
  const artWords = Array.isArray(content.art_words) ? content.art_words : []
  const artWord =
    artWords.find((word) => word.placement === 'headline')?.text || artWords[0]?.text || ''
  const footerParts = ['创意海报版式 · 非真实新闻']
  if (content.date) footerParts.push(content.date)
  const noteParts = String(content.poster_note || '')
    .split(/[·•｜|/／,，、]+/)
    .map((part) => part.trim())
    .filter(Boolean)
  return {
    masthead: '头版智造局',
    issue: 'NO.001',
    kicker: template?.en ? `// ${template.en}` : '',
    artWord,
    ghost: artWord,
    headline: content.headline || '',
    subhead: content.subhead || '',
    caption: content.caption || '',
    note: content.poster_note || '',
    info1: noteParts[0] || content.date || '',
    info2: noteParts[1] || '',
    info3: noteParts[2] || '',
    footer: footerParts.join('　／　'),
  }
}

function colorOf(role, palette) {
  if (role === 'paper') return palette.paper
  if (role === 'accent') return palette.accent
  if (role === 'secondary') return palette.secondary
  if (role === 'tertiary') return palette.tertiary || palette.accent
  if (role === 'quaternary') return palette.quaternary || palette.secondary
  if (role === 'muted') return palette.muted
  return palette.ink
}

function slotFontSize(slot, factor) {
  return Math.max(8, Math.round(slot.size * factor * 10) / 10)
}

/**
 * @returns {{
 *   template, variant, palette, fonts, artFont, safe, hero, artBox,
 *   blocks: Array<{ id, value, lines, size, ... }>,
 *   decor: Array<object>, size: { width, height }
 * }}
 */
export function layoutPoster(scheme) {
  const template = getPosterTemplate(scheme?.poster?.template)
  const variant = resolvePosterVariant(template, scheme?.poster?.variant)
  const palette = posterPalette(scheme)
  const fonts = posterFonts(scheme)
  const factor = posterScaleFactor(scheme?.style?.headline_scale)
  const values = slotValues(scheme, template)
  const hero = pxBox(variant.hero)
  const artBox = pxBox(variant.artBox || variant.hero)
  const blocks = []

  for (const [id, slot] of Object.entries(variant.slots)) {
    const value = values[id]
    if (!value) continue
    const box = pxBox(slot)
    const size = id === 'headline' ? slotFontSize(slot, factor) : slot.size
    const text = slot.upper ? String(value).toUpperCase() : String(value)
    const fitted = fitText(text, {
      maxWidth: box.w,
      maxLines: slot.maxLines ?? 1,
      size,
      tracking: slot.tracking ?? 0,
      minScale: id === 'headline' ? 0.68 : id === 'ghost' ? 0.4 : 0.8,
    })
    blocks.push({
      kind: 'text',
      id,
      value: text,
      lines: fitted.lines,
      size: fitted.size,
      truncated: fitted.truncated,
      weight: slot.weight ?? 400,
      tracking: slot.tracking ?? 0,
      lineHeight: slot.lineHeight ?? 1.2,
      color: colorOf(slot.color || 'ink', palette),
      align: slot.align || 'left',
      x: box.x,
      y: box.y,
      w: box.w,
      h: Math.round(fitted.lines.length * fitted.size * (slot.lineHeight ?? 1.2) * 10) / 10,
      rotate: slot.rotate || 0,
      opacity: slot.opacity ?? 1,
      outline: Boolean(slot.outline),
      strokeWidth: slot.strokeWidth ?? 0,
      role: slot.color || 'ink',
      font: ['headline', 'masthead', 'artWord', 'ghost'].includes(id) ? fonts.head : fonts.body,
    })
  }

  return {
    template,
    variant,
    palette,
    fonts,
    artFont: scheme?.poster?.artFont !== undefined ? scheme.poster.artFont : template.artFont,
    safe: template.safe,
    hero,
    artBox,
    blocks,
    decor: variant.decor || [],
    size: { width: POSTER_W, height: POSTER_H },
  }
}

/** 文字块 → 每行基线，供 SVG 渲染与测试复用。 */
export function baselineOf(block, index = 0) {
  const lead = block.size * (block.lineHeight || 1.2)
  return block.y + block.size * 0.82 + index * lead
}
