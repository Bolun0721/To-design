import { h } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
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
import {
  POSTER_TEMPLATES,
  POSTER_VARIANTS,
  getPosterTemplate,
} from '../config/posterTemplates.js'
import { POSTER_RECIPES, getPosterRecipe } from '../config/posterPatterns.js'

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
  onPosterChange,
  onResetLayout,
  onOpenJson,
  onExport,
  onPrint,
  exporting,
  demo,
  photo = null,
  photo2 = null,
  onPhotoFile,
  onRemovePhoto2,
  captionBusy = false,
  onEnrichCaptions,
  messages = [],
  chatBusy = false,
  keyReady = false,
  canUndo = false,
  chatRequest = 0,
  reference = null,
  onClearReference,
  onSendChat,
  onUndoChat,
}) {
  const [tab, setTab] = useState('design')
  const secondaryFileRef = useRef(null)
  const lastChatRequestRef = useRef(chatRequest)
  const st = resolveStyle(scheme)

  useEffect(() => {
    if (chatRequest > lastChatRequestRef.current) {
      lastChatRequestRef.current = chatRequest
      setTab('chat')
    }
  }, [chatRequest])
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
        <div class="insp-title"><span>图片槽位</span><em>Images · ${photo2 ? '2' : '1'} 图</em></div>
        <div class="slot-row">
          <div class="slot-thumb">
            ${photo ? html`<img src=${photo.dataUrl} alt="主图" />` : html`<span>主</span>`}
          </div>
          <div class="slot-meta">
            <strong>主图</strong>
            <span>${photo ? photo.name : '未上传 · 在左侧上传'}</span>
          </div>
        </div>
        ${photo2
          ? html`
              <div class="slot-row">
                <div class="slot-thumb">
                  <img src=${photo2.dataUrl} alt="子图" />
                </div>
                <div class="slot-meta">
                  <strong>子图</strong>
                  <span>${photo2.name}</span>
                </div>
                <div class="slot-actions">
                  <button
                    class="slot-btn"
                    type="button"
                    onClick=${() => secondaryFileRef.current?.click()}
                  >
                    更换
                  </button>
                  <button class="slot-btn danger" type="button" onClick=${onRemovePhoto2}>
                    移除
                  </button>
                </div>
              </div>
            `
          : html`
              <button
                class="slot-add"
                type="button"
                onClick=${() => secondaryFileRef.current?.click()}
              >
                ＋ 添加子图
              </button>
            `}
        <input
          ref=${secondaryFileRef}
          type="file"
          accept="image/*"
          style="display:none"
          onChange=${(event) => {
            const file = event.currentTarget.files?.[0]
            if (file) onPhotoFile?.(file, 'secondary')
            event.currentTarget.value = ''
          }}
        />
        <p class="insp-note">
          多图会把主图位拆成主图 + 子图并自动重排；移除子图会回收版面，不留占位块。
        </p>
        ${photo2 &&
        html`
          <button
            class="slot-caption"
            type="button"
            onClick=${onEnrichCaptions}
            disabled=${captionBusy || !keyReady}
            title=${keyReady ? '让模型为主图和子图各写一条图注' : '需要先填写 API Key'}
          >
            ${captionBusy ? '正在生成补充文案…' : '生成补充文案并重排'}
          </button>
        `}
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

  const poster = format === 'poster' && scheme.poster ? scheme.poster : null
  const posterTemplate = poster ? getPosterTemplate(poster.template) : null
  const posterRecipe = poster ? getPosterRecipe(poster.art?.recipe) : null
  const artWord =
    (scheme.content?.art_words || []).find((word) => word.placement === 'headline')?.text || ''
  const updateContent = (patch) => onPosterChange?.({ content: patch })
  const setArtWord = (value) => {
    const text = String(value || '')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
    onPosterChange?.({ content: { art_words: text ? [{ text, placement: 'headline' }] : [] } })
  }
  const pickTemplate = (id) => {
    const tpl = getPosterTemplate(id)
    onPosterChange?.({
      color_preset: tpl.palette,
      font_pairing: tpl.font,
      poster: {
        template: id,
        variant: 'quiet',
        artFont: tpl.artFont,
        art: {
          source: 'recipe',
          recipe: tpl.recipe,
          params: {},
          seed: poster?.art?.seed || 0,
          shapes: poster?.art?.shapes || [],
        },
      },
    })
  }
  const updateParam = (key, value) => {
    onPosterChange?.({
      poster: { art: { params: { ...(poster?.art?.params || {}), [key]: Number(value) } } },
    })
  }

  const posterDesign = poster
    ? html`
        <div class="insp-design">
          <section class="insp-section">
            <div class="insp-title"><span>海报模板</span><em>Poster</em></div>
            <select
              class="field"
              value=${poster.template}
              onChange=${(e) => pickTemplate(e.currentTarget.value)}
            >
              ${Object.values(POSTER_TEMPLATES).map(
                (tpl) => html`<option value=${tpl.id}>${tpl.name} · ${tpl.tagline}</option>`,
              )}
            </select>
            <div class="seg" style="margin-top:8px">
              ${POSTER_VARIANTS.map(
                (variant) => html`
                  <button
                    class=${poster.variant === variant ? 'active' : ''}
                    type="button"
                    onClick=${() => onPosterChange?.({ poster: { variant } })}
                  >
                    ${variant === 'quiet' ? '克制' : '张扬'}
                  </button>
                `,
              )}
            </div>
            <p class="insp-note">${posterTemplate?.when}</p>
            <p class="insp-note">海报画布只读：改文案 / 样式用下面的检查器，改完立即重渲染。</p>
          </section>

          <section class="insp-section">
            <div class="insp-title"><span>文案</span><em>Copy</em></div>
            <input
              class="field"
              placeholder="主标题 ≤15 字"
              value=${scheme.content.headline || ''}
              maxlength="15"
              onInput=${(e) => updateContent({ headline: e.currentTarget.value })}
            />
            <input
              class="field"
              placeholder="副标题 ≤25 字"
              value=${scheme.content.subhead || ''}
              maxlength="25"
              onInput=${(e) => updateContent({ subhead: e.currentTarget.value })}
            />
            <input
              class="field"
              placeholder="图注 ≤30 字"
              value=${scheme.content.caption || ''}
              maxlength="30"
              onInput=${(e) => updateContent({ caption: e.currentTarget.value })}
            />
            <input
              class="field"
              placeholder="注记 ≤30 字"
              value=${scheme.content.poster_note || ''}
              maxlength="30"
              onInput=${(e) => updateContent({ poster_note: e.currentTarget.value })}
            />
            <input
              class="field"
              placeholder="英文装饰词（可空）"
              value=${artWord}
              maxlength="28"
              onInput=${(e) => setArtWord(e.currentTarget.value)}
            />
          </section>

          <section class="insp-section">
            <div class="insp-title"><span>配色</span><em>Palette</em></div>
            <select
              class="field"
              value=${scheme.color_preset}
              onChange=${(e) => onPosterChange?.({ color_preset: e.currentTarget.value })}
            >
              ${COLOR_PRESET_IDS.map(
                (id) => html`<option value=${id}>${COLOR_PRESETS[id].name}</option>`,
              )}
            </select>

            <div class="insp-title" style="margin-top:14px"><span>主色</span><em>Accent</em></div>
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
                <input
                  type="color"
                  value=${currentAccent}
                  onInput=${(e) => setAccent(e.currentTarget.value)}
                />
              </label>
            </div>
            <p class=${`contrast-note ${ratio < 3 ? 'warn' : ratio < 4.5 ? 'warn' : 'ok'}`}>
              主色 / 纸底 对比度 ${ratio.toFixed(2)}:1 ·
              ${ratio >= 4.5 ? '可安全用于标题与正文强调' : ratio >= 3 ? '仅限大号标题与线条' : '对比过低，建议换色'}
            </p>
          </section>

          <section class="insp-section">
            <div class="insp-title"><span>字体</span><em>Type</em></div>
            <select
              class="field"
              value=${scheme.font_pairing}
              onChange=${(e) => onPosterChange?.({ font_pairing: e.currentTarget.value })}
            >
              ${FONT_PAIRING_IDS.map(
                (id) => html`<option value=${id}>${FONT_PAIRINGS[id].name}</option>`,
              )}
            </select>
            <div class="seg" style="margin-top:8px">
              ${Object.entries(HEADLINE_SCALES).map(
                ([key, item]) => html`
                  <button
                    class=${scheme.style.headline_scale === key ? 'active' : ''}
                    type="button"
                    onClick=${() => onPosterChange?.({ style: { headline_scale: key } })}
                  >
                    ${item.label}
                  </button>
                `,
              )}
            </div>
            <p class="insp-note">艺术字：${poster.artFont ? getPosterTemplate(poster.template).artFont : '无（走标题字体）'}</p>
          </section>

          <section class="insp-section">
            <div class="insp-title"><span>图案</span><em>Pattern</em></div>
            <select
              class="field"
              value=${poster.art?.recipe}
              onChange=${(e) =>
                onPosterChange?.({
                  poster: {
                    art: {
                      recipe: e.currentTarget.value,
                      params: {},
                      seed: poster.art?.seed || 0,
                    },
                  },
                })}
            >
              ${POSTER_RECIPES.map(
                (recipe) => html`<option value=${recipe.id}>${recipe.label}</option>`,
              )}
            </select>
            ${posterRecipe &&
            Object.entries(posterRecipe.params).map(
              ([key, rule]) => html`
                <label class="insp-note" style="display:block;margin-top:8px">
                  ${rule.label || key}：${poster.art?.params?.[key] ?? rule.default}
                  <input
                    type="range"
                    style="width:100%"
                    min=${rule.min}
                    max=${rule.max}
                    step=${rule.step || 1}
                    value=${poster.art?.params?.[key] ?? rule.default}
                    onInput=${(e) => updateParam(key, e.currentTarget.value)}
                  />
                </label>
              `,
            )}
            <div class="seg" style="margin-top:8px">
              <input
                class="field"
                type="number"
                min="0"
                max="9999"
                value=${poster.art?.seed ?? 0}
                onInput=${(e) =>
                  onPosterChange?.({
                    poster: { art: { seed: Number(e.currentTarget.value) || 0 } },
                  })}
              />
              <button
                type="button"
                onClick=${() =>
                  onPosterChange?.({
                    poster: { art: { seed: Math.floor(Math.random() * 10000) } },
                  })}
              >
                随机 seed
              </button>
            </div>
            <label class="insp-note" style="display:block;margin-top:8px">
              纸纹颗粒：${poster.textures?.grain ?? 0}
              <input
                type="range"
                style="width:100%"
                min="0"
                max="0.4"
                step="0.02"
                value=${poster.textures?.grain ?? 0}
                onInput=${(e) =>
                  onPosterChange?.({
                    poster: { textures: { ...(poster.textures || {}), grain: Number(e.currentTarget.value) } },
                  })}
              />
            </label>
          </section>

          <section class="insp-section">
            <div class="insp-title"><span>主图</span><em>Image</em></div>
            <div class="slot-row">
              <div class="slot-thumb">
                ${photo ? html`<img src=${photo.dataUrl} alt="主图" />` : html`<span>无</span>`}
              </div>
              <div class="slot-meta">
                <strong>主图</strong>
                <span>${photo ? photo.name : '没有照片：图案配方填充视觉区'}</span>
              </div>
            </div>
            ${photo2 &&
            html`
              <div class="slot-row">
                <div class="slot-thumb">
                  <img src=${photo2.dataUrl} alt="子图" />
                </div>
                <div class="slot-meta">
                  <strong>子图</strong>
                  <span>${photo2.name}</span>
                </div>
                <div class="slot-actions">
                  <button class="slot-btn danger" type="button" onClick=${onRemovePhoto2}>
                    移除
                  </button>
                </div>
              </div>
            `}
            <p class="insp-note">
              ${photo2 ? '子图会以拼贴小图内嵌；移除后回到单图。' : '没有照片：图案配方填充视觉区。'}
            </p>
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
                <span>重置海报版式</span>
                <span class="kbd">↺</span>
              </button>
            </div>
          </section>

          <section class="insp-section">
            <div class="insp-title"><span>生成摘要</span><em>Note</em></div>
            <p class="summary-quote">${scheme.design_rationale || summary}</p>
            ${warnings && warnings.length
              ? html`
                  <details class="warn-box" style="margin-top:10px">
                    <summary>校验提示 · ${warnings.length} 条</summary>
                    <ul>
                      ${warnings.map((item) => html`<li>${item}</li>`)}
                    </ul>
                  </details>
                `
              : html`<p class="insp-note">当前海报由代码确定性渲染，文案 / 图案 / 版式都在同一张 SVG 里。</p>`}
          </section>
        </div>
      `
    : null

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
        ? posterDesign || design
        : html`
            <${ChatPanel}
              messages=${messages}
              busy=${chatBusy}
              keyReady=${keyReady}
              canUndo=${canUndo}
              reference=${reference}
              onClearReference=${onClearReference}
              onSend=${onSendChat}
              onUndo=${onUndoChat}
            />
          `}
    </aside>
  `
}
