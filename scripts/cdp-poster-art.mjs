/**
 * 海报艺术字自检：design 模式 + 海报 → headline / masthead / note 三个位置。
 * 前置：node server.mjs + node scripts/mock-llm.mjs + Edge 9222。
 */
const DEBUG = 'http://127.0.0.1:9222'
const APP = 'http://127.0.0.1:5173/?demo=1&format=poster'
const OUT = new URL('../.shots/', import.meta.url)
import fs from 'node:fs/promises'
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
  const message = JSON.parse(event.data)
  if (message.id) {
    const item = pending.get(message.id)
    if (item) {
      pending.delete(message.id)
      item.resolve(message)
    }
    return
  }
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails)
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
  const result = await call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  })
  if (result.result?.exceptionDetails) throw new Error('页面脚本异常')
  return result.result?.result?.value
}
async function waitFor(expression, label, timeout = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return
    await sleep(300)
  }
  throw new Error(`等待超时：${label}`)
}

await call('Runtime.enable')
await call('Page.enable')
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
await evaluate(`(() => {
  const select = document.querySelector('.mode-select select');
  select.value = 'design';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`)
await sleep(400)
await evaluate(`document.querySelector('.generate-btn').click(); true;`)
await waitFor(`document.querySelectorAll('.scheme-card').length === 3`, '海报三套', 40000)
await sleep(700)

await fs.mkdir(OUT, { recursive: true })
const snapshot = await call('Page.captureScreenshot', { format: 'png' })
await fs.writeFile(new URL('poster-art.png', OUT), Buffer.from(snapshot.result.data, 'base64'))

const result = {
  format: await evaluate(`document.querySelector('.format-btn.active')?.innerText || ''`),
  headline: await evaluate(
    `[...document.querySelectorAll('.scheme-card .headline-art')].map((n) => n.innerText.trim())`,
  ),
  masthead: await evaluate(
    `[...document.querySelectorAll('.scheme-card .m-art')].map((n) => n.innerText.trim())`,
  ),
  note: await evaluate(
    `[...document.querySelectorAll('.scheme-card .poster-note-art')].map((n) => n.innerText.trim())`,
  ),
  exceptions: exceptions.length,
}
console.log(JSON.stringify(result, null, 2))

if (!result.format.includes('海报')) throw new Error('没有进入海报格式')
if (result.headline.length !== 3) throw new Error('缺少 headline 艺术词')
if (result.masthead.length !== 3) throw new Error('缺少 masthead 艺术词')
if (result.note.length !== 3) throw new Error('缺少 note 艺术词')
if (!result.masthead.includes('BAUHAUS')) throw new Error('masthead 艺术词异常')
if (!result.note.includes('ISSUE 03')) throw new Error('note 艺术词异常')
if (result.exceptions) throw new Error('页面存在未捕获异常')

await call('Browser.close').catch(() => {})
ws.close()
