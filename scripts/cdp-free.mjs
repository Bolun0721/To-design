/**
 * 自由模式：提示弹窗 → 无图生成 SVG 图案 → 画廊/编辑器/导出。
 * 前置：node server.mjs + node scripts/mock-llm.mjs + Edge --remote-debugging-port=9222
 */
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const DEBUG = 'http://127.0.0.1:9222'
const APP = 'http://127.0.0.1:5173/'
const DOWNLOAD = new URL('../.shots/downloads/', import.meta.url)
const OUT = new URL('../.shots/', import.meta.url)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

await fs.rm(DOWNLOAD, { recursive: true, force: true })
await fs.mkdir(DOWNLOAD, { recursive: true })

const targets = await (await fetch(`${DEBUG}/json/list`)).json()
const page = targets.find((t) => t.type === 'page' && t.url.includes('127.0.0.1:5173'))
if (!page) throw new Error('没有找到 demo 页面')

const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let seq = 0
const pending = new Map()
const exceptions = []

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id) {
    const entry = pending.get(msg.id)
    if (entry) {
      pending.delete(msg.id)
      entry.resolve(msg)
    }
    return
  }
  if (msg.method === 'Runtime.exceptionThrown') exceptions.push(msg.params.exceptionDetails)
})

function call(method, params = {}, timeout = 40000) {
  const id = ++seq
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id)
        reject(new Error(`CDP timeout: ${method}`))
      }
    }, timeout)
  })
}

async function evaluate(expression, awaitPromise = false) {
  const res = await call('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  })
  if (res.result?.exceptionDetails) {
    throw new Error(`页面脚本异常：${JSON.stringify(res.result.exceptionDetails).slice(0, 800)}`)
  }
  return res.result?.result?.value
}

async function waitFor(expression, label, timeout = 30000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return true
    await sleep(300)
  }
  throw new Error(`等待超时：${label}`)
}

async function waitPng(timeout = 20000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    const files = (await fs.readdir(DOWNLOAD)).filter((file) => file.endsWith('.png'))
    if (files.length) return files[0]
    await sleep(300)
  }
  return ''
}

await call('Runtime.enable')
await call('Page.enable')
await call('Browser.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath: fileURLToPath(DOWNLOAD),
})

await evaluate(`
  localStorage.setItem('fpl.settings.v1', JSON.stringify({
    provider: 'custom',
    baseUrl: 'http://127.0.0.1:8787/v1',
    model: 'mock-model',
    mode: 'direct',
    vision: false
  }));
  localStorage.removeItem('fpl.mode.v1');
  sessionStorage.setItem('fpl.apikey.v1', 'mock-key');
  true;
`)
await call('Page.navigate', { url: APP })
await waitFor(`document.querySelector('.mode-select select')`, '模式下拉')
await sleep(500)

const result = {}

await evaluate(`(() => {
  const select = document.querySelector('.mode-select select');
  select.value = 'free';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return select.value;
})()`)
await waitFor(`document.querySelector('.free-mode-warning')`, '自由模式提示')
result.warningTitle = await evaluate(`document.querySelector('.modal-title')?.innerText`)
result.warningSubtitle = await evaluate(`document.querySelector('.modal-sub')?.innerText`)
await evaluate(
  `[...document.querySelectorAll('.free-mode-actions button')].find((b) => b.innerText.trim() === '取消').click(); true;`,
)
await sleep(400)
result.cancelMode = await evaluate(`document.querySelector('.mode-select select').value`)
result.cancelWarning = await evaluate(`Boolean(document.querySelector('.free-mode-warning'))`)

await evaluate(`(() => {
  const select = document.querySelector('.mode-select select');
  select.value = 'free';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return select.value;
})()`)
await waitFor(`document.querySelector('.free-mode-warning')`, '自由模式提示二')
await evaluate(
  `[...document.querySelectorAll('.free-mode-actions button')].find((b) => b.innerText.includes('继续使用')).click(); true;`,
)
await sleep(500)
result.freeMode = await evaluate(`document.querySelector('.mode-select select').value`)
result.storedMode = await evaluate(`localStorage.getItem('fpl.mode.v1')`)
result.noPhotoHint = await evaluate(`document.querySelector('.dropzone-empty')?.innerText || ''`)

await evaluate(`
  (() => {
    const ta = document.querySelector('#desc');
    ta.value = '自由模式：给偶像、日本和 DeepSeek 做一个抽象线条头版，不需要照片。';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return ta.value;
  })()
`)
await sleep(200)
await evaluate(`document.querySelector('.generate-btn').click(); true;`)
await waitFor(`document.querySelectorAll('.scheme-card').length === 3`, '自由模式三套', 40000)
await waitFor(
  `document.querySelectorAll('.scheme-card .hero-artwork img[src^="data:image/svg+xml"]').length === 3`,
  '三张 SVG 图案',
  30000,
)
await sleep(500)

