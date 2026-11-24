/**
 * 本地 mock LLM（OpenAI 兼容），用于无 Key 的端到端联调。
 * 运行：node scripts/mock-llm.mjs  →  http://127.0.0.1:8787/v1/chat/completions
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildDemoPayload } from '../src/agent/demoData.js'

const PORT = 8787
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const IMAGE_FIXTURE = fs
  .readFileSync(path.join(ROOT, 'public', 'demo', 'coffee.jpg'))
  .toString('base64')

const payload = buildDemoPayload({ date: '2026年10月20日', format: 'newspaper' })
payload.summary = 'MOCK 模型已返回三套方案，推荐 B：标题最有力。'
payload.schemes[0].name = '模型甲'
payload.schemes[1].name = '模型乙'
payload.schemes[2].name = '模型丙'

let rateLimitedOnce = false

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.url.startsWith('/v1/images/')) {
    console.log(
      `[mock-llm] ${req.method} ${req.url} image model=${req.headers['x-mock-model'] || '-'} key=${
        req.headers.authorization ? 'present' : 'missing'
      }`,
    )
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(
      JSON.stringify({
        created: Math.floor(Date.now() / 1000),
        data: [{ b64_json: IMAGE_FIXTURE }],
        usage: { generated_images: 1 },
      }),
    )
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
    let delayMs = 0
    if (userText.includes('【本轮角度】')) {
      // 海报单套生成：返回一套「文案 + 海报规格」
      const angle = (userText.match(/【本轮角度】([ABC])/))?.[1] || 'A'
      delayMs = angle === 'A' ? 250 : angle === 'B' ? 1400 : 2400
      if (process.env.MOCK_429 === '1' && angle === 'B' && !rateLimitedOnce) {
        rateLimitedOnce = true
        console.log('[mock-llm] forced 429 for poster B (will succeed on retry)')
        res.writeHead(429, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ error: { message: 'rate limited (mock)' } }))
        return
      }
      const byAngle = {
        A: { template: 'poster_ark_file', variant: 'quiet', palette: 'ark_night', font: 'grotesk', headline: '巷口那杯手冲', word: 'FIELD NOTES' },
        B: { template: 'poster_ark_hazard', variant: 'loud', palette: 'ark_hazard', font: 'grotesk', headline: '这杯咖啡，值得上头版', word: 'WARNING' },
        C: { template: 'poster_endfield_survey', variant: 'loud', palette: 'endfield_field', font: 'grotesk', headline: '周日，晴', word: 'SURVEY' },
      }
      const pick = byAngle[angle] || byAngle.A
      const recipe = { poster_ark_file: 'paper_grain', poster_ark_hazard: 'diagonal_split', poster_endfield_survey: 'contour' }[pick.template]
      content = JSON.stringify({
        name: `MOCK ${angle}`,
        poster_template: pick.template,
        poster_variant: pick.variant,
        color_preset: pick.palette,
        font_pairing: pick.font,
        headline_scale: angle === 'B' ? 'xlarge' : 'large',
        content: {
          headline: pick.headline,
          subhead: '一个普通的周日下午，被十分钟的等待重新计时',
          caption: '靠窗的座位上，一杯手冲与一本翻旧的书',
          poster_note: '周日 · 下午三点 · 巷口',
          art_words: [{ text: pick.word, placement: 'headline' }],
          body_blocks: [
            {
              type: 'paragraph',
              text: '下午三点，巷口的咖啡馆只坐了三桌客人。靠窗的位置上，一杯手冲刚刚注完最后一段水，热气沿着玻璃向上爬。',
            },
          ],
          date: '2026年11月24日',
        },
        poster: {
          art: { recipe, params: {}, seed: 42 + angle.charCodeAt(0), shapes: [] },
          textures: { paper: 'aged', grain: 0.06 },
        },
        design_rationale: `MOCK 海报 ${angle}：模板 ${pick.template}。`,
      })
      console.log(`[mock-llm] poster request -> ${angle} / ${pick.template}`)
    } else if (userText.includes('主图和子图的图注')) {
      content = JSON.stringify({
        captions: [
          { slot: 'main', text: '窗边的咖啡与一本翻旧的书' },
          { slot: 'secondary', text: '午后的光停在杯沿与桌面' },
        ],
      })
      console.log('[mock-llm] caption request -> 2 captions')
    } else if (userText.includes('【本次指令】')) {
      // 对话微调：返回一个最小 patch
      const posterChat = systemText.includes('海报微调')
      const wantsZine = /手作|zine|换模板/i.test(userText)
      content = JSON.stringify(
        posterChat && wantsZine
          ? {
              reply: '已换成「终末信号」模板，并切到张扬排版。',
              patch: { poster: { template: 'poster_endfield_signal', variant: 'loud' } },
            }
          : {
              reply: '已把标题放大，并换成财经日报配色。',
              patch: {
                color_preset: 'financial_daily',
                style: { headline_scale: 'xlarge' },
                content: { headline: '夜色里的手冲' },
              },
            },
      )
      console.log('[mock-llm] edit request -> patch')
    } else if (userText.includes('【图案任务】')) {
      content = JSON.stringify({
        artworks: [
          {
            id: 'A',
            concept: '鲸尾穿过水波',
            symbols: ['whale-tail', 'water-wave'],
            composition: 'duo',
            style: { strokeWidth: 1.6, fill: 'soft-accent', shadow: 1, opacity: 0.95 },
            extra_elements: [
              { shape: 'circle', cx: 476, cy: 92, r: 18, stroke: 'muted', strokeWidth: 1, opacity: 0.35 },
              { shape: 'line', x1: 70, y1: 380, x2: 530, y2: 380, stroke: 'ink', strokeWidth: 1, opacity: 0.25 },
            ],
            alt: '鲸尾与水波线条',
          },
          {
            id: 'B',
            concept: '网格与一杯咖啡',
            symbols: ['coffee', 'book'],
            composition: 'horizon',
            style: { strokeWidth: 1.3, fill: 'none', shadow: 0, opacity: 0.9 },
            extra_elements: [
              { shape: 'circle', cx: 500, cy: 120, r: 34, stroke: 'muted', strokeWidth: 1, opacity: 0.3 },
            ],
            alt: '咖啡与书的线条',
          },
          {
            id: 'C',
            concept: '轨道与星',
            symbols: ['orbit', 'star'],
            composition: 'triad',
            style: { strokeWidth: 1.5, fill: 'soft-accent', shadow: 1, opacity: 0.95 },
            extra_elements: [
              { shape: 'arc', d: 'M90 380 C150 340 210 420 270 380 C330 340 390 420 450 380 C500 350 530 360 550 380', stroke: 'accent', strokeWidth: 1.2, opacity: 0.6 },
            ],
            alt: '轨道和星形线条',
          },
        ],
      })
      console.log('[mock-llm] free art request -> 3 library compositions')
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
        style: {
          columns: 2,
          headline_scale: 'large',
          image_treatment: 'duotone',
          art_font: 'bauhaus',
        },
        content: {
          ...designPayload.schemes[0].content,
          english_title: 'GEOMETRIC DAILY',
          art_words: [
            { text: 'GEOMETRIC DAILY', placement: 'headline' },
            { text: 'BAUHAUS', placement: 'masthead' },
            { text: 'ISSUE 03', placement: 'note' },
          ],
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
        style: {
          columns: 3,
          headline_scale: 'xlarge',
          image_treatment: 'original',
          art_font: 'swiss_style',
        },
        content: {
          ...designPayload.schemes[1].content,
          english_title: 'THE QUIET HOUR',
          art_words: [
            { text: 'THE QUIET HOUR', placement: 'headline' },
            { text: 'SWISS GRID', placement: 'masthead' },
            { text: '02 / 2026', placement: 'note' },
          ],
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
        style: {
          columns: 1,
          headline_scale: 'large',
          image_treatment: 'halftone_mono',
          art_font: 'cassette_futurism',
        },
        content: {
          ...designPayload.schemes[2].content,
          english_title: 'AFTER HOURS',
          art_words: [
            { text: 'AFTER HOURS', placement: 'headline' },
            { text: 'SIDE A', placement: 'masthead' },
            { text: '03:00 AM', placement: 'note' },
          ],
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

    const send = () => {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      res.end(
        JSON.stringify({
          id: 'mock-1',
          model: body.model || 'mock-model',
          choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 1200, completion_tokens: 900, total_tokens: 2100 },
        }),
      )
    }
    if (delayMs > 0) setTimeout(send, delayMs)
    else send()
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`mock LLM → http://127.0.0.1:${PORT}/v1/chat/completions`)
})
