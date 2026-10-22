import { h } from 'preact'
import htm from 'htm'
import { Paper } from './Paper.js'
import { FORMATS, COLOR_PRESETS, VARIANTS } from '../config/presets.js'
import { getStylePack } from '../config/stylePacks.js'

const html = htm.bind(h)

export function Gallery({
  schemes,
  summary,
  recommended,
  format,
  photo,
  photo2,
  stylePack = 'classic',
  onCycleStylePack,
  onSelect,
  onRegenerate,
  busy,
}) {
  const scale = format === 'poster' ? 0.3 : 0.275
  const pack = getStylePack(stylePack)

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

      <div class="gallery-pack">
        <span class="pack-kicker">风格包</span>
        <strong class="pack-name">${pack.name}</strong>
        <span class="pack-en">${pack.en}</span>
        <span class="pack-tagline">${pack.tagline}</span>
        <button class="pack-cycle" type="button" onClick=${onCycleStylePack} disabled=${busy || !schemes.length}>
          换一组 →
        </button>
        <span class="pack-count">3 / 9 种</span>
      </div>

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

      <div style="margin-top:24px; display:flex; gap:10px; align-items:center; flex-wrap:wrap">
        <button class="btn" onClick=${onRegenerate} disabled=${busy}>${busy ? '生成中…' : '重新生成三套'}</button>
        <button class="btn" onClick=${onCycleStylePack} disabled=${busy || !schemes.length}>
          再换三种风格 →
        </button>
        <span style="font-size:9px; color:var(--muted-2); letter-spacing:.08em">
          换风格保留内容和稿子，只重排版式、配色与字体。
        </span>
      </div>
    </section>
  `
}
