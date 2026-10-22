/**
 * 本地 mock LLM（OpenAI 兼容），用于无 Key 的端到端联调。
 * 运行：node scripts/mock-llm.mjs  →  http://127.0.0.1:8787/v1/chat/completions
 */
import http from 'node:http'
import { buildDemoPayload } from '../src/agent/demoData.js'

const PORT = 8787

const payload = buildDemoPayload({ date: '2026年10月20日', format: 'newspaper' })
payload.summary = 'MOCK 模型已返回三套方案，推荐 B：标题最有力。'
payload.schemes[0].name = '模型甲'
payload.schemes[1].name = '模型乙'
payload.schemes[2].name = '模型丙'

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8')
    let body = {}
    try {
      body = JSON.parse(raw || '{}')
    } catch {
      /* ignore */
    }
    console.log(
      `[mock-llm] ${req.method} ${req.url} model=${body.model || '-'} key=${
        req.headers.authorization ? 'present' : 'missing'
      } messages=${body.messages?.length || 0}`,
    )

    const user = body.messages?.find((m) => m.role === 'user')?.content
    const userText = Array.isArray(user) ? user.map((part) => part.text || '').join('\n') : String(user || '')

    let content
    if (userText.includes('主图和子图的图注')) {
      content = JSON.stringify({
        captions: [
          { slot: 'main', text: '窗边的咖啡与一本翻旧的书' },
          { slot: 'secondary', text: '午后的光停在杯沿与桌面' },
        ],
      })
      console.log('[mock-llm] caption request -> 2 captions')
    } else if (userText.includes('【本次指令】')) {
      // 对话微调：返回一个最小 patch
      content = JSON.stringify({
        reply: '已把标题放大，并换成财经日报配色。',
        patch: {
          color_preset: 'financial_daily',
          style: { headline_scale: 'xlarge' },
          content: { headline: '夜色里的手冲' },
        },
      })
      console.log('[mock-llm] edit request -> patch')
    } else {
      content = JSON.stringify(payload)
      console.log('[mock-llm] generation request -> 3 schemes')
    }

    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
    res.end(
      JSON.stringify({
        id: 'mock-1',
        model: body.model || 'mock-model',
        choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1200, completion_tokens: 900, total_tokens: 2100 },
      }),
    )
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`mock LLM → http://127.0.0.1:${PORT}/v1/chat/completions`)
})
