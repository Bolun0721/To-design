import { h } from 'preact'
import { useRef, useState } from 'preact/hooks'
import htm from 'htm'
import { FORMATS } from '../config/presets.js'
import { IMAGE_STYLES, getImageStyle } from '../config/imageStyles.js'
import { IMAGE_PROVIDERS, PROVIDERS } from '../agent/llm.js'
import { DEMO_DESCRIPTION } from '../agent/demoData.js'

const html = htm.bind(h)

export function InputRail({
  photo,
  imageMeta,
  description,
  setDescription,
  format,
  setFormat,
  settings,
  setSettings,
  apiKey,
  setApiKey,
  imageApiKey,
  setImageApiKey,
  generationRole = 'layout',
  setGenerationRole,
  imageStyle = 'original',
  setImageStyle,
  autoLayout = true,
  setAutoLayout,
  busy,
  busyLabel,
  onGenerate,
  onDemo,
  onPhotoFile,
  onRemovePhoto,
  onRestoreOriginal,
  error,
  onDismissError,
  mode = 'standard',
}) {
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const freeMode = mode === 'free'
  const imageMode = generationRole === 'image'
  const [showKey, setShowKey] = useState(false)

  const provider = PROVIDERS.find((p) => p.id === settings.provider) || PROVIDERS[0]
  const imageProvider =
    IMAGE_PROVIDERS.find((p) => p.id === settings.image?.provider) || IMAGE_PROVIDERS[0]
  const activeStyle = getImageStyle(imageStyle)
  const activeKey = imageMode ? imageApiKey : apiKey
  const setActiveKey = imageMode ? setImageApiKey : setApiKey

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

  const updateImage = (patch) => {
    setSettings({
      ...settings,
      image: { ...(settings.image || {}), ...patch },
    })
  }

  const changeImageProvider = (id) => {
    const next = IMAGE_PROVIDERS.find((p) => p.id === id)
    updateImage({
      provider: id,
      baseUrl: next?.baseUrl || settings.image?.baseUrl || '',
      model: next?.model || settings.image?.model || '',
      supportsReference: Boolean(next?.supportsReference),
    })
  }

  const changeRole = (role) => {
    setGenerationRole(role)
    if (role === 'image' && !photo && imageStyle === 'original') {
      setImageStyle('classic_broadsheet')
    }
  }

  return html`
    <aside class=${`rail ${imageMode ? 'rail-image-mode' : ''}`}>
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
          ${imageMeta &&
          html`
            <div class="image-meta">
              <span class="image-meta-badge">AI 素材 · ${imageMeta.styleLabel}</span>
              <button class="link-btn" onClick=${onRestoreOriginal}>恢复原图</button>
            </div>
          `}
        `}

        <label class="field-label" for="desc">
          ${imageMode ? '描述画面 / 想要生成的主图' : '描述这张照片 / 你想要的头版'}
        </label>
        <textarea
          id="desc"
          class="field desc-field"
          rows=${imageMode ? 2 : 4}
          maxlength="300"
          placeholder=${imageMode
            ? '例：周末下午的巷口咖啡馆，靠窗位置，一杯手冲和一本旧书；主体清晰，适合作为海报主图。'
            : '例：周末下午在巷口咖啡馆，靠窗位置，一杯手冲和一本旧书。想做成有年代感的报纸头版，可以打印收藏。'}
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

        ${imageMode &&
        html`
          <div class="image-style-field">
            <label class="field-label" for="image-style">视觉风格</label>
            <select
              id="image-style"
              class="field"
              value=${imageStyle}
              onChange=${(e) => setImageStyle(e.currentTarget.value)}
            >
              ${IMAGE_STYLES.map(
                (style) => html`
                  <option value=${style.id}>
                    ${style.label}${style.id === 'original' ? '（不处理）' : ` · ${style.en}`}
                  </option>
                `,
              )}
            </select>
            <p class="image-style-note">
              ${activeStyle.id === 'original'
                ? '原图：不调用生图模型，直接使用已上传素材。'
                : `${activeStyle.description}。生成结果会替换素材框，原图仍可恢复。`}
            </p>
            <label class="check-row image-auto-layout">
              <input
                type="checkbox"
                checked=${autoLayout}
                onChange=${(e) => setAutoLayout(e.currentTarget.checked)}
              />
              <span>生成素材后立即排版（自动切回排版模型）</span>
            </label>
          </div>
        `}
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
          <label class="field-label" for="model-role">模型用途</label>
          <select
            id="model-role"
            class="field model-role-select"
            value=${generationRole}
            onChange=${(e) => changeRole(e.currentTarget.value)}
          >
            <option value="layout">排版模型 · 写稿 + 设计版式</option>
            <option value="image">生图模型 · 先做素材图</option>
          </select>

          <div class="api-status">
            <span class="api-provider">${imageMode ? imageProvider.name : provider.name}</span>
            <span>${activeKey ? 'Key 已填写' : '未填写 Key'}</span>
          </div>

          <div class="api-key-row">
            <input
              class="field"
              type=${showKey ? 'text' : 'password'}
              placeholder=${imageMode
                ? '粘贴生图 Key（独立保存，不复用排版 Key）'
                : 'sk-... 粘贴模型 API Key'}
              value=${activeKey}
              autocomplete="off"
              spellcheck=${false}
              onInput=${(e) => setActiveKey(e.currentTarget.value)}
            />
            <button class="mini-btn" onClick=${() => setShowKey(!showKey)} type="button">
              ${showKey ? '隐藏' : '显示'}
            </button>
          </div>

          ${imageMode
            ? html`
                <label class="field-label" for="image-provider">生图服务商</label>
                <select
                  id="image-provider"
                  class="field"
                  value=${settings.image?.provider || 'ark'}
                  onChange=${(e) => changeImageProvider(e.currentTarget.value)}
                >
                  ${IMAGE_PROVIDERS.map((p) => html`<option value=${p.id}>${p.name}</option>`)}
                </select>

                <details class="api-advanced" open>
                  <summary>生图接口设置</summary>
                  <div class="api-grid">
                    <input
                      class="field"
                      type="text"
                      placeholder="Base URL，如 https://ark.cn-beijing.volces.com/api/v3"
                      value=${settings.image?.baseUrl || ''}
                      onInput=${(e) => updateImage({ baseUrl: e.currentTarget.value })}
                    />
                    <input
                      class="field"
                      type="text"
                      placeholder="图片模型 ID，如 doubao-seedream-4-0"
                      value=${settings.image?.model || ''}
                      onInput=${(e) => updateImage({ model: e.currentTarget.value })}
                    />
                    <select
                      class="field"
                      value=${settings.image?.size || 'auto'}
                      onChange=${(e) => updateImage({ size: e.currentTarget.value })}
                    >
                      <option value="auto">尺寸 · 自动</option>
                      <option value="1024x1024">1024 × 1024</option>
                      <option value="1024x1536">1024 × 1536</option>
                      <option value="2K">2K（火山方舟）</option>
                    </select>
                    <select
                      class="field"
                      value=${settings.image?.mode || 'proxy'}
                      onChange=${(e) => updateImage({ mode: e.currentTarget.value })}
                    >
                      <option value="proxy">请求方式 · 本地中继</option>
                      <option value="direct">请求方式 · 浏览器直连</option>
                    </select>
                  </div>
                  <label class="check-row">
                    <input
                      type="checkbox"
                      checked=${Boolean(settings.image?.supportsReference)}
                      onChange=${(e) => updateImage({ supportsReference: e.currentTarget.checked })}
                    />
                    <span>该模型支持参考图编辑 / 图生图</span>
                  </label>
                  <p class="api-note">
                    火山方舟图片模型请填 Seedream；Seedance 是视频模型，不返回图片。生图 Key 独立保存，留空不会复用排版 Key。
                  </p>
                </details>
              `
            : html`
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
              `}
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
          ${busy
            ? busyLabel || (imageMode ? '正在生成素材图…' : '正在写稿…')
            : imageMode
              ? imageStyle === 'original'
                ? '使用原图'
                : '生成素材图'
              : '生成 3 个方案'}
        </button>
        ${!imageMode &&
        html`
          <button class="demo-btn" onClick=${onDemo} disabled=${busy}>
            没有 Key？用示例稿件预览 →
          </button>
        `}
        <p class="rail-hint">
          ${imageMode
            ? '生成结果会进入素材框；成功后自动切回排版模型。'
            : '一次生成三套版式；生成后可拖版块、双击改字、导出 PNG 或打印 PDF。'}
        </p>
      </section>
    </aside>
  `
}
