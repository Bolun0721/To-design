import { h } from 'preact'
import htm from 'htm'
import { Paper } from './Paper.js'
import { FORMATS, COLOR_PRESETS, VARIANTS } from '../config/presets.js'
import { POSTER_TEMPLATES } from '../config/posterTemplates.js'
import { getStylePack } from '../config/stylePacks.js'

const html = htm.bind(h)

export function Gallery({
  schemes,
  summary,
  recommended,
  format,
  photo,
  photo2,
  warnings = [],
  stylePack = 'classic',
  mode = 'standard',
  onCycleStylePack,
  onSelect,
  onRegenerate,
  onRetryPoster,
  busy,
}) {
  const scale = format === 'poster' ? 0.3 : 0.275
  const pack = getStylePack(stylePack)
  const freeMode = mode === 'free'
  const designMode = mode === 'design' || freeMode
  const posterMode = format === 'poster'
  const pendingCount = schemes.filter((scheme) => scheme.pending).length
  const failedCount = schemes.filter((scheme) => scheme.pendingError).length

  return html`
    <section class="gallery">
      <header class="gallery-head">
        <div>
          <h2 class="gallery-title">${posterMode ? '三张海报，三种口气' : '三套头版，三种读法'}</h2>
          <p class="gallery-sub">
            ${summary ||
            (posterMode
              ? '三套并发生成，先完成的一套先显示；画布只读，改字用右侧检查器。'
              : '挑选一套进入画布，拖动版块做最后微调。')}
          </p>
        </div>
        <div class="gallery-reco">
          ${posterMode && (pendingCount || failedCount)
            ? html`完成 <strong>${schemes.length - pendingCount - failedCount}/3</strong>`
            : html` 推荐方案 <strong>${recommended || 'B'}</strong> `}
        </div>
      </header>

      ${posterMode
        ? html`
            <div class="gallery-pack">
              <span class="pack-kicker">海报</span>
              <strong class="pack-name">SVG 海报</strong>
              <span class="pack-en">CODE-RENDERED</span>
              <span class="pack-tagline">
                文案、图案、版式在同一张 800×1000 SVG 里；三路并行，先到先显示。
              </span>
              <span class="pack-count">${posterMode ? '画布只读 · 检查器改字' : ''}</span>
            </div>
          `
        : designMode
          ? html`
              <div class="gallery-pack design-mode-bar">
                <span class="pack-kicker">${freeMode ? '自由模式' : '设计模式'}</span>
                <strong class="pack-name">${freeMode ? '自由图案' : '自由设计'}</strong>
                <span class="pack-en">${freeMode ? 'FREE ART' : 'DESIGN MODE'}</span>
                <span class="pack-tagline">
                  ${freeMode
                    ? '无照片时生成 SVG 线条图案；有照片时使用照片。'
                    : '模型自选模板、配色、字体与信息量；不套用风格包。'}
                </span>
                <span class="pack-count">${freeMode ? '符号库兜底' : '重新生成可探索新方案'}</span>
              </div>
            `
          : html`
              <div class="gallery-pack">
                <span class="pack-kicker">风格包</span>
                <strong class="pack-name">${pack.name}</strong>
                <span class="pack-en">${pack.en}</span>
                <span class="pack-tagline">${pack.tagline}</span>
                <button
                  class="pack-cycle"
                  type="button"
                  onClick=${onCycleStylePack}
                  disabled=${busy || !schemes.length}
                >
                  换一组 →
                </button>
                <span class="pack-count">3 / 9 种</span>
              </div>
            `}

      ${warnings.length > 0 &&
      html`
        <details class="warn-box" open>
          <summary>生成提示 · ${warnings.length} 条</summary>
          <ul>
            ${warnings.map((warning) => html`<li>${warning}</li>`)}
          </ul>
        </details>
      `}

      <div class="gallery-cards">
        ${schemes.map((scheme, index) => {
          const preset = COLOR_PRESETS[scheme.color_preset] || COLOR_PRESETS.classic_serious
          const posterTemplate = scheme.poster ? POSTER_TEMPLATES[scheme.poster.template] : null
          const variant = VARIANTS[scheme.layout_variant]
          const pending = Boolean(scheme.pending)
          const error = scheme.pendingError
          const label = posterMode
            ? posterTemplate?.name || '海报生成中'
            : variant?.name || scheme.layout_variant
          return html`
            <div
              class=${`scheme-card ${pending ? 'is-pending' : ''} ${error ? 'is-error' : ''}`}
              onClick=${() => {
                if (!pending && !error) onSelect(index)
              }}
              onKeyDown=${(e) => {
                if (!pending && !error && (e.key === 'Enter' || e.key === ' ')) onSelect(index)
              }}
              role="button"
              tabindex="0"
            >
              ${!pending && !error && scheme.id === recommended && html`<span class="card-badge">推荐</span>`}
              <div class="card-paper">
                ${pending
                  ? html`
                      <div class="card-skeleton">
                        <span class="sk-letter">${scheme.id}</span>
                        <span>正在生成…</span>
                      </div>
                    `
                  : error
                    ? html`
                        <div class="card-error">
                          <span class="err-letter">${scheme.id}</span>
                          <p>${error}</p>
                          ${onRetryPoster &&
                          html`<button
                            class="mini-btn"
                            type="button"
                            onClick=${(event) => {
                              event.stopPropagation()
                              onRetryPoster(scheme.id)
                            }}
                          >
                            重试这一套
                          </button>`}
                        </div>
                      `
                    : html`
                        <${Paper}
                          scheme=${scheme}
                          format=${format}
                          photo=${photo}
                          photo2=${photo2}
                          scale=${scale}
                          freeMode=${freeMode}
                        />
                      `}
              </div>
              <div class="card-top">
                <span class="card-letter">${scheme.id}</span>
                <span class="card-name">${scheme.name}</span>
                <span class="card-variant">${label}<br />${posterMode ? 'SVG · 4:5' : FORMATS[format].label}</span>
              </div>
              <p class="card-rationale">
                ${error ? '这一套没有生成成功，可以单独重试，不影响另外两套。' : scheme.design_rationale}
              </p>
              <div class="card-foot">
                <span class="card-preset">
                  ${error
                    ? ''
                    : html`
                        <span class="preset-dots">
                          <i class="preset-dot" style=${`background:${preset.background}`}></i>
                          <i class="preset-dot" style=${`background:${preset.text}`}></i>
                          <i class="preset-dot" style=${`background:${preset.accent}`}></i>
                        </span>
                        ${preset.name}
                      `}
                </span>
                <span class="card-cta">
                  ${pending ? '生成中…' : error ? '' : '进入画布 →'}
                </span>
              </div>
            </div>
          `
        })}
      </div>

      <div style="margin-top:24px; display:flex; gap:10px; align-items:center; flex-wrap:wrap">
        <button class="btn" onClick=${onRegenerate} disabled=${busy}>${busy ? '生成中…' : designMode ? (freeMode ? '重新生成自由方案' : '重新设计三套') : '重新生成三套'}</button>
        ${!designMode &&
        !posterMode &&
        html`
          <button class="btn" onClick=${onCycleStylePack} disabled=${busy || !schemes.length}>
            再换三种风格 →
          </button>
        `}
        <span style="font-size:9px; color:var(--muted-2); letter-spacing:.08em">
          ${posterMode
            ? '每套海报独立请求，先完成先显示；画布只读，改字与配色请用右侧检查器。'
            : freeMode
              ? '无图时会多一次图案生成；要使用照片，请先在左侧上传。'
              : designMode
                ? '设计模式会重新判断内容与场景，重新组织布局、信息量和视觉方向。'
                : '换风格保留内容和稿子，只重排版式、配色与字体。'}
        </span>
      </div>
    </section>
  `
}
