/**
 * 前端硬校验：模型只被允许在预设白名单内选择。
 * 任何越界 / 重复 / 超长内容都在这里被修复，并记录一条人话警告。
 * 渲染链路永远拿到合法的 3 套方案。
 */
import {
  COLOR_PRESETS,
  COLOR_PRESET_IDS,
  FONT_PAIRINGS,
  HEADLINE_SCALES,
  VARIANTS,
  VARIANT_IDS,
  buildLayout,
} from '../config/presets.js'
import { normalizeDesignLayout } from '../config/designLayout.js'
import { clampText, charLen, chineseDate } from '../lib/format.js'

const SLOTS = [
  {
    id: 'A',
    variant: 'classic_broadsheet',
    preset: 'classic_serious',
    font: 'serif_serif',
    columns: 3,
    scale: 'large',
    treatment: 'original',
  },
  {
    id: 'B',
    variant: 'tabloid_bold',
    preset: 'financial_daily',
    font: 'serif_sans',
    columns: 2,
    scale: 'large',
    treatment: 'duotone',
  },
  {
    id: 'C',
    variant: 'minimal_masthead',
    preset: 'newsprint_single_accent',
    font: 'superfamily',
    columns: 2,
    scale: 'medium',
    treatment: 'halftone_mono',
  },
]

const TREATMENTS = ['original', 'halftone_mono', 'duotone']
const SCALES = Object.keys(HEADLINE_SCALES)

