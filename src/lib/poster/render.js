/**
 * 海报渲染器：把 layoutPoster() 的结构 + 图案配方渲染成一张完整的 800×1000 SVG。
 *
 * 图层顺序（后画的在上）：
 *   纸底 → 底色块/斜切 → 背景几何 → 图案配方 → 主图 → 分隔线 → 文字层 → 纹理颗粒
 * 文字始终是 <text>，不转曲；颜色只来自 palette；纹理由 pattern 合成，不用 CSS filter。
 */
import { POSTER_ASSET_VERSION, POSTER_H, POSTER_W, POSTER_ART_FONTS } from '../../config/posterTemplates.js'
import {
  defaultRecipeParams,
  getPosterRecipe,
  resolveRecipeParams,
} from '../../config/posterPatterns.js'
import { baselineOf, layoutPoster } from './layout.js'

const ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }

export function xmlEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPE[ch])
}

/** SVG 属性里用单引号包字体名，避免与双引号冲突。 */
export function fontFamilyAttr(stack) {
  return String(stack || 'serif').replace(/"/g, "'").replace(/&/g, '&amp;')
}

function colorOf(role, palette) {
  if (role === 'paper') return palette.paper
  if (role === 'accent') return palette.accent
  if (role === 'secondary') return palette.secondary
  if (role === 'muted') return palette.muted
  if (role === 'tertiary') return palette.tertiary
  return palette.ink
}

function pointsAttr(points) {
  return points
    .map(([x, y]) => `${((Number(x) / 100) * POSTER_W).toFixed(2)},${((Number(y) / 100) * POSTER_H).toFixed(2)}`)
    .join(' ')
}

function renderDecor(decor, palette) {
  return (decor || [])
    .map((item) => {
      const color = colorOf(item.color, palette)
      const opacity = item.opacity == null ? 1 : item.opacity
      if (item.kind === 'polygon') {
        return `<polygon points="${pointsAttr(item.points || [])}" fill="${color}" opacity="${opacity}"/>`
      }
      if (item.kind === 'band' || item.kind === 'block') {
        const x = (Number(item.x) / 100) * POSTER_W
        const y = (Number(item.y) / 100) * POSTER_H
        const w = (Number(item.w) / 100) * POSTER_W
        const h = (Number(item.h) / 100) * POSTER_H
        const rotate = item.rotate
          ? ` transform="rotate(${item.rotate} ${(x + w / 2).toFixed(2)} ${(y + h / 2).toFixed(2)})"`
          : ''
        return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${color}" opacity="${opacity}"${rotate}/>`
      }
      if (item.kind === 'rule') {
        const x = (Number(item.x) / 100) * POSTER_W
        const y = (Number(item.y) / 100) * POSTER_H
        const w = (Number(item.w) / 100) * POSTER_W
        return `<line x1="${x.toFixed(2)}" y1="${y.toFixed(2)}" x2="${(x + w).toFixed(2)}" y2="${y.toFixed(2)}" stroke="${color}" stroke-width="${item.thickness || 1}" opacity="${opacity}"/>`
      }
      if (item.kind === 'grid') {
        const x = (Number(item.x) / 100) * POSTER_W
        const y = (Number(item.y) / 100) * POSTER_H
        const w = (Number(item.w) / 100) * POSTER_W
        const h = (Number(item.h) / 100) * POSTER_H
        const cols = Math.max(2, Math.min(24, Math.round(item.columns || 12)))
        const lines = []
        for (let i = 0; i <= cols; i += 1) {
          const gx = x + (w / cols) * i
          lines.push(
            `<line x1="${gx.toFixed(2)}" y1="${y.toFixed(2)}" x2="${gx.toFixed(2)}" y2="${(y + h).toFixed(2)}" stroke="${color}" stroke-width="1" opacity="${opacity}"/>`,
          )
        }
        return lines.join('')
      }
      if (item.kind === 'frame') {
        const x = (Number(item.x) / 100) * POSTER_W
        const y = (Number(item.y) / 100) * POSTER_H
        const w = (Number(item.w) / 100) * POSTER_W
        const h = (Number(item.h) / 100) * POSTER_H
        const rotate = item.rotate
          ? ` transform="rotate(${item.rotate} ${(x + w / 2).toFixed(2)} ${(y + h / 2).toFixed(2)})"`
          : ''
        return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="none" stroke="${color}" stroke-width="${item.thickness || 1}" opacity="${opacity}"${rotate}/>`
      }
      if (item.kind === 'vrule') {
        const x = (Number(item.x) / 100) * POSTER_W
        const y = (Number(item.y) / 100) * POSTER_H
        const h = (Number(item.h) / 100) * POSTER_H
        return `<line x1="${x.toFixed(2)}" y1="${y.toFixed(2)}" x2="${x.toFixed(2)}" y2="${(y + h).toFixed(2)}" stroke="${color}" stroke-width="${item.thickness || 1}" opacity="${opacity}"/>`
      }
      if (item.kind === 'badge') {
        const cx = (Number(item.x) / 100) * POSTER_W
        const cy = (Number(item.y) / 100) * POSTER_H
        const r = (Number(item.r || 2.2) / 100) * POSTER_W
        const textColor = colorOf(item.textColor || 'paper', palette)
        const label = String(item.text || '').slice(0, 3)
        return `<g opacity="${opacity}"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}"/><text x="${cx.toFixed(1)}" y="${(cy + r * 0.34).toFixed(1)}" font-family="'Source Sans 3','Microsoft YaHei',Arial,sans-serif" font-size="${(r * 1.05).toFixed(1)}" font-weight="700" letter-spacing="0" fill="${textColor}" text-anchor="middle">${xmlEscape(label)}</text></g>`
      }
      if (item.kind === 'corners') {
        const x = (Number(item.x) / 100) * POSTER_W
        const y = (Number(item.y) / 100) * POSTER_H
        const w = (Number(item.w) / 100) * POSTER_W
        const h = (Number(item.h) / 100) * POSTER_H
        const len = (Number(item.len ?? 3) / 100) * POSTER_W
        const t = item.thickness || 1.4
        const lines = [
          [x, y, x + len, y], [x, y, x, y + len],
          [x + w, y, x - len, y], [x + w, y, x + w, y + len],
          [x, y + h, x + len, y + h], [x, y + h, x, y + h - len],
          [x + w, y + h, x - len, y + h], [x + w, y + h, x + w, y + h - len],
        ]
        return lines
          .map(([x1, y1, x2, y2]) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${t}" opacity="${opacity}"/>`)
          .join('')
      }
      if (item.kind === 'dots') {
        const x = (Number(item.x) / 100) * POSTER_W
        const y = (Number(item.y) / 100) * POSTER_H
        const w = (Number(item.w) / 100) * POSTER_W
        const h = (Number(item.h) / 100) * POSTER_H
        const cols = Math.max(1, Math.min(30, Math.round(item.cols || 8)))
        const rows = Math.max(1, Math.min(12, Math.round(item.rows || 1)))
        const r = Number(item.r || 1.6)
        const parts = []
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            const cx = x + (cols === 1 ? w / 2 : (w / (cols - 1)) * col)
            const cy = y + (rows === 1 ? 0 : (h / (rows - 1)) * row)
            parts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${color}" opacity="${opacity}"/>`)
          }
        }
        return parts.join('')
      }
      if (item.kind === 'squares') {
        const x = (Number(item.x) / 100) * POSTER_W
        const y = (Number(item.y) / 100) * POSTER_H
        const size = Number(item.size || 8)
        const gap = Number(item.gap || 4)
        const count = Math.max(1, Math.min(16, Math.round(item.count || 4)))
        const parts = []
        for (let i = 0; i < count; i += 1) {
          parts.push(`<rect x="${(x + i * (size + gap)).toFixed(1)}" y="${y.toFixed(1)}" width="${size}" height="${size}" fill="${color}" opacity="${opacity}"/>`)
        }
        return parts.join('')
      }
      if (item.kind === 'bars') {
        const x = (Number(item.x) / 100) * POSTER_W
        const y = (Number(item.y) / 100) * POSTER_H
        const w = (Number(item.w) / 100) * POSTER_W
        const h = (Number(item.h) / 100) * POSTER_H
        const count = Math.max(3, Math.min(40, Math.round(item.count || 14)))
        const step = w / count
        const parts = []
        for (let i = 0; i < count; i += 1) {
          const ratio = (i * 37 + 11) % 100
          const bh = h * (0.35 + (ratio / 100) * 0.65)
          const bw = Math.max(1.2, step * (i % 3 === 0 ? 0.72 : 0.4))
          parts.push(`<rect x="${(x + step * i).toFixed(1)}" y="${(y + h - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${color}" opacity="${opacity}"/>`)
        }
        return parts.join('')
      }
      if (item.kind === 'scrim') {
        const x = (Number(item.x) / 100) * POSTER_W
        const y = (Number(item.y) / 100) * POSTER_H
        const w = (Number(item.w) / 100) * POSTER_W
        const h = (Number(item.h) / 100) * POSTER_H
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" opacity="${opacity}"/>`
      }
      if (item.kind === 'cutBlock' || item.kind === 'cutFrame') {
        const x = (Number(item.x) / 100) * POSTER_W
        const y = (Number(item.y) / 100) * POSTER_H
        const w = (Number(item.w) / 100) * POSTER_W
        const h = (Number(item.h) / 100) * POSTER_H
        const cut = (Number(item.cut ?? 4) / 100) * POSTER_W
        const corner = item.corner || 'tr'
        let points
        if (corner === 'both') {
          points = `${x},${y} ${x + w - cut},${y} ${x + w},${y + cut} ${x + w},${y + h} ${x + cut},${y + h} ${x},${y + h - cut}`
        } else if (corner === 'br') {
          points = `${x},${y} ${x + w},${y} ${x + w},${y + h - cut} ${x + w - cut},${y + h} ${x},${y + h}`
        } else {
          points = `${x},${y} ${x + w - cut},${y} ${x + w},${y + cut} ${x + w},${y + h} ${x},${y + h}`
        }
        if (item.kind === 'cutFrame') {
          return `<polygon points="${points}" fill="none" stroke="${color}" stroke-width="${item.thickness || 1.2}" opacity="${opacity}"/>`
        }
        return `<polygon points="${points}" fill="${color}" opacity="${opacity}"/>`
      }
      if (item.kind === 'triColor') {
        const x = (Number(item.x) / 100) * POSTER_W
        const y = (Number(item.y) / 100) * POSTER_H
        const w = (Number(item.w) / 100) * POSTER_W
        const h = (Number(item.h || 0.35) / 100) * POSTER_H
        const gap = Number(item.gap || 0)
        const segment = (w - gap * 2) / 3
        return [
          `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${segment.toFixed(1)}" height="${h.toFixed(1)}" fill="${palette.tertiary || palette.accent}" opacity="${opacity}"/>`,
          `<rect x="${(x + segment + gap).toFixed(1)}" y="${y.toFixed(1)}" width="${segment.toFixed(1)}" height="${h.toFixed(1)}" fill="${palette.accent}" opacity="${opacity}"/>`,
          `<rect x="${(x + (segment + gap) * 2).toFixed(1)}" y="${y.toFixed(1)}" width="${segment.toFixed(1)}" height="${h.toFixed(1)}" fill="${palette.quaternary || palette.secondary}" opacity="${opacity}"/>`,
        ].join('')
      }
      if (item.kind === 'contour') {
        const x = (Number(item.x) / 100) * POSTER_W
        const y = (Number(item.y) / 100) * POSTER_H
        const w = (Number(item.w) / 100) * POSTER_W
        const h = (Number(item.h) / 100) * POSTER_H
        const lines = Math.max(2, Math.min(18, Math.round(item.lines || 7)))
        const amp = (Number(item.amplitude ?? 3) / 100) * POSTER_H
        const parts = []
        for (let i = 0; i < lines; i += 1) {
          const yb = y + (h / (lines + 1)) * (i + 1)
          const d = `M ${x.toFixed(1)} ${yb.toFixed(1)} C ${(x + w * 0.24).toFixed(1)} ${(yb - amp).toFixed(1)}, ${(x + w * 0.52).toFixed(1)} ${(yb + amp).toFixed(1)}, ${(x + w).toFixed(1)} ${yb.toFixed(1)}`
          parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${item.thickness || 0.9}" opacity="${opacity}"/>`)
        }
        return parts.join('')
      }
      return ''
    })
    .join('')
}

