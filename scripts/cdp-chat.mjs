/**
 * 对话微调 + 主题切换自检（CDP）：
 * 填入 mock Key → 打开方案 A → 对话「标题大一点 + 换财经日报配色」→ 校验 patch → 撤销 → 切暗色。
 */
import fs from 'node:fs/promises'

const DEBUG = 'http://127.0.0.1:9222'
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

await call('Page.navigate', {
  url: 'http://127.0.0.1:5173/?demo=1&scheme=A&theme=light',
})
await waitFor(`document.querySelectorAll('.insp-tab').length >= 2`, '编辑器检查器')
await sleep(400)

await evaluate(
  `[...document.querySelectorAll('.insp-tab')].find((b) => b.innerText.includes('对话')).click(); true;`,
)
await waitFor(`document.querySelector('.chat-input')`, '对话面板')
await waitFor(
  `Boolean(document.querySelector('iframe.paper-frame')?.contentDocument?.querySelector('.paper'))`,
  'iframe 画布',
)

await evaluate(`(() => {
  const el = document.querySelector('.chat-input');
  el.value = '标题再大一点，换成财经日报配色';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return el.value;
})()`)
await sleep(200)
await evaluate(`document.querySelector('.chat-send').click(); true;`)
await waitFor(`document.querySelectorAll('.chat-msg.assistant').length >= 1`, '助手回复', 30000)
await sleep(700)

const results = {}
results.reply = await evaluate(`document.querySelector('.chat-msg.assistant .chat-text')?.innerText`)
results.applied = await evaluate(`document.querySelector('.chat-applied')?.innerText`)
results.headline = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelector('.headline')?.innerText`,
)
results.accent = await evaluate(
  `getComputedStyle(document.querySelector('iframe.paper-frame').contentDocument.querySelector('.paper')).getPropertyValue('--accent').trim()`,
)
results.theme = await evaluate(`document.documentElement.dataset.theme`)
results.messages = await evaluate(
  `[...document.querySelectorAll('.chat-msg')].map((m) => m.className)`,
)

await fs.mkdir(OUT, { recursive: true })
const shot = await call('Page.captureScreenshot', { format: 'png' })
await fs.writeFile(new URL('chat-light.png', OUT), Buffer.from(shot.result.data, 'base64'))

await evaluate(`document.querySelector('.chat-undo').click(); true;`)
await sleep(600)
results.headlineAfterUndo = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelector('.headline')?.innerText`,
)
results.accentAfterUndo = await evaluate(
  `getComputedStyle(document.querySelector('iframe.paper-frame').contentDocument.querySelector('.paper')).getPropertyValue('--accent').trim()`,
)

await evaluate(`document.querySelector('.theme-btn').click(); true;`)
await sleep(500)
results.themeAfterToggle = await evaluate(`document.documentElement.dataset.theme`)
results.iframeTheme = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.documentElement.dataset.theme`,
)
results.storedTheme = await evaluate(`localStorage.getItem('fpl.theme.v1')`)

console.log(JSON.stringify({ ...results, exceptions: exceptions.length }, null, 2))

if (results.headline !== '夜色里的手冲') throw new Error('对话 patch 没有改到标题')
if (results.accent.toLowerCase() !== '#8b1538') throw new Error(`配色 patch 未生效：${results.accent}`)
if (results.headlineAfterUndo !== '巷口那杯手冲') throw new Error('撤销没有恢复标题')
if (results.themeAfterToggle !== 'dark') throw new Error('主题切换没有生效')
if (results.iframeTheme !== 'dark') throw new Error('iframe 主题没有跟随父页面')
if (results.storedTheme !== 'dark') throw new Error('主题没有持久化')
if (exceptions.length) throw new Error('页面存在未捕获异常')

await call('Browser.close').catch(() => {})
ws.close()
