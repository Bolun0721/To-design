/**
 * 零依赖本地服务器：
 *   1. 托管 index.html / src / public
 *   2. POST /api/llm —— 极薄 LLM 中继，只转发、不落盘、不记录 Key
 *
 * 运行：node server.mjs  →  http://127.0.0.1:5173
 */
import http from 'node:http'
import fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 5173)
const HOST = process.env.HOST || '127.0.0.1'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
}

function sendJson(res, code, obj) {
  res.statusCode = code
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(obj))
}

function readBody(req, maxBytes = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > maxBytes) {
        reject(new Error('请求体过大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function resolveStatic(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0])
  const rel = clean === '/' ? 'index.html' : clean.replace(/^\/+/, '')
  const candidates = rel.startsWith('src/') || rel.startsWith('public/')
    ? [path.join(ROOT, rel)]
    : rel.startsWith('vendor/') || rel.startsWith('demo/')
      ? [path.join(ROOT, 'public', rel)]
      : [path.join(ROOT, rel), path.join(ROOT, 'public', rel)]

  return candidates
    .map((file) => path.resolve(file))
    .filter((file) => file.startsWith(ROOT + path.sep) || file === ROOT)
}

async function handleRelay(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
  if (!req.headers.authorization) return sendJson(res, 400, { error: '缺少 Authorization 头' })

  let target
  try {
    const u = new URL(String(req.headers['x-llm-base'] || ''))
    if (u.protocol !== 'https:') throw new Error('仅支持 https')
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(u.hostname)) throw new Error('目标不能是本机')
    target = u.toString().replace(/\/$/, '')
  } catch (err) {
    return sendJson(res, 400, { error: `不合法的基础地址：${err.message}` })
  }

  const url = /\/chat\/completions$/.test(target)
    ? target
    : `${target}${/\/v\d+$/.test(target) ? '' : '/v1'}/chat/completions`

  let body
  try {
    body = await readBody(req)
  } catch (err) {
    return sendJson(res, 413, { error: err.message })
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 120_000)
  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: req.headers.authorization,
      },
      body,
      signal: controller.signal,
    })
    const text = await upstream.text()
    res.statusCode = upstream.status
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', 'no-store')
    res.end(text)
  } catch (err) {
    sendJson(res, 502, {
      error: `中继请求失败：${err.name === 'AbortError' ? '超时（120s）' : err.message}`,
    })
  } finally {
    clearTimeout(timer)
  }
}

