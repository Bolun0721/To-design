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
import { fileURLToPath } from 'node:url'

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
  '.txt': 'text/plain; charset=utf-8',
}

function sendJson(res, code, obj) {
  res.statusCode = code
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(obj))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 8 * 1024 * 1024) {
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

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/llm')) return await handleRelay(req, res)

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

server.listen(PORT, HOST, () => {
  console.log(`\n  头版智造局 · FRONT PAGE LAB`)
  console.log(`  → http://${HOST}:${PORT}\n`)
})
