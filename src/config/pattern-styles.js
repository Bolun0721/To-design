/** 九套模板的图案配方：线宽 / 填充 / 阴影 / 透明度。 */
import { VARIANTS } from './presets.js'

const STYLES = {
  classic_broadsheet: {
    strokeWidth: 1.25,
    fill: 'none',
    shadow: 0,
    opacity: 0.95,
    line: '细线 / 双线 / 表格感',
  },
  tabloid_bold: {
    strokeWidth: 2.4,
    fill: 'soft-ink',
    shadow: 2,
    opacity: 1,
    line: '粗斜线 / 放射 / 强对比',
  },
  minimal_masthead: {
    strokeWidth: 1,
    fill: 'none',
    shadow: 0,
    opacity: 0.8,
    line: '单线 / 大留白',
  },
  constructivism: {
    strokeWidth: 2.2,
    fill: 'soft-accent',
    shadow: 1,
    opacity: 1,
    line: '斜切 / 红黑 / 几何块',
  },
  bauhaus: {
    strokeWidth: 1.8,
    fill: 'soft-accent',
    shadow: 0,
    opacity: 1,
    line: '圆 / 半圆 / 弧线',
  },
  de_stijl: {
    strokeWidth: 2,
    fill: 'soft-ink',
    shadow: 1,
    opacity: 0.95,
    line: '网格 / 矩形 / 直线',
  },
  nasa_punk: {
    strokeWidth: 1.3,
    fill: 'none',
    shadow: 1,
    opacity: 0.95,
    line: '十字准星 / 坐标线',
  },
  swiss_style: {
    strokeWidth: 1.1,
    fill: 'none',
    shadow: 0,
    opacity: 0.9,
    line: '网格 / 箭头 / 极简',
  },
  cassette_futurism: {
    strokeWidth: 1.6,
    fill: 'soft-accent',
    shadow: 0,
    opacity: 1,
    line: '波形 / 像素线 / 扫描线',
  },
}

const FILLS = ['none', 'soft-accent', 'soft-ink']

function clamp(value, min, max, fallback) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.min(max, Math.max(min, num))
}

export function resolvePatternStyle(variantId, override = {}) {
  const base = STYLES[variantId] || STYLES.classic_broadsheet
  return {
    ...base,
    strokeWidth: clamp(override?.strokeWidth, 0.8, 3, base.strokeWidth),
    fill: FILLS.includes(override?.fill) ? override.fill : base.fill,
    shadow: Math.round(clamp(override?.shadow, 0, 2, base.shadow)),
    opacity: clamp(override?.opacity, 0.6, 1, base.opacity),
  }
}

export const PATTERN_STYLE_TABLE = Object.entries(STYLES)
  .map(([id, style]) => {
    const variant = VARIANTS[id]
    return `- ${id}｜${variant?.name || id}｜线宽 ${style.strokeWidth}｜填充 ${style.fill}｜阴影 ${style.shadow}｜透明度 ${style.opacity}｜${style.line}`
  })
  .join('\n')
