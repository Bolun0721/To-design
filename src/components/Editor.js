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
  onReferenceBlock,
}) {
  const stageRef = useRef(null)
  const [fitScale, setFitScale] = useState(0.6)
  const [manualZoom, setManualZoom] = useState(null)
  const scheme = schemes[active]
  const scale = manualZoom ?? fitScale

  useEffect(() => {
    setManualZoom(null)
  }, [format])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const update = () => {
      const dims = FORMATS[format]
      const w = el.clientWidth - 54
      const h = el.clientHeight - 54
      const next = Math.min(w / dims.width, h / dims.height, 0.96)
      setFitScale(Math.max(0.24, next))
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

      <div class="stage-shell">
        <div class="stage" ref=${stageRef}>
          <div class="stage-canvas">
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
              onReferenceBlock=${onReferenceBlock}
              controllerRef=${sandboxRef}
            />
          </div>
        </div>
        <div class="stage-zoom-control">
          <span class="zoom-label">缩放 <strong>${Math.round(scale * 100)}%</strong></span>
          <input
            class="zoom-range"
            type="range"
            min="20"
            max="100"
            step="1"
            value=${Math.round(scale * 100)}
            aria-label="画布缩放"
            onInput=${(event) => setManualZoom(Number(event.currentTarget.value) / 100)}
          />
          <button
            class="zoom-fit"
            type="button"
            onClick=${() => setManualZoom(null)}
            title="恢复为适应画布大小"
          >
            适应
          </button>
        </div>
        <span class="stage-hint">拖动版块 · 单击选中 · 双击改字 / 卡片引用</span>
      </div>
    </section>
  `
}
