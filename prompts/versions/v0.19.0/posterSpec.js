/**
 * 海报规格归一化（单套）。
 *
 * 模型只负责：文案 + 模板 id + 变体 + 配色/字体 id + 图案配方 id/参数/seed + 少量背景几何。
 * 所有 id 与数值在这里过白名单；越界夹紧、未知丢弃、不合法回退默认，不抛异常。
 * 报纸仍走 validate.js 的 normalizeSchemes，两条链路互不影响。
 */
import { COLOR_PRESETS, FONT_PAIRINGS, HEADLINE_SCALES, buildLayout } from '../config/presets.js'
import {
  POSTER_ANGLES,
  POSTER_ART_FONTS,
  POSTER_TEMPLATES,
  POSTER_TEMPLATE_IDS,
  POSTER_VARIANTS,
  getPosterTemplate,
  newspaperVariantForPoster,
} from '../config/posterTemplates.js'
import {
  POSTER_RECIPE_IDS,
  getPosterRecipe,
  resolveRecipeParams,
} from '../config/posterPatterns.js'
import { charLen, clampText } from '../lib/format.js'
import { cleanText } from './validate.js'

export const POSTER_SPEC_VERSION = 1

export const POSTER_CONTENT_RULES = {
  headline: 15,
  subhead: 25,
  caption: 30,
  posterNote: 30,
  artWords: 3,
  body: { min: 60, max: 120, paragraphs: 2 },
  recommendations: { headline: 9, subhead: 18 },
}

const PLACEMENTS = ['headline', 'masthead', 'note']
const SHAPE_KINDS = ['circle', 'rect', 'triangle', 'line', 'arc']
const SHAPE_ROLES = ['accent', 'ink', 'muted', 'paper', 'secondary']
const FORBIDDEN_KEYS = ['svg', 'hex', 'path', 'd', 'renderer', 'markup']

function cleanEnglish(value) {
  return String(value || '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function normalizeArtWords(content, warnings) {
  const raw = Array.isArray(content?.art_words) ? content.art_words : []
  const words = []
  const used = new Set()
  for (const item of raw) {
    const text = clampText(cleanEnglish(typeof item === 'string' ? item : item?.text), 32)
    if (!text) continue
    const placement = PLACEMENTS.includes(item?.placement) ? item.placement : 'headline'
    if (used.has(placement)) continue
    used.add(placement)
    words.push({ text, placement })
    if (words.length >= POSTER_CONTENT_RULES.artWords) break
  }
  if (words.length < raw.length) warnings.push('部分英文装饰词被丢弃（重复、超长或非英文）。')
  return words
}

function normalizeBody(content, fallback, warnings) {
  const raw = Array.isArray(content?.body_blocks) ? content.body_blocks : []
  let blocks = raw
    .map((item) => ({ type: 'paragraph', text: clampText(cleanText(item?.text ?? item), 260) }))
    .filter((item) => item.text)
  if (!blocks.length) {
    const text = clampText(cleanText(content?.subhead || content?.poster_note || fallback), 120)
    if (text) {
      blocks = [{ type: 'paragraph', text }]
      warnings.push('海报没有备用正文，已用副标题补一段供报纸视图使用。')
    }
  }
  if (blocks.length > POSTER_CONTENT_RULES.body.paragraphs) {
    blocks = blocks.slice(0, POSTER_CONTENT_RULES.body.paragraphs)
    warnings.push('备用正文超过 2 段，已截断。')
  }
  const total = blocks.reduce((sum, block) => sum + charLen(block.text), 0)
  if (total > POSTER_CONTENT_RULES.body.max) {
    let budget = POSTER_CONTENT_RULES.body.max
    blocks = blocks
      .map((block) => {
        if (budget <= 0) return null
        const text = clampText(block.text, budget)
        budget -= charLen(text)
        return text ? { ...block, text } : null
      })
      .filter(Boolean)
    warnings.push(`备用正文超过 ${POSTER_CONTENT_RULES.body.max} 字，已截断。`)
  }
  return blocks
}

function normalizeShapes(shapes, warnings) {
  if (!Array.isArray(shapes)) return []
  const out = []
  for (const shape of shapes.slice(0, 8)) {
    if (!shape || typeof shape !== 'object') continue
    if (!SHAPE_KINDS.includes(shape.kind)) continue
    const clamp01 = (value, fallback = 0) => {
      const num = Number(value)
      return Number.isFinite(num) ? Math.min(1, Math.max(0, num)) : fallback
    }
    const item = {
      kind: shape.kind,
      x: clamp01(shape.x, 0.5),
      y: clamp01(shape.y, 0.5),
      role: SHAPE_ROLES.includes(shape.role) ? shape.role : 'accent',
      opacity: Number.isFinite(Number(shape.opacity))
        ? Math.min(1, Math.max(0, Number(shape.opacity)))
        : 0.85,
    }
    if (shape.kind === 'circle') item.r = Math.min(0.4, Math.max(0.02, clamp01(shape.r, 0.1)))
    if (shape.kind === 'rect') {
      item.w = Math.min(0.8, Math.max(0.02, clamp01(shape.w, 0.16)))
      item.h = Math.min(0.8, Math.max(0.02, clamp01(shape.h, 0.12)))
    }
    if (shape.kind === 'triangle') item.r = Math.min(0.4, Math.max(0.02, clamp01(shape.r, 0.1)))
    if (shape.kind === 'line' || shape.kind === 'arc') {
      item.x2 = clamp01(shape.x2, item.x)
      item.y2 = clamp01(shape.y2, item.y)
      item.strokeWidth = Math.min(6, Math.max(0.5, Number(shape.strokeWidth) || 2))
      if (shape.kind === 'arc') item.r = Math.min(0.4, Math.max(0.02, clamp01(shape.r, 0.14)))
    }
    out.push(item)
  }
  if (out.length < (Array.isArray(shapes) ? shapes.length : 0)) {
    warnings.push('部分背景几何不合法，已丢弃。')
  }
  return out
}

function scanForbidden(value, path = '', hits = []) {
  if (!value || typeof value !== 'object') return hits
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForbidden(item, `${path}[${index}]`, hits))
    return hits
  }
  for (const [key, child] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key
    if (FORBIDDEN_KEYS.includes(key) && (typeof child === 'string' || typeof child === 'object')) {
      hits.push(nextPath)
    }
    scanForbidden(child, nextPath, hits)
  }
  return hits
}

