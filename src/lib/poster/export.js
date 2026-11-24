/**
 * 海报导出：内联 SVG → 2×/3× PNG。
 *
 * 关键点：SVG 作为图片光栅化时不会加载页面的 webfont，
 * 所以导出前把「海报用到的拉丁字体 + 艺术字」以 base64 @font-face 嵌进 SVG；
 * 中文使用系统字体（Songti SC / SimSun / PingFang / YaHei），预览与导出一致。
 *
 * 超过体积上限的艺术字不会进入海报链路（见 POSTER_ART_FONTS）；现有字体均已做 latin 子集，
 * constructivism 从 2.5MB 降到 28KB，导出体积可控。
 */
import { WEB_FONT_FILES } from '../../config/webFonts.js'
import { POSTER_ART_FONTS, POSTER_FONT_STACKS } from '../../config/posterTemplates.js'

const FONT_CACHE = new Map()

function bytesToBase64(bytes) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function fontFormat(path) {
  if (path.endsWith('.woff2')) return 'woff2'
  if (path.endsWith('.otf')) return 'opentype'
  return 'truetype'
}

async function fontDataUrl(path) {
  if (FONT_CACHE.has(path)) return FONT_CACHE.get(path)
  const res = await fetch(path)
  if (!res.ok) throw new Error(`字体加载失败：${path}`)
  const bytes = new Uint8Array(await res.arrayBuffer())
  const url = `data:font/${fontFormat(path)};base64,${bytesToBase64(bytes)}`
  FONT_CACHE.set(path, url)
  return url
}

export function posterUsedFamilies(scheme) {
  const stack = POSTER_FONT_STACKS[scheme?.font_pairing] || POSTER_FONT_STACKS.grotesk
  const families = new Set()
  for (const value of [stack.head, stack.body]) {
    for (const match of String(value).matchAll(/"([^"]+)"/g)) {
      families.add(match[1])
    }
  }
  const artFont = POSTER_ART_FONTS[scheme?.poster?.artFont]
  if (artFont) families.add(artFont.family)
  return families
}

/** 生成导出用的 @font-face 规则（只嵌入真正用到的字体）。 */
export async function posterFontFaceCss(scheme) {
  const families = posterUsedFamilies(scheme)
  const rules = []
  for (const entry of WEB_FONT_FILES) {
    if (!families.has(entry.family)) continue
    const url = await fontDataUrl(entry.file)
    rules.push(
      `@font-face{font-family:'${entry.family}';font-style:${entry.style};font-weight:${entry.weight};src:url(${url}) format('woff2');}`,
    )
  }
  const artFont = POSTER_ART_FONTS[scheme?.poster?.artFont]
  if (artFont) {
    const url = await fontDataUrl(artFont.file)
    rules.push(
      `@font-face{font-family:'${artFont.family}';font-style:normal;font-weight:400 900;src:url(${url}) format('${fontFormat(artFont.file)}');}`,
    )
  }
  return rules.join('')
}

export function serializePosterSvg(svgElement, fontCss = '') {
  if (!svgElement) throw new Error('海报画布还没准备好')
  const clone = svgElement.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  if (fontCss) {
    const defs = clone.querySelector('defs') || clone.insertBefore(clone.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'defs'), clone.firstChild)
    const style = clone.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'style')
    style.textContent = fontCss
    defs.appendChild(style)
  }
  return new XMLSerializer().serializeToString(clone)
}

function svgToDataUrl(svg) {
  const bytes = new TextEncoder().encode(svg)
  return `data:image/svg+xml;base64,${bytesToBase64(bytes)}`
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('海报无法光栅化'))
    image.src = src
  })
}

/**
 * @returns {Promise<{ dataUrl: string, width: number, height: number }>}
 */
export async function exportPosterPng(svgElement, { scheme, scale = 2, background = '#FFFFFF' } = {}) {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* ignore */
    }
  }
  const fontCss = await posterFontFaceCss(scheme)
  const svg = serializePosterSvg(svgElement, fontCss)
  const image = await loadImage(svgToDataUrl(svg))
  const width = Math.round((svgElement.viewBox?.baseVal?.width?.value || 800) * scale)
  const height = Math.round((svgElement.viewBox?.baseVal?.height?.value || 1000) * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('当前浏览器不支持 Canvas')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)
  return { dataUrl: canvas.toDataURL('image/png'), width, height }
}
