/**
 * 弹窗自检：设计 Skill / 系统提示词 / 方案 JSON。
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

function call(method, params = {}, timeout = 30000) {
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

async function waitFor(expression, label, timeout = 12000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return
    await sleep(250)
  }
  throw new Error(`等待超时：${label}`)
}

async function shot(name) {
  const res = await call('Page.captureScreenshot', { format: 'png' })
  await fs.mkdir(OUT, { recursive: true })
  await fs.writeFile(new URL(name, OUT), Buffer.from(res.result.data, 'base64'))
}

await call('Runtime.enable')
await call('Page.enable')
await call('Page.navigate', { url: 'http://127.0.0.1:5173/?demo=1&scheme=A' })
await waitFor(`document.querySelectorAll('.action-btn').length > 0`, '编辑器')

// 方案 JSON
await evaluate(
  `[...document.querySelectorAll('.action-btn')].find((b) => b.innerText.includes('JSON')).click(); true;`,
)
await waitFor(`document.querySelector('.modal pre')`, 'JSON 弹窗')
await sleep(300)
await shot('modal-json.png')
const jsonTitle = await evaluate(`document.querySelector('.modal-title')?.innerText`)
const jsonLength = await evaluate(`document.querySelector('.modal pre')?.innerText.length`)
await evaluate(`document.querySelector('.modal-close').click(); true;`)
await sleep(250)

// 设计 Skill
await evaluate(
  `[...document.querySelectorAll('.header-btn')].find((b) => b.innerText.includes('SKILL')).click(); true;`,
)
await waitFor(`document.querySelector('.skill-grid')`, '设计 Skill 弹窗')
await sleep(250)
await shot('modal-skill.png')
const skillTitle = await evaluate(`document.querySelector('.modal-title')?.innerText`)
const skillCards = await evaluate(`document.querySelectorAll('.skill-card').length`)
await evaluate(`document.querySelector('.modal-close').click(); true;`)
await sleep(250)

// 系统提示词
await evaluate(
  `[...document.querySelectorAll('.header-btn')].find((b) => b.innerText.includes('系统提示词')).click(); true;`,
)
await waitFor(`document.querySelector('.modal pre')`, '提示词弹窗')
await sleep(250)
await shot('modal-prompt.png')
const promptTitle = await evaluate(`document.querySelector('.modal-title')?.innerText`)
const promptLength = await evaluate(`document.querySelector('.modal pre')?.innerText.length`)
await evaluate(`document.querySelector('.modal-close').click(); true;`)
await sleep(250)

// 帮助：推荐模型与 API 申请
await evaluate(
  `[...document.querySelectorAll('.header-btn')].find((b) => b.innerText.includes('帮助')).click(); true;`,
)
await waitFor(`document.querySelectorAll('.help-card').length === 2`, '帮助弹窗')
await sleep(250)
await shot('modal-help.png')
const helpTitle = await evaluate(`document.querySelector('.modal-title')?.innerText`)
const helpCards = await evaluate(`document.querySelectorAll('.help-card').length`)
const helpModels = await evaluate(
  `[...document.querySelectorAll('.help-model')].map((n) => n.innerText)`,
)
const helpLinks = await evaluate(
  `[...document.querySelectorAll('.help-link')].map((a) => a.getAttribute('href'))`,
)
const helpText = await evaluate(`document.querySelector('.modal')?.innerText || ''`)

console.log(
  JSON.stringify(
    {
      jsonTitle,
      jsonLength,
      skillTitle,
      skillCards,
      promptTitle,
      promptLength,
      helpTitle,
      helpCards,
      helpModels,
      helpLinks,
      exceptions: exceptions.length,
    },
    null,
    2,
  ),
)

if (skillCards < 6) throw new Error('设计 Skill 卡片数量异常')
if (promptLength < 3000) throw new Error('系统提示词长度异常')
if (helpCards !== 2) throw new Error('帮助弹窗推荐模型卡片数量异常')
if (!helpModels.some((name) => name.includes('DeepSeek V4.1 Flash'))) {
  throw new Error('帮助弹窗缺少 DeepSeek V4.1 Flash')
}
if (!helpModels.some((name) => name.includes('Seedream 4.0'))) {
  throw new Error('帮助弹窗缺少 Seedream 4.0')
}
if (helpLinks.length < 6) throw new Error('帮助弹窗官方链接不足')
if (!helpText.includes('免费额度')) throw new Error('帮助弹窗缺少免费额度说明')
if (!helpText.includes('Seedance 是视频模型')) throw new Error('帮助弹窗缺少 Seedance 提示')
if (exceptions.length) throw new Error('弹窗渲染出现未捕获异常')

await call('Browser.close').catch(() => {})
ws.close()
