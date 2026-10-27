/**
 * 从两份 emoji-outline Markdown 中提取图标，生成 24×24 图标库。
 * 用法：node scripts/import-icon-library.mjs
 */
import fs from 'node:fs/promises'

const SOURCES = [
  new URL('../prompts/references/emoji-outline/emoji-outline-svg-code.md', import.meta.url),
  new URL(
    '../prompts/references/emoji-outline/emoji-outline-svg-code-animals-objects.md',
    import.meta.url,
  ),
]
const OUT = new URL('../src/config/icon-library.generated.js', import.meta.url)

const icons = new Map()

for (const source of SOURCES) {
  const text = await fs.readFile(source, 'utf8')
  const sectionRe = /###\s+([a-z0-9-]+)\s*\n([\s\S]*?)```xml\n([\s\S]*?)```/g
  let match
  while ((match = sectionRe.exec(text))) {
    const id = match[1]
    const metaBlock = match[2]
    const svgBlock = match[3]
    const svgMatch = svgBlock.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i)
    if (!svgMatch) continue
    const attrs = svgMatch[1]
    const body = svgMatch[2].trim()
    const meta = metaBlock.match(/`[^`]+`\s+([^·\n]+?)\s+·\s+`[^`]+`\s+·\s+分组：([^\n]+)/)
    const label = meta ? meta[1].trim() : id
    const group = meta ? meta[2].trim() : '其他'
    const viewBox = attrs.match(/viewBox="([^"]+)"/)?.[1] || '0 0 24 24'
    const strokeWidth = Number(attrs.match(/stroke-width="([^"]+)"/)?.[1] || 1.75)
    if (icons.has(id)) {
      console.warn(`重复图标 ${id}，保留第一次`)
      continue
    }
    icons.set(id, {
      id,
      label,
      group,
      keywords: [id, label],
      viewBox,
      strokeWidth,
      body,
    })
  }
}

const iconList = [...icons.values()].sort((a, b) => a.id.localeCompare(b.id))
const groups = [...new Set(iconList.map((icon) => icon.group))]
const output = `/* 自动生成：node scripts/import-icon-library.mjs；请勿手改。 */
export const GENERATED_ICONS = ${JSON.stringify(iconList, null, 2)}

export const GENERATED_ICON_GROUPS = ${JSON.stringify(groups, null, 2)}
export const GENERATED_ICON_COUNT = ${iconList.length}
`

await fs.writeFile(OUT, output, 'utf8')
console.log(`✓ 提取 ${iconList.length} 枚图标，${groups.length} 个分组`)
console.log(iconList.map((icon) => `${icon.id}:${icon.group}`).join('\n'))
