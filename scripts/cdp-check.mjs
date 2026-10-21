/**
 * iframe 画布隔离自检：
 * 编辑器 .paper 只在 iframe 内；父页面注入 .headline 样式不会影响 iframe。
 * 拖动 / 双击 / 导出见 cdp-sandbox.mjs。
 */
import fs from 'node:fs/promises'

const DEBUG = 'http://127.0.0.1:9222'
const OUT = new URL('../.shots/', import.meta.url)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const targets = await (await fetch(`${DEBUG}/json/list`)).json()
const page = targets.find((t) => t.type === 'page' && t.url.includes('127.0.0.1:5173'))
if (!page) throw new Error('没有找到 demo 页面，请先启动 Edge 并打开 demo URL')

const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let seq = 0
const pending = new Map()
const exceptions = []
const logs = []

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
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') logs.push(msg.params.entry.text)
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
    if (await evaluate(expression)) return true
    await sleep(250)
  }
  throw new Error(`等待超时：${label}`)
}

await call('Runtime.enable')
await call('Log.enable')
await call('Page.enable')
await call('Page.navigate', {
  url: 'http://127.0.0.1:5173/?demo=1&scheme=A&theme=dark',
})
await waitFor(
  `Boolean(document.querySelector('iframe.paper-frame')?.contentDocument?.querySelector('.paper'))`,
  'iframe 画布',
)

const results = {}
results.frame = await evaluate(
  `Boolean(document.querySelector('iframe.paper-frame'))`,
)
results.parentPaper = await evaluate(`Boolean(document.querySelector('.stage > .paper'))`)
results.iframePaper = await evaluate(
  `Boolean(document.querySelector('iframe.paper-frame').contentDocument.querySelector('.paper'))`,
)
results.blocks = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelectorAll('.paper .block').length`,
)
results.headline = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelector('.headline')?.innerText`,
)
results.iframeTheme = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.documentElement.dataset.theme`,
)
results.scaleLabel = await evaluate(`document.querySelector('.stage-zoom')?.innerText`)

// 父页面注入 .headline 样式，不应穿透 iframe
results.isolation = await evaluate(`(() => {
  const style = document.createElement('style');
  style.id = 'fpl-isolation-test';
  style.textContent = '.headline { color: rgb(255, 0, 0) !important; }';
  document.head.appendChild(style);
  const doc = document.querySelector('iframe.paper-frame').contentDocument;
  const color = getComputedStyle(doc.querySelector('.headline')).color;
  style.remove();
  return color;
})()`)

const shot = await call('Page.captureScreenshot', { format: 'png' })
await fs.mkdir(OUT, { recursive: true })
await fs.writeFile(new URL('iframe-isolation.png', OUT), Buffer.from(shot.result.data, 'base64'))

console.log(JSON.stringify({ ...results, exceptions: exceptions.length, logs }, null, 2))

if (!results.frame) throw new Error('没有 iframe 画布')
if (results.parentPaper) throw new Error('父页面仍然渲染了 .paper')
if (!results.iframePaper) throw new Error('iframe 内没有 .paper')
if (results.blocks < 6) throw new Error(`iframe 内版块数量异常：${results.blocks}`)
if (results.isolation === 'rgb(255, 0, 0)') throw new Error('父页面样式穿透到了 iframe')
if (exceptions.length) {
  console.error('页面存在未捕获异常：', JSON.stringify(exceptions, null, 2).slice(0, 2000))
  process.exitCode = 1
}

await call('Browser.close').catch(() => {})
ws.close()
