/**
 * 编辑器沙箱入口：在 iframe 内独立渲染 Paper，并接管拖动 / 双击 / 导出。
 * 父页面通过 postMessage 发送 render / export；这里的回调用 postMessage 回传。
 * 同源 iframe：用于 CSS/DOM 隔离，不宣称是安全边界。
 */
import { h, render } from 'preact'
import htm from 'htm'
import { Paper } from '../components/Paper.js'
import { resolveStyle } from '../config/presets.js'
import { renderTreatedPhoto } from '../lib/image.js'

const html = htm.bind(h)
const root = document.getElementById('paper-root')
const paperRef = { current: null }
let currentState = null
let announced = false

function post(message) {
  window.parent.postMessage({ source: 'fpl-paper', ...message }, '*')
}

function draw() {
  if (!currentState) return
  document.documentElement.dataset.theme =
    currentState.theme === 'light' ? 'light' : 'dark'
  const background = currentState.background || '#FFFFFF'
  document.documentElement.style.backgroundColor = background
  document.body.style.backgroundColor = background

  render(
    html`
      <${Paper}
        scheme=${currentState.scheme}
        format=${currentState.format}
        photo=${currentState.photo}
        photo2=${currentState.photo2}
        scale=${currentState.scale}
        interactive=${true}
        paperRef=${paperRef}
        disclaimer=${currentState.disclaimer}
        onBlockCommit=${(id, patch) => post({ type: 'block', id, patch })}
        onEditText=${(key, text) => post({ type: 'text', key, text })}
      />
    `,
    root,
  )

  if (!announced) {
    announced = true
    post({ type: 'ready' })
  }
}

async function exportPaper({ requestId, scale = 2, background = '#FFFFFF' }) {
  if (!currentState) throw new Error('画布尚未就绪')
  const paper = paperRef.current || document.querySelector('.paper')
  if (!paper) throw new Error('画布尚未就绪')
  if (!window.html2canvas) throw new Error('导出组件未加载，请刷新页面')

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* ignore */
    }
  }

  const st = resolveStyle(currentState.scheme)
  const images = [...paper.querySelectorAll('.hero img')]
  const previousSrc = images.map((img) => img.getAttribute('src'))
  const treated = await Promise.all(
    images.map((img) =>
      renderTreatedPhoto(
        { dataUrl: img.src },
        st.imageTreatment,
        st.palette.accent,
        img.clientWidth,
      ),
    ),
  )
  await Promise.all(
    images.map(async (img, index) => {
      if (treated[index] && treated[index] !== img.src) {
        img.src = treated[index]
        try {
          await img.decode()
        } catch {
          /* ignore */
        }
      }
    }),
  )

  const dots = [...paper.querySelectorAll('.halftone-dots')]
  dots.forEach((el) => {
    el.style.display = 'none'
  })

  const zoom = paper.parentElement
  const previousTransform = zoom ? zoom.style.transform : ''
  if (zoom) zoom.style.transform = 'none'
  void paper.offsetWidth

  try {
    const canvas = await window.html2canvas(paper, {
      scale,
      backgroundColor: background,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: paper.offsetWidth,
      height: paper.offsetHeight,
    })
    post({
      type: 'export-result',
      requestId,
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
    })
  } catch (err) {
    post({
      type: 'export-error',
      requestId,
      message: err.message || '导出失败',
    })
  } finally {
    if (zoom) zoom.style.transform = previousTransform
    images.forEach((img, index) => {
      if (previousSrc[index]) img.setAttribute('src', previousSrc[index])
    })
    dots.forEach((el) => {
      el.style.display = ''
    })
  }
}

window.addEventListener('message', (event) => {
  if (event.source !== window.parent) return
  const data = event.data
  if (!data || data.source !== 'fpl-parent') return

  if (data.type === 'render') {
    currentState = data.state
    draw()
  }

  if (data.type === 'export') {
    exportPaper(data).catch((err) => {
      post({
        type: 'export-error',
        requestId: data.requestId,
        message: err.message || '导出失败',
      })
    })
  }
})

// 通知父页面：iframe 已准备好，可以发送首帧
post({ type: 'hello' })
