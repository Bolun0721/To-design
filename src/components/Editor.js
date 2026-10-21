import { h } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import htm from 'htm'
import { IframePaper } from './IframePaper.js'
import { FORMATS } from '../config/presets.js'

const html = htm.bind(h)

export function Editor({
  schemes,
  active,
  format,
  photo,
  photo2,
  theme,
  sandboxRef,
  disclaimer,
  onSelect,
  onBack,
  onBlockCommit,
  onEditText,
}) {
  const stageRef = useRef(null)
  const [scale, setScale] = useState(0.6)
  const scheme = schemes[active]

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const update = () => {
      const dims = FORMATS[format]
      const w = el.clientWidth - 54
      const h = el.clientHeight - 54
      const next = Math.min(w / dims.width, h / dims.height, 0.96)
      setScale(Math.max(0.24, next))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [format])

  if (!scheme) return null

  return html`
    <section class="editor">
      <header class="editor-head">
        <button class="back-btn" onClick=${onBack}>← 三套方案</button>
        <div class="editor-tabs">
          ${schemes.map(
            (s, i) => html`
              <button
                class=${`scheme-tab ${i === active ? 'active' : ''}`}
                onClick=${() => onSelect(i)}
                type="button"
              >
                <span class="letter">${s.id}</span>
                <span class="tab-name">${s.name}</span>
              </button>
            `,
          )}
        </div>
        <span class="editor-head-fill"></span>
        <span class="editor-meta">${FORMATS[format].size} · ${FORMATS[format].label}</span>
      </header>

      <div class="stage" ref=${stageRef}>
        <${IframePaper}
          scheme=${scheme}
          format=${format}
          photo=${photo}
          photo2=${photo2}
          scale=${scale}
          theme=${theme}
          disclaimer=${disclaimer}
          onBlockCommit=${onBlockCommit}
          onEditText=${onEditText}
          controllerRef=${sandboxRef}
        />
        <span class="stage-zoom">缩放 ${Math.round(scale * 100)}%</span>
        <span class="stage-hint">拖动任意版块 · 双击文字修改 · 右下角拖动缩放</span>
      </div>
    </section>
  `
}
