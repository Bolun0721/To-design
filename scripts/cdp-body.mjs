/**
 * 回归：设计模式在海报格式生成空正文时，切回报纸必须有正文。
 * 前置：node server.mjs + node scripts/mock-llm.mjs + Edge --remote-debugging-port=9222
 */
const DEBUG = 'http://127.0.0.1:9222'
const APP = 'http://127.0.0.1:5173/'
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

async function waitFor(expression, label, timeout = 30000) {
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
  const poster = [...document.querySelectorAll('.rail .format-toggle button')].find((b) => b.innerText.includes('海报'));
  if (poster) poster.click();
  return Boolean(poster);
})()`)
await sleep(500)

await evaluate(`
  (() => {
    const ta = document.querySelector('#desc');
    ta.value = '海报格式生成，三套方案切回报纸也要有正文。';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return ta.value;
  })()
`)
await evaluate(`document.querySelector('.generate-btn').click(); true;`)
await waitFor(`document.querySelectorAll('.scheme-card').length === 3`, '设计模式海报三套', 40000)
await sleep(500)

const results = {}
results.formatBefore = await evaluate(
  `document.querySelector('.rail .format-toggle button.active')?.innerText || ''`,
)
results.warnings = await evaluate(
  `[...document.querySelectorAll('.warn-box li')].map((n) => n.textContent || '')`,
)

await evaluate(`document.querySelectorAll('.scheme-card')[1].click(); true;`)
await waitFor(
  `Boolean(document.querySelector('iframe.paper-frame')?.contentDocument?.querySelector('.paper'))`,
  '画布',
)
await sleep(500)
results.iframeFormat = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelector('.paper')?.className || ''`,
)
await evaluate(`(() => {
  const btn = [...document.querySelectorAll('.inspector .seg button')].find((b) => b.innerText.includes('报纸'));
  if (btn) btn.click();
  return Boolean(btn);
})()`)
await waitFor(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelector('.paper')?.className.includes('format-newspaper')`,
  '切回报纸',
)
await sleep(500)

results.bodyText = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelector('.paper .body')?.innerText.trim() || ''`,
)
results.bodyParagraphs = await evaluate(
  `document.querySelector('iframe.paper-frame').contentDocument.querySelectorAll('.paper .body p').length`,
)
results.emptyState = await evaluate(
  `Boolean(document.querySelector('iframe.paper-frame').contentDocument.querySelector('.paper .body-empty'))`,
)
results.exceptions = exceptions.length

console.log(JSON.stringify(results, null, 2))

if (!results.formatBefore.includes('海报')) throw new Error('生成前没有切到海报格式')
if (!results.warnings.some((warning) => warning.includes('缺少正文'))) {
  throw new Error('生成提示里没有正文兜底警告')
}
if (!results.bodyText) throw new Error('切回报纸后正文为空')
if (results.bodyParagraphs < 1) throw new Error('报纸正文没有段落')
if (results.emptyState) throw new Error('仍然出现了正文空状态')
if (results.exceptions) throw new Error('页面存在未捕获异常')

await call('Browser.close').catch(() => {})
ws.close()
