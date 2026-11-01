/** 生图模型：OpenAI 兼容 / 火山方舟图片接口。 */
import { IMAGE_PROVIDERS } from './llm.js'

export function normalizeImageBase(baseUrl) {
  const base = String(baseUrl || '').trim().replace(/\/+$/, '')
  if (!base) throw new Error('请填写生图接口 Base URL')
  return base.replace(/\/images\/(generations|edits)$/, '')
}

export function resolveImageSize(settings, format) {
  if (settings?.size && settings.size !== 'auto') return settings.size
  if (settings?.provider === 'ark') return '2K'
  if (format === 'poster') return '1024x1536'
  return '1024x1024'
}

function imageUrl(baseUrl, path) {
  const base = normalizeImageBase(baseUrl)
  return `${base}/images/${path}`
}

function dataUrlToBlob(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.*)$/s)
  if (!match) throw new Error('参考图格式不正确')
  const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0))
  return new Blob([bytes], { type: match[1] })
}

async function parseResponse(res) {
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  if (!res.ok) {
    const detail =
      data?.error?.message || data?.error || data?.message || String(data).slice(0, 300)
    if (res.status === 401 || res.status === 403) {
      throw new Error(`生图 Key 无效或没有权限（${res.status}）。${detail}`)
    }
    if (res.status === 404) {
      throw new Error(`生图接口或模型名不存在（404）。请检查 Base URL / 模型名。${detail}`)
    }
    if (res.status === 429) {
      throw new Error(`生图请求过于频繁或额度用完（429）。${detail}`)
    }
    throw new Error(`生图请求失败（${res.status}）：${detail}`)
  }
  return data
}

async function responseToImage(data) {
  const item = Array.isArray(data?.data) ? data.data[0] : data
  const b64 = item?.b64_json || item?.image_base64 || data?.b64_json
  if (b64) {
    const mime = b64.startsWith('iVBOR')
      ? 'image/png'
      : b64.startsWith('UklG')
        ? 'image/webp'
        : b64.startsWith('R0lG')
          ? 'image/gif'
          : 'image/jpeg'
    return `data:${mime};base64,${b64}`
  }
  const url = item?.url || data?.url
  if (url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`生图结果图片下载失败（${res.status}）`)
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('生图结果读取失败'))
      reader.readAsDataURL(blob)
    })
  }
  throw new Error('生图接口没有返回图片')
}

function generationsPayload({ model, prompt, size, reference, provider }) {
  const payload = {
    model,
    prompt,
    n: 1,
    size,
    response_format: 'b64_json',
  }
  if (reference && (provider === 'ark' || provider === 'custom')) payload.image = reference
  return payload
}

async function directRequest({ settings, prompt, size, reference, apiKey, signal }) {
  const provider = settings.provider || 'custom'
  const headers = {
    'content-type': 'application/json',
    authorization: `Bearer ${apiKey}`,
  }

  if (reference && provider === 'openai') {
    const form = new FormData()
    form.append('model', settings.model)
    form.append('prompt', prompt)
    form.append('size', size)
    form.append('image', dataUrlToBlob(reference), 'reference.png')
    const res = await fetch(imageUrl(settings.baseUrl, 'edits'), {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
      signal,
    })
    return responseToImage(await parseResponse(res))
  }

  const res = await fetch(imageUrl(settings.baseUrl, 'generations'), {
    method: 'POST',
    headers,
    body: JSON.stringify(generationsPayload({ ...settings, prompt, size, reference, provider })),
    signal,
  })
  return responseToImage(await parseResponse(res))
}

/**
 * 生图统一入口。imageApiKey 独立，留空不会复用排版 Key。
 * 默认走本地 /api/image 中继；direct 仅用于静态部署/测试。
 */
export async function requestImage({
  imageApiKey,
  settings,
  prompt,
  size,
  referenceDataUrl,
  signal,
}) {
  if (!imageApiKey?.trim()) throw new Error('请填写生图 Key；生图 Key 不会复用排版 Key')
  if (!settings?.model?.trim()) throw new Error('请填写生图模型名')
  if (!prompt?.trim()) throw new Error('请填写画面描述')

  const provider = settings.provider || 'custom'
  const payload = {
    provider,
    baseUrl: settings.baseUrl,
    model: settings.model.trim(),
    prompt,
    size,
    reference: referenceDataUrl || null,
    responseFormat: 'b64_json',
  }

  if (settings.mode === 'direct') {
    const dataUrl = await directRequest({
      settings,
      prompt,
      size,
      reference: referenceDataUrl,
      apiKey: imageApiKey.trim(),
      signal,
    })
    return { dataUrl, raw: null }
  }

  const res = await fetch('/api/image', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${imageApiKey.trim()}`,
    },
    body: JSON.stringify(payload),
    signal,
  })
  const data = await parseResponse(res)
  const dataUrl = data?.dataUrl || (await responseToImage(data))
  return { dataUrl, raw: data }
}

export function imageProviderOf(settings) {
  return (
    IMAGE_PROVIDERS.find((provider) => provider.id === settings?.provider) ||
    IMAGE_PROVIDERS[0]
  )
}
