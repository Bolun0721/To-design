/**
 * 海报 skill 回归：资产单一数据源、派生目录 / 白名单、提示词注入位置、输出自检。
 *
 * 这些断言守住四件事：
 * 1. 目录与白名单必须由 config 派生，config 改了这里不会「悄悄漂移」；
 * 2. 海报 skill 只能进海报提示词，报纸提示词保持原文案；
 * 3. patch 字段里不能出现坐标 / SVG / hex；
 * 4. auditPosterScheme 的口径与提示词里的自检一致（示例稿零警告，越界稿逐条报）。
 */
import assert from 'node:assert/strict'
import { ART_FONTS } from '../src/config/artFonts.js'
import {
  COLOR_PRESET_IDS,
  FONT_PAIRING_IDS,
  VARIANT_IDS,
} from '../src/config/presets.js'
import { buildDemoPayload } from '../src/agent/demoData.js'
import { normalizeSchemes } from '../src/agent/validate.js'
import { buildDesignSystemPrompt, buildDesignChatSystemPrompt } from '../src/agent/designPrompt.js'
import { buildChatSystemPrompt } from '../src/agent/chat.js'
import { buildSystemPrompt } from '../src/agent/systemPrompt.js'
import {
  POSTER_ASSETS,
  POSTER_SKILL,
  POSTER_SKILL_BULLETS,
  POSTER_SKILL_VERSION,
  assertPosterAssets,
  auditPosterScheme,
  buildPosterCatalog,
  buildPosterWhitelist,
  posterChatGuard,
  posterSkillSection,
} from '../src/agent/posterSkill.js'

const date = '2026年11月24日'

/* ---------- 1. 资产自检与覆盖矩阵 ---------- */

const info = assertPosterAssets()
assert.deepEqual(
  info.covered.sort(),
  ['bauhaus', 'cassette_futurism', 'constructivism', 'de_stijl', 'nasa_punk', 'swiss_style'],
)
assert.deepEqual(
  info.fallback.sort(),
  ['classic_broadsheet', 'minimal_masthead', 'tabloid_bold'],
)
assert.equal(info.templates, VARIANT_IDS.length)
assert.ok(info.catalogTokens > 0 && info.catalogTokens <= 1200)
assert.match(POSTER_SKILL_VERSION, /^\d+\.\d+\.\d+$/)

/* ---------- 2. 目录 / 白名单与 config 同源 ---------- */

const catalog = buildPosterCatalog()
for (const id of VARIANT_IDS) assert.ok(catalog.includes(id), `目录缺少版式 ${id}`)
for (const id of Object.keys(ART_FONTS)) assert.ok(catalog.includes(id), `目录缺少艺术字 ${id}`)
assert.ok(catalog.includes('不适用'), '目录必须给出一正一反的触发线索')

const whitelist = buildPosterWhitelist()
assert.deepEqual([...whitelist.templates].sort(), [...VARIANT_IDS].sort())
assert.deepEqual([...whitelist.presets].sort(), [...COLOR_PRESET_IDS].sort())
assert.deepEqual([...whitelist.fonts].sort(), [...FONT_PAIRING_IDS].sort())
assert.deepEqual([...whitelist.artFonts].sort(), Object.keys(ART_FONTS).sort())
assert.ok(whitelist.posterBlocks.has('posterNote'))
assert.ok(whitelist.patchFields.has('content.poster_note'))

/* ---------- 3. patch 白名单不能夹带坐标 / SVG / hex ---------- */

for (const field of whitelist.patchFields) {
  assert.doesNotMatch(field, /(^|\.)(x|y|w|h|block_id|svg|path|hex)$/i, `非法 patch 字段：${field}`)
}
assert.equal(whitelist.patchFields.has('layout_overrides'), false)
assert.equal(whitelist.patchFields.has('extra_blocks'), false)

/* ---------- 4. skill 文本包含目录、踩坑与自检 ---------- */

for (const pitfall of POSTER_ASSETS.pitfalls) {
  assert.ok(POSTER_SKILL.includes(pitfall.title), `skill 缺少踩坑点 ${pitfall.title}`)
}
for (const check of POSTER_ASSETS.selfChecks) {
  assert.ok(POSTER_SKILL.includes(check), `skill 缺少自检项 ${check}`)
}
assert.ok(POSTER_SKILL.includes(catalog.split('\n')[2]), 'skill 必须内嵌生成的版式目录')
assert.equal(POSTER_SKILL_BULLETS.length, 8)
for (const [title, desc] of POSTER_SKILL_BULLETS) {
  assert.ok(title && desc, '海报 skill 卡片必须有标题和描述')
}

/* ---------- 5. 只注入海报；标准 / 设计模式边界不同 ---------- */