result.cards = await evaluate(`document.querySelectorAll('.scheme-card').length`)
result.artCount = await evaluate(
  `document.querySelectorAll('.scheme-card .hero-artwork img[src^="data:image/svg+xml"]').length`,
)
result.placeholders = await evaluate(`document.querySelectorAll('.scheme-card .hero-empty').length`)
result.freeBar = await evaluate(`document.querySelector('.design-mode-bar')?.innerText || ''`)
result.stylePackCycle = await evaluate(`Boolean(document.querySelector('.pack-cycle'))`)
result.artSizes = await evaluate(
  `[...document.querySelectorAll('.scheme-card .hero-artwork img')].map((img) => img.src.length)`,
)
result.artDebug = await evaluate(
  `[...document.querySelectorAll('.scheme-card .hero-artwork img')].map((img) => ({
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    rect: img.getBoundingClientRect().toJSON(),
    figure: img.parentElement.getBoundingClientRect().toJSON(),
    srcPrefix: img.src.slice(0, 40)
  }))`,
)

await fs.mkdir(OUT, { recursive: true })
const galleryShot = await call('Page.captureScreenshot', { format: 'png' })
await fs.writeFile(new URL('free-mode.png', OUT), Buffer.from(galleryShot.result.data, 'base64'))

// 打开画布，验证 iframe 内 SVG 与导出
await evaluate(`document.querySelectorAll('.scheme-card')[0].click(); true;`)
await waitFor(
  `Boolean(document.querySelector('iframe.paper-frame')?.contentDocument?.querySelector('.paper'))`,
  '自由模式画布',
)
await sleep(700)
result.iframeArt = await evaluate(
  `Boolean(document.querySelector('iframe.paper-frame').contentDocument.querySelector('.hero-artwork img[src^="data:image/svg+xml"]'))`,
)
await evaluate(`document.querySelector('.action-btn.primary').click(); true;`)
await sleep(500)
const file = await waitPng()
result.exportFile = Boolean(file)
result.exportToast = await evaluate(`document.querySelector('.toast')?.innerText || ''`)
result.exportError = await evaluate(`document.querySelector('.error-box')?.innerText || ''`)
if (file) {
  const buffer = await fs.readFile(new URL(file, DOWNLOAD))
  result.exportSize = `${buffer.readUInt32BE(16)}×${buffer.readUInt32BE(20)}`
  result.exportBytes = buffer.length
}

// 有照片时优先使用照片，不显示生成的 SVG
await evaluate(`document.querySelector('.back-btn').click(); true;`)
await waitFor(`document.querySelectorAll('.scheme-card').length === 3`, '返回自由模式画廊')
const doc = await call('DOM.getDocument', { depth: -1 })
const photoInput = await call('DOM.querySelector', {
  nodeId: doc.result.root.nodeId,
  selector: '.rail input[type="file"]',
})
await call('DOM.setFileInputFiles', {
  nodeId: photoInput.result.nodeId,
  files: [fileURLToPath(new URL('../public/demo/coffee.jpg', import.meta.url))],
})
await waitFor(
  `document.querySelectorAll('.scheme-card .hero-artwork').length === 0 &&
   Boolean(document.querySelector('.scheme-card .hero img[src^="data:image"]'))`,
  '自由模式使用照片',
)
result.photoArtCount = await evaluate(
  `document.querySelectorAll('.scheme-card .hero-artwork').length`,
)
result.photoImageCount = await evaluate(
  `document.querySelectorAll('.scheme-card .hero img[src^="data:image"]').length`,
)

result.exceptions = exceptions.length
console.log(JSON.stringify(result, null, 2))

if (result.warningTitle !== '自由模式') throw new Error('自由模式提示标题异常')
if (!result.warningSubtitle?.includes('SVG')) throw new Error('自由模式提示没有说明 SVG')
if (result.cancelMode !== 'standard' || result.cancelWarning) throw new Error('取消后没有保持标准模式')
if (result.freeMode !== 'free' || result.storedMode !== 'free') throw new Error('自由模式没有生效或持久化')
if (!result.noPhotoHint.includes('自由模式可不提供照片')) throw new Error('没有显示自由模式无图提示')
if (result.cards !== 3) throw new Error('自由模式没有生成三套')
if (result.artCount !== 3) throw new Error('自由模式没有渲染三张 SVG')
if (result.placeholders !== 0) throw new Error('自由模式仍然出现空占位')
if (!result.freeBar.includes('自由图案')) throw new Error('自由模式画廊提示异常')
if (result.stylePackCycle) throw new Error('自由模式仍显示风格包')
if (!result.iframeArt) throw new Error('iframe 画布没有 SVG')
if (!result.exportFile) throw new Error('自由模式导出没有生成 PNG')
if (result.exportError) throw new Error(`自由模式导出错误：${result.exportError}`)
if (result.exportSize !== '1588×2246') throw new Error(`导出尺寸异常：${result.exportSize}`)
if (result.photoArtCount !== 0 || result.photoImageCount !== 3) {
  throw new Error('上传照片后自由模式没有优先使用照片')
}
if (result.exceptions) throw new Error('页面存在未捕获异常')

await call('Browser.close').catch(() => {})
ws.close()