function renderTextBlock(block) {
  const anchor = block.align === 'center' ? 'middle' : block.align === 'right' ? 'end' : 'start'
  const x = block.align === 'center' ? block.x + block.w / 2 : block.align === 'right' ? block.x + block.w : block.x
  const rotate = block.rotate
    ? ` transform="rotate(${block.rotate} ${(block.x + block.w / 2).toFixed(2)} ${(block.y + (block.h || 0) / 2).toFixed(2)})"`
    : ''
  const tspans = block.lines
    .map((line, index) => {
      const y = baselineOf(block, index)
      return `<tspan x="${x.toFixed(2)}" y="${y.toFixed(2)}">${xmlEscape(line)}</tspan>`
    })
    .join('')
  const fill = block.outline ? 'none' : block.color
  const stroke = block.outline ? block.color : 'none'
  return `<g data-block="${block.id}"${rotate}><text x="${x.toFixed(2)}" y="${baselineOf(block, 0).toFixed(2)}" font-family="${fontFamilyAttr(block.font)}" font-size="${block.size}" font-weight="${block.weight}" letter-spacing="${block.tracking}" fill="${fill}" stroke="${stroke}" stroke-width="${block.strokeWidth || 0}" stroke-linejoin="round" opacity="${block.opacity ?? 1}" text-anchor="${anchor}">${tspans}</text></g>`
}

