import { h } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import htm from 'htm'
import { FORMATS, resolveStyle, headlinePx, hexHue } from '../config/presets.js'
import { chineseDate, weekdayCN, clamp, round } from '../lib/format.js'

const html = htm.bind(h)

const BLOCK_LABELS = {
  masthead: '报头',
  dateline: '日期栏',
  headline: '主标题',
  subhead: '副标题',
  byline: '署名',
  image: '主图',
  caption: '图注',
  body: '正文',
  pullquote: '引语',
  note: '海报注记',
  footer: '页脚',
  scrim: '压暗层',
}

const SNAP_X = [0, 5, 50, 95]
const SNAP_Y = [0, 5, 50, 95]

function snapValue(value, candidates, tolerance) {
  let best = value
  let bestDist = tolerance + 0.001
  for (const c of candidates) {
    const d = Math.abs(value - c)
    if (d < bestDist) {
      best = c
      bestDist = d
    }
  }
  return best
}

function useLatest(value) {
  const ref = useRef(value)
  ref.current = value
  return ref
}

export function Paper({
  scheme,
  format = 'newspaper',
  photo = null,
  photo2 = null,
  scale = 1,
  interactive = false,
  paperRef = null,
  disclaimer = '创意报纸版式，非真实新闻',
  className = '',
  onBlockCommit = null,
  onEditText = null,
}) {
  const dims = FORMATS[format]
  const st = resolveStyle(scheme)
  const rawLayout = scheme.layouts?.[format] || []
  const layout = rawLayout.filter((block) => block.slot !== 'secondary' || Boolean(photo2))
  const content = scheme.content
  const headlineSize = headlinePx(scheme.layout_variant, format, st.headlineScale)
  const duoHue = Math.round(hexHue(st.palette.accent) - 38)
  const commitRef = useLatest(onBlockCommit)
  const editRef = useLatest(onEditText)

  const styleStr = [
    `--pw:${dims.width}px`,
    `--ph:${dims.height}px`,
    `--paper-bg:${st.palette.background}`,
    `--ink:${st.palette.text}`,
    `--accent:${st.palette.accent}`,
    `--secondary:${st.palette.secondary}`,
    `--muted:${st.palette.muted}`,
    `--tertiary:${st.palette.tertiary}`,
    `--quaternary:${st.palette.quaternary}`,
    `--font-head:${st.font.headline}`,
    `--font-body:${st.font.body}`,
    `--headline-size:${headlineSize}px`,
    `--cols:${st.columns}`,
    `--duo-hue:${duoHue}deg`,
  ].join(';')

  /* ---------------- 拖动 / 缩放 / 双击改字 ---------------- */
  useEffect(() => {
    if (!interactive) return
    const paper = paperRef?.current
    if (!paper) return

    let cancelDrag = null

    const onPointerDown = (event) => {
      if (event.button !== 0) return
      const target = event.target
      if (target.closest('[contenteditable="true"]')) return
      if (target.closest('.guide-v, .guide-h, .guide-tag, .margin-guide')) return
      const blockEl = target.closest('[data-block-id]')
      if (!blockEl || blockEl.dataset.type === 'scrim') return

      const isResize = Boolean(target.closest('[data-resize]'))
      const paperRect = paper.getBoundingClientRect()
      const startX = event.clientX
      const startY = event.clientY
      const startLeft = parseFloat(blockEl.style.left)
      const startTop = parseFloat(blockEl.style.top)
      const startWidth = parseFloat(blockEl.style.width)
      const startHeight = blockEl.style.height ? parseFloat(blockEl.style.height) : null
      const pointerId = event.pointerId

      event.preventDefault()
      event.stopPropagation()

      const guideV = paper.querySelector('.guide-v')
      const guideH = paper.querySelector('.guide-h')
      const guideTag = paper.querySelector('.guide-tag')

      blockEl.classList.add('is-dragging')
      paper.classList.add('is-dragging')
      document.body.classList.add('is-block-dragging')
      if (paper.setPointerCapture) {
        try {
          paper.setPointerCapture(pointerId)
        } catch {
          /* ignore */
        }
      }

      let moved = false

      const move = (ev) => {
        const dx = ((ev.clientX - startX) / paperRect.width) * 100
        const dy = ((ev.clientY - startY) / paperRect.height) * 100
        if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) moved = true

        if (isResize) {
          const w = round(clamp(startWidth + dx, 10, 100 - startLeft), 1)
          blockEl.style.width = `${w}%`
          if (startHeight != null) {
            const h = round(clamp(startHeight + dy, 6, 100 - startTop), 1)
            blockEl.style.height = `${h}%`
          }
          if (guideTag) {
            guideTag.textContent = `${w.toFixed(1)}%`
            guideTag.style.left = `${startLeft}%`
            guideTag.style.top = `${startTop}%`
            guideTag.style.display = 'block'
          }
          return
        }

        let x = clamp(startLeft + dx, 0, 100 - startWidth)
        let y = clamp(startTop + dy, 0, 97)
        const sx = snapValue(x, SNAP_X, 0.9)
        const sy = snapValue(y, SNAP_Y, 0.9)
        if (Math.abs(sx - x) < 0.9) x = sx
        if (Math.abs(sy - y) < 0.9) y = sy

        blockEl.style.left = `${round(x, 1)}%`
        blockEl.style.top = `${round(y, 1)}%`

        if (guideV) {
          guideV.style.left = `${x}%`
          guideV.style.display = 'block'
        }
        if (guideH) {
          guideH.style.top = `${y}%`
          guideH.style.display = 'block'
        }
        if (guideTag) {
          guideTag.textContent = `${x.toFixed(1)} · ${y.toFixed(1)}`
          guideTag.style.left = `${x}%`
          guideTag.style.top = `${y}%`
          guideTag.style.display = 'block'
        }
      }

      const finish = (commit) => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        if (paper.releasePointerCapture) {
          try {
            paper.releasePointerCapture(pointerId)
          } catch {
            /* ignore */
          }
        }
        blockEl.classList.remove('is-dragging')
        paper.classList.remove('is-dragging')
        document.body.classList.remove('is-block-dragging')
        if (guideV) guideV.style.display = 'none'
        if (guideH) guideH.style.display = 'none'
        if (guideTag) guideTag.style.display = 'none'
        cancelDrag = null

        if (!commit || !moved) return
        const patch = isResize
          ? {
              w: parseFloat(blockEl.style.width),
              ...(startHeight != null ? { h: parseFloat(blockEl.style.height) } : {}),
            }
          : {
              x: parseFloat(blockEl.style.left),
              y: parseFloat(blockEl.style.top),
            }
        if (commitRef.current) commitRef.current(blockEl.dataset.blockId, patch)
      }

      const onUp = () => finish(true)

      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
      cancelDrag = () => finish(false)
    }

    const onDoubleClick = (event) => {
      const el = event.target.closest('[data-edit]')
      if (!el) return
      event.preventDefault()
      event.stopPropagation()
      if (el.getAttribute('contenteditable') === 'true') return

      const original = el.innerText
      el.setAttribute('contenteditable', 'true')
      el.classList.add('is-editing')
      el.focus()

      const selection = window.getSelection()
      if (selection) {
        const range = document.createRange()
        range.selectNodeContents(el)
        selection.removeAllRanges()
        selection.addRange(range)
      }

      const cleanupEdit = () => {
        el.setAttribute('contenteditable', 'false')
        el.classList.remove('is-editing')
        el.removeEventListener('blur', onBlur)
        el.removeEventListener('keydown', onKey)
      }

      const onBlur = () => {
        const text = el.innerText.replace(/\s+/g, ' ').trim()
        cleanupEdit()
        if (text !== original && editRef.current) editRef.current(el.dataset.edit, text)
      }

      const onKey = (ev) => {
        if (ev.key === 'Escape') {
          ev.preventDefault()
          el.innerText = original
          el.blur()
        }
        if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
          ev.preventDefault()
          el.blur()
        }
      }

      el.addEventListener('blur', onBlur)
      el.addEventListener('keydown', onKey)
    }

    paper.addEventListener('pointerdown', onPointerDown)
    paper.addEventListener('dblclick', onDoubleClick)

    return () => {
      if (cancelDrag) cancelDrag()
      paper.removeEventListener('pointerdown', onPointerDown)
      paper.removeEventListener('dblclick', onDoubleClick)
    }
  }, [interactive, paperRef, scheme, format, commitRef, editRef])

  const renderImage = (treatment, slot = 'hero') => {
    const isSecondary = slot === 'secondary'
    const media = isSecondary ? photo2 : photo
    const placeholder = !isSecondary
      ? (content.image_placeholders || []).find(
          (item) => String(item?.slot || '').toLowerCase() === 'hero',
        )
      : null
    if (isSecondary && !media) return null
    return html`
      <figure class=${`hero treat-${treatment} ${isSecondary ? 'hero-secondary' : ''}`}>
        ${media
          ? html`<img src=${media.dataUrl} alt=${media.name || '报纸配图'} draggable=${false} />`
          : html`
              <div class="hero-empty">
                <span class="hero-plus">＋</span>
                <span>上传照片后自动填入</span>
                <span class="hero-hint">
                  ${placeholder?.purpose || '支持 JPG / PNG，建议 4:3 或 3:4'}
                </span>
              </div>
            `}
        ${treatment === 'halftone_mono' && html`<span class="halftone-dots"></span>`}
      </figure>
    `
  }

  const useDropCap = scheme.layout_variant === 'classic_broadsheet' && format === 'newspaper'

  const renderBlock = (block, index) => {
    const toneClass = block.tone === 'invert' ? 'tone-invert' : ''
    const alignClass = block.align === 'center' ? 'align-center' : ''
    const isBand = block.type === 'pullquote' && scheme.layout_variant === 'tabloid_bold'
    const isSecondary = block.slot === 'secondary'
    const shapeClass = block.shape ? `shape-${block.shape}` : ''
    const label =
      block.type === 'image' && isSecondary
        ? '次图'
        : block.type === 'caption' && isSecondary
          ? '次图注'
          : BLOCK_LABELS[block.type] || ''
    const z = 2 + index

    return html`
      <div
        key=${block.id}
        class=${`block b-${block.type} ${shapeClass} ${toneClass} ${alignClass} ${isBand ? 'is-band' : ''}`}
        data-block-id=${block.id}
        data-type=${block.type}
        data-label=${label}
        style=${`left:${block.x}%;top:${block.y}%;width:${block.w}%;${block.h != null ? `height:${block.h}%;` : ''}z-index:${z}`}
      >
        ${block.type === 'masthead' &&
        html`
          <div class="masthead">
            <span class="m-rule top"></span>
            <div class="m-row">
              <span class="m-name">头版智造局</span>
              <span class="m-side">
                <span class="m-en">FRONT PAGE LAB</span>
                <span class="m-tagline">创意头版 · 非真实新闻</span>
              </span>
            </div>
            <span class="m-rule bottom"></span>
          </div>
        `}
        ${block.type === 'dateline' &&
        html`
          <div class="dateline">
            <span>${content.date || chineseDate()}</span>
            <span class="dl-week">${weekdayCN()}</span>
            <span class="dl-sep"></span>
            <span>第 001 期</span>
            <span class="dl-fill"></span>
            <span class="dl-tag">本版 · ${scheme.name}</span>
          </div>
        `}
        ${block.type === 'headline' &&
        html`<h1 class="headline" data-edit="headline">${content.headline}</h1>`}
        ${block.type === 'subhead' &&
        html`<p class="subhead" data-edit="subhead">${content.subhead}</p>`}
        ${block.type === 'byline' &&
        html`
          <div class="byline">
            <span>撰文 · 智造局编辑部</span>
            <span>摄影 · 读者来稿</span>
          </div>
        `}
        ${block.type === 'image' && renderImage(st.imageTreatment, block.slot)}
        ${block.type === 'scrim' && html`<span class="scrim"></span>`}
        ${block.type === 'caption' &&
        html`
          <figcaption class=${`caption ${isSecondary ? 'caption-secondary' : ''}`}>
            <span class="cap-mark">图</span>
            <span data-edit=${isSecondary ? 'caption_secondary' : 'caption'}>
              ${isSecondary
                ? content.caption_secondary || '次图说明待补充'
                : content.caption || '照片说明待补充'}
            </span>
          </figcaption>
        `}
        ${block.type === 'body' &&
        html`
          <div class="body" style=${`column-count:${st.columns}`}>
            ${(content.body_blocks || []).map((p, i) => {
              const chars = Array.from(String(p.text || ''))
              const withDropCap = useDropCap && i === 0 && chars.length > 1
              return html`
                <p data-edit=${`paragraph:${i}`}>
                  ${withDropCap
                    ? html`<span class="dropcap">${chars[0]}</span>${chars.slice(1).join('')}`
                    : p.text}
                </p>
              `
            })}
          </div>
        `}
        ${block.type === 'pullquote' &&
        html`
          <blockquote class="pullquote">
            <span class="quote-mark">“</span>
            <span class="quote-body">
              <span class="quote-label">手记 / NOTE</span>
              <span class="quote-text" data-edit="pullquote">${content.pullquote || '一句可以被单独引用的话。'}</span>
            </span>
          </blockquote>
        `}
        ${block.type === 'note' &&
        html`
          <div class="poster-note">
            <span class="poster-note-mark">✳</span>
            <span data-edit="poster_note">
              ${content.poster_note || 'FRONT PAGE LAB · ISSUE 001'}
            </span>
          </div>
        `}
        ${block.type === 'footer' &&
        html`
          <div class="paper-footer">
            <span>${disclaimer}</span>
            <span>FRONT PAGE LAB · 01</span>
          </div>
        `}
        ${interactive && html`<span class="block-handle" data-resize=${block.id} title="拖动缩放"></span>`}
      </div>
    `
  }

  return html`
    <div
      class=${`paper-viewport ${className}`}
      style=${`width:${dims.width * scale}px;height:${dims.height * scale}px`}
    >
      <div
        class="paper-zoom"
        style=${`width:${dims.width}px;height:${dims.height}px;transform:scale(${scale})`}
      >
        <div
          ref=${paperRef}
          class=${`paper variant-${scheme.layout_variant} format-${format} ${interactive ? 'is-editable' : ''}`}
          style=${styleStr}
        >
          ${layout.map(renderBlock)}
          ${interactive &&
          html`
            <span class="guide-v"></span>
            <span class="guide-h"></span>
            <span class="guide-tag"></span>
            <span class="margin-guide mg-left"></span>
            <span class="margin-guide mg-right"></span>
            <span class="margin-guide mg-top"></span>
            <span class="margin-guide mg-bottom"></span>
          `}
        </div>
      </div>
    </div>
  `
}
