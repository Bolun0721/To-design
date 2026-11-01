/**
 * 双阶段生图回归：
 * 生图模型 → 风格 → 素材框 → 自动切回排版 → 3 套方案。
 * 前置：node server.mjs + node scripts/mock-llm.mjs；Edge 9222。
 */
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const DEBUG = 'http://127.0.0.1:9222'
const APP = 'http://127.0.0.1:5173/'
const PHOTO = fileURLToPath(new URL('../public/demo/coffee.jpg', import.meta.url))
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
  const result = await call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  })
  if (result.result?.exceptionDetails) {
    throw new Error(`页面脚本异常：${JSON.stringify(result.result.exceptionDetails).slice(0, 600)}`)
  }
  return result.result?.result?.value
}

async function waitFor(expression, label, timeout = 45000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return
    await sleep(300)
  }
  throw new Error(`等待超时：${label}`)
}

await call('Runtime.enable')
await call('Page.enable')
await call('DOM.enable')

await evaluate(`
  (() => {
    const settings = {
      provider: 'custom',
      baseUrl: 'http://127.0.0.1:8787/v1',
      model: 'mock-layout',
      mode: 'direct',
      vision: false,
      image: {
        provider: 'custom',
        baseUrl: 'http://127.0.0.1:8787/v1',
        model: 'mock-image',
        mode: 'direct',
        supportsReference: true,
        size: '1024x1024'
      }
    };
    localStorage.setItem('fpl.settings.v1', JSON.stringify(settings));
    sessionStorage.setItem('fpl.apikey.v1', 'mock-layout-key');
    sessionStorage.setItem('fpl.imagekey.v1', 'mock-image-key');
    localStorage.setItem('fpl.mode.v1', 'standard');
    return true;
  })()
`)
await call('Page.navigate', { url: APP })
await waitFor(`document.querySelector('.model-role-select')`, '模型用途下拉')

const result = {}
const layoutHeight = await evaluate(
  `document.querySelector('#desc').getBoundingClientRect().height`,
)
await evaluate(`(() => {
  const select = document.querySelector('.model-role-select');
  select.value = 'image';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`)
await waitFor(`document.querySelector('.rail-image-mode')`, '生图模式')
await sleep(400)

result.layoutHeight = layoutHeight
result.imageHeight = await evaluate(
  `document.querySelector('#desc').getBoundingClientRect().height`,
)
result.styleOptions = await evaluate(
  `document.querySelectorAll('#image-style option').length`,
)
result.styleLabels = await evaluate(
  `[...document.querySelectorAll('#image-style option')].map((o) => o.textContent.trim())`,
)
result.imageProvider = await evaluate(
  `document.querySelector('#image-provider')?.value || ''`,
)
result.imageKeyField = await evaluate(
  `document.querySelector('.api-key-row input')?.placeholder || ''`,
)

await evaluate(`(() => {
  const desc = document.querySelector('#desc');
  desc.value = '一张适合时尚杂志封面的包豪斯风格主图，红黄蓝几何构成，主体清晰';
  desc.dispatchEvent(new Event('input', { bubbles: true }));
  const style = document.querySelector('#image-style');
  style.value = 'bauhaus';
  style.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`)

const shot = await call('Page.captureScreenshot', { format: 'png' })
fs.mkdirSync(new URL('../.shots/', import.meta.url), { recursive: true })
fs.writeFileSync(
  new URL('../.shots/image-model.png', import.meta.url),
  Buffer.from(shot.result.data, 'base64'),
)

await evaluate(`document.querySelector('.generate-btn').click(); true;`)
await waitFor(`document.querySelectorAll('.scheme-card').length === 3`, '生图后自动排版三套', 60000)
await sleep(800)

result.cards = await evaluate(`document.querySelectorAll('.scheme-card').length`)
result.roleAfter = await evaluate(`document.querySelector('.model-role-select')?.value || ''`)
result.imageMeta = await evaluate(
  `document.querySelector('.image-meta-badge')?.textContent || ''`,
)
result.photoPrefix = await evaluate(
  `document.querySelector('.dropzone img')?.src.slice(0, 32) || ''`,
)
result.heightAfter = await evaluate(
  `document.querySelector('#desc').getBoundingClientRect().height`,
)

