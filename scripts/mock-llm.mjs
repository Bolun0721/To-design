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
    const system = body.messages?.find((m) => m.role === 'system')?.content
    const systemText = Array.isArray(system) ? system.map((part) => part.text || '').join('\n') : String(system || '')

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
    } else if (userText.includes('【图案任务】')) {
      content = JSON.stringify({
        artworks: [
          {
            id: 'A',
            concept: '鲸尾穿过水波',
            symbols: ['whale-tail'],
            alt: '鲸尾与水波线条',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" fill="none"><path d="M300 330 C294 250 270 190 240 120 C286 150 314 190 326 240 C340 180 372 132 416 100 C394 186 362 254 330 300 C318 320 310 338 300 350 C290 338 282 320 270 300 C238 254 206 186 184 100 C228 132 260 180 274 240 C286 190 314 150 360 120 C330 190 306 250 300 330 Z" stroke="{{accent}}" stroke-width="4"/><path d="M120 378 C190 356 246 392 300 374 C354 356 414 394 480 370" stroke="{{muted}}" stroke-width="2"/></svg>',
          },
          {
            id: 'B',
            concept: '网格与一杯咖啡',
            symbols: ['coffee'],
            alt: '咖啡杯与网格线条',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" fill="none"><g stroke="{{muted}}" stroke-width="1"><path d="M70 80 H530 M70 180 H530 M70 280 H530 M70 380 H530 M120 50 V400 M300 50 V400 M480 50 V400"/></g><path d="M250 190 H380 V285 C380 310 360 326 330 326 H300 C270 326 250 310 250 285 Z" stroke="{{accent}}" stroke-width="4"/><path d="M380 210 C430 202 438 286 384 288" stroke="{{accent}}" stroke-width="4"/><path d="M278 150 C264 126 292 112 278 88 M310 144 C296 118 324 104 310 80 M342 150 C328 126 356 112 342 88" stroke="{{ink}}" stroke-width="2"/></svg>',
          },
          {
            id: 'C',
            concept: '轨道与声波',
            symbols: ['orbit', 'wave'],
            alt: '轨道和声波线条',
            svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" fill="none"><circle cx="300" cy="210" r="52" stroke="{{accent}}" stroke-width="4"/><ellipse cx="300" cy="210" rx="170" ry="58" transform="rotate(-24 300 210)" stroke="{{muted}}" stroke-width="2"/><ellipse cx="300" cy="210" rx="140" ry="42" transform="rotate(34 300 210)" stroke="{{muted}}" stroke-width="2" stroke-dasharray="4 8"/><path d="M90 380 C130 340 170 420 210 380 C250 340 290 420 330 380 C370 340 410 420 450 380 C490 340 520 400 544 378" stroke="{{accent}}" stroke-width="2"/></svg>',
          },
        ],
      })
      console.log('[mock-llm] free art request -> 3 svg')
    } else if (systemText.includes('这是设计模式，不是标准模板模式')) {
      // 设计模式：故意使用三种不同模板，且允许某套没有正文
      const designPayload = JSON.parse(JSON.stringify(payload))
      designPayload.summary = 'MOCK 设计模式返回三套自由方案，推荐 A：几何切分最醒目。'
      designPayload.schemes[0] = {
        ...designPayload.schemes[0],
        name: '自由 A',
        layout_variant: 'bauhaus',
        color_preset: 'bauhaus_primary',
        font_pairing: 'grotesk',
        style: { columns: 2, headline_scale: 'large', image_treatment: 'duotone' },
        content: {
          ...designPayload.schemes[0].content,
          body_blocks: [{ type: 'paragraph', text: '设计模式允许用更短的正文，把视觉重心交给标题和图片。' }],
          poster_note: 'BAUHAUS STUDY · 001',
        },
        layout_overrides: [{ block_id: 'headline', x: 4, y: 11, w: 58, h: 9 }],
        extra_blocks: [
          {
            id: 'quote2',
            type: 'pullquote',
            x: 5,
            y: 82,
            w: 42,
            h: 9,
            text: '设计模式允许新增第二个引语板块。',
            tone: 'invert',
          },
        ],
        design_rationale: '红黄蓝几何切分，适合展陈与社交分享。',
      }
      designPayload.schemes[1] = {
        ...designPayload.schemes[1],
        name: '自由 B',
        layout_variant: 'swiss_style',
        color_preset: 'swiss_red',
        font_pairing: 'serif_sans',
        style: { columns: 3, headline_scale: 'xlarge', image_treatment: 'original' },
        content: {
          ...designPayload.schemes[1].content,
          body_blocks: [],
          poster_note: 'SWISS GRID · 02',
        },
        design_rationale: '极简网格与粗标题，正文留白，适合画册。',
      }
      designPayload.schemes[2] = {
        ...designPayload.schemes[2],
        name: '自由 C',
        layout_variant: 'cassette_futurism',
        color_preset: 'cassette_dark',
        font_pairing: 'terminal_mono',
        style: { columns: 1, headline_scale: 'large', image_treatment: 'halftone_mono' },
        content: {
          ...designPayload.schemes[2].content,
          body_blocks: [{ type: 'paragraph', text: '黑底荧光绿，用屏幕感处理一杯咖啡的日常。' }],
          poster_note: 'SIDE A · 03:00',
        },
        extra_blocks: [
          {
            id: 'footer2',
            type: 'footer',
            x: 5,
            y: 90,
            w: 60,
            h: 3,
            text: '第二行页脚 · 设计模式追加',
          },
        ],
        design_rationale: '显像管界面与单栏窄版，适合夜间分享。',
      }
      content = JSON.stringify(designPayload)
      console.log('[mock-llm] design request -> 3 free schemes')
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
