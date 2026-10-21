/**
 * 本地草稿 / 对话历史自检：
 * 生成聊天修改 → 自动保存 → 刷新（无 ?demo）恢复方案 + 对话 → 打开草稿列表 → 删除。
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

// 清掉旧状态，保证从空状态开始（使用全新 Edge profile 时 IndexedDB 也是空的）
await evaluate(`
  localStorage.clear();
  sessionStorage.clear();
  true;
`)
await sleep(300)

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
await waitFor(`document.querySelectorAll('.insp-tab').length >= 2`, '编辑器')
await sleep(500)

// 对话修改：标题 + 配色
await evaluate(
  `[...document.querySelectorAll('.insp-tab')].find((b) => b.innerText.includes('对话')).click(); true;`,
)
await waitFor(`document.querySelector('.chat-input')`, '对话面板')
await evaluate(`(() => {
  const el = document.querySelector('.chat-input');
  el.value = '标题再大一点，换成财经日报配色';
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`)
await sleep(150)
await evaluate(`document.querySelector('.chat-send').click(); true;`)
await waitFor(`document.querySelectorAll('.chat-msg.assistant').length >= 1`, '聊天回复', 30000)
await sleep(2400)

const results = {}
results.draftIdAfterSave = await evaluate(`localStorage.getItem('fpl.draft.current.v1')`)
results.draftCountAfterSave = await evaluate(`document.querySelector('.draft-count')?.innerText`)

// 草稿列表
await evaluate(`document.querySelector('.draft-btn').click(); true;`)
await waitFor(`document.querySelectorAll('.draft-row').length >= 1`, '草稿列表')
results.draftTitle = await evaluate(`document.querySelector('.draft-row .draft-title')?.innerText`)
results.draftRows = await evaluate(`document.querySelectorAll('.draft-row').length`)
await fs.mkdir(OUT, { recursive: true })
const listShot = await call('Page.captureScreenshot', { format: 'png' })
await fs.writeFile(new URL('drafts-list.png', OUT), Buffer.from(listShot.result.data, 'base64'))
await evaluate(`document.querySelector('.modal-close').click(); true;`)
await sleep(300)

// 刷新（去掉 ?demo，模拟重新打开页面）
await call('Page.navigate', { url: 'http://127.0.0.1:5173/' })
await waitFor(`Boolean(document.querySelector('.paper')) && Boolean(document.querySelector('.headline'))`, '草稿恢复')
await sleep(700)

results.restoredHeadline = await evaluate(`document.querySelector('.headline')?.innerText`)
results.restoredScheme = await evaluate(`document.querySelector('.scheme-tab.active .letter')?.innerText`)
results.restoredView = await evaluate(`Boolean(document.querySelector('.editor')) ? 'editor' : 'other'`)
results.restoredDraftId = await evaluate(`localStorage.getItem('fpl.draft.current.v1')`)

// 对话历史恢复
await evaluate(
  `[...document.querySelectorAll('.insp-tab')].find((b) => b.innerText.includes('对话')).click(); true;`,
)
await waitFor(`document.querySelectorAll('.chat-msg').length >= 2`, '对话历史恢复')
results.restoredChatMessages = await evaluate(
  `[...document.querySelectorAll('.chat-msg')].map((m) => m.querySelector('.chat-text')?.innerText)`,
)

await fs.mkdir(OUT, { recursive: true })
const shot = await call('Page.captureScreenshot', { format: 'png' })
await fs.writeFile(new URL('drafts-restored.png', OUT), Buffer.from(shot.result.data, 'base64'))

// 当前列表：新建 → 打开旧草稿 → 删除
await evaluate(`document.querySelector('.draft-btn').click(); true;`)
await waitFor(`document.querySelectorAll('.draft-row').length >= 1`, '草稿列表 2')
results.currentBadge = await evaluate(`document.querySelector('.draft-current')?.innerText`)

// 新建草稿：清空工作区，但旧草稿仍保留
await evaluate(`document.querySelector('.drafts-new').click(); true;`)
await waitFor(`Boolean(document.querySelector('.intro'))`, '新建草稿回到首页')
await sleep(500)
results.newDraftCurrent = await evaluate(`localStorage.getItem('fpl.draft.current.v1')`)
results.newDraftCount = await evaluate(`document.querySelector('.draft-count')?.innerText`)

// 从列表重新打开旧草稿
await evaluate(`document.querySelector('.draft-btn').click(); true;`)
await waitFor(`document.querySelectorAll('.draft-row').length >= 1`, '草稿列表 3')
await evaluate(`(() => {
  const btn = [...document.querySelectorAll('.draft-row .slot-btn')].find((b) => b.innerText.includes('打开'));
  if (btn) btn.click();
  return Boolean(btn);
})()`)
await waitFor(`Boolean(document.querySelector('.paper')) && Boolean(document.querySelector('.headline'))`, '从列表打开草稿')
await sleep(500)
results.reopenedHeadline = await evaluate(`document.querySelector('.headline')?.innerText`)
results.reopenedCurrent = await evaluate(`localStorage.getItem('fpl.draft.current.v1')`)

// 删除当前草稿
await evaluate(`document.querySelector('.draft-btn').click(); true;`)
await waitFor(`document.querySelectorAll('.draft-row').length >= 1`, '草稿列表 4')
await evaluate(`window.confirm = () => true; true;`)
await evaluate(`document.querySelector('.draft-row .slot-btn.danger').click(); true;`)
await waitFor(`Boolean(document.querySelector('.intro'))`, '删除后回到首页')
await sleep(800)
results.afterDeleteDrafts = await evaluate(`document.querySelector('.draft-count')?.innerText`)
results.afterDeleteCurrent = await evaluate(`localStorage.getItem('fpl.draft.current.v1')`)
results.afterDeleteRows = await evaluate(`document.querySelectorAll('.draft-row').length`)
results.exceptions = exceptions.length

console.log(JSON.stringify(results, null, 2))

if (!results.draftIdAfterSave) throw new Error('自动保存没有写入当前草稿 id')
if (results.draftRows < 1) throw new Error('草稿列表为空')
if (results.restoredHeadline !== '夜色里的手冲') throw new Error('刷新后没有恢复方案内容')
if (results.restoredScheme !== 'A') throw new Error('刷新后没有恢复当前方案')
if (results.restoredView !== 'editor') throw new Error('刷新后没有恢复画布视图')
if (results.restoredChatMessages.length < 2) throw new Error('刷新后没有恢复对话历史')
if (results.currentBadge !== '当前') throw new Error('草稿列表没有标记当前草稿')
if (results.newDraftCurrent !== null) throw new Error('新建草稿后 current id 没有清空')
if (results.newDraftCount !== '1') throw new Error('新建草稿不应删除旧草稿')
if (results.reopenedHeadline !== '夜色里的手冲') throw new Error('从列表打开草稿没有恢复内容')
if (!results.reopenedCurrent) throw new Error('从列表打开草稿没有重新绑定 current id')
if (results.afterDeleteDrafts !== '0') throw new Error('删除后草稿数量没有归零')
if (results.afterDeleteCurrent !== null) throw new Error('删除后 current id 没有清空')
if (results.afterDeleteRows !== 0) throw new Error('删除后草稿列表没有清空')
if (exceptions.length) throw new Error('页面存在未捕获异常')

await call('Browser.close').catch(() => {})
ws.close()
