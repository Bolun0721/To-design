/**
 * 六种新风格 × 报纸/海报 的导出自检。
 * 每个风格都从画廊进入编辑器，点真实导出按钮，校验 PNG 尺寸。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEBUG = 'http://127.0.0.1:9222'
const DOWNLOAD = fileURLToPath(new URL('../.shots/style-downloads/', import.meta.url))
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

async function clearDownloads() {
  await fs.rm(DOWNLOAD, { recursive: true, force: true })
  await fs.mkdir(DOWNLOAD, { recursive: true })
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

await clearDownloads()
await call('Runtime.enable')
await call('Page.enable')
await call('Browser.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath: DOWNLOAD,
})
await call('Page.navigate', { url: 'http://127.0.0.1:5173/?demo=1&theme=dark' })
await waitFor(`document.querySelectorAll('.scheme-card').length === 3`, '画廊')
await sleep(600)

const results = []

async function cycleTo(packName) {
  for (let i = 0; i < 4; i += 1) {
    const current = await evaluate(`document.querySelector('.pack-name')?.innerText`)
    if (current === packName) return
    await evaluate(
      `[...document.querySelectorAll('.gallery button')].find((b) => b.innerText.includes('再换三种风格') || b.innerText.includes('换一组')).click(); true;`,
    )
    await sleep(650)
  }
  throw new Error(`无法切换到 ${packName}`)
}

async function setFormat(format) {
  await evaluate(`(() => {
    const label = '${format}' === 'poster' ? '海报' : '报纸';
    const btn = [...document.querySelectorAll('.format-btn')].find((b) => b.innerText.includes(label));
    if (btn) btn.click();
    return Boolean(btn);
  })()`)
  await sleep(700)
}

async function exportScheme(index, format, pack, styleName) {
  await evaluate(`document.querySelectorAll('.scheme-card')[${index}].click(); true;`)
  await waitFor(
    `Boolean(document.querySelector('iframe.paper-frame')?.contentDocument?.querySelector('.paper.format-${format}'))`,
    `${styleName} 编辑器`,
  )
  await sleep(500)
  await clearDownloads()
  await evaluate(`document.querySelector('.action-btn.primary').click(); true;`)
  const file = await waitForPng()
  const toast = await evaluate(`document.querySelector('.toast')?.innerText || ''`)
  const error = await evaluate(`document.querySelector('.error-box')?.innerText || ''`)
  const hasSub = await evaluate(
    `Boolean(document.querySelector('iframe.paper-frame').contentDocument.querySelector('[data-block-id="secondary"] .hero img'))`,
  )
  const note = await evaluate(
    `document.querySelector('iframe.paper-frame').contentDocument.querySelector('.poster-note')?.innerText || ''`,
  )
  const record = { pack, style: styleName, format, file: Boolean(file), toast, error, hasSub, note }
  if (file) {
    const buf = await fs.readFile(file)
    record.size = `${buf.readUInt32BE(16)}×${buf.readUInt32BE(20)}`
    record.bytes = buf.length
    await fs.mkdir(fileURLToPath(new URL('../.shots/', import.meta.url)), { recursive: true })
    await fs.copyFile(
      file,
      fileURLToPath(new URL(`../.shots/style-export-${format}-${pack}-${index}.png`, import.meta.url)),
    )
  }
  results.push(record)
  await evaluate(`document.querySelector('.back-btn').click(); true;`)
  await waitFor(`document.querySelectorAll('.scheme-card').length === 3`, '返回画廊')
  await sleep(300)
}

for (const format of ['newspaper', 'poster']) {
  await setFormat(format)
  await cycleTo('经典三式')
  const classicNames = ['经典大报', '小报冲击', '极简报头']
  for (let i = 0; i < 3; i += 1) {
    await exportScheme(i, format, 'classic', classicNames[i])
  }
  await cycleTo('几何三式')
  const geometryNames = ['构成主义', '包豪斯', '风格派']
  for (let i = 0; i < 3; i += 1) {
    await exportScheme(i, format, 'geometry', geometryNames[i])
  }
  await cycleTo('系统三式')
  const systemNames = ['NASA 朋克', '瑞士风格', '卡带未来']
  for (let i = 0; i < 3; i += 1) {
    await exportScheme(i, format, 'system', systemNames[i])
  }
}

const expected = (format) => (format === 'newspaper' ? '1588×2246' : '1600×2000')
let failed = 0
for (const item of results) {
  if (
    !item.file ||
    item.error ||
    item.toast.includes('失败') ||
    item.size !== expected(item.format) ||
    !item.hasSub ||
    (item.format === 'poster' && !item.note.trim())
  ) {
    failed += 1
    console.error('FAIL', item)
  } else {
    console.log(`✓ ${item.format.padEnd(9)} ${item.pack.padEnd(8)} ${item.style.padEnd(8)} ${item.size} ${item.bytes}b 双图`)
  }
}
console.log(`${results.length - failed}/${results.length} 通过 · ${exceptions.length} 异常`)

if (failed || exceptions.length) process.exitCode = 1
await call('Browser.close').catch(() => {})
ws.close()
