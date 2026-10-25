/**
 * SVG 图案安全层：严格限制在简单线条图，颜色只允许来自当前方案 palette。
 * 输出为 data URI，交给 <img> 渲染，避免 SVG 脚本进入父文档。
 */
const ALLOWED_TAGS = new Set([
  'svg',
  'g',
  'path',
  'line',
  'circle',
  'ellipse',
  'polyline',
  'polygon',
  'rect',
])

const ALLOWED_ATTRS = new Set([
  'xmlns',
  'viewBox',
  'preserveAspectRatio',
  'd',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'width',
  'height',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'points',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-dasharray',
  'fill-rule',
  'clip-rule',
  'opacity',
  'transform',
  'vector-effect',
])

const TOKEN_KEYS = ['ink', 'accent', 'muted', 'paper', 'secondary', 'tertiary']

function cleanNumber(value) {
  return String(value).replace(/[^\d.+-]/g, '')
}

function safeAttrValue(name, value, palette) {
  const raw = String(value || '').trim()
  if (raw.length > 400) return null
  if (/javascript:|data:|https?:|url\(/i.test(raw)) return null
  if (name === 'stroke') {
    const normalized = raw.toLowerCase()
    if (normalized === 'none' || normalized === 'currentcolor') return normalized
    const colors = Object.values(palette).map((color) => String(color).toLowerCase())
    return colors.includes(normalized) ? normalized : String(palette.accent).toLowerCase()
  }
  if (name === 'fill') {
    return raw.toLowerCase() === 'none' ? 'none' : null
  }
  if (name === 'viewBox') {
    const parts = raw.split(/[\s,]+/).map(Number)
    if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part)) || parts[2] <= 0 || parts[3] <= 0) {
      return null
    }
    return parts.join(' ')
  }
  if (name === 'transform') {
    if (!/^[-a-zA-Z0-9\s().,]+$/.test(raw)) return null
    return raw
  }
  if (name === 'd' || name === 'points' || name === 'stroke-dasharray') {
    if (!/^[-a-zA-Z0-9\s().,+]*$/.test(raw)) return null
    return raw
  }
  if (name === 'preserveAspectRatio') return raw
  if (name === 'xmlns') return 'http://www.w3.org/2000/svg'
  if (name === 'opacity') {
    const num = Number(raw)
    return Number.isFinite(num) && num >= 0 && num <= 1 ? String(num) : null
  }
  if (name === 'vector-effect') return raw === 'non-scaling-stroke' ? raw : null
  if (['stroke-linecap', 'stroke-linejoin'].includes(name)) {
    return ['butt', 'round', 'square', 'miter', 'bevel'].includes(raw) ? raw : null
  }
  if (name === 'fill-rule' || name === 'clip-rule') {
    return ['nonzero', 'evenodd'].includes(raw) ? raw : null
  }
  if (name === 'stroke-miterlimit') {
    const num = Number(raw)
    return Number.isFinite(num) ? String(num) : null
  }
  return cleanNumber(raw) || null
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

const DEFAULT_PALETTE = {
  background: '#FFFFFF',
  text: '#1A1A1A',
  accent: '#C8102E',
  secondary: '#4A4A4A',
  muted: '#9E9E9E',
  tertiary: '#C8102E',
}

export function colorizeSvg(svg, palette = DEFAULT_PALETTE) {
  let next = String(svg)
  for (const key of TOKEN_KEYS) {
    next = next.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), palette[key] || DEFAULT_PALETTE[key])
  }
  return next
}

/**
 * 返回 { ok, svg, dataUrl, viewBox, error }
 * 只接受线条图；遇到脚本、外链、文字、滤镜、渐变直接拒绝。
 */