function renderShapes(shapes, palette) {
  if (!Array.isArray(shapes)) return ''
  return shapes
    .slice(0, 8)
    .map((shape) => {
      const color = colorOf(shape.role, palette)
      const opacity = shape.opacity == null ? 0.85 : shape.opacity
      const cx = Number(shape.x) * POSTER_W
      const cy = Number(shape.y) * POSTER_H
      if (shape.kind === 'circle') {
        const r = Math.max(8, Number(shape.r) * Math.min(POSTER_W, POSTER_H))
        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${opacity}"/>`
      }
      if (shape.kind === 'rect') {
        const w = Math.max(10, Number(shape.w || 0.16) * POSTER_W)
        const h = Math.max(10, Number(shape.h || 0.12) * POSTER_H)
        return `<rect x="${(cx - w / 2).toFixed(1)}" y="${(cy - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}" opacity="${opacity}"/>`
      }
      if (shape.kind === 'triangle') {
        const s = Math.max(20, Number(shape.r || 0.1) * POSTER_W)
        return `<polygon points="${(cx - s).toFixed(1)},${(cy + s).toFixed(1)} ${(cx + s).toFixed(1)},${(cy + s).toFixed(1)} ${cx.toFixed(1)},${(cy - s).toFixed(1)}" fill="${color}" opacity="${opacity}"/>`
      }
      if (shape.kind === 'line') {
        const x2 = Number(shape.x2 ?? Number(shape.x) + 0.3) * POSTER_W
        const y2 = Number(shape.y2 ?? shape.y) * POSTER_H
        return `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${shape.strokeWidth || 2}" opacity="${opacity}"/>`
      }
      if (shape.kind === 'arc') {
        const r = Math.max(10, Number(shape.r || 0.14) * POSTER_W)
        return `<path d="M${(cx - r).toFixed(1)} ${cy.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx + r).toFixed(1)} ${cy.toFixed(1)}" fill="none" stroke="${color}" stroke-width="${shape.strokeWidth || 2}" opacity="${opacity}"/>`
      }
      return ''
    })
    .join('')
}

