/**
 * 端到端：真实点击「生成 3 个方案」，走 requestSchemes → 校验 → 画廊。
 * 前置：node server.mjs + node scripts/mock-llm.mjs + Edge --remote-debugging-port=9222
 */
import fs from 'node:fs/promises'

const DEBUG = 'http://127.0.0.1:9222'
const APP = 'http://127.0.0.1:5173/'
const OUT = new URL('../.shots/', import.meta.url)
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

async function waitFor(expression, label, timeout = 20000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return true
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
  sessionStorage.setItem('fpl.apikey.v1', 'mock-key');
  true;
`)
await call('Page.navigate', { url: APP })
await waitFor(`document.querySelector('.generate-btn')`, '首页渲染')
await sleep(600)

await evaluate(`
  (() => {
    const ta = document.querySelector('#desc');
    ta.value = '模型联调：周末在巷口咖啡馆的一杯手冲，做成报纸头版。';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return ta.value;
  })()
`)
await sleep(200)
await evaluate(`document.querySelector('.generate-btn').click(); true;`)

await waitFor(`document.querySelectorAll('.scheme-card').length === 3`, '三套方案渲染', 30000)
await sleep(600)

const result = {
  cards: await evaluate(`document.querySelectorAll('.scheme-card').length`),
  names: await evaluate(`[...document.querySelectorAll('.card-name')].map((n) => n.innerText)`),
  summary: await evaluate(`document.querySelector('.gallery-sub')?.innerText`),
  status: await evaluate(`document.querySelector('.header-status')?.innerText.trim()`),
  headline: await evaluate(`document.querySelector('.scheme-card .headline')?.innerText`),
  warnings: await evaluate(`document.querySelectorAll('.warn-box li').length`),
}

await fs.mkdir(OUT, { recursive: true })
const shot = await call('Page.captureScreenshot', { format: 'png' })
await fs.writeFile(new URL('generated.png', OUT), Buffer.from(shot.result.data, 'base64'))

console.log(JSON.stringify({ ...result, exceptions: exceptions.length }, null, 2))

if (result.cards !== 3) throw new Error('没有生成 3 套方案')
if (!result.summary?.includes('MOCK')) throw new Error('画廊没有使用 mock 模型返回的 summary')
if (!result.names?.includes('模型乙')) throw new Error('画廊没有使用 mock 模型返回的方案名')
if (exceptions.length) throw new Error('页面存在未捕获异常')

await call('Browser.close').catch(() => {})
ws.close()
