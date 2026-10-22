/**
 * 风格包：一次只展示三种风格，可在「经典三式 / 几何三式 / 系统三式」之间轮换。
 * 轮换只换模板、配色和字体，保留三套稿子的内容。
 */
import { VARIANTS, COLOR_PRESETS, FONT_PAIRINGS, buildLayout } from './presets.js'

export const STYLE_PACKS = [
  {
    id: 'classic',
    name: '经典三式',
    en: 'THE CLASSICS',
    tagline: '经典大报 · 小报冲击 · 极简报头',
    variants: ['classic_broadsheet', 'tabloid_bold', 'minimal_masthead'],
  },
  {
    id: 'geometry',
    name: '几何三式',
    en: 'GEOMETRY',
    tagline: '构成主义 · 包豪斯 · 风格派',
    variants: ['constructivism', 'bauhaus', 'de_stijl'],
  },
  {
    id: 'system',
    name: '系统三式',
    en: 'SYSTEMS',
    tagline: 'NASA 朋克 · 瑞士风格 · 卡带未来',
    variants: ['nasa_punk', 'swiss_style', 'cassette_futurism'],
  },
]

export const STYLE_PACK_IDS = STYLE_PACKS.map((pack) => pack.id)

export function getStylePack(id) {
  return STYLE_PACKS.find((pack) => pack.id === id) || STYLE_PACKS[0]
}

export function nextStylePack(id) {
  const index = STYLE_PACKS.findIndex((pack) => pack.id === id)
  return STYLE_PACKS[(index + 1) % STYLE_PACKS.length]
}

export function stylePackVariants(id) {
  const pack = getStylePack(id)
  return pack.variants.map((variantId) => VARIANTS[variantId]).filter(Boolean)
}

/**
 * 把一组方案套进某个风格包。
 * 保留 content / name / id / 角度，只替换版式、配色、字体和三套坐标。
 */
export function applyStylePack(schemes, packId, hasSub = false) {
  const pack = getStylePack(packId)
  return (schemes || []).map((scheme, index) => {
    const variantId = pack.variants[index % pack.variants.length]
    const variant = VARIANTS[variantId] || VARIANTS.classic_broadsheet
    const preset = COLOR_PRESETS[variant.defaultPreset] || COLOR_PRESETS.classic_serious
    const font = FONT_PAIRINGS[variant.defaultFont] || FONT_PAIRINGS.serif_serif
    return {
      ...scheme,
      layout_variant: variant.id,
      color_preset: preset.id,
      font_pairing: font.id,
      style: {
        ...scheme.style,
        columns: variant.defaultColumns,
        headline_scale: variant.defaultHeadlineScale,
        image_treatment: variant.defaultTreatment,
        accent_color: preset.accent,
      },
      design_rationale: variant.tagline,
      layouts: {
        newspaper: buildLayout(variant.id, 'newspaper', hasSub),
        poster: buildLayout(variant.id, 'poster', hasSub),
      },
    }
  })
}
