/**
 * iframe 沙箱画布自检：
 * 在 iframe 内拖动 / 双击改字，父页面点导出，确认 PNG 尺寸与无异常。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEBUG = 'http://127.0.0.1:9222'
const DOWNLOAD = fileURLToPath(new URL('../.shots/sandbox-downloads/', import.meta.url))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

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

function call(method, params = {}, timeout = 60000) {
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

async function evaluate(expression) {
  const res = await call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    userGesture: true,
    awaitPromise: true,
  })
  if (res.result?.exceptionDetails) {
    throw new Error(`页面脚本异常：${JSON.stringify(res.result.exceptionDetails).slice(0, 1000)}`)
  }
  return res.result?.result?.value
}

async function waitFor(expression, label, timeout = 25000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return
    await sleep(300)
  }
  throw new Error(`等待超时：${label}`)
}

async function waitForPng(timeout = 30000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    const names = (await fs.readdir(DOWNLOAD).catch(() => [])).filter((n) => n.endsWith('.png'))
    if (names.length) return path.join(DOWNLOAD, names[0])
    await sleep(300)
  }
  return null
}

await fs.rm(DOWNLOAD, { recursive: true, force: true })
await fs.mkdir(DOWNLOAD, { recursive: true })

await call('Runtime.enable')
await call('Page.enable')
await call('Browser.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath: DOWNLOAD,
})

await call('Page.navigate', {
  url: 'http://127.0.0.1:5173/?demo=1&scheme=A&theme=dark',
})
await waitFor(
  `Boolean(document.querySelector('iframe.paper-frame')?.contentDocument?.querySelector('.paper'))`,
  'iframe 画布',
)

const results = {}
results.hasParentPaper = await evaluate(`Boolean(document.querySelector('.stage > .paper'))`)
results.iframePaper = await evaluate(
  `Boolean(document.querySelector('iframe.paper-frame')?.contentDocument?.querySelector('.paper'))`,
)

// 在 iframe 内拖动标题
const dragResult = await evaluate(`(() => {
  const frame = document.querySelector('iframe.paper-frame');
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  const el = doc.querySelector('[data-block-id="headline"]');
  if (!el) return { ok: false };
  const rect = el.getBoundingClientRect();
  const startLeft = parseFloat(el.style.left);
  const startTop = parseFloat(el.style.top);
  const base = {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  };
  el.dispatchEvent(new win.PointerEvent('pointerdown', base));
  win.dispatchEvent(new win.PointerEvent('pointermove', { ...base, clientX: base.clientX + 46, clientY: base.clientY + 34 }));
  win.dispatchEvent(new win.PointerEvent('pointerup', { ...base, buttons: 0, clientX: base.clientX + 46, clientY: base.clientY + 34 }));
  return { ok: true, startLeft, startTop };
})()`)
await sleep(800)
results.drag = await evaluate(`(() => {
  const doc = document.querySelector('iframe.paper-frame').contentDocument;
  const el = doc.querySelector('[data-block-id="headline"]');
  return { left: parseFloat(el.style.left), top: parseFloat(el.style.top) };
})()`)
results.dragStart = dragResult

// 在 iframe 内双击改字
const editResult = await evaluate(`(() => {
  const frame = document.querySelector('iframe.paper-frame');
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  const el = doc.querySelector('[data-block-id="headline"] [data-edit="headline"]');
  if (!el) return false;
  el.dispatchEvent(new win.MouseEvent('dblclick', { bubbles: true, cancelable: true }));
  el.innerText = '沙箱里的头版';
  el.blur();
  return true;
})()`)
await sleep(900)
results.editDispatched = editResult
results.headline = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelector('[data-block-id="headline"] [data-edit="headline"]')?.innerText`,
)

// 点主色，确认 iframe 内重新渲染
const accentBefore = await evaluate(
  `getComputedStyle(document.querySelector('iframe.paper-frame').contentDocument.querySelector('.paper')).getPropertyValue('--accent')`,
)
await evaluate(`document.querySelectorAll('.swatch')[1].click(); true;`)
await sleep(700)
const accentAfter = await evaluate(
  `getComputedStyle(document.querySelector('iframe.paper-frame').contentDocument.querySelector('.paper')).getPropertyValue('--accent')`,
)
results.accent = { before: accentBefore.trim(), after: accentAfter.trim() }

// 父页面按钮导出，验证 iframe 内 html2canvas 回传
await evaluate(`document.querySelector('.action-btn.primary').click(); true;`)
const file = await waitForPng()
results.exportFile = Boolean(file)
results.exportToast = await evaluate(`document.querySelector('.toast')?.innerText || ''`)
if (file) {
  const buf = await fs.readFile(file)
  results.exportSize = `${buf.readUInt32BE(16)}×${buf.readUInt32BE(20)}`
  results.exportBytes = buf.length
}

const shot = await call('Page.captureScreenshot', { format: 'png' })
await fs.mkdir(fileURLToPath(new URL('../.shots/', import.meta.url)), { recursive: true })
await fs.writeFile(
  fileURLToPath(new URL('../.shots/iframe-check.png', import.meta.url)),
  Buffer.from(shot.result.data, 'base64'),
)

results.exceptions = exceptions.length
console.log(JSON.stringify(results, null, 2))

if (results.hasParentPaper) throw new Error('编辑器仍在父页面渲染 .paper')
if (!results.iframePaper) throw new Error('iframe 内没有画布')
if (!results.dragStart?.ok) throw new Error('没有找到可拖动标题')
if (!(results.drag.left > results.dragStart.startLeft)) throw new Error('iframe 内拖动没有生效')
if (results.headline !== '沙箱里的头版') throw new Error('iframe 内双击改字没有同步到父页面状态')
if (results.accent.before === results.accent.after) throw new Error('换色后 iframe 没有重新渲染')
if (!results.exportFile) throw new Error('iframe 导出没有生成 PNG')
if (results.exportSize !== '1588×2246') throw new Error(`导出尺寸异常：${results.exportSize}`)
if (results.exportToast.includes('失败')) throw new Error('导出失败 toast')
if (exceptions.length) throw new Error('页面存在未捕获异常')

await call('Browser.close').catch(() => {})
ws.close()
