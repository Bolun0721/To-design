/**
 * 风格包视觉自检：经典三式 → 几何三式 → 系统三式 → 回到经典。
 * 顺便截取六种新风格的编辑器全页。
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
    awaitPromise: true,
  })
  if (res.result?.exceptionDetails) {
    throw new Error(`页面脚本异常：${JSON.stringify(res.result.exceptionDetails).slice(0, 1000)}`)
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

async function shot(name) {
  await fs.mkdir(OUT, { recursive: true })
  const result = await call('Page.captureScreenshot', { format: 'png' })
  await fs.writeFile(new URL(`${name}.png`, OUT), Buffer.from(result.result.data, 'base64'))
}

const variants = () =>
  evaluate(`[...document.querySelectorAll('.scheme-card .paper')].map((p) => [...p.classList].find((c) => c.startsWith('variant-')))`)

await call('Runtime.enable')
await call('Page.enable')
await call('Page.navigate', { url: 'http://127.0.0.1:5173/?demo=1&theme=dark' })
await waitFor(`document.querySelectorAll('.scheme-card').length === 3`, '画廊')
await sleep(700)

const results = { packs: [], templateSubs: [] }
results.packs.push({ id: 'classic', variants: await variants() })
await shot('style-gallery-classic')

async function cycle() {
  await evaluate(
    `[...document.querySelectorAll('.gallery button')].find((b) => b.innerText.includes('再换三种风格')).click(); true;`,
  )
  await sleep(700)
}

async function openEditor(index, name) {
  await evaluate(`document.querySelectorAll('.scheme-card')[${index}].click(); true;`)
  await waitFor(
    `Boolean(document.querySelector('iframe.paper-frame')?.contentDocument?.querySelector('.paper'))`,
    `${name} 编辑器`,
  )
  await sleep(600)
  await shot(`style-editor-${name}`)
  const hasSub = await evaluate(
    `Boolean(document.querySelector('iframe.paper-frame').contentDocument.querySelector('[data-block-id="secondary"] .hero img'))`,
  )
  results.templateSubs.push({ name, hasSub })
  await evaluate(`document.querySelector('.back-btn').click(); true;`)
  await waitFor(`document.querySelectorAll('.scheme-card').length === 3`, '返回画廊')
  await sleep(300)
}

await cycle()
results.packs.push({ id: 'geometry', variants: await variants() })
await shot('style-gallery-geometry')
await openEditor(0, 'constructivism')
await openEditor(1, 'bauhaus')
await openEditor(2, 'de_stijl')

await cycle()
results.packs.push({ id: 'system', variants: await variants() })
await shot('style-gallery-system')
await openEditor(0, 'nasa-punk')
await openEditor(1, 'swiss')
await openEditor(2, 'cassette')

await cycle()
results.packs.push({ id: 'classic-again', variants: await variants() })
results.headline = await evaluate(`document.querySelector('.scheme-card .headline')?.innerText`)
results.exceptions = exceptions.length
console.log(JSON.stringify(results, null, 2))

if (results.packs[1].variants.join(',') !== 'variant-constructivism,variant-bauhaus,variant-de_stijl') {
  throw new Error('几何三式顺序不正确')
}
if (results.packs[2].variants.join(',') !== 'variant-nasa_punk,variant-swiss_style,variant-cassette_futurism') {
  throw new Error('系统三式顺序不正确')
}
if (results.packs[3].variants.join(',') !== 'variant-classic_broadsheet,variant-tabloid_bold,variant-minimal_masthead') {
  throw new Error('没有回到经典三式')
}
if (results.templateSubs.length !== 6 || results.templateSubs.some((item) => !item.hasSub)) {
  throw new Error(`有模板没有进入双图模式：${JSON.stringify(results.templateSubs)}`)
}
if (exceptions.length) throw new Error('页面存在未捕获异常')

await call('Browser.close').catch(() => {})
ws.close()
