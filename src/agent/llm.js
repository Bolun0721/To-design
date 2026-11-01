export const PROVIDERS = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    vision: false,
    note: '性价比高，适合中文写稿',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    vision: true,
    note: '支持直接看图（vision）',
  },
  {
    id: 'moonshot',
    name: 'Moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    vision: false,
    note: '中文报纸腔表现稳定',
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    vision: true,
    note: '国内直连，支持视觉模型',
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'Qwen/Qwen2.5-72B-Instruct',
    vision: false,
    note: '开源模型聚合',
  },
  {
    id: 'custom',
    name: '自定义 / 兼容接口',
    baseUrl: '',
    model: '',
    vision: false,
    note: '任何 OpenAI 兼容的 /chat/completions',
  },
]

export const IMAGE_PROVIDERS = [
  {
    id: 'ark',
    name: '火山方舟',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-seedream-5-0-260128',
    supportsReference: true,
    note: '图片生成用 Seedream；Seedance 是视频模型',
  },
  {
    id: 'openai',
    name: 'OpenAI Images',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-image-1',
    supportsReference: true,
    note: '支持图片生成与参考图编辑',
  },
  {
    id: 'custom',
    name: '自定义 / 兼容接口',
    baseUrl: '',
    model: '',
    supportsReference: false,
    note: '兼容 /images/generations 的图片接口',
  },
]

export function defaultImageSettings() {
  const p = IMAGE_PROVIDERS[0]
  return {
    provider: p.id,
    baseUrl: p.baseUrl,
    model: p.model,
    mode: 'proxy',
    supportsReference: true,
    size: 'auto',
  }
}

export function defaultSettings() {
  const p = PROVIDERS[0]
  return {
    provider: p.id,
    baseUrl: p.baseUrl,
    model: p.model,
    mode: 'auto',
    vision: false,
    image: defaultImageSettings(),
  }
}

export function normalizeBase(baseUrl) {
  const base = String(baseUrl || '').trim().replace(/\/+$/, '')
  if (!base) throw new Error('请填写接口地址 Base URL')
  if (/\/chat\/completions$/.test(base)) return base
  if (/\/v\d+$/.test(base)) return `${base}/chat/completions`
  return `${base}/v1/chat/completions`
}

function extractJson(text) {
  const raw = String(text || '').trim()
  if (!raw) throw new Error('模型返回为空')
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1].trim() : raw
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`没有找到 JSON 对象：${raw.slice(0, 120)}…`)
  }
  const jsonText = candidate.slice(start, end + 1)
  try {
    return JSON.parse(jsonText)
  } catch (err) {
    // 常见瑕疵：尾随逗号
    try {
      return JSON.parse(jsonText.replace(/,\s*([}\]])/g, '$1'))
    } catch {
      throw new Error(`JSON 解析失败：${err.message}`)
    }
  }
}

function messageOf(body) {
  if (!body) return ''
  if (typeof body === 'string') return body.slice(0, 300)
  if (body.error?.message) return body.error.message
  if (typeof body.error === 'string') return body.error
  if (body.message) return body.message
  return JSON.stringify(body).slice(0, 300)
}

function friendlyError(status, body) {
  const detail = messageOf(body)
  if (status === 401 || status === 403) return `API Key 无效或没有权限（${status}）。${detail}`
  if (status === 404) return `接口地址或模型名不存在（404）。请检查 Base URL 与模型名。${detail}`
  if (status === 429) return `请求过于频繁或额度用完（429）。${detail}`
  if (status >= 500) return `模型服务端错误（${status}）。${detail}`
  return `请求失败（${status}）：${detail}`
}

/**
 * 统一的 OpenAI 兼容 /chat/completions 调用。
 * mode = proxy：走本地中继（解决 CORS，不落盘 Key）
 * mode = direct：浏览器直连（静态部署时使用）
 */
async function postChat({
  apiKey,
  settings,
  system,
  user,
  signal,
  temperature = 0.7,
  maxTokens = 3200,
}) {
  if (!apiKey?.trim()) throw new Error('请先填写模型 API Key')
  if (!settings?.model?.trim()) throw new Error('请填写模型名')

  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(location.hostname)
  const useProxy = settings.mode === 'auto' ? isLocal : settings.mode === 'proxy'
  const url = useProxy ? '/api/llm' : normalizeBase(settings.baseUrl)

  const payload = {
    model: settings.model.trim(),
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  }

  const headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${apiKey.trim()}`,
  }
  if (useProxy) headers['x-llm-base'] = normalizeBase(settings.baseUrl).replace(/\/chat\/completions$/, '')

  const send = async (body) => {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    })
    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
    return { res, data }
  }

  let { res, data } = await send(payload)

  // 有些兼容接口不认识 response_format，去掉后重试一次
  if (!res.ok && res.status === 400 && /response_format|json_object/i.test(messageOf(data))) {
    const { response_format, ...fallback } = payload
    ;({ res, data } = await send(fallback))
  }

  if (!res.ok) throw new Error(friendlyError(res.status, data))

  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error(`模型没有返回内容：${messageOf(data)}`)

  return {
    json: extractJson(content),
    usage: data.usage || null,
    raw: content,
  }
}

export async function requestSchemes({
  apiKey,
  settings,
  system,
  user,
  photoDataUrl,
  photo2DataUrl,
  signal,
}) {
  const images = [photoDataUrl, photo2DataUrl].filter(Boolean)
  const userContent =
    settings.vision && images.length
      ? [
          { type: 'text', text: user },
          ...images.map((url) => ({
            type: 'image_url',
            image_url: { url, detail: 'low' },
          })),
        ]
      : user

  return postChat({
    apiKey,
    settings,
    system,
    user: userContent,
    signal,
    temperature: 0.9,
    maxTokens: 3200,
  })
}

/** 自由模式图案：一次返回 3 个 SVG，失败由前端符号库兜底 */
export async function requestArtworks({ apiKey, settings, system, user, signal }) {
  return postChat({
    apiKey,
    settings,
    system,
    user,
    signal,
    temperature: 0.6,
    maxTokens: 6000,
  })
}

/** 多图补充图注：只返回 JSON captions */
export async function requestCaptions({ apiKey, settings, system, user, imageDataUrls = [], signal }) {
  const images = imageDataUrls.filter(Boolean)
  const userContent =
    settings.vision && images.length
      ? [
          { type: 'text', text: user },
          ...images.map((url) => ({
            type: 'image_url',
            image_url: { url, detail: 'low' },
          })),
        ]
      : user
  return postChat({
    apiKey,
    settings,
    system,
    user: userContent,
    signal,
    temperature: 0.4,
    maxTokens: 900,
  })
}

/** 对话微调：一次只返回一个 JSON patch */
export async function requestEdit({ apiKey, settings, system, user, signal }) {
  return postChat({
    apiKey,
    settings,
    system,
    user,
    signal,
    temperature: 0.35,
    maxTokens: 1400,
  })
}