function paperPatternDefs(grain, id = 'fplGrain') {
  if (!(grain > 0)) return ''
  return `<pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse">
    <circle cx="1.5" cy="2" r="0.55" fill="#000" fill-opacity="0.05"/>
    <circle cx="6.5" cy="6.5" r="0.4" fill="#000" fill-opacity="0.04"/>
  </pattern>`
}

/**
 * @param scheme 方案（含 poster 规格）
 * @param {{ photo?: { dataUrl?: string }, photo2?: { dataUrl?: string } }} options
 * @returns {{ svg: string, meta: object }}
 */
export function renderPosterSvg(scheme, { photo, photo2 } = {}) {
  const layout = layoutPoster(scheme)
  const { template, variant, palette, fonts, artBox, hero, blocks, decor, size } = layout
  const poster = scheme?.poster || {}
  const recipe = getPosterRecipe(poster.art?.recipe)
  const seed = Number.isFinite(Number(poster.art?.seed)) ? Number(poster.art.seed) : 0
  const params = recipe
    ? resolveRecipeParams(recipe.id, { ...defaultRecipeParams(recipe.id), ...(poster.art?.params || {}) })
    : {}
  const hasPhoto = Boolean(photo?.dataUrl)
  const hasPhoto2 = Boolean(photo2?.dataUrl)
  const grain = Number(poster.textures?.grain) || 0
  // 同一页面上可能同时内联多张海报（画廊三张），clipPath / pattern 的 id 必须逐张唯一，
  // 否则 url(#id) 会命中第一张的裁切框。
  const uid = `p${`${scheme?.id || 'X'}${template.id}${variant.id}${seed}`.replace(/[^a-zA-Z0-9]/g, '')}`
  const artClipId = `${uid}-artClip`
  const heroClipId = `${uid}-heroClip`
  const grainId = `${uid}-grain`
  const monoFilterId = `${uid}-mono`
  const photoFilter = variant.photoFilter === 'mono' ? monoFilterId : ''

  const heroShape = variant.heroShape || 'rect'
  const patternClipId = variant.artClip === 'hero' ? heroClipId : artClipId
  const foregroundKinds = new Set([
    'rule',
    'frame',
    'badge',
    'corners',
    'cutFrame',
    'triColor',
    'contour',
    'scrim',
  ])
  const isForeground = (item) => item.layer === 'foreground' || foregroundKinds.has(item.kind)
  const backgroundDecor = decor.filter((item) => !isForeground(item))
  const foregroundDecor = decor.filter((item) => isForeground(item))

  const patternMarkup =
    recipe && !hasPhoto
      ? `<g clip-path="url(#${patternClipId})">${recipe.render({ seed, params, palette, box: artBox })}</g>`
      : ''

  const photoMarkup = hasPhoto
    ? `<g clip-path="url(#${heroClipId})"><image href="${xmlEscape(photo.dataUrl)}" x="${hero.x}" y="${hero.y}" width="${hero.w}" height="${hero.h}" preserveAspectRatio="xMidYMid slice"${photoFilter ? ` filter="url(#${photoFilter})"` : ''}/></g>`
    : ''

  // 子图：模板可指定 secondary 框；没指定时缩在 hero 的右下角，做拼贴式小图。
  const secondaryBox = variant.secondary
    ? {
        x: (Number(variant.secondary.x) / 100) * POSTER_W,
        y: (Number(variant.secondary.y) / 100) * POSTER_H,
        w: (Number(variant.secondary.w) / 100) * POSTER_W,
        h: (Number(variant.secondary.h) / 100) * POSTER_H,
      }
    : {
        x: hero.x + hero.w * 0.62,
        y: hero.y + hero.h * 0.6,
        w: Math.max(110, hero.w * 0.32),
        h: Math.max(80, hero.h * 0.34),
      }
  const secondaryMarkup = hasPhoto2
    ? (() => {
        const pad = 8
        const rotate = Number(variant.secondary?.rotate ?? (variant.id === 'loud' ? -2.4 : 2.4))
        const cx = secondaryBox.x + secondaryBox.w / 2
        const cy = secondaryBox.y + secondaryBox.h / 2
        return `<g data-secondary="1" transform="rotate(${rotate} ${cx.toFixed(1)} ${cy.toFixed(1)})"><rect x="${(secondaryBox.x + 5).toFixed(1)}" y="${(secondaryBox.y + 7).toFixed(1)}" width="${(secondaryBox.w + pad * 2).toFixed(1)}" height="${(secondaryBox.h + pad * 2).toFixed(1)}" fill="${palette.ink}" opacity="0.2"/><rect x="${(secondaryBox.x - pad).toFixed(1)}" y="${(secondaryBox.y - pad).toFixed(1)}" width="${(secondaryBox.w + pad * 2).toFixed(1)}" height="${(secondaryBox.h + pad * 2).toFixed(1)}" fill="${palette.paper}" opacity="0.98"/><image href="${xmlEscape(photo2.dataUrl)}" x="${secondaryBox.x.toFixed(1)}" y="${secondaryBox.y.toFixed(1)}" width="${secondaryBox.w.toFixed(1)}" height="${secondaryBox.h.toFixed(1)}" preserveAspectRatio="xMidYMid slice"${photoFilter ? ` filter="url(#${photoFilter})"` : ''}/><rect x="${secondaryBox.x.toFixed(1)}" y="${secondaryBox.y.toFixed(1)}" width="${secondaryBox.w.toFixed(1)}" height="${secondaryBox.h.toFixed(1)}" fill="none" stroke="${palette.ink}" stroke-width="0.8" opacity="0.55"/></g>`
      })()
    : ''

  const artFontFamily = POSTER_ART_FONTS[layout.artFont]?.family || ''
  const textMarkup = blocks
    .map((block) => {
      const next =
        ['artWord', 'ghost'].includes(block.id) && artFontFamily
          ? { ...block, font: artFontFamily }
          : block
      return renderTextBlock(next)
    })
    .join('')

  const margin = template.safe?.side ?? 7
  const heroCut = (Number(variant.heroCut ?? 7) / 100) * hero.w
  const heroClip =
    heroShape === 'circle'
      ? `<circle cx="${(hero.x + hero.w / 2).toFixed(2)}" cy="${(hero.y + hero.h / 2).toFixed(2)}" r="${(
          Math.min(hero.w, hero.h) / 2
        ).toFixed(2)}"/>`
      : heroShape === 'cut'
        ? `<polygon points="${hero.x},${hero.y} ${(hero.x + hero.w - heroCut).toFixed(1)},${hero.y} ${(hero.x + hero.w).toFixed(1)},${(hero.y + heroCut).toFixed(1)} ${(hero.x + hero.w).toFixed(1)},${(hero.y + hero.h).toFixed(1)} ${(hero.x + heroCut).toFixed(1)},${(hero.y + hero.h).toFixed(1)} ${hero.x},${(hero.y + hero.h - heroCut).toFixed(1)}"/>`
        : `<rect x="${hero.x}" y="${hero.y}" width="${hero.w}" height="${hero.h}"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size.width} ${size.height}" width="${size.width}" height="${size.height}" data-poster="1" data-assets="${POSTER_ASSET_VERSION}" data-template="${template.id}" data-variant="${variant.id}" data-recipe="${recipe?.id || 'none'}" data-seed="${seed}" data-hero-shape="${heroShape}" data-photo-filter="${variant.photoFilter || 'none'}" role="img" aria-label="${xmlEscape(scheme?.content?.headline || '海报')}">
  <title>${xmlEscape(scheme?.content?.headline || '海报')}</title>
  <desc>${xmlEscape(`${template.name} · ${recipe?.label || '无图案'} · seed ${seed} · assets ${POSTER_ASSET_VERSION} · ${margin}% 安全区`)}</desc>
  <defs>
    ${paperPatternDefs(grain, grainId)}
    ${photoFilter ? `<filter id="${monoFilterId}"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.18" intercept="-0.06"/><feFuncG type="linear" slope="1.18" intercept="-0.06"/><feFuncB type="linear" slope="1.18" intercept="-0.06"/></feComponentTransfer></filter>` : ''}
    <clipPath id="${artClipId}"><rect x="${artBox.x}" y="${artBox.y}" width="${artBox.w}" height="${artBox.h}"/></clipPath>
    <clipPath id="${heroClipId}">${heroClip}</clipPath>
  </defs>
  <rect width="${size.width}" height="${size.height}" fill="${palette.paper}"/>
  ${backgroundDecor ? renderDecor(backgroundDecor, palette) : ''}
  ${renderShapes(poster.art?.shapes, palette)}
  ${patternMarkup}
  ${photoMarkup}
  ${secondaryMarkup}
  ${foregroundDecor ? renderDecor(foregroundDecor, palette) : ''}
  ${textMarkup}
  ${grain > 0 ? `<rect width="${size.width}" height="${size.height}" fill="url(#${grainId})" opacity="${grain}"/>` : ''}
</svg>`

  return {
    svg,
    meta: {
      template: template.id,
      variant: variant.id,
      recipe: recipe?.id || '',
      seed,
      assetsVersion: POSTER_ASSET_VERSION,
      size: { width: size.width, height: size.height },
      blocks: blocks.map((block) => ({
        id: block.id,
        size: block.size,
        lines: block.lines.length,
        truncated: block.truncated,
      })),
      hasPhoto,
      hasPhoto2,
      photoFilter: variant.photoFilter || '',
    },
  }
}

export { POSTER_W, POSTER_H }
