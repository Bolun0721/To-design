import { h } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import htm from 'htm'
import { FORMATS, resolveStyle } from '../config/presets.js'

const html = htm.bind(h)

const IMPORT_MAP = JSON.stringify({
  imports: {
    preact: '/vendor/preact.mjs',
    'preact/hooks': '/vendor/hooks.mjs',
    htm: '/vendor/htm.mjs',
  },
})

const SRCDOC = `<!doctype html>
<html lang="zh-CN" data-theme="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Noto+Sans+SC:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,600;0,800;1,600&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/src/styles.css" />
<link rel="stylesheet" href="/src/theme-chat.css" />
<style>
  html, body {
    height: 100%;
    margin: 0;
    padding: 0;
    background: transparent !important;
    overflow: hidden;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #paper-root {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  .paper-viewport {
    box-shadow: none;
  }
  body.is-block-dragging {
    user-select: none;
    cursor: grabbing;
  }
  body.is-block-dragging * {
    cursor: grabbing !important;
  }
  #selection-hud {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 300;
  }
  .select-card {
    position: absolute;
    width: 184px;
    padding: 10px 11px 9px;
    border: 1px solid var(--accent, #c8102e);
    background: #151517;
    color: #f5f0e6;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    pointer-events: auto;
    cursor: pointer;
  }
  html[data-theme="light"] .select-card {
    background: #fffdf7;
    color: #17181c;
    box-shadow: 0 16px 40px rgba(40, 45, 60, 0.2);
  }
  .select-kicker {
    display: block;
    font-family: "IBM Plex Mono", "Courier New", monospace;
    font-size: 7px;
    letter-spacing: 0.14em;
    color: var(--accent, #c8102e);
    text-transform: uppercase;
  }
  .select-name {
    display: block;
    margin-top: 4px;
    font-size: 19px;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.12;
  }
  .select-hint {
    display: block;
    margin-top: 3px;
    font-size: 8.5px;
    letter-spacing: 0.04em;
    opacity: 0.62;
  }
  .select-ref {
    display: block;
    width: 100%;
    margin-top: 8px;
    padding: 5px 7px;
    border: 1px solid var(--accent, #c8102e);
    background: transparent;
    color: inherit;
    font-family: inherit;
    font-size: 8.5px;
    letter-spacing: 0.08em;
    text-align: left;
    cursor: pointer;
  }
  .select-ref:hover {
    background: var(--accent, #c8102e);
    color: #fff;
  }
  body.is-block-dragging .select-card {
    opacity: 0;
    pointer-events: none;
  }
</style>
<script src="/vendor/html2canvas.min.js"></script>
<script type="importmap">${IMPORT_MAP}</script>
</head>
<body>
  <div id="paper-root"></div>
  <div id="selection-hud"></div>
  <script type="module" src="/src/sandbox/entry.js"></script>
</body>
</html>`

/**
 * 编辑器画布：Paper 渲染在同源 iframe 内。
 * 父页面只负责发送状态、接收 block/text 事件和导出结果。
 */
export function IframePaper({
  scheme,
  format,
  photo,
  photo2,
  scale,
  theme,
  freeMode = false,
  disclaimer,
  onBlockCommit,
  onEditText,
  onReferenceBlock,
  controllerRef,
}) {
  const iframeRef = useRef(null)
  const [ready, setReady] = useState(false)
  const pendingRef = useRef(new Map())
  const dims = FORMATS[format]
  const style = scheme ? resolveStyle(scheme) : null
  const background = style?.palette.background || '#FFFFFF'
  const frameWidth = dims.width * scale
  const frameHeight = dims.height * scale

  const sendRender = useCallback(() => {
    const win = iframeRef.current?.contentWindow
    if (!win || !scheme) return
    win.postMessage(
      {
        source: 'fpl-parent',
        type: 'render',
        state: { scheme, format, photo, photo2, scale, theme, freeMode, disclaimer, background },
      },
      '*',
    )
  }, [scheme, format, photo, photo2, scale, theme, freeMode, disclaimer, background])

  useEffect(() => {
    if (ready) sendRender()
  }, [ready, sendRender])

  useEffect(() => {
    const win = iframeRef.current?.contentWindow
    if (!win) return undefined

    const onMessage = (event) => {
      if (event.source !== win) return
      const data = event.data
      if (!data || data.source !== 'fpl-paper') return

      if (data.type === 'hello') {
        setReady(true)
        sendRender()
        return
      }
      if (data.type === 'block') {
        onBlockCommit?.(data.id, data.patch)
        return
      }
      if (data.type === 'text') {
        onEditText?.(data.key, data.text)
        return
      }
      if (data.type === 'reference') {
        onReferenceBlock?.(data.block)
        return
      }
      if (data.type === 'export-result' || data.type === 'export-error') {
        const pending = pendingRef.current.get(data.requestId)
        if (!pending) return
        pendingRef.current.delete(data.requestId)
        clearTimeout(pending.timer)
        if (data.type === 'export-result') pending.resolve(data)
        else pending.reject(new Error(data.message || '导出失败'))
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [onBlockCommit, onEditText, onReferenceBlock, sendRender])

  useEffect(() => {
    if (!controllerRef) return undefined
    controllerRef.current = {
      exportPng: ({ scale: exportScale = 2, background = '#FFFFFF' } = {}) =>
        new Promise((resolve, reject) => {
          const win = iframeRef.current?.contentWindow
          if (!win || !ready) {
            reject(new Error('画布还没准备好，请稍后再试'))
            return
          }
          const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          const timer = setTimeout(() => {
            pendingRef.current.delete(requestId)
            reject(new Error('导出超时，请重试'))
          }, 45000)
          pendingRef.current.set(requestId, { resolve, reject, timer })
          win.postMessage(
            { source: 'fpl-parent', type: 'export', requestId, scale: exportScale, background },
            '*',
          )
        }),
    }
    return () => {
      controllerRef.current = null
      for (const pending of pendingRef.current.values()) {
        clearTimeout(pending.timer)
        pending.reject(new Error('画布已关闭'))
      }
      pendingRef.current.clear()
    }
  }, [controllerRef, ready])

  return html`
    <div
      class="paper-sandbox"
      style=${`width:${frameWidth}px;height:${frameHeight}px`}
    >
      <iframe
        ref=${iframeRef}
        class="paper-frame"
        title="报纸画布"
        style=${`background:${background}`}
        srcDoc=${SRCDOC}
        onLoad=${() => {
          setReady(true)
          sendRender()
        }}
      ></iframe>
    </div>
  `
}
