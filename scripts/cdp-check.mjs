/**
 * 无头浏览器交互自检（CDP）：
 * 拖动版块 → 双击改字 → 换主色 → html2canvas 2× 渲染 → 截图
 *
 * 用法：先启动 Edge（--remote-debugging-port=9222），再 node scripts/cdp-check.mjs
 */
import fs from 'node:fs/promises'

const DEBUG = 'http://127.0.0.1:9222'
const OUT = new URL('../.shots/', import.meta.url)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const targets = await (await fetch(`${DEBUG}/json/list`)).json()
const page = targets.find((t) => t.type === 'page' && t.url.includes('127.0.0.1:5173'))
if (!page) throw new Error('没有找到 demo 页面，请先启动 Edge 并打开 demo URL')

const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let seq = 0
const pending = new Map()
const exceptions = []
const logs = []

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
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') logs.push(msg.params.entry.text)
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

async function waitFor(expression, label, timeout = 12000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return true
    await sleep(250)
  }
  throw new Error(`等待超时：${label}`)
}

await call('Runtime.enable')
await call('Log.enable')
await call('Page.enable')
await call('Page.reload', { ignoreCache: true })
await waitFor(`document.querySelectorAll('.paper .block').length > 5`, '编辑器渲染')

const results = {}

results.blocks = await evaluate(`document.querySelectorAll('.paper .block').length`)
results.headline = await evaluate(`document.querySelector('.headline')?.innerText`)

// 1. 拖动主标题
const before = await evaluate(
  `JSON.stringify((() => { const el = document.querySelector('[data-block-id="headline"]'); return { left: el.style.left, top: el.style.top, w: el.getBoundingClientRect().width }; })())`,
)
results.dragBefore = JSON.parse(before)
await evaluate(`(() => {
  const el = document.querySelector('[data-block-id="headline"]');
  const r = el.getBoundingClientRect();
  const base = { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0 };
  el.dispatchEvent(new PointerEvent('pointerdown', { ...base, buttons: 1, clientX: r.left + 30, clientY: r.top + 20 }));
  window.dispatchEvent(new PointerEvent('pointermove', { ...base, buttons: 1, clientX: r.left + 90, clientY: r.top + 76 }));
  window.dispatchEvent(new PointerEvent('pointerup', { ...base, buttons: 0, clientX: r.left + 90, clientY: r.top + 76 }));
  return true;
})()`)
await sleep(450)
results.dragAfter = await evaluate(
  `JSON.parse(JSON.stringify((() => { const el = document.querySelector('[data-block-id="headline"]'); return { left: el.style.left, top: el.style.top }; })()))`,
)
if (results.dragAfter.left === results.dragBefore.left) throw new Error('拖动没有生效')

// 2. 双击改字
const original = await evaluate(`document.querySelector('[data-edit="headline"]').innerText`)
await evaluate(`(() => {
  const el = document.querySelector('[data-edit="headline"]');
  el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
  return el.getAttribute('contenteditable');
})()`)
results.editMode = await evaluate(`document.querySelector('[data-edit="headline"]').getAttribute('contenteditable')`)
await evaluate(`(() => {
  const el = document.querySelector('[data-edit="headline"]');
  el.innerText = '测试标题已修改';
  el.blur();
  return true;
})()`)
await sleep(350)
results.headlineAfterEdit = await evaluate(`document.querySelector('.headline')?.innerText`)
if (!results.headlineAfterEdit.includes('测试标题已修改')) throw new Error('双击改字没有写回内容')

// 3. 换主色
await evaluate(`document.querySelectorAll('.swatch')[1].click()`)
await sleep(300)
results.accent = await evaluate(
  `getComputedStyle(document.querySelector('.paper')).getPropertyValue('--accent').trim()`,
)
if (!results.accent) throw new Error('主色变量未生效')

// 4. html2canvas 2× 渲染（导出链路）
results.export = await evaluate(
  `(async () => {
    const imageMod = await import('/src/lib/image.js');
    const exportMod = await import('/src/lib/exportPaper.js');
    const el = document.querySelector('.paper');
    const img = el.querySelector('.hero img');
    const treated = await imageMod.renderTreatedPhoto(
      { dataUrl: '/demo/coffee.jpg' },
      'duotone',
      '#8B1538',
      img ? img.clientWidth : 700,
    );
    if (img && treated) {
      img.src = treated;
      await img.decode();
    }
    el.querySelectorAll('.halftone-dots').forEach((d) => { d.style.display = 'none'; });
    const canvas = await exportMod.renderPaperPng(el, { scale: 2, background: '#E9ECEE' });
    return { width: canvas.width, height: canvas.height, cssWidth: el.offsetWidth, bytes: canvas.toDataURL('image/png').length, data: canvas.toDataURL('image/png') };
  })()`,
  true,
)
if (results.export.width < results.export.cssWidth * 2 - 2) {
  throw new Error(`导出尺寸异常：${JSON.stringify(results.export)}`)
}
await fs.mkdir(OUT, { recursive: true })
await fs.writeFile(
  new URL('export.png', OUT),
  Buffer.from(results.export.data.split(',')[1], 'base64'),
)
delete results.export.data

// 5. 截图
const shot = await call('Page.captureScreenshot', { format: 'png' })
await fs.mkdir(OUT, { recursive: true })
await fs.writeFile(new URL('interaction.png', OUT), Buffer.from(shot.result.data, 'base64'))

console.log(JSON.stringify({ ...results, exceptions: exceptions.length, logs }, null, 2))

if (exceptions.length) {
  console.error('页面存在未捕获异常：', JSON.stringify(exceptions, null, 2).slice(0, 2000))
  process.exitCode = 1
}

await call('Browser.close').catch(() => {})
ws.close()
