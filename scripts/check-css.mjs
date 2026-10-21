/**
 * P0 回归护栏：禁止在样式中使用 html2canvas 1.4 无法解析的现代颜色函数。
 *
 * html2canvas 会把 CSS 计算值交给自己的颜色解析器；Chrome 会把
 * color-mix() 计算成 color(srgb …)，html2canvas 直接抛
 * "Attempting to parse an unsupported color function 'color'"，
 * 导致「导出 PNG」整个失败。这个脚本在 CI / npm test 里提前拦住同类写法。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')

async function findCss(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await findCss(full)))
    else if (entry.name.toLowerCase().endsWith('.css')) files.push(full)
  }
  return files
}

const FILES = await findCss(SRC)

const RULES = [
  { name: 'color-mix()', re: /\bcolor-mix\s*\(/gi },
  { name: 'color()', re: /(?<![\w-])color\s*\(/gi },
  { name: 'oklch()', re: /\boklch\s*\(/gi },
  { name: 'lab()', re: /(?<![\w-])lab\s*\(/gi },
  { name: 'lch()', re: /(?<![\w-])lch\s*\(/gi },
  { name: 'hwb()', re: /\bhwb\s*\(/gi },
  { name: 'light-dark()', re: /\blight-dark\s*\(/gi },
]

function stripComments(text) {
  // 保留换行，保证行号仍然准确
  return text.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
}

const findings = []
let scanned = 0

for (const file of FILES) {
  const raw = await fs.readFile(file, 'utf8')
  const lines = stripComments(raw).split(/\r?\n/)
  scanned += 1

  lines.forEach((line, index) => {
    for (const rule of RULES) {
      rule.re.lastIndex = 0
      let match
      while ((match = rule.re.exec(line)) !== null) {
        findings.push({
          file: path.relative(process.cwd(), file),
          line: index + 1,
          name: rule.name,
          snippet: line.trim().slice(0, 120),
        })
        if (match.index === rule.re.lastIndex) rule.re.lastIndex += 1
      }
    }
  })
}

if (findings.length) {
  console.error('')
  console.error('✗ CSS 颜色护栏未通过：发现 html2canvas 不支持的现代颜色函数')
  console.error('  这些写法会让「导出 PNG」抛 unsupported color function "color"。')
  console.error('  请改用 hex / rgb() / rgba() / hsl()，或把颜色写成 CSS 变量的 hex 值。')
  console.error('')
  for (const item of findings) {
    console.error(`  ${item.file}:${item.line}  ${item.name}  ${item.snippet}`)
  }
  console.error('')
  process.exitCode = 1
} else {
  console.log(`✓ CSS 颜色护栏通过（${scanned} 个样式文件，无 color-mix / color() / oklch 等写法）`)
}
