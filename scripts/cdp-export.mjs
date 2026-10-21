/**
 * 导出按钮端到端：亮色主题 + 报纸 + 海报，允许下载并检查 PNG 尺寸。
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const DEBUG = 'http://127.0.0.1:9222'
const ROOT = new URL('../.shots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const DOWNLOAD = path.join(ROOT, 'downloads')
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

async function waitFor(expression, label, timeout = 20000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return
    await sleep(300)
  }
  throw new Error(`等待超时：${label}`)
}

async function waitFile(timeout = 20000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    const files = (await fs.readdir(DOWNLOAD)).filter((f) => f.endsWith('.png'))
    if (files.length) return files
    await sleep(400)
  }
  return []
}

await call('Runtime.enable')
await call('Page.enable')
await call('Browser.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath: DOWNLOAD,
  eventsEnabled: true,
})

await call('Page.navigate', {
  url: 'http://127.0.0.1:5173/?demo=1&scheme=A&theme=light',
})
await waitFor(`document.querySelector('.action-btn.primary')`, '编辑器')
await waitFor(
  `Boolean(document.querySelector('iframe.paper-frame')?.contentDocument?.querySelector('.paper'))`,
  'iframe 画布',
)
await sleep(700)

const results = { theme: await evaluate(`document.documentElement.dataset.theme`) }

// 报纸导出
await evaluate(`document.querySelector('.action-btn.primary').click(); true;`)
await sleep(300)
const filesPaper = await waitFile()
await sleep(400)
results.paperFiles = filesPaper
results.paperToast = await evaluate(`document.querySelector('.toast')?.innerText || ''`)
results.paperError = await evaluate(`document.querySelector('.error-box')?.innerText || ''`)

// 切海报
await evaluate(`(() => {
  const btn = [...document.querySelectorAll('.seg button')].find((b) => b.innerText.trim() === '海报');
  if (btn) btn.click();
  return Boolean(btn);
})()`)
await sleep(800)
await evaluate(`document.querySelector('.action-btn.primary').click(); true;`)
await sleep(300)
const filesPoster = await waitFile()
await sleep(400)
results.posterFiles = filesPoster
results.posterToast = await evaluate(`document.querySelector('.toast')?.innerText || ''`)
results.posterError = await evaluate(`document.querySelector('.error-box')?.innerText || ''`)
results.exceptions = exceptions.length

console.log(JSON.stringify(results, null, 2))

if (!filesPaper.length) throw new Error('报纸导出没有生成 PNG 文件')
if (!filesPoster.some((f) => f !== filesPaper[0])) throw new Error('海报导出没有生成新的 PNG 文件')
if (results.paperError || results.posterError) throw new Error('导出时出现错误提示')
if (exceptions.length) throw new Error('导出时页面存在未捕获异常')

await call('Browser.close').catch(() => {})
ws.close()