export function sanitizeSvg(raw, palette = DEFAULT_PALETTE, fallbackViewBox = '0 0 600 450') {
  const safePalette = { ...DEFAULT_PALETTE, ...(palette || {}) }
  if (typeof raw !== 'string') return { ok: false, error: 'SVG 不是字符串' }
  if (raw.length > 16000) return { ok: false, error: 'SVG 过大' }

  const source = raw
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!doctype[\s\S]*?>/gi, '')
    .trim()

  if (!/^<svg[\s>]/i.test(source)) return { ok: false, error: '根节点不是 svg' }
  if (!/<\/svg>\s*$/i.test(source)) return { ok: false, error: 'SVG 未闭合' }
  if (
    /<\s*(script|foreignObject|image|use|style|animate|animateTransform|filter|text|tspan|iframe|object|embed)\b/i.test(
      source,
    )
  ) {
    return { ok: false, error: '包含不允许的 SVG 元素' }
  }
  if (
    /\son[a-z]+\s*=/i.test(source) ||
    /(?:xlink:)?href\s*=/i.test(source) ||
    /javascript:|data:|url\s*\(/i.test(source)
  ) {
    return { ok: false, error: '包含外链或脚本属性' }
  }
  const withoutXmlns = source.replace(
    /xmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/gi,
    '',
  )
  if (/https?:/i.test(withoutXmlns)) {
    return { ok: false, error: '包含外部 URL' }
  }

  const colorized = colorizeSvg(source, safePalette)
  const tagRe = /<\s*(\/?)\s*([a-zA-Z][\w:-]*)([^>]*?)(\/?)\s*>/g
  const attrRe = /([a-zA-Z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
  let out = ''
  let last = 0
  let tagCount = 0
  let rootSeen = false
  let viewBox = fallbackViewBox
  const stack = []
  let match

  while ((match = tagRe.exec(colorized))) {
    const [whole, closing, rawTag, rawAttrs, selfClosing] = match
    const tag = rawTag.toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) return { ok: false, error: `不允许的标签 ${tag}` }
    if (closing) {
      if (!stack.length || stack.pop() !== tag) {
        return { ok: false, error: 'SVG 标签未正确闭合' }
      }
      out += `</${tag}>`
      last = tagRe.lastIndex
      continue
    }
    tagCount += 1
    if (tagCount === 1 && tag !== 'svg') return { ok: false, error: '根节点不是 svg' }
    if (tag === 'svg') rootSeen = true

    const attrs = []
    let attr
    while ((attr = attrRe.exec(rawAttrs))) {
      const name = attr[1]
      const value = attr[2] ?? attr[3] ?? ''
      if (!ALLOWED_ATTRS.has(name)) continue
      // 统一由根节点 fill="none" 控制，避免重复 fill 属性导致 XML 无效。
      if (name === 'fill') continue
      const safe = safeAttrValue(name, value, safePalette)
      if (safe == null) continue
      if (name === 'viewBox') viewBox = safe
      attrs.push(`${name}="${escapeAttr(safe)}"`)
    }
    if (tag === 'svg' && !attrs.some((item) => item.startsWith('xmlns='))) {
      attrs.unshift('xmlns="http://www.w3.org/2000/svg"')
    }
    if (tag === 'svg' && !attrs.some((item) => item.startsWith('viewBox='))) {
      attrs.push(`viewBox="${fallbackViewBox}"`)
    }
    const fillNone = tag === 'svg' ? ' fill="none"' : ''
    out += `<${tag} ${attrs.join(' ')}${fillNone}${selfClosing ? ' /' : ''}>`
    if (!selfClosing) stack.push(tag)
    last = tagRe.lastIndex
  }

  if (!rootSeen) return { ok: false, error: '缺少 svg 根节点' }
  if (stack.length) return { ok: false, error: 'SVG 标签未闭合' }
  if (!viewBox) return { ok: false, error: '缺少 viewBox' }
  if (out.length > 12000) return { ok: false, error: '清理后的 SVG 过大' }
  const svg = out
  return {
    ok: true,
    svg,
    viewBox,
    dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  }
}

export function buildArtwork(svg, palette, { alt = '', symbols = [], concept = '', source = 'model' } = {}) {
  const result = sanitizeSvg(svg, palette)
  if (!result.ok) return null
  return {
    svg: result.svg,
    dataUrl: result.dataUrl,
    viewBox: result.viewBox,
    alt: alt || concept || '自由模式线条图案',
    symbols,
    concept,
    source,
  }
}

export function isSafeArtwork(dataUrl) {
  return typeof dataUrl === 'string' && dataUrl.startsWith('data:image/svg+xml')
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve(image)
    }
    image.onload = finish
    image.onerror = () => {
      if (settled) return
      settled = true
      reject(new Error('SVG 图案无法加载'))
    }
    image.src = src
    if (image.complete && image.naturalWidth) finish()
    setTimeout(() => {
      if (settled) return
      if (image.naturalWidth) {
        finish()
      } else {
        settled = true
        reject(new Error('SVG 图案无法加载'))
      }
    }, 1200)
  })
}

/**
 * 只在浏览器里把 SVG 光栅化成 PNG，供 html2canvas / 打印使用。
 * 预览仍保留 SVG；这个 PNG 作为 data-export-src 存在 artwork 上。
 */
export async function svgToPngDataUrl(svgDataUrl, width = 1200, height = 900) {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return ''
  const image = await loadImage(svgDataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(width, image.naturalWidth || 0)
  canvas.height = Math.max(height, image.naturalHeight || 0)
  const context = canvas.getContext('2d')
  if (!context) return ''
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}