// 参考图 + 第二个风格
await evaluate(`document.querySelector('.model-role-select').value = 'image'; document.querySelector('.model-role-select').dispatchEvent(new Event('change', { bubbles: true })); true;`)
await waitFor(`document.querySelector('.rail-image-mode')`, '第二次生图模式')
const doc = await call('DOM.getDocument', { depth: -1 })
const input = await call('DOM.querySelector', {
  nodeId: doc.result.root.nodeId,
  selector: '.rail input[type="file"]',
})
await call('DOM.setFileInputFiles', { nodeId: input.result.nodeId, files: [PHOTO] })
await waitFor(`document.querySelector('.dropzone img')?.src.includes('data:image')`, '参考图载入')
await evaluate(`(() => {
  const style = document.querySelector('#image-style');
  style.value = 'constructivism';
  style.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`)
await evaluate(`document.querySelector('.generate-btn').click(); true;`)
await waitFor(`document.querySelectorAll('.scheme-card').length === 3`, '参考图生图后排版', 60000)
await sleep(600)
result.referenceMeta = await evaluate(
  `document.querySelector('.image-meta-badge')?.textContent || ''`,
)
result.roleAfterReference = await evaluate(
  `document.querySelector('.model-role-select')?.value || ''`,
)

// 原图：不发图片请求，直接使用参考图
await evaluate(`document.querySelector('.model-role-select').value = 'image'; document.querySelector('.model-role-select').dispatchEvent(new Event('change', { bubbles: true })); true;`)
await waitFor(`document.querySelector('.rail-image-mode')`, '原图模式')
await evaluate(`(() => {
  const style = document.querySelector('#image-style');
  style.value = 'original';
  style.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`)
await evaluate(`document.querySelector('.generate-btn').click(); true;`)
await waitFor(`document.querySelectorAll('.scheme-card').length === 3`, '原图排版', 60000)
await sleep(500)
result.originalMeta = await evaluate(
  `document.querySelector('.image-meta-badge')?.textContent || ''`,
)
result.originalRole = await evaluate(
  `document.querySelector('.model-role-select')?.value || ''`,
)

// 生图 Key 留空：不能复用排版 Key
await evaluate(`document.querySelector('.model-role-select').value = 'image'; document.querySelector('.model-role-select').dispatchEvent(new Event('change', { bubbles: true })); true;`)
await waitFor(`document.querySelector('.rail-image-mode')`, '空 Key 生图模式')
await evaluate(`(() => {
  const key = document.querySelector('.api-key-row input');
  key.value = '';
  key.dispatchEvent(new Event('input', { bubbles: true }));
  const style = document.querySelector('#image-style');
  style.value = 'swiss_style';
  style.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`)
await evaluate(`document.querySelector('.generate-btn').click(); true;`)
await waitFor(`document.querySelector('.error-box')`, '空生图 Key 错误')
result.emptyImageKeyError = await evaluate(
  `document.querySelector('.error-box')?.textContent || ''`,
)
result.originalRoleAfterEmptyKey = await evaluate(
  `document.querySelector('.model-role-select')?.value || ''`,
)
result.exceptions = exceptions.length

console.log(JSON.stringify(result, null, 2))

if (result.styleOptions !== 10) throw new Error('风格下拉不是原图 + 9 种')
if (result.imageProvider !== 'custom') throw new Error('生图服务商切换异常')
if (!result.imageKeyField.includes('生图 Key')) throw new Error('生图 Key 字段提示不对')
if (!(result.imageHeight < result.layoutHeight)) throw new Error('生图模式 textarea 没有缩短')
if (result.cards !== 3) throw new Error('生图后没有自动生成 3 套')
if (result.roleAfter !== 'layout') throw new Error('生图后没有自动切回排版模型')
if (!result.imageMeta.includes('AI 素材')) throw new Error('素材框没有 AI 素材标识')
if (result.roleAfterReference !== 'layout') throw new Error('参考图生图后没有切回排版')
if (!result.referenceMeta.includes('构成主义')) throw new Error('参考图生图风格标识异常')
if (result.originalMeta) throw new Error('原图模式不应保留 AI 素材标识')
if (result.originalRole !== 'layout') throw new Error('原图模式没有切回排版')
if (!result.emptyImageKeyError.includes('生图 Key')) throw new Error('空生图 Key 没有给出独立 Key 提示')
if (result.originalRoleAfterEmptyKey !== 'image') throw new Error('空生图 Key 不应自动切换用途')
if (result.exceptions) throw new Error('页面存在未捕获异常')

await call('Browser.close').catch(() => {})
ws.close()
