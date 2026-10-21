import { h } from 'preact'
import { useState } from 'preact/hooks'
import htm from 'htm'
import { ChatPanel } from './ChatPanel.js'
import {
  COLOR_PRESETS,
  COLOR_PRESET_IDS,
  FONT_PAIRINGS,
  FONT_PAIRING_IDS,
  FORMATS,
  HEADLINE_SCALES,
  VARIANTS,
  contrastRatio,
  resolveStyle,
} from '../config/presets.js'

const html = htm.bind(h)

const TREATMENTS = [
  ['original', '原图'],
  ['halftone_mono', '黑白半调'],
  ['duotone', '双色调'],
]

export function Inspector({
  scheme,
  format,
  summary,
  warnings,
  onChangeStyle,
  onChangeFormat,
  onResetLayout,
  onOpenJson,
  onExport,
  onPrint,
  exporting,
  demo,
  messages = [],
  chatBusy = false,
  keyReady = false,
  canUndo = false,
  onSendChat,
  onUndoChat,
}) {
  const [tab, setTab] = useState('design')
  const st = resolveStyle(scheme)
  const variant = VARIANTS[scheme.layout_variant]
  const ratio = contrastRatio(st.palette.accent, st.palette.background)
  const accents = [...new Set(COLOR_PRESET_IDS.map((id) => COLOR_PRESETS[id].accent))]
  const currentAccent = (scheme.style.accent_color || st.palette.accent).toUpperCase()

  const setAccent = (value) => onChangeStyle({ accent_color: value.toUpperCase() })

  const design = html`
    <div class="insp-design">
      <section class="insp-section">
        <div class="insp-title"><span>版式</span><em>${variant?.en}</em></div>
        <h3 class="insp-variant-name">${variant?.name || scheme.layout_variant}</h3>
        <p class="insp-variant-tag">${variant?.tagline}</p>
        <p class="insp-note">${scheme.design_rationale}</p>
      </section>

      <section class="insp-section">
        <div class="insp-title"><span>主色</span><em>Accent</em></div>
        <div class="swatches">
          ${accents.map(
            (color) => html`
              <button
                class=${`swatch ${currentAccent === color.toUpperCase() ? 'active' : ''}`}
                style=${`background:${color}`}
                title=${color}
                onClick=${() => setAccent(color)}
                type="button"
              ></button>
            `,
          )}
          <label class="swatch-custom" title="自定义主色">
            ＋
            <input type="color" value=${currentAccent} onInput=${(e) => setAccent(e.currentTarget.value)} />
          </label>
        </div>
        <p class=${`contrast-note ${ratio < 3 ? 'warn' : ratio < 4.5 ? 'warn' : 'ok'}`}>
          主色 / 纸底 对比度 ${ratio.toFixed(2)}:1 ·
          ${ratio >= 4.5 ? '可安全用于标题与正文强调' : ratio >= 3 ? '仅限大号标题与线条' : '对比过低，建议换色'}
        </p>
      </section>

      <section class="insp-section">
        <div class="insp-title"><span>正文栏数</span><em>Columns</em></div>
        <div class="seg">
          ${[1, 2, 3].map(
            (n) => html`
              <button
                class=${st.columns === n ? 'active' : ''}
                onClick=${() => onChangeStyle({ columns: n })}
                type="button"
              >
                ${n} 栏
              </button>
            `,
          )}
        </div>
        <p class="insp-note">
          ${format === 'poster' ? '海报模式不显示正文，栏数在切回报纸时生效。' : '改变栏数会立即重排正文，不改动其他版块位置。'}
        </p>
      </section>

      <section class="insp-section">
        <div class="insp-title"><span>标题字号</span><em>Scale</em></div>
        <div class="seg">
          ${Object.entries(HEADLINE_SCALES).map(
            ([key, item]) => html`
              <button
                class=${st.headlineScale === key ? 'active' : ''}
                onClick=${() => onChangeStyle({ headline_scale: key })}
                type="button"
              >
                ${item.label}
              </button>
            `,
          )}
        </div>
      </section>

      <section class="insp-section">
        <div class="insp-title"><span>图片处理</span><em>Image</em></div>
        <div class="seg">
          ${TREATMENTS.map(
            ([key, label]) => html`
              <button
                class=${st.imageTreatment === key ? 'active' : ''}
                onClick=${() => onChangeStyle({ image_treatment: key })}
                type="button"
              >
                ${label}
              </button>
            `,
          )}
        </div>
      </section>

      <section class="insp-section">
        <div class="insp-title"><span>字体搭配</span><em>Type</em></div>
        <select
          class="field"
          value=${scheme.font_pairing}
          onChange=${(e) => onChangeStyle({ font_pairing: e.currentTarget.value }, 'scheme')}
        >
          ${FONT_PAIRING_IDS.map(
            (id) => html`<option value=${id}>${FONT_PAIRINGS[id].name}</option>`,
          )}
        </select>
        <p class="insp-note">${FONT_PAIRINGS[scheme.font_pairing]?.note}</p>
      </section>

      <section class="insp-section">
        <div class="insp-title"><span>画面</span><em>Format</em></div>
        <div class="seg">
          ${Object.values(FORMATS).map(
            (f) => html`
              <button
                class=${format === f.id ? 'active' : ''}
                onClick=${() => onChangeFormat(f.id)}
                type="button"
              >
                ${f.label}
              </button>
            `,
          )}
        </div>
        <p class="insp-note">${FORMATS[format].size} · ${FORMATS[format].hint}</p>
      </section>

      <section class="insp-section">
        <div class="insp-title"><span>导出</span><em>Output</em></div>
        <div class="insp-actions">
          <button class="action-btn primary" onClick=${onExport} disabled=${exporting}>
            <span>${exporting ? '正在渲染…' : '导出 PNG'}</span>
            <span class="kbd">2×</span>
          </button>
          <button class="action-btn" onClick=${onPrint} disabled=${exporting}>
            <span>打印 / 存为 PDF</span>
            <span class="kbd">PDF</span>
          </button>
          <button class="action-btn" onClick=${onOpenJson}>
            <span>查看方案 JSON</span>
            <span class="kbd">{ }</span>
          </button>
          <button class="action-btn" onClick=${onResetLayout}>
            <span>重置版式</span>
            <span class="kbd">↺</span>
          </button>
        </div>
      </section>

      <section class="insp-section">
        <div class="insp-title"><span>生成摘要</span><em>Note</em></div>
        <p class="summary-quote">${summary || '模型会根据描述写出三种不同角度的报道。'}</p>
        ${warnings && warnings.length
          ? html`
              <details class="warn-box" style="margin-top:10px">
                <summary>校验已通过 · ${warnings.length} 处自动修正</summary>
                <ul>
                  ${warnings.map((w) => html`<li>${w}</li>`)}
                </ul>
              </details>
            `
          : html`<p class="insp-note">${demo ? '当前为内置示例稿件，未调用模型。' : 'JSON schema、版式 / 配色白名单均已通过校验。'}</p>`}
      </section>
    </div>
  `

  return html`
    <aside class=${`inspector ${tab === 'chat' ? 'is-chat' : ''}`}>
      <div class="insp-tabs">
        <button
          class=${`insp-tab ${tab === 'design' ? 'active' : ''}`}
          type="button"
          onClick=${() => setTab('design')}
        >
          设计
        </button>
        <button
          class=${`insp-tab ${tab === 'chat' ? 'active' : ''}`}
          type="button"
          onClick=${() => setTab('chat')}
        >
          对话微调
        </button>
      </div>
      ${tab === 'design'
        ? design
        : html`
            <${ChatPanel}
              messages=${messages}
              busy=${chatBusy}
              keyReady=${keyReady}
              canUndo=${canUndo}
              onSend=${onSendChat}
              onUndo=${onUndoChat}
            />
          `}
    </aside>
  `
}