async function handleImageRelay(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
  if (!req.headers.authorization) return sendJson(res, 400, { error: '缺少 Authorization 头' })

  let payload
  try {
    payload = JSON.parse(await readBody(req, 24 * 1024 * 1024))
  } catch (err) {
    return sendJson(res, 400, { error: `生图请求体不合法：${err.message}` })
  }

  const {
    provider = 'custom',
    baseUrl,
    model,
    prompt,
    size = '1024x1024',
    reference = null,
  } = payload
  if (!model || !prompt) return sendJson(res, 400, { error: '缺少 model 或 prompt' })

  let base
  try {
    const parsed = new URL(String(baseUrl || ''))
    if (parsed.protocol !== 'https:') throw new Error('仅支持 https')
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)) {
      throw new Error('目标不能是本机')
    }
    base = parsed.toString().replace(/\/+$/, '').replace(/\/images\/(generations|edits)$/, '')
  } catch (err) {
    return sendJson(res, 400, { error: `不合法的生图地址：${err.message}` })
  }

  const headers = { authorization: req.headers.authorization }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 240_000)

  try {
    let upstream
    if (provider === 'openai' && reference) {
      const match = String(reference).match(/^data:([^;]+);base64,(.*)$/s)
      if (!match) return sendJson(res, 400, { error: '参考图格式不正确' })
      const form = new FormData()
      form.append('model', model)
      form.append('prompt', prompt)
      form.append('size', size)
      form.append(
        'image',
        new Blob([Buffer.from(match[2], 'base64')], { type: match[1] }),
        'reference.png',
      )
      upstream = await fetch(`${base}/images/edits`, {
        method: 'POST',
        headers,
        body: form,
        signal: controller.signal,
      })
    } else {
      headers['content-type'] = 'application/json'
      const body = {
        model,
        prompt,
        n: 1,
        size,
        response_format: 'b64_json',
      }
      if (provider === 'ark') {
        body.watermark = false
        if (reference) body.image = reference
      } else if (provider === 'custom' && reference) {
        body.image = reference
      }
      upstream = await fetch(`${base}/images/generations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    }

    const text = await upstream.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
    if (!upstream.ok) {
      const detail =
        data?.error?.message || data?.error || data?.message || String(data).slice(0, 400)
      return sendJson(res, upstream.status, { error: `上游生图失败：${detail}` })
    }

    const item = Array.isArray(data?.data) ? data.data[0] : data
    if (item?.b64_json) {
      const b64 = item.b64_json
      const mime = b64.startsWith('iVBOR')
        ? 'image/png'
        : b64.startsWith('UklG')
          ? 'image/webp'
          : b64.startsWith('R0lG')
            ? 'image/gif'
            : 'image/jpeg'
      return sendJson(res, 200, {
        dataUrl: `data:${mime};base64,${b64}`,
        usage: data.usage || null,
      })
    }
    const imageUrl = item?.url || data?.url
    if (!imageUrl) return sendJson(res, 502, { error: '生图接口没有返回图片' })

    const imageRes = await fetch(imageUrl, { signal: controller.signal })
    if (!imageRes.ok) return sendJson(res, 502, { error: `生图结果下载失败（${imageRes.status}）` })
    const buffer = Buffer.from(await imageRes.arrayBuffer())
    if (buffer.length > 20 * 1024 * 1024) {
      return sendJson(res, 502, { error: '生图结果超过 20MB' })
    }
    const mime = imageRes.headers.get('content-type') || 'image/png'
    return sendJson(res, 200, {
      dataUrl: `data:${mime.split(';')[0]};base64,${buffer.toString('base64')}`,
      usage: data.usage || null,
    })
  } catch (err) {
    return sendJson(res, 502, {
      error: `生图中继失败：${err.name === 'AbortError' ? '超时（240s）' : err.message}`,
    })
  } finally {
    clearTimeout(timer)
  }
}

export function createAppServer() {
  return http.createServer(async (req, res) => {
    try {
      if (req.url.startsWith('/api/llm')) return await handleRelay(req, res)
      if (req.url.startsWith('/api/image')) return await handleImageRelay(req, res)

      const candidates = resolveStatic(req.url)
      if (!candidates.length) return sendJson(res, 404, { error: 'Not found' })

      let file = null
      let stat = null
      for (const candidate of candidates) {
        try {
          const s = await fs.stat(candidate)
          if (s.isFile()) {
            file = candidate
            stat = s
            break
          }
        } catch {
          /* try next */
        }
      }
      if (!file) return sendJson(res, 404, { error: 'Not found' })

      res.statusCode = 200
      res.setHeader('content-type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream')
      res.setHeader('cache-control', 'no-store')
      createReadStream(file).pipe(res)
    } catch (err) {
      sendJson(res, 500, { error: err.message })
    }
  })
}

/** 启动服务器；port=0 时由系统分配端口。 */
export function startAppServer({ port = PORT, host = HOST } = {}) {
  return new Promise((resolve, reject) => {
    const server = createAppServer()
    const onError = (error) => {
      server.off('error', onError)
      reject(error)
    }
    server.once('error', onError)
    server.listen(port, host, () => {
      server.off('error', onError)
      resolve({ server, host, port: server.address().port })
    })
  })
}

const isMain =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url

if (isMain) {
  startAppServer()
    .then(({ host, port }) => {
      console.log(`\n  头版智造局 · FRONT PAGE LAB`)
      console.log(`  → http://${host}:${port}\n`)
    })
    .catch((err) => {
      console.error(`服务器启动失败：${err.message}`)
      process.exitCode = 1
    })
}
