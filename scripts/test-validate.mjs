import assert from 'node:assert/strict'
import { buildDemoPayload } from '../src/agent/demoData.js'
import { buildUserPrompt } from '../src/agent/systemPrompt.js'
import { normalizeSchemes } from '../src/agent/validate.js'
import { chineseDate } from '../src/lib/format.js'
import { applyStylePack, nextStylePack, STYLE_PACKS } from '../src/config/stylePacks.js'
import { VARIANTS } from '../src/config/presets.js'

const date = '2026年10月20日'
const demo = buildDemoPayload({ date, format: 'newspaper' })
const ok = normalizeSchemes(demo, { date, format: 'newspaper' })

assert.equal(ok.schemes.length, 3)
assert.equal(new Set(ok.schemes.map((s) => s.layout_variant)).size, 3)
assert.equal(new Set(ok.schemes.map((s) => s.color_preset)).size, 3)
for (const scheme of ok.schemes) {
  assert.equal(scheme.layouts.newspaper.length > 5, true)
  assert.equal(scheme.layouts.poster.length > 4, true)
  assert.ok(scheme.style.accent_color.startsWith('#'))
  assert.ok(scheme.content.headline.length <= 15)
}
assert.equal(ok.schemes[0].layouts.newspaper.some((b) => b.slot === 'secondary'), false)
assert.ok(ok.schemes[0].content.caption_secondary.includes('午后'))
assert.ok(ok.schemes[0].content.poster_note.includes('巷口'))
assert.equal(ok.recommended, 'B')

const multiClassic = applyStylePack(ok.schemes, 'classic', true)
assert.equal(
  multiClassic[0].layouts.newspaper.some((b) => b.id === 'secondary'),
  true,
)
assert.equal(
  multiClassic[0].layouts.poster.some((b) => b.id === 'secondary'),
  true,
)
const singleClassic = applyStylePack(ok.schemes, 'classic', false)
assert.equal(
  singleClassic[0].layouts.newspaper.some((b) => b.slot === 'secondary'),
  false,
)

const freePayload = JSON.parse(JSON.stringify(demo))
freePayload.schemes[1].layout_variant = 'classic_broadsheet'
freePayload.schemes[1].color_preset = 'classic_serious'
freePayload.schemes[1].content.body_blocks = []
const designed = normalizeSchemes(freePayload, { date, format: 'newspaper', mode: 'design' })
assert.equal(designed.schemes[1].layout_variant, 'classic_broadsheet')
assert.equal(designed.schemes[1].color_preset, 'classic_serious')
assert.deepEqual(designed.schemes[1].content.body_blocks, [])
const repairedStandard = normalizeSchemes(freePayload, { date, format: 'newspaper' })
assert.notEqual(repairedStandard.schemes[1].layout_variant, 'classic_broadsheet')
assert.equal(repairedStandard.schemes[1].content.body_blocks.length > 0, true)
console.log('✓ design mode keeps free template/color choices and allows empty body')

const prompt = buildUserPrompt({
  description: '两杯咖啡',
  photoMeta: { width: 1400, height: 1050, name: 'a.jpg' },
  secondaryPhotoMeta: { width: 1400, height: 1050, name: 'b.jpg' },
  formatLabel: '报纸',
  date,
  vision: true,
})
assert.ok(prompt.includes('这两张照片'))
assert.ok(prompt.includes('caption_secondary'))
const designPrompt = buildUserPrompt({
  description: '海报设计模式',
  formatLabel: '海报',
  date,
  vision: false,
  mode: 'design',
})
assert.ok(designPrompt.includes('可以完全省略正文'))
console.log('✓ demo payload normalizes into 3 distinct schemes')
console.log('✓ multi-image prompt includes secondary metadata and caption_secondary')

const geometry = applyStylePack(ok.schemes, 'geometry')
assert.deepEqual(
  geometry.map((scheme) => scheme.layout_variant),
  ['constructivism', 'bauhaus', 'de_stijl'],
)
assert.equal(geometry[0].content.headline, ok.schemes[0].content.headline)
assert.equal(geometry[1].color_preset, 'bauhaus_primary')
assert.ok(geometry[0].layouts.newspaper.length >= 9)
assert.ok(geometry[0].layouts.poster.length >= 5)
for (const pack of STYLE_PACKS) {
  for (const variantId of pack.variants) {
    assert.ok(VARIANTS[variantId], `${pack.id} 缺少版式 ${variantId}`)
  }
}
assert.equal(nextStylePack('classic').id, 'geometry')
assert.equal(nextStylePack('geometry').id, 'system')
assert.equal(nextStylePack('system').id, 'classic')
console.log('✓ 9 style variants form 3 packs and preserve content when switching')

const messy = {
  summary: '随便写写',
  meta: {},
  schemes: [
    {
      id: 'A',
      name: '这个方案名字特别特别长',
      layout_variant: 'nope',
      color_preset: 'classic_serious',
      font_pairing: 'nope',
      style: { columns: 9, headline_scale: 'huge', image_treatment: 'vaporwave' },
      content: {
        headline: '这是一个远远超过十五个字的主标题用来测试截断逻辑',
        subhead: '',
        body_blocks: [
          { type: 'paragraph', text: '<script>alert(1)</script>正文一段。' },
          { type: 'paragraph', text: '正文二段。' },
          { type: 'paragraph', text: '正文三段。' },
          { type: 'paragraph', text: '正文四段。' },
          { type: 'paragraph', text: '正文五段。' },
        ],
        caption: '',
        pullquote: '',
        image_placeholders: 'oops',
      },
    },
    {
      id: 'B',
      layout_variant: 'classic_broadsheet',
      color_preset: 'classic_serious',
      content: { headline: '重复版式与配色', body_blocks: [{ text: '内容。' }] },
    },
    {
      id: 'C',
      layout_variant: 'tabloid_bold',
      color_preset: 'financial_daily',
      content: { headline: '第三套', body_blocks: [{ text: '内容。' }] },
    },
  ],
}

const repaired = normalizeSchemes(messy, { date, format: 'poster' })
assert.equal(repaired.schemes.length, 3)
assert.equal(new Set(repaired.schemes.map((s) => s.layout_variant)).size, 3)
assert.equal(new Set(repaired.schemes.map((s) => s.color_preset)).size, 3)
assert.ok(repaired.warnings.length >= 5)
assert.ok(repaired.schemes[0].content.headline.length <= 15)
assert.equal(repaired.schemes[0].content.body_blocks.length, 4)
assert.ok(!repaired.schemes[0].content.body_blocks.some((b) => /<script/i.test(b.text)))
assert.ok(repaired.schemes[0].style.columns <= 3)
console.log(`✓ messy payload repaired with ${repaired.warnings.length} warnings`)

assert.throws(
  () => normalizeSchemes({ schemes: [demo.schemes[0], demo.schemes[1]] }, { date }),
  /只返回了 2 套方案/,
)
console.log('✓ fewer than 3 schemes rejected')

console.log(`\nall validation tests passed · ${chineseDate()}`)