assert.equal(posterSkillSection({ format: 'newspaper', mode: 'standard' }), '')
assert.equal(posterSkillSection({ format: 'newspaper', mode: 'design' }), '')

const standardPoster = posterSkillSection({ format: 'poster', mode: 'standard' })
const designPoster = posterSkillSection({ format: 'poster', mode: 'design' })
assert.ok(standardPoster.includes('标准模板'))
assert.ok(standardPoster.includes('不要输出 art_font'))
assert.ok(designPoster.includes('设计 / 自由模式'))
assert.ok(designPoster.includes('x + w ≤ 100'))
assert.notEqual(standardPoster, designPoster)

const newspaperPrompt = buildSystemPrompt({ date, format: 'newspaper' })
const posterPrompt = buildSystemPrompt({ date, format: 'poster' })
assert.equal(newspaperPrompt.includes('海报道具'), false, '报纸提示词不能带海报 skill')
assert.ok(posterPrompt.includes('海报道具'))
assert.ok(posterPrompt.includes('踩坑速查'))
assert.ok(posterPrompt.length > newspaperPrompt.length)

const designNewspaperPrompt = buildDesignSystemPrompt({ format: 'newspaper' })
const designPosterPrompt = buildDesignSystemPrompt({ format: 'poster' })
assert.equal(designNewspaperPrompt.includes('海报道具'), false, '设计模式报纸提示词不能带海报 skill')
assert.ok(designPosterPrompt.includes('海报道具'))
assert.ok(designPosterPrompt.includes('art_font 只能填 none'))

/* ---------- 5b. 对话微调只带短护栏，不带整份 skill ---------- */

assert.equal(posterChatGuard({ format: 'newspaper' }), '')
assert.ok(posterChatGuard({ format: 'poster' }).includes('海报微调'))
assert.equal(buildChatSystemPrompt({ format: 'newspaper' }).includes('海报微调'), false)
assert.ok(buildChatSystemPrompt({ format: 'poster' }).includes('海报微调'))
assert.equal(buildDesignChatSystemPrompt({ format: 'newspaper' }).includes('海报微调'), false)
assert.ok(buildDesignChatSystemPrompt({ format: 'poster' }).includes('海报微调'))
assert.equal(
  buildChatSystemPrompt({ format: 'poster' }).includes('踩坑速查'),
  false,
  '对话提示词不应重复整份海报 skill',
)

/* ---------- 6. 输出自检：示例稿零警告，越界稿逐条报 ---------- */

const demoPoster = normalizeSchemes(buildDemoPayload({ date, format: 'poster' }), {
  date,
  format: 'poster',
})
for (const scheme of demoPoster.schemes) {
  assert.deepEqual(auditPosterScheme(scheme), [], `示例海报方案 ${scheme.id} 不应有警告`)
}

const badScheme = {
  id: 'A',
  layout_variant: 'bauhaus',
  content: {
    headline: '一个非常非常长的海报主标题啊',
    subhead: '副标题',
    caption: '',
    poster_note: '',
    art_words: [],
    body_blocks: [{ type: 'paragraph', text: '短' }],
  },
}
const badWarnings = auditPosterScheme(badScheme)
assert.equal(badWarnings.length, 5, `越界海报应报 5 条，实际：${badWarnings.join(' / ')}`)
assert.ok(badWarnings.every((warning) => warning.startsWith('方案 A：')))
assert.ok(badWarnings.some((warning) => warning.includes('3 行')))
assert.ok(badWarnings.some((warning) => warning.includes('图注')))
assert.ok(badWarnings.some((warning) => warning.includes('注记')))
assert.ok(badWarnings.some((warning) => warning.includes('bauhaus')))
assert.ok(badWarnings.some((warning) => warning.includes('正文')))

const cleanScheme = {
  id: 'B',
  layout_variant: 'tabloid_bold',
  content: {
    headline: '短标题',
    subhead: '短副标题',
    caption: '图注',
    poster_note: 'SPECIAL ISSUE · 001',
    art_words: [],
    body_blocks: [
      {
        type: 'paragraph',
        text: '下午三点，巷口的咖啡馆只坐了三桌客人。靠窗的位置上，一杯手冲刚刚注完最后一段水，热气沿着玻璃向上爬。',
      },
    ],
  },
}
assert.deepEqual(
  auditPosterScheme(cleanScheme),
  [],
  '干净的海报方案不该报警；tabloid_bold 没有艺术字字体，也不该因为 art_words 为空报警',
)

console.log(`✓ 海报 skill 通过：${info.templates} 套版式 / ${info.covered.length} 套艺术字 / 目录约 ${info.catalogTokens} token`)
