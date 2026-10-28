import { h } from 'preact'
import { useRef, useState } from 'preact/hooks'
import htm from 'htm'
import { FORMATS } from '../config/presets.js'
import { PROVIDERS } from '../agent/llm.js'
import { DEMO_DESCRIPTION } from '../agent/demoData.js'

const html = htm.bind(h)

export function InputRail({
  photo,
  description,
  setDescription,
  format,
  setFormat,
  settings,
  setSettings,
  apiKey,
  setApiKey,
  busy,
  busyLabel,
  onGenerate,
  onDemo,
  onPhotoFile,
  onRemovePhoto,
  error,
  onDismissError,
  mode = 'standard',
}) {
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const freeMode = mode === 'free'
  const [showKey, setShowKey] = useState(false)

  const provider = PROVIDERS.find((p) => p.id === settings.provider) || PROVIDERS[0]

  const chooseFile = () => fileRef.current && fileRef.current.click()

  const onDrop = (event) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer?.files?.[0]
    if (file) onPhotoFile(file)
  }

  const changeProvider = (id) => {
    const next = PROVIDERS.find((p) => p.id === id)
    setSettings({
      ...settings,
      provider: id,
      baseUrl: next?.baseUrl || settings.baseUrl,
      model: next?.model || settings.model,
      vision: next?.vision || false,
    })
  }

  return html`
    <aside class="rail">
      <section class="rail-section">
        <div class="rail-label"><span>01 / 素材</span><em>Photo</em></div>

        <div
          class=${`dropzone ${dragOver ? 'is-over' : ''}`}
          onClick=${chooseFile}
          onDragOver=${(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave=${() => setDragOver(false)}
          onDrop=${onDrop}
          role="button"
          tabindex="0"
          onKeyDown=${(e) => {
            if (e.key === 'Enter' || e.key === ' ') chooseFile()
          }}
        >
          ${photo
            ? html`<img src=${photo.dataUrl} alt="已上传照片" />`
            : html`
                <div class="dropzone-empty">
                  <span class="dropzone-plus">＋</span>
                  <span>${freeMode ? '自由模式可不提供照片' : '拖入照片，或点击上传'}</span>
                  <span class="dropzone-hint">
                    ${freeMode ? '无图时由模型生成 SVG 线条图案' : 'JPG / PNG / WebP · 最大 15MB'}
                  </span>
                </div>
              `}
          <input
            ref=${fileRef}
            type="file"
            accept="image/*"
            style="display:none"
            onClick=${(e) => e.stopPropagation()}
            onChange=${(e) => {
              const file = e.currentTarget.files?.[0]
              if (file) onPhotoFile(file)
              e.currentTarget.value = ''
            }}
          />
        </div>

        ${photo &&
        html`
          <div class="photo-meta">
            <span class="photo-name">${photo.name} · ${photo.width}×${photo.height}</span>
            <span>
              <button class="link-btn" onClick=${chooseFile}>更换</button>
              <button class="link-btn danger" onClick=${onRemovePhoto}>移除</button>
            </span>
          </div>
        `}

        <label class="field-label" for="desc">描述这张照片 / 你想要的头版</label>
        <textarea
          id="desc"
          class="field"
          rows="4"
          maxlength="300"
          placeholder="例：周末下午在巷口咖啡馆，靠窗位置，一杯手冲和一本旧书。想做成有年代感的报纸头版，可以打印收藏。"
          value=${description}
          onInput=${(e) => setDescription(e.currentTarget.value)}
        ></textarea>
        <div class="counter">
          <span>${description.length} / 300</span>
        </div>
        <div class="photo-meta" style="margin-top:2px">
          <button
            class="link-btn"
            onClick=${() => setDescription(DEMO_DESCRIPTION)}
          >
            填入示例需求
          </button>
          ${description && html`<button class="link-btn" onClick=${() => setDescription('')}>清空</button>`}
        </div>
      </section>

      <section class="rail-section">
        <div class="rail-label"><span>02 / 画面</span><em>Format</em></div>
        <div class="format-toggle">
          ${Object.values(FORMATS).map(
            (f) => html`
              <button
                class=${`format-btn ${format === f.id ? 'active' : ''}`}
                onClick=${() => setFormat(f.id)}
                type="button"
              >
                <span class="fb-title">${f.label}<span class="fb-en">${f.en}</span></span>
                <span class="fb-size">${f.size}</span>
              </button>
            `,
          )}
        </div>
        ${format === 'poster' && (mode === 'design' || mode === 'free') && html`
          <p class="insp-note poster-body-hint">
            海报本身不显示正文；模型仍会为切回报纸保留 1–2 段短正文。
          </p>
        `}
      </section>

      <section class="rail-section">
        <div class="rail-label"><span>03 / 模型</span><em>BYOK</em></div>
        <div class="api-card">
          <div class="api-status">
            <span class="api-provider">${provider.name}</span>
            <span>${apiKey ? 'Key 已填写' : '未填写 Key'}</span>
          </div>

          <div class="api-key-row">
            <input
              class="field"
              type=${showKey ? 'text' : 'password'}
              placeholder="sk-... 粘贴模型 API Key"
              value=${apiKey}
              autocomplete="off"
              spellcheck=${false}
              onInput=${(e) => setApiKey(e.currentTarget.value)}
            />
            <button class="mini-btn" onClick=${() => setShowKey(!showKey)} type="button">
              ${showKey ? '隐藏' : '显示'}
            </button>
          </div>

          <label class="field-label" for="provider">服务商</label>
          <select
            id="provider"
            class="field"
            value=${settings.provider}
            onChange=${(e) => changeProvider(e.currentTarget.value)}
          >
            ${PROVIDERS.map((p) => html`<option value=${p.id}>${p.name}</option>`)}
          </select>

          <details class="api-advanced">
            <summary>接口设置</summary>
            <div class="api-grid">
              <input
                class="field"
                type="text"
                placeholder="Base URL，如 https://api.deepseek.com/v1"
                value=${settings.baseUrl}
                onInput=${(e) => setSettings({ ...settings, baseUrl: e.currentTarget.value })}
              />
              <input
                class="field"
                type="text"
                placeholder="模型名，如 deepseek-chat"
                value=${settings.model}
                onInput=${(e) => setSettings({ ...settings, model: e.currentTarget.value })}
              />
              <select
                class="field"
                value=${settings.mode}
                onChange=${(e) => setSettings({ ...settings, mode: e.currentTarget.value })}
              >
                <option value="auto">请求方式 · 自动</option>
                <option value="proxy">请求方式 · 本地中继</option>
                <option value="direct">请求方式 · 浏览器直连</option>
              </select>
            </div>
            <label class="check-row">
              <input
                type="checkbox"
                checked=${settings.vision}
                onChange=${(e) => setSettings({ ...settings, vision: e.currentTarget.checked })}
              />
              <span>让模型直接看图（需要视觉模型；不勾选时只根据文字描述写稿）</span>
            </label>
            <p class="api-note">
              Key 只写入本标签页的 sessionStorage，关闭页面即失效；本地中继只转发请求，不落盘、不记录 Key。
            </p>
          </details>
        </div>

        ${error &&
        html`
          <div class="error-box" onClick=${onDismissError} title="点击关闭">
            ${error}
          </div>
        `}
      </section>

      <section class="rail-section rail-generate">
        <button class="generate-btn" disabled=${busy} onClick=${onGenerate}>
          ${busy ? html`<span class="spinner"></span>` : null}
          ${busy ? busyLabel || '正在写稿…' : '生成 3 个方案'}
        </button>
        <button class="demo-btn" onClick=${onDemo} disabled=${busy}>
          没有 Key？用示例稿件预览 →
        </button>
        <p class="rail-hint">
          一次生成三套版式；生成后可拖版块、双击改字、导出 PNG 或打印 PDF。
        </p>
      </section>
    </aside>
  `
}
