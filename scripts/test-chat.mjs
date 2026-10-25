import assert from 'node:assert/strict'
import { buildDemoPayload } from '../src/agent/demoData.js'
import { normalizeSchemes } from '../src/agent/validate.js'
import { applyChatPatch } from '../src/agent/chat.js'
import { COLOR_PRESETS } from '../src/config/presets.js'
import { overlaps, rectOf } from '../src/config/designLayout.js'

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

const standardSwap = applyChatPatch(scheme, 'newspaper', {
  layout_swaps: [['headline', 'pullquote']],
})
assert.equal(standardSwap.changed, true)
assert.equal(
  standardSwap.scheme.layouts.newspaper.find((b) => b.id === 'headline').x,
  scheme.layouts.newspaper.find((b) => b.id === 'pullquote').x,
)
console.log('✓ standard chat also supports layout_swaps')

const designScheme = normalizeSchemes(buildDemoPayload({ date }), {
  date,
  mode: 'design',
}).schemes[0]

const standardLayoutAttempt = applyChatPatch(designScheme, 'newspaper', {
  layout_variant: 'swiss_style',
})
assert.equal(standardLayoutAttempt.changed, false)

const designLayout = applyChatPatch(
  designScheme,
  'newspaper',
  { layout_variant: 'swiss_style' },
  { mode: 'design', hasSub: true },
)
assert.equal(designLayout.changed, true)
assert.equal(designLayout.scheme.layout_variant, 'swiss_style')
assert.equal(
  designLayout.scheme.layouts.newspaper.some((block) => block.id === 'secondary'),
  true,
)

const designEmptyBody = applyChatPatch(
  designScheme,
  'newspaper',
  { content: { body_blocks: [] } },
  { mode: 'design' },
)
assert.equal(designEmptyBody.changed, true)
assert.deepEqual(designEmptyBody.scheme.content.body_blocks, [])
console.log('✓ design chat can switch layout and clear body')

const headlineBefore = designScheme.layouts.newspaper.find((b) => b.id === 'headline')
const quoteBefore = designScheme.layouts.newspaper.find((b) => b.id === 'pullquote')
const swapped = applyChatPatch(
  designScheme,
  'newspaper',
  { layout_swaps: [['headline', 'pullquote']] },
  { mode: 'design' },
)
const headlineAfter = swapped.scheme.layouts.newspaper.find((b) => b.id === 'headline')
const quoteAfter = swapped.scheme.layouts.newspaper.find((b) => b.id === 'pullquote')
assert.equal(swapped.changed, true)
assert.equal(headlineAfter.x, quoteBefore.x)
assert.equal(quoteAfter.x, headlineBefore.x)
assert.equal(overlaps(rectOf(headlineAfter), rectOf(quoteAfter)), false)
console.log('✓ layout_swaps exchanges full slots without overlap')

const blocked = applyChatPatch(
  designScheme,
  'newspaper',
  {
    layout_placements: [
      {
        block_id: 'headline',
        x: quoteBefore.x,
        y: quoteBefore.y,
        w: quoteBefore.w,
        h: quoteBefore.h ?? 8,
      },
    ],
  },
  { mode: 'design' },
)
const blockedHeadline = blocked.scheme.layouts.newspaper.find((b) => b.id === 'headline')
assert.ok(blocked.warning.includes('重叠'))
assert.equal(blockedHeadline.x, headlineBefore.x)
assert.equal(blockedHeadline.y, headlineBefore.y)
console.log('✓ conflicting placement is reverted with a warning')

const added = applyChatPatch(
  designScheme,
  'newspaper',
  {
    extra_blocks: [
      {
        id: 'quote2',
        type: 'pullquote',
        x: 5,
        y: 82,
        w: 40,
        text: '新增的第二条引语',
      },
    ],
  },
  { mode: 'design' },
)
assert.equal(added.changed, true)
assert.ok(added.scheme.layouts.newspaper.some((b) => b.id === 'quote2'))
assert.ok(added.scheme.design_layout.extra_blocks.some((b) => b.id === 'quote2'))
console.log('✓ design chat can add a custom text block')

const removedFooter = applyChatPatch(
  designScheme,
  'newspaper',
  { remove_blocks: ['footer'] },
  { mode: 'design' },
)
assert.equal(
  removedFooter.scheme.layouts.newspaper.some((b) => b.type === 'footer'),
  false,
)
const reAddedFooter = applyChatPatch(
  removedFooter.scheme,
  'newspaper',
  {
    extra_blocks: [
      {
        id: 'footer2',
        type: 'footer',
        x: 5,
        y: 90,
        w: 60,
        h: 3,
        text: '重新生成的页脚',
      },
    ],
  },
  { mode: 'design' },
)
assert.ok(reAddedFooter.scheme.layouts.newspaper.some((b) => b.id === 'footer2'))
assert.equal(
  reAddedFooter.scheme.layouts.newspaper.find((b) => b.id === 'footer2').type,
  'footer',
)
console.log('✓ footer can be re-added after the last one is deleted')

console.log('\nall chat patch tests passed')
