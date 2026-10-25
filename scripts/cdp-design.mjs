/**
 * 设计模式端到端：模式下拉 → 设计提示词 → 生成自由方案 → 不套风格包。
 * 前置：node server.mjs + node scripts/mock-llm.mjs + Edge --remote-debugging-port=9222
 */
import fs from 'node:fs/promises'

const DEBUG = 'http://127.0.0.1:9222'
const APP = 'http://127.0.0.1:5173/?demo=1'
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

async function waitFor(expression, label, timeout = 30000) {
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
  localStorage.removeItem('fpl.mode.v1');
  sessionStorage.setItem('fpl.apikey.v1', 'mock-key');
  true;
`)
await call('Page.navigate', { url: APP })
await waitFor(`document.querySelector('.mode-select select')`, '模式下拉')
await sleep(500)

const result = {}
result.initialMode = await evaluate(`document.querySelector('.mode-select select').value`)

await evaluate(`(() => {
  const select = document.querySelector('.mode-select select');
  select.value = 'design';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return select.value;
})()`)
await sleep(400)
result.designMode = await evaluate(`document.querySelector('.mode-select select').value`)
result.designClass = await evaluate(`document.querySelector('.mode-select').classList.contains('is-design')`)
result.storedMode = await evaluate(`localStorage.getItem('fpl.mode.v1')`)
result.datasetMode = await evaluate(`document.documentElement.dataset.mode`)

await evaluate(
  `[...document.querySelectorAll('.header-btn')].find((b) => b.innerText.includes('系统提示词')).click(); true;`,
)
await waitFor(`document.querySelector('.modal-content, .modal-box, .modal')`, '提示词弹窗')
await sleep(400)
result.promptHasDesign = await evaluate(
  `Boolean(document.querySelector('.modal, .modal-box, .modal-content')?.innerText.includes('设计总监'))`,
)
await evaluate(`document.querySelector('.modal-close, .modal .close, .modal button')?.click(); true;`)
await sleep(300)

await evaluate(`
  (() => {
    const ta = document.querySelector('#desc');
    ta.value = '设计模式联调：给巷口咖啡馆做三套完全不同的头版，允许少正文。';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return ta.value;
  })()
`)
await sleep(200)
await evaluate(`document.querySelector('.generate-btn').click(); true;`)
await waitFor(`document.querySelectorAll('.scheme-card').length === 3`, '设计模式三套方案', 30000)
await sleep(700)

result.cards = await evaluate(`document.querySelectorAll('.scheme-card').length`)
result.names = await evaluate(`[...document.querySelectorAll('.card-name')].map((n) => n.innerText)`)
result.variants = await evaluate(`[...document.querySelectorAll('.card-variant')].map((n) => n.innerText)`)
result.summary = await evaluate(`document.querySelector('.gallery-sub')?.innerText`)
result.designBar = await evaluate(`Boolean(document.querySelector('.design-mode-bar'))`)
result.stylePackCycle = await evaluate(`Boolean(document.querySelector('.pack-cycle'))`)
result.bodyB = await evaluate(
  `document.querySelectorAll('.scheme-card')[1]?.querySelector('.paper .body')?.innerText.trim() || ''`,
)

await fs.mkdir(OUT, { recursive: true })
const shot = await call('Page.captureScreenshot', { format: 'png' })
await fs.writeFile(new URL('design-mode.png', OUT), Buffer.from(shot.result.data, 'base64'))

await evaluate(`(() => {
  const select = document.querySelector('.mode-select select');
  select.value = 'standard';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return select.value;
})()`)
await sleep(500)
result.standardMode = await evaluate(`document.querySelector('.mode-select select').value`)
result.standardPack = await evaluate(`Boolean(document.querySelector('.pack-cycle'))`)
result.storedStandard = await evaluate(`localStorage.getItem('fpl.mode.v1')`)
result.exceptions = exceptions.length

console.log(JSON.stringify(result, null, 2))

if (result.initialMode !== 'standard') throw new Error('默认模式不是标准模板')
if (result.designMode !== 'design' || !result.designClass) throw new Error('没有切到设计模式')
if (result.storedMode !== 'design' || result.datasetMode !== 'design') throw new Error('设计模式没有持久化')
if (!result.promptHasDesign) throw new Error('系统提示词弹窗没有显示设计总监提示词')
if (result.cards !== 3) throw new Error('设计模式没有生成 3 套方案')
if (!result.variants.some((text) => text.includes('包豪斯'))) throw new Error('没有采用 mock 的包豪斯方案')
if (!result.variants.some((text) => text.includes('瑞士风格'))) throw new Error('没有采用 mock 的瑞士方案')
if (!result.variants.some((text) => text.includes('卡带未来'))) throw new Error('没有采用 mock 的卡带方案')
if (!result.designBar) throw new Error('设计模式画廊没有提示条')
if (result.stylePackCycle) throw new Error('设计模式仍然显示风格包切换')
if (result.bodyB) throw new Error('设计模式空正文没有被保留')
if (result.standardMode !== 'standard' || !result.standardPack) throw new Error('切回标准模式后风格包没有恢复')
if (result.storedStandard !== 'standard') throw new Error('标准模式没有持久化')
if (result.exceptions) throw new Error('页面存在未捕获异常')

await call('Browser.close').catch(() => {})
ws.close()
