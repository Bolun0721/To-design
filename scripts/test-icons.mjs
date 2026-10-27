import assert from 'node:assert/strict'
import { ICON_IDS, ICON_LIBRARY, ICON_GROUPS } from '../src/config/icon-library.js'
import { CONCEPTS } from '../src/config/symbol-map.js'
import { resolvePatternStyle } from '../src/config/pattern-styles.js'
import { composeArtwork, COMPOSITIONS } from '../src/lib/composeArtwork.js'
import { sanitizeSvg } from '../src/lib/svg.js'

const palette = {
  background: '#FFFFFF',
  text: '#1A1A1A',
  accent: '#C8102E',
  secondary: '#4A4A4A',
  muted: '#9E9E9E',
  tertiary: '#C8102E',
}

assert.ok(ICON_IDS.length >= 79, `图标数量不足：${ICON_IDS.length}`)
assert.equal(new Set(ICON_IDS).size, ICON_IDS.length, '图标 id 重复')
assert.ok(ICON_GROUPS.includes('动物'))
assert.ok(ICON_GROUPS.includes('自定义'))

for (const icon of Object.values(ICON_LIBRARY)) {
  assert.ok(['0 0 24 24', '0 0 200 200'].includes(icon.viewBox), `${icon.id} viewBox 异常`)
  assert.ok(icon.body.includes('<'), `${icon.id} 没有 SVG 内容`)
  assert.ok(icon.body.length > 20, `${icon.id} 过于单薄`)
}

assert.ok(ICON_LIBRARY.fish.body.includes('M5.8 12'))
assert.ok(ICON_LIBRARY.star.body.includes('M12 3L14.23'))
assert.ok(ICON_LIBRARY.rainbow.body.includes('M2.2 20.5'))
assert.ok(ICON_LIBRARY['water-wave'])
assert.ok(ICON_LIBRARY['paper-plane'])

for (const concept of CONCEPTS) {
  assert.ok(ICON_LIBRARY[concept.primary], `${concept.name} 主图标不存在`)
  assert.ok(ICON_LIBRARY[concept.secondary], `${concept.name} 辅图标不存在`)
}

const variants = [
  'classic_broadsheet',
  'tabloid_bold',
  'minimal_masthead',
  'constructivism',
  'bauhaus',
  'de_stijl',
  'nasa_punk',
  'swiss_style',
  'cassette_futurism',
]
for (const variant of variants) {
  for (const composition of COMPOSITIONS) {
    const style = resolvePatternStyle(variant)
    const composed = composeArtwork({
      symbols: ['fish', 'star', 'rainbow'],
      composition,
      style,
      variant,
      extraElements: [{ shape: 'circle', cx: 480, cy: 90, r: 24, stroke: 'muted' }],
    })
    const sanitized = sanitizeSvg(composed.svg, palette)
    assert.equal(sanitized.ok, true, `${variant}/${composition} SVG 清洗失败`)
  }
}

const shadowed = composeArtwork({
  symbols: ['fish'],
  composition: 'center',
  style: { strokeWidth: 2, fill: 'soft-accent', shadow: 2, opacity: 0.9 },
  variant: 'tabloid_bold',
})
assert.ok(shadowed.svg.includes('fill-opacity="0.08"'))
assert.ok(shadowed.svg.includes('opacity="0.12"'))
assert.equal(sanitizeSvg(shadowed.svg, palette).ok, true)

console.log(`✓ ${ICON_IDS.length} icons / ${ICON_GROUPS.length} groups / 9 variants × 6 compositions`)
