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
const hud = document.getElementById('selection-hud')
const paperRef = { current: null }
let currentState = null
let announced = false
let selectedId = null

function post(message) {
  window.parent.postMessage({ source: 'fpl-paper', ...message }, '*')
}

function blockInfo(block) {
  return {
    id: block.dataset.blockId,
    label: block.dataset.label || block.dataset.blockId || '板块',
    type: block.dataset.type || 'block',
  }
}

function clearSelection() {
  selectedId = null
  const paper = paperRef.current || document.querySelector('.paper')
  if (paper) {
    paper.querySelectorAll('.block.is-selected').forEach((el) => el.classList.remove('is-selected'))
  }
  if (hud) hud.replaceChildren()
}

function referenceBlock(block) {
  post({ type: 'reference', block: blockInfo(block) })
}

function applySelection() {
  if (!hud) return
  const paper = paperRef.current || document.querySelector('.paper')
  if (!paper) return
  paper.querySelectorAll('.block.is-selected').forEach((el) => el.classList.remove('is-selected'))
  hud.replaceChildren()
  if (!selectedId) return

  let block = null
  try {
    block = paper.querySelector(`[data-block-id="${CSS.escape(selectedId)}"]`)
  } catch {
    block = paper.querySelector(`[data-block-id="${selectedId}"]`)
  }
  if (!block) {
    selectedId = null
    return
  }
  block.classList.add('is-selected')

  const info = blockInfo(block)
  const card = document.createElement('div')
  card.className = 'select-card'
  card.setAttribute('role', 'button')
  card.setAttribute('title', '双击引用到对话')
  card.tabIndex = 0

  const kicker = document.createElement('span')
  kicker.className = 'select-kicker'
  kicker.textContent = `已选中 · ${info.type.toUpperCase()}`

  const name = document.createElement('strong')
  name.className = 'select-name'
  name.textContent = info.label

  const hint = document.createElement('span')
  hint.className = 'select-hint'
  hint.textContent = '双击卡片引用到对话'

  const button = document.createElement('button')
  button.className = 'select-ref'
  button.type = 'button'
  button.textContent = '引用到对话 →'

  card.append(kicker, name, hint, button)
  hud.appendChild(card)

  card.addEventListener('dblclick', (event) => {
    event.preventDefault()
    event.stopPropagation()
    referenceBlock(block)
  })
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      referenceBlock(block)
    }
  })
  button.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    referenceBlock(block)
  })

  const rect = block.getBoundingClientRect()
  const cardWidth = card.offsetWidth || 184
  const cardHeight = card.offsetHeight || 84
  let left = rect.left
  let top = rect.top - cardHeight - 9
  if (top < 6) top = rect.bottom + 9
  if (top + cardHeight > window.innerHeight - 6) {
    top = Math.max(6, window.innerHeight - cardHeight - 6)
  }
  left = Math.max(6, Math.min(left, window.innerWidth - cardWidth - 6))
  card.style.left = `${left}px`
  card.style.top = `${top}px`
}

function bindSelection() {
  const paper = paperRef.current || document.querySelector('.paper')
  if (!paper || paper.dataset.fplSelectBound === '1') return
  paper.dataset.fplSelectBound = '1'

  let down = null

  paper.addEventListener(
    'pointerdown',
    (event) => {
      const block = event.target.closest('[data-block-id]')
      down = {
        x: event.clientX,
        y: event.clientY,
        block: block || null,
        moved: false,
      }
    },
    true,
  )

  window.addEventListener(
    'pointermove',
    (event) => {
      if (!down) return
      if (Math.abs(event.clientX - down.x) > 4 || Math.abs(event.clientY - down.y) > 4) {
        down.moved = true
      }
    },
    true,
  )

  window.addEventListener(
    'pointerup',
    () => {
      if (!down) return
      const { block, moved } = down
      down = null
      if (moved) return
      if (block) {
        selectedId = block.dataset.blockId
        applySelection()
      } else {
        clearSelection()
      }
    },
    true,
  )

  paper.addEventListener(
    'dblclick',
    (event) => {
      const block = event.target.closest('[data-block-id]')
      if (!block || selectedId !== block.dataset.blockId) return
      if (block.dataset.type === 'image' || event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        referenceBlock(block)
      }
    },
    true,
  )
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
        freeMode=${Boolean(currentState.freeMode)}
        interactive=${true}
        paperRef=${paperRef}
        disclaimer=${currentState.disclaimer}
        onBlockCommit=${(id, patch) => post({ type: 'block', id, patch })}
        onEditText=${(key, text) => post({ type: 'text', key, text })}
      />
    `,
    root,
  )

  bindSelection()
  applySelection()

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
  const treatmentImages = images.filter((img) => !img.closest('.hero-artwork'))
  const treated = await Promise.all(
    treatmentImages.map((img) =>
      renderTreatedPhoto(
        { dataUrl: img.src },
        st.imageTreatment,
        st.palette.accent,
        img.clientWidth,
      ),
    ),
  )
  await Promise.all(
    treatmentImages.map(async (img, index) => {
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

  // 预览用 SVG；导出时换父页面预先光栅化好的 PNG，避免 html2canvas 解码 SVG。
  const artworkImages = images.filter((img) => img.closest('.hero-artwork'))
  await Promise.all(
    artworkImages.map(async (img) => {
      const png = img.dataset.exportSrc
      if (!png) return
      img.src = png
      await new Promise((resolve) => {
        if (img.complete && img.naturalWidth) resolve()
        else img.addEventListener('load', resolve, { once: true })
        setTimeout(resolve, 1200)
      })
    }),
  )

  const dots = [...paper.querySelectorAll('.halftone-dots')]
  dots.forEach((el) => {
    el.style.display = 'none'
  })

  const zoom = paper.parentElement
  const previousTransform = zoom ? zoom.style.transform : ''
  paper.classList.add('is-exporting')
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
    paper.classList.remove('is-exporting')
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
