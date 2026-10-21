import assert from 'node:assert/strict'
import { buildDemoPayload } from '../src/agent/demoData.js'
import { normalizeSchemes } from '../src/agent/validate.js'
import { applyChatPatch } from '../src/agent/chat.js'
import { COLOR_PRESETS } from '../src/config/presets.js'

const date = '2026年10月21日'
const result = normalizeSchemes(buildDemoPayload({ date }), { date })
const scheme = result.schemes[1]
const beforeHeadline = scheme.content.headline
const beforeBlock = scheme.layouts.newspaper.find((b) => b.id === 'headline')

const { scheme: next, changed } = applyChatPatch(scheme, 'newspaper', {
  color_preset: 'newsprint_single_accent',
  font_pairing: 'superfamily',
  style: { columns: 2, headline_scale: 'xlarge', image_treatment: 'halftone_mono' },
  content: {
    headline: '这是一个被改过的标题',
    caption: '',
    caption_secondary: '次图说明测试',
    body_blocks: ['第一段新的导语。', '第二段新的正文。'],
  },
  layout_moves: [{ block_id: 'headline', dx: 2, dy: 1 }, { block_id: 'nope', dx: 5 }],
})

assert.equal(changed, true)
assert.equal(next.color_preset, 'newsprint_single_accent')
assert.equal(next.style.accent_color, COLOR_PRESETS.newsprint_single_accent.accent)
assert.equal(next.font_pairing, 'superfamily')
assert.equal(next.style.columns, 2)
assert.equal(next.style.headline_scale, 'xlarge')
assert.equal(next.style.image_treatment, 'halftone_mono')
assert.equal(next.content.headline, '这是一个被改过的标题')
assert.equal(next.content.body_blocks.length, 2)
assert.ok(next.content.caption === '')
assert.equal(next.content.caption_secondary, '次图说明测试')
const afterBlock = next.layouts.newspaper.find((b) => b.id === 'headline')
assert.equal(afterBlock.x, Math.round((beforeBlock.x + 2) * 10) / 10)
assert.equal(afterBlock.y, Math.round((beforeBlock.y + 1) * 10) / 10)
assert.equal(scheme.content.headline, beforeHeadline)
console.log('✓ chat patch applies allowed fields and keeps the original immutable')

const ignored = applyChatPatch(scheme, 'newspaper', {
  color_preset: 'not_a_preset',
  style: { columns: 9 },
  content: { headline: '' },
  layout_moves: [{ block_id: 'missing', dx: 4 }],
})
assert.equal(ignored.changed, false)
assert.equal(ignored.scheme, scheme)
console.log('✓ invalid chat patch is ignored')

const clamped = applyChatPatch(scheme, 'newspaper', {
  layout_moves: [{ block_id: 'headline', dx: 99, dy: -99, dw: 50 }],
  content: { headline: '一二三四五六七八九十一二三四五六七八' },
})
assert.equal(clamped.changed, true)
const moved = clamped.scheme.layouts.newspaper.find((b) => b.id === 'headline')
assert.ok(moved.x >= 0 && moved.x + moved.w <= 100.01)
assert.ok(moved.y >= 0)
assert.ok(Array.from(clamped.scheme.content.headline).length <= 15)
console.log('✓ out-of-range moves and text are clamped')

console.log('\nall chat patch tests passed')
