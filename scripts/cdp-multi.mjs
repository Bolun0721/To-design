/**
 * P1 多图自检：
 * 1. 示例经典大报加载主图 + 次图；
 * 2. 移除次图 → 出现占位，仍可导出；
 * 3. 重新上传次图 → 恢复两图。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEBUG = 'http://127.0.0.1:9222'
const DOWNLOAD = fileURLToPath(new URL('../.shots/multi-downloads/', import.meta.url))
const SECONDARY_FILE = fileURLToPath(new URL('../public/demo/coffee-2.jpg', import.meta.url))
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

async function evaluate(expression) {
  const res = await call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    userGesture: true,
  })
  if (res.result?.exceptionDetails) {
    throw new Error(`页面脚本异常：${JSON.stringify(res.result.exceptionDetails).slice(0, 800)}`)
  }
  return res.result?.result?.value
}

async function waitFor(expression, label, timeout = 15000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return
    await sleep(300)
  }
  throw new Error(`等待超时：${label}`)
}

async function waitForPng(timeout = 20000) {
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
await call('DOM.enable')
await call('Browser.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath: DOWNLOAD,
})

await call('Page.navigate', {
  url: 'http://127.0.0.1:5173/?demo=1&scheme=A&theme=light',
})
await waitFor(
  `document.querySelector('iframe.paper-frame')?.contentDocument?.querySelectorAll('.paper .hero img').length === 2 &&
   Boolean(document.querySelector('.slot-row .slot-thumb img'))`,
  '两图初态',
)

const results = {}
results.initialImages = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelectorAll('.paper .hero img').length`,
)
results.slotRows = await evaluate(`document.querySelectorAll('.slot-row').length`)

// 移除次图
await evaluate(`(() => {
  const row = [...document.querySelectorAll('.slot-row')].find((r) => r.innerText.includes('次图'));
  const btn = row && [...row.querySelectorAll('button')].find((b) => b.innerText.includes('移除'));
  if (btn) btn.click();
  return Boolean(btn);
})()`)
await waitFor(
  `document.querySelector('iframe.paper-frame')?.contentDocument?.querySelectorAll('.paper .hero img').length === 1 &&
   Boolean(document.querySelector('iframe.paper-frame').contentDocument.querySelector('[data-block-id="secondary"] .hero-empty'))`,
  '次图占位',
)
results.afterRemoveImages = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelectorAll('.paper .hero img').length`,
)
results.placeholderText = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelector('[data-block-id="secondary"] .hero-empty')?.innerText`,
)

await fs.mkdir(DOWNLOAD, { recursive: true })
await evaluate(`document.querySelector('.action-btn.primary').click(); true;`)
const file = await waitForPng()
results.placeholderExport = Boolean(file)
results.placeholderToast = await evaluate(`document.querySelector('.toast')?.innerText || ''`)
results.placeholderError = await evaluate(`document.querySelector('.error-box')?.innerText || ''`)
if (file) await fs.rm(file, { force: true })

// 重新上传次图
const doc = await call('DOM.getDocument', { depth: -1 })
const node = await call('DOM.querySelector', {
  nodeId: doc.result.root.nodeId,
  selector: '.inspector input[type="file"]',
})
await call('DOM.setFileInputFiles', {
  nodeId: node.result.nodeId,
  files: [SECONDARY_FILE],
})
await waitFor(
  `document.querySelector('iframe.paper-frame')?.contentDocument?.querySelectorAll('.paper .hero img').length === 2 &&
   Boolean(document.querySelector('iframe.paper-frame').contentDocument.querySelector('[data-block-id="secondary"] .hero img'))`,
  '次图已上传',
)
results.restoredImages = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelectorAll('.paper .hero img').length`,
)
results.captionSecondary = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelector('[data-block-id="secondaryCaption"] .caption')?.innerText`,
)
results.exceptions = exceptions.length

console.log(JSON.stringify(results, null, 2))

if (results.initialImages !== 2) throw new Error('示例没有渲染两张图')
if (results.afterRemoveImages !== 1) throw new Error('移除次图后图片数量异常')
if (!results.placeholderText) throw new Error('次图占位没有出现')
if (!results.placeholderExport) throw new Error('占位状态导出失败')
if (results.placeholderError) throw new Error(`占位导出出现错误：${results.placeholderError}`)
if (results.restoredImages !== 2) throw new Error('重新上传次图后没有恢复两图')
if (!results.captionSecondary?.includes('午后')) throw new Error('次图说明没有渲染')
if (exceptions.length) throw new Error('页面存在未捕获异常')

await call('Browser.close').catch(() => {})
ws.close()
