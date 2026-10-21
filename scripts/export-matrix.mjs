/**
 * P0 导出矩阵：3 个方案 × 2 种格式 × 2 套主题 = 12 例。
 * 真实点击「导出 PNG」，校验下载文件尺寸、Toast、错误框和页面异常。
 *
 * 前置：
 *   1. node server.mjs
 *   2. Edge/Chrome 以 --remote-debugging-port=9222 启动，并打开任意 demo 页面
 * 运行：
 *   node scripts/export-matrix.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEBUG = 'http://127.0.0.1:9222'
const APP = 'http://127.0.0.1:5173/'
const DOWNLOAD = fileURLToPath(new URL('../.shots/matrix/', import.meta.url))
const FAIL_DIR = path.join(DOWNLOAD, 'fails')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const EXPECTED = {
  newspaper: { width: 1588, height: 2246 },
  poster: { width: 1600, height: 2000 },
}

const CASES = []
for (const theme of ['dark', 'light']) {
  for (const format of ['newspaper', 'poster']) {
    for (const scheme of ['A', 'B', 'C']) {
      CASES.push({ theme, format, scheme })
    }
  }
}

async function clearDownloads() {
  await fs.mkdir(DOWNLOAD, { recursive: true })
  const entries = await fs.readdir(DOWNLOAD)
  await Promise.all(
    entries
      .filter((name) => name !== 'fails')
      .map((name) => fs.rm(path.join(DOWNLOAD, name), { recursive: true, force: true })),
  )
}

async function waitForPng(timeout = 25000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    const names = (await fs.readdir(DOWNLOAD).catch(() => [])).filter((name) =>
      name.toLowerCase().endsWith('.png'),
    )
    if (names.length) {
      const stats = await Promise.all(
        names.map(async (name) => ({
          name,
          mtime: (await fs.stat(path.join(DOWNLOAD, name))).mtimeMs,
        })),
      )
      stats.sort((a, b) => b.mtime - a.mtime)
      return path.join(DOWNLOAD, stats[0].name)
    }
    await sleep(300)
  }
  return null
}

async function pngSize(file) {
  const buffer = await fs.readFile(file)
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') return null
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

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

async function waitFor(expression, label, timeout = 25000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return
    await sleep(250)
  }
  throw new Error(`等待超时：${label}`)
}

async function saveFailure(name) {
  try {
    await fs.mkdir(FAIL_DIR, { recursive: true })
    const shot = await call('Page.captureScreenshot', { format: 'png' })
    await fs.writeFile(path.join(FAIL_DIR, `${name}.png`), Buffer.from(shot.result.data, 'base64'))
  } catch {
    /* ignore */
  }
}

await call('Runtime.enable')
await call('Page.enable')
await call('Browser.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath: DOWNLOAD,
  eventsEnabled: true,
})
await fs.mkdir(DOWNLOAD, { recursive: true })

const results = []

for (const item of CASES) {
  const name = `${item.theme}-${item.format}-${item.scheme}`
  const expected = EXPECTED[item.format]
  const url = `${APP}?demo=1&scheme=${item.scheme}&format=${item.format}&theme=${item.theme}`
  const started = Date.now()
  const record = { ...item, name, ok: false, reasons: [] }

  try {
    await clearDownloads()
    await call('Page.navigate', { url })
    await waitFor(
      `Boolean(document.querySelector('.action-btn.primary')) &&
       Boolean(document.querySelector('iframe.paper-frame')?.contentDocument?.querySelector('.paper.format-${item.format}'))`,
      `${name} 编辑器`,
    )
    await sleep(700)

    const actual = {
      theme: await evaluate(`document.documentElement.dataset.theme`),
      scheme: await evaluate(`document.querySelector('.scheme-tab.active .letter')?.innerText?.trim()`),
      format: await evaluate(
        `document.querySelector('iframe.paper-frame')?.contentDocument?.querySelector('.paper')?.classList.contains('format-${item.format}')`,
      ),
    }

    if (actual.theme !== item.theme) record.reasons.push(`主题=${actual.theme}`)
    if (actual.scheme !== item.scheme) record.reasons.push(`方案=${actual.scheme}`)
    if (actual.format !== true) record.reasons.push('格式 class 不匹配')

    if (item.scheme === 'A' && item.format === 'newspaper') {
      const imageCount = await evaluate(
        `document.querySelector('iframe.paper-frame')?.contentDocument?.querySelectorAll('.paper .hero img').length || 0`,
      )
      if (imageCount !== 2) record.reasons.push(`经典大报图片数=${imageCount}，期望 2`)
    }

    await evaluate(`document.querySelector('.action-btn.primary').click(); true;`)
    const file = await waitForPng()
    const toast = await evaluate(`document.querySelector('.toast')?.innerText || ''`)
    const error = await evaluate(`document.querySelector('.error-box')?.innerText || ''`)
    const size = file ? await pngSize(file) : null

    if (!file) record.reasons.push('没有生成 PNG')
    if (error) record.reasons.push(`错误框：${error}`)
    if (!toast.includes('已导出')) record.reasons.push(`Toast：${toast || '空'}`)
    if (!size) {
      record.reasons.push('PNG 无法读取')
    } else if (size.width !== expected.width || size.height !== expected.height) {
      record.reasons.push(`尺寸 ${size.width}×${size.height}，期望 ${expected.width}×${expected.height}`)
    } else {
      record.size = `${size.width}×${size.height}`
    }

    record.ok = record.reasons.length === 0
    if (file) await fs.rm(file, { force: true })
    if (!record.ok) await saveFailure(name)
  } catch (err) {
    record.reasons.push(err.message)
    await saveFailure(name)
  }

  record.ms = Date.now() - started
  results.push(record)
  console.log(
    `${record.ok ? '✓' : '✗'} ${name.padEnd(24)} ${
      record.size || '-'.padEnd(11)
    }  ${record.ok ? `${record.ms}ms` : record.reasons.join('；')}`,
  )
}

const failed = results.filter((item) => !item.ok)
console.log('')
console.log(`${results.length - failed.length}/${results.length} 通过 · ${exceptions.length} 个未捕获异常`)

if (failed.length) {
  console.error('')
  console.error('失败项：')
  for (const item of failed) console.error(`  - ${item.name}: ${item.reasons.join('；')}`)
  process.exitCode = 1
}

await call('Browser.close').catch(() => {})
ws.close()
