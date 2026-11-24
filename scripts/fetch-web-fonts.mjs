/**
 * 下载海报用到的拉丁 webfont（Google Fonts 的 latin 子集）到 public/fonts/web/，
 * 并生成：
 *   - public/fonts/web/fonts.css  本地 @font-face（页面/iframe 直接引用，离线可用）
 *   - src/config/webFonts.js      导出时按 family/weight 找到字体文件并 base64 嵌入
 *
 * 中文不用 webfont：SVG 转图片时用系统字体，预览与导出保持一致。
 *
 * 用法：node scripts/fetch-web-fonts.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public', 'fonts', 'web')
const CONFIG = path.join(ROOT, 'src', 'config', 'webFonts.js')
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const FAMILIES = [
  { family: 'Playfair Display', weights: [700, 900] },
  { family: 'PT Serif', weights: [400, 700] },
  { family: 'Source Sans 3', weights: [400, 600, 700] },
  { family: 'Source Serif 4', weights: [400, 600, 700] },
  { family: 'IBM Plex Mono', weights: [400, 600] },
]

function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function latinBlocks(css) {
  const blocks = []
  const re = /@font-face\s*\{([\s\S]*?)\}/g
  let match
  while ((match = re.exec(css))) {
    const body = match[1]
    const family = (body.match(/font-family:\s*'([^']+)'/) || [])[1]
    const weight = (body.match(/font-weight:\s*([^;]+);/) || [])[1]?.trim()
    const style = (body.match(/font-style:\s*([^;]+);/) || [])[1]?.trim() || 'normal'
    const url = (body.match(/url\(([^)]+)\)/) || [])[1]
    const range = (body.match(/unicode-range:\s*([^;]+);/) || [])[1] || ''
    if (!family || !weight || !url) continue
    const latin = !range || /U\+0000-00FF/.test(range) || /U\+0000-00FF/i.test(range)
    if (!latin) continue
    blocks.push({ family, weight, style, url: url.replace(/['"]/g, '') })
  }
  return blocks
}

async function download(url, file) {
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  if (!res.ok) throw new Error(`字体下载失败 ${res.status}: ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(file, buffer)
  return buffer.length
}

const entries = []
const cssLines = []
let total = 0

await fs.mkdir(OUT_DIR, { recursive: true })

for (const item of FAMILIES) {
  const query = `${item.family.replace(/ /g, '+')}:wght@${item.weights.join(';')}`
  const url = `https://fonts.googleapis.com/css2?family=${query}&display=swap`
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  if (!res.ok) throw new Error(`CSS 拉取失败 ${res.status}: ${url}`)
  const css = await res.text()
  const blocks = latinBlocks(css)
  if (!blocks.length) throw new Error(`没有找到 latin 字体块：${item.family}`)

  for (const block of blocks) {
    const weightTag = String(block.weight).replace(/\s+/g, '-')
    const file = `${slug(block.family)}-${weightTag}.woff2`
    const target = path.join(OUT_DIR, file)
    let bytes = 0
    try {
      bytes = (await fs.stat(target)).size
    } catch {
      bytes = await download(block.url, target)
    }
    total += bytes
    entries.push({ family: block.family, weight: block.weight, style: block.style, file: `/fonts/web/${file}` })
    cssLines.push(
      `@font-face {\n  font-family: '${block.family}';\n  font-style: ${block.style};\n  font-weight: ${block.weight};\n  font-display: swap;\n  src: url('${file}') format('woff2');\n}`,
    )
  }
}

cssLines.unshift('/* 由 scripts/fetch-web-fonts.mjs 生成：Google Fonts 的 latin 子集，本地化后用于海报与导出 */')
await fs.writeFile(path.join(OUT_DIR, 'fonts.css'), `${cssLines.join('\n\n')}\n`, 'utf8')

const config = `/**
 * 由 scripts/fetch-web-fonts.mjs 生成，请勿手改。
 * 海报导出时按 family + weight 找文件，base64 嵌入 SVG，保证 PNG 与预览一致。
 */
export const WEB_FONT_FILES = ${JSON.stringify(entries, null, 2)}

export function webFontFilesFor(families = []) {
  const wanted = new Set(families.filter(Boolean))
  return WEB_FONT_FILES.filter((entry) => wanted.has(entry.family))
}
`
await fs.writeFile(CONFIG, config, 'utf8')

console.log(
  JSON.stringify(
    {
      families: FAMILIES.map((item) => item.family),
      files: entries.length,
      bytes: total,
      out: path.relative(ROOT, OUT_DIR),
    },
    null,
    2,
  ),
)
