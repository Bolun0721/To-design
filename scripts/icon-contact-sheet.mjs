/**
 * 生成 94 枚图标 contact sheet 的 HTML；用浏览器截图后保存 docs/19-icon-library.png。
 * 用法：node scripts/icon-contact-sheet.mjs
 */
import fs from 'node:fs/promises'
import { ICON_LIBRARY, ICON_GROUPS } from '../src/config/icon-library.js'

const OUT = new URL('../.shots/icon-library.html', import.meta.url)
const icons = Object.values(ICON_LIBRARY)

const groups = ICON_GROUPS.map((group) => {
  const items = icons.filter((icon) => icon.group === group)
  return `
    <section>
      <h2>${group} · ${items.length}</h2>
      <div class="grid">
        ${items
          .map(
            (icon) => `
          <div class="icon">
            <svg viewBox="${icon.viewBox}" width="38" height="38" fill="none" stroke="#161616" stroke-width="${(1.75 * ((icon.viewBox.split(/\s+/).map(Number)[2] || 24) / 24)).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round">${icon.body}</svg>
            <b>${icon.id}</b>
            <span>${icon.label}</span>
          </div>`,
          )
          .join('')}
      </div>
    </section>`
}).join('')

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>Emoji Outline Icon Library</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px 40px 48px; background: #f2efe7; color: #161616; font-family: "Segoe UI", "Microsoft YaHei", sans-serif; }
  h1 { margin: 0 0 6px; font-size: 26px; letter-spacing: .04em; }
  .sub { margin: 0 0 26px; color: #6e6a60; font-size: 12px; letter-spacing: .08em; }
  section { margin-bottom: 22px; }
  h2 { margin: 0 0 10px; font-size: 13px; letter-spacing: .12em; color: #8b1a2b; border-bottom: 1px solid #d7d0c2; padding-bottom: 6px; }
  .grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 8px; }
  .icon { background: #fffdf8; border: 1px solid #e1dacb; padding: 8px 6px 7px; text-align: center; }
  .icon svg { display: block; margin: 0 auto 4px; }
  .icon b { display: block; font-size: 8px; font-weight: 600; color: #161616; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .icon span { display: block; margin-top: 2px; font-size: 8px; color: #8a857a; }
</style>
</head>
<body>
  <h1>Emoji Outline Icon Library</h1>
  <p class="sub">${icons.length} icons · 24-unit optical grid · fill none · stroke 1.75 · round caps · fish / star / rainbow corrected</p>
  ${groups}
</body>
</html>`

await fs.mkdir(new URL('../.shots/', import.meta.url), { recursive: true })
await fs.writeFile(OUT, html, 'utf8')
console.log(`✓ ${icons.length} icons → .shots/icon-library.html`)