export function posterAngle(id) {
  return POSTER_ANGLES.find((angle) => angle.id === id) || POSTER_ANGLES[0]
}

/**
 * @param payload 模型返回（可含 scheme 包裹，也可是裸对象）
 * @param {{ angle?: string, date?: string, mode?: string }} options
 * @returns {{ scheme: object, warnings: string[] }}
 */
export function normalizePosterScheme(payload, { angle = 'A', date = '', mode = 'standard' } = {}) {
  const warnings = []
  const hit = scanForbidden(payload)
  if (hit.length) warnings.push(`模型夹带了不允许的字段（${hit.slice(0, 3).join('、')}），已忽略。`)

  const raw = payload?.scheme && typeof payload.scheme === 'object' ? payload.scheme : payload || {}
  const slot = posterAngle(angle)
  const content = raw.content && typeof raw.content === 'object' ? raw.content : {}

  const requestedTemplate = raw.poster?.template || raw.poster_template
  let templateId = POSTER_TEMPLATE_IDS.includes(requestedTemplate) ? requestedTemplate : ''
  if (!templateId) {
    templateId = slot.templates.find((id) => POSTER_TEMPLATE_IDS.includes(id)) || POSTER_TEMPLATE_IDS[0]
    warnings.push(`海报模板「${requestedTemplate ?? '空'}」不在白名单，已回退为 ${templateId}。`)
  }
  if (!slot.templates.includes(templateId)) {
    warnings.push(`模板 ${templateId} 不属于 ${slot.id} 的内容角度，仍按模型选择渲染。`)
  }
  const template = getPosterTemplate(templateId)

  const requestedVariant = raw.poster?.variant || raw.poster_variant
  const variant = POSTER_VARIANTS.includes(requestedVariant) ? requestedVariant : 'quiet'
  if (requestedVariant && !POSTER_VARIANTS.includes(requestedVariant)) {
    warnings.push(`海报变体「${requestedVariant}」不合法，已回退为 quiet。`)
  }

  const requestedPalette = raw.color_preset || raw.poster?.palette
  const palette = COLOR_PRESETS[requestedPalette] ? requestedPalette : template.palette
  if (requestedPalette && !COLOR_PRESETS[requestedPalette]) {
    warnings.push(`配色「${requestedPalette}」不在白名单，已回退为 ${template.palette}。`)
  }

  const requestedFont = raw.font_pairing
  const font = FONT_PAIRINGS[requestedFont] ? requestedFont : template.font
  if (requestedFont && !FONT_PAIRINGS[requestedFont]) {
    warnings.push(`字体「${requestedFont}」不在白名单，已回退为 ${template.font}。`)
  }

  const requestedScale = raw.headline_scale || raw.style?.headline_scale
  const headlineScale = HEADLINE_SCALES[requestedScale] ? requestedScale : 'large'
  if (requestedScale && !HEADLINE_SCALES[requestedScale]) {
    warnings.push(`标题字号档「${requestedScale}」不合法，已回退为 large。`)
  }

  const requestedRecipe = raw.poster?.art?.recipe || raw.poster_recipe
  let recipeId = POSTER_RECIPE_IDS.includes(requestedRecipe) ? requestedRecipe : template.recipe
  if (!getPosterRecipe(recipeId)) recipeId = template.recipe
  if (requestedRecipe && requestedRecipe !== recipeId) {
    warnings.push(`图案配方「${requestedRecipe}」不在白名单，已回退为 ${recipeId}。`)
  }
  const params = resolveRecipeParams(recipeId, raw.poster?.art?.params || raw.poster_params || {})
  const seedRaw = Number(raw.poster?.art?.seed ?? raw.poster_seed ?? 0)
  const seed = Number.isFinite(seedRaw) ? Math.min(9999, Math.max(0, Math.round(seedRaw))) : 0

  const requestedArtFont = raw.style?.art_font || raw.poster?.artFont
  const artFont =
    requestedArtFont && requestedArtFont !== 'none'
      ? POSTER_ART_FONTS[requestedArtFont] && requestedArtFont === template.artFont
        ? requestedArtFont
        : template.artFont
      : template.artFont
  if (requestedArtFont && requestedArtFont !== 'none' && requestedArtFont !== artFont) {
    warnings.push(`艺术字「${requestedArtFont}」与模板不匹配或体积过大，已回退为 ${artFont || '标题字体'}。`)
  }

  const shapes = normalizeShapes(raw.poster?.art?.shapes || raw.poster_shapes, warnings)

  const headline = clampText(cleanText(content.headline), POSTER_CONTENT_RULES.headline)
  if (charLen(cleanText(content.headline)) > POSTER_CONTENT_RULES.headline) {
    warnings.push(`主标题超过 ${POSTER_CONTENT_RULES.headline} 字，已截断。`)
  }
  const subhead = clampText(cleanText(content.subhead), POSTER_CONTENT_RULES.subhead)
  const caption = clampText(cleanText(content.caption), POSTER_CONTENT_RULES.caption)
  const posterNote = clampText(cleanText(content.poster_note), POSTER_CONTENT_RULES.posterNote)
  const artWords = normalizeArtWords(content, warnings)
  const bodyBlocks = normalizeBody(content, subhead || posterNote, warnings)

  if (!headline) {
    warnings.push('缺少主标题，已使用占位标题。')
  }

  const dateValue = date || clampText(cleanText(content.date), 20)
  const name = clampText(cleanText(raw.name), 10) || template.name
  const rationale = clampText(cleanText(raw.design_rationale), 50) || template.tagline

  const scheme = {
    id: slot.id,
    name,
    angle: slot.id,
    angleRole: slot.role,
    pending: false,
    layout_variant: newspaperVariantForPoster(templateId),
    color_preset: palette,
    font_pairing: font,
    style: {
      headline_scale: headlineScale,
      art_font: artFont || 'none',
      accent_color: COLOR_PRESETS[palette].accent,
    },
    content: {
      headline: headline || '未命名海报',
      subhead,
      caption,
      poster_note: posterNote,
      art_words: artWords,
      body_blocks: bodyBlocks,
      date: dateValue,
    },
    poster: {
      spec_version: POSTER_SPEC_VERSION,
      template: templateId,
      variant,
      artFont,
      art: { source: 'recipe', recipe: recipeId, params, seed, shapes },
      textures: {
        paper: ['plain', 'aged'].includes(raw.poster?.textures?.paper)
          ? raw.poster.textures.paper
          : 'plain',
        grain: Math.min(0.4, Math.max(0, Number(raw.poster?.textures?.grain) || 0)),
      },
    },
    design_rationale: rationale,
    mode: mode === 'design' || mode === 'free' ? mode : 'standard',
    // 报纸视图仍可切换：保留一套对应的报纸布局，海报渲染不读取它。
    layouts: {
      newspaper: buildLayout(newspaperVariantForPoster(templateId), 'newspaper'),
      poster: buildLayout(newspaperVariantForPoster(templateId), 'poster'),
    },
  }

  return { scheme, warnings }
}

/** 给三套方案补默认海报规格（旧稿 / 报纸转海报时用）。 */
export function defaultPosterSpec(scheme, { angle = 'A' } = {}) {
  const templateId = scheme?.poster?.template || posterAngle(angle).templates[0]
  const template = getPosterTemplate(templateId)
  return {
    spec_version: POSTER_SPEC_VERSION,
    template: templateId,
    variant: POSTER_VARIANTS.includes(scheme?.poster?.variant) ? scheme.poster.variant : 'quiet',
    artFont: template.artFont,
    art: {
      source: 'recipe',
      recipe: template.recipe,
      params: resolveRecipeParams(template.recipe),
      seed: 0,
      shapes: [],
    },
    textures: { paper: 'plain', grain: 0 },
  }
}

export function hasPosterSpec(scheme) {
  return Boolean(scheme?.poster?.template)
}

export function posterTemplateOf(scheme) {
  return getPosterTemplate(scheme?.poster?.template)
}
