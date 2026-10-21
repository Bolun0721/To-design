import { h } from 'preact'
import htm from 'htm'
import { Paper } from './Paper.js'
import { FORMATS, COLOR_PRESETS, VARIANTS } from '../config/presets.js'

const html = htm.bind(h)

export function Gallery({ schemes, summary, recommended, format, photo, photo2, onSelect, onRegenerate, busy }) {
  const scale = format === 'poster' ? 0.3 : 0.275

  return html`
    <section class="gallery">
      <header class="gallery-head">
        <div>
          <h2 class="gallery-title">三套头版，三种读法</h2>
          <p class="gallery-sub">${summary || '挑选一套进入画布，拖动版块做最后微调。'}</p>
        </div>
        <div class="gallery-reco">
          推荐方案
          <strong>${recommended || 'B'}</strong>
        </div>
      </header>

      <div class="gallery-cards">
        ${schemes.map((scheme, index) => {
          const preset = COLOR_PRESETS[scheme.color_preset]
          const variant = VARIANTS[scheme.layout_variant]
          return html`
            <div
              class="scheme-card"
              onClick=${() => onSelect(index)}
              onKeyDown=${(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(index)
              }}
              role="button"
              tabindex="0"
            >
              ${scheme.id === recommended && html`<span class="card-badge">推荐</span>`}
              <div class="card-paper">
                <${Paper} scheme=${scheme} format=${format} photo=${photo} photo2=${photo2} scale=${scale} />
              </div>
              <div class="card-top">
                <span class="card-letter">${scheme.id}</span>
                <span class="card-name">${scheme.name}</span>
                <span class="card-variant">${variant?.name || scheme.layout_variant}<br />${FORMATS[format].label}</span>
              </div>
              <p class="card-rationale">${scheme.design_rationale}</p>
              <div class="card-foot">
                <span class="card-preset">
                  <span class="preset-dots">
                    <i class="preset-dot" style=${`background:${preset.background}`}></i>
                    <i class="preset-dot" style=${`background:${preset.text}`}></i>
                    <i class="preset-dot" style=${`background:${preset.accent}`}></i>
                  </span>
                  ${preset.name}
                </span>
                <span class="card-cta">进入画布 →</span>
              </div>
            </div>
          `
        })}
      </div>

      <div style="margin-top:24px; display:flex; gap:10px; align-items:center">
        <button class="btn" onClick=${onRegenerate} disabled=${busy}>${busy ? '生成中…' : '重新生成三套'}</button>
        <span style="font-size:9px; color:var(--muted-2); letter-spacing:.08em">
          想换方向？回到左侧改一句描述，再生成一次。
        </span>
      </div>
    </section>
  `
}