export function cleanText(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstUnused(preferred, used, fallback) {
  if (!used.has(fallback)) return fallback
  return preferred.find((x) => !used.has(x)) || fallback
}

function paragraphsOf(content) {
  const blocks = content?.body_blocks
  if (Array.isArray(blocks) && blocks.length) {
    return blocks
      .map((b) => ({ type: 'paragraph', text: cleanText(b?.text ?? b) }))
      .filter((b) => b.text)
  }
  const flat = cleanText(content?.body)
  if (flat) return flat.split(/(?<=。)\s*/).filter(Boolean).map((text) => ({ type: 'paragraph', text }))
  return []
}

export function normalizeSchemes(
  payload,
  { date, format = 'newspaper', mode = 'standard' } = {},
) {
  const warnings = []
  const designMode = mode === 'design' || mode === 'free'
  const rawSchemes = Array.isArray(payload?.schemes) ? payload.schemes : []
  if (!rawSchemes.length) {
    throw new Error('模型返回中没有 schemes 数组。请重试，或检查模型是否支持 JSON 输出。')
  }
  if (rawSchemes.length < 3) {
    throw new Error(`模型只返回了 ${rawSchemes.length} 套方案（需要 3 套）。请重试。`)
  }
  if (rawSchemes.length > 3) {
    warnings.push(`模型返回了 ${rawSchemes.length} 套方案，已取前 3 套。`)
  }

  const usedVariants = new Set()
  const usedPresets = new Set()

  const schemes = rawSchemes.slice(0, 3).map((raw, index) => {
    const slot = SLOTS[index]

    let variant = VARIANTS[raw?.layout_variant] ? raw.layout_variant : null
    if (!variant) {
      warnings.push(`方案 ${slot.id} 的版式「${raw?.layout_variant ?? '空'}」不在白名单，已回退为 ${VARIANTS[slot.variant].name}。`)
      variant = slot.variant
    }
    if (usedVariants.has(variant) && !designMode) {
      const next = firstUnused(VARIANT_IDS, usedVariants, slot.variant)
      warnings.push(`方案 ${slot.id} 的版式与其它方案重复，已替换为 ${VARIANTS[next].name}。`)
      variant = next
    }
    usedVariants.add(variant)

    let preset = COLOR_PRESETS[raw?.color_preset] ? raw.color_preset : null
    if (!preset) {
      warnings.push(`方案 ${slot.id} 的配色「${raw?.color_preset ?? '空'}」不在白名单，已回退为 ${COLOR_PRESETS[slot.preset].name}。`)
      preset = slot.preset
    }
    if (usedPresets.has(preset) && !designMode) {
      const next = firstUnused(COLOR_PRESET_IDS, usedPresets, slot.preset)
      warnings.push(`方案 ${slot.id} 的配色与其它方案重复，已替换为 ${COLOR_PRESETS[next].name}。`)
      preset = next
    }
    usedPresets.add(preset)

    const variantDef = VARIANTS[variant]
    const font = FONT_PAIRINGS[raw?.font_pairing] ? raw.font_pairing : variantDef.defaultFont
    if (raw?.font_pairing && !FONT_PAIRINGS[raw.font_pairing]) {
      warnings.push(`方案 ${slot.id} 的字体搭配不在白名单，已回退为默认值。`)
    }

    const rawStyle = raw?.style || {}
    const columns = [1, 2, 3].includes(Number(rawStyle.columns)) ? Number(rawStyle.columns) : slot.columns
    const scale = SCALES.includes(rawStyle.headline_scale) ? rawStyle.headline_scale : slot.scale
    const treatment = TREATMENTS.includes(rawStyle.image_treatment)
      ? rawStyle.image_treatment
      : slot.treatment

    const content = raw?.content || {}

    let headline = clampText(cleanText(content.headline), 15)
    if (!headline) {
      headline = '未命名头版'
      warnings.push(`方案 ${slot.id} 缺少主标题，已使用占位标题。`)
    } else if (charLen(cleanText(content.headline)) > 15) {
      warnings.push(`方案 ${slot.id} 的主标题超过 15 字，已截断。`)
    }

    let subhead = clampText(cleanText(content.subhead), 25)
    if (charLen(cleanText(content.subhead)) > 25) {
      warnings.push(`方案 ${slot.id} 的副标题超过 25 字，已截断。`)
    }

    let caption = clampText(cleanText(content.caption), 30)
    let captionSecondary = clampText(cleanText(content.caption_secondary), 30)
    let posterNote = clampText(cleanText(content.poster_note), 30)
    let pullquote = clampText(cleanText(content.pullquote), 24)

    let bodyBlocks = paragraphsOf(content)
    if (bodyBlocks.length > 4) {
      const head = bodyBlocks.slice(0, 3)
      const rest = bodyBlocks.slice(3).map((b) => b.text).join('')
      bodyBlocks = [...head, { type: 'paragraph', text: rest }]
      warnings.push(`方案 ${slot.id} 的正文超过 4 段，已合并。`)
    }
    if (!bodyBlocks.length && !designMode) {
      bodyBlocks = [{ type: 'paragraph', text: subhead || '这一期的头版，留给一个普通的下午。' }]
      warnings.push(`方案 ${slot.id} 缺少正文，已用副标题兜底。`)
    }
    const bodyChars = bodyBlocks.reduce((sum, b) => sum + charLen(b.text), 0)
    if (!designMode && bodyChars < 120) {
      warnings.push(`方案 ${slot.id} 的正文只有 ${bodyChars} 字，偏短，版面会留白较多。`)
    }
    const bodyLimit = designMode ? 340 : 260
    if (bodyChars > bodyLimit) {
      let budget = bodyLimit
      bodyBlocks = bodyBlocks
        .map((b) => {
          if (budget <= 0) return null
          const text = clampText(b.text, budget)
          budget -= charLen(text)
          return text ? { ...b, text } : null
        })
        .filter(Boolean)
      warnings.push(`方案 ${slot.id} 的正文超过 ${bodyLimit} 字，已截断。`)
    }

    const name = clampText(cleanText(raw?.name), designMode ? 10 : 8) || variantDef.name
    const rationale = clampText(cleanText(raw?.design_rationale), designMode ? 50 : 40)

    const placeholders = Array.isArray(content.image_placeholders)
      ? content.image_placeholders
          .filter((item) => item && typeof item === 'object')
          .slice(0, 3)
          .map((item) => ({
            slot: cleanText(item.slot) === 'hero' ? 'hero' : 'secondary',
            aspect_ratio: clampText(cleanText(item.aspect_ratio), 10) || '3:4',
            purpose: clampText(cleanText(item.purpose), 30),
          }))
      : []

    return {
      id: slot.id,
      name,
      layout_variant: variant,
      color_preset: preset,
      font_pairing: font,
      style: {
        columns,
        headline_scale: scale,
        image_treatment: treatment,
        accent_color: COLOR_PRESETS[preset].accent,
      },
      content: {
        headline,
        subhead,
        body_blocks: bodyBlocks,
        caption,
        caption_secondary: captionSecondary,
        poster_note: posterNote,
        pullquote,
        date: date || clampText(cleanText(content.date), 20) || chineseDate(),
        image_placeholders: placeholders,
      },
      design_rationale: rationale || variantDef.tagline,
      ...(designMode ? { design_layout: normalizeDesignLayout(raw, format) } : {}),
      layouts: {
        newspaper: buildLayout(variant, 'newspaper'),
        poster: buildLayout(variant, 'poster'),
      },
    }
  })

  const summary = clampText(cleanText(payload?.summary), 60) ||
    '已生成三套头版方案，推荐 B：标题最有力，适合社交传播。'
  const match = summary.match(/(?:推荐|首选)\s*([ABC])/i)
  const recommended = match ? match[1].toUpperCase() : 'B'

  return {
    schemes,
    warnings,
    summary,
    recommended,
    meta: {
      date: clampText(cleanText(payload?.meta?.date), 20) || date,
      disclaimer: clampText(cleanText(payload?.meta?.disclaimer), 40) || '创意报纸版式，非真实新闻',
    },
    format,
  }
}

export function rebuildLayout(scheme, format, hasSub = false) {
  return {
    ...scheme,
    layouts: {
      ...scheme.layouts,
      [format]: buildLayout(scheme.layout_variant, format, hasSub),
    },
  }
}
