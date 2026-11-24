/**
 * 海报渲染回归：模板 / 配方 / 文本拟合 / 规格校验 / 确定性。
 * 不依赖浏览器：只测纯函数与 SVG 字符串。
 */
import assert from 'node:assert/strict'
import {
  POSTER_ANGLES,
  POSTER_ART_FONTS,
  POSTER_ASSET_VERSION,
  POSTER_TEMPLATES,
  POSTER_TEMPLATE_IDS,
  POSTER_VARIANTS,
  USABLE_POSTER_ART_FONT_IDS,
  getPosterTemplate,
} from '../src/config/posterTemplates.js'
import fs from 'node:fs'
import path from 'node:path'
import {
  POSTER_RECIPES,
  POSTER_RECIPE_IDS,
  resolveRecipeParams,
} from '../src/config/posterPatterns.js'
import { fitText, wrapText } from '../src/lib/poster/text.js'
import { layoutPoster } from '../src/lib/poster/layout.js'
import { renderPosterSvg } from '../src/lib/poster/render.js'
import { normalizePosterScheme, defaultPosterSpec, mergePosterPatch } from '../src/agent/posterSpec.js'
import { buildPosterSystemPrompt, buildPosterUserPrompt } from '../src/agent/posterPrompt.js'
import { applyChatPatch } from '../src/agent/chat.js'

const date = '2026年11月24日'
const content = {
  headline: '巷口那杯手冲',
  subhead: '一个普通的周日下午，被十分钟的等待重新计时',
  caption: '靠窗的座位上，一杯手冲与一本翻旧的书',
  poster_note: '周日 · 下午三点 · 巷口',
  art_words: [{ text: 'SLOW MORNING', placement: 'headline' }],
  body_blocks: [
    {
      type: 'paragraph',
      text: '下午三点，巷口的咖啡馆只坐了三桌客人。靠窗的位置上，一杯手冲刚刚注完最后一段水，热气沿着玻璃向上爬。',
    },
  ],
  date,
}

function payloadFor(template, variant) {
  return {
    name: '测试海报',
    poster_template: template,
    poster_variant: variant,
    content,
    poster: {
      art: { recipe: getPosterTemplate(template).recipe, params: {}, seed: 42, shapes: [] },
      textures: { paper: 'aged', grain: 0.06 },
    },
    design_rationale: '测试用',
  }
}

/* ---------- 1. 模板与艺术字覆盖 ---------- */

assert.deepEqual([...POSTER_TEMPLATE_IDS].sort(), Object.keys(POSTER_TEMPLATES).sort())
for (const tpl of Object.values(POSTER_TEMPLATES)) {
  assert.ok(tpl.when && tpl.notWhen, `${tpl.id} 缺少适用/不适用`)
  assert.ok(POSTER_VARIANTS.every((variant) => tpl.variants[variant]), `${tpl.id} 缺少变体`)
  if (tpl.artFont) {
    assert.ok(USABLE_POSTER_ART_FONT_IDS.includes(tpl.artFont), `${tpl.id} 艺术字超出体积上限`)
  }
}
assert.equal(USABLE_POSTER_ART_FONT_IDS.includes('constructivism'), true, '子集化后构成主义应可用')
assert.ok(POSTER_ART_FONTS.constructivism.bytes <= 64 * 1024, '构成主义子集应小于 64KB')
for (const [id, font] of Object.entries(POSTER_ART_FONTS)) {
  assert.ok(font.file.includes('/subset/'), `${id} 应指向子集字体`)
  assert.ok(font.bytes <= 400 * 1024, `${id} 超过 400KB 上限`)
  const file = path.join(process.cwd(), 'public', font.file.replace(/^\//, ''))
  assert.ok(fs.existsSync(file), `${id} 子集字体文件不存在：${font.file}`)
  assert.equal(fs.statSync(file).size, font.bytes, `${id} 字节数与实际文件不一致`)
}

/* ---------- 2. 配方参数夹紧与确定性 ---------- */

const recipe = POSTER_RECIPES.find((item) => item.id === 'halftone_stars')
const clamped = resolveRecipeParams('halftone_stars', { density: 999, size: -1 })
assert.equal(clamped.density, 5)
assert.equal(clamped.size, 0.6)
const seeded = (seed) => recipe.render({ seed, params: resolveRecipeParams(recipe.id), palette: {}, box: { x: 0, y: 0, w: 100, h: 100 } })
assert.equal(seeded(42), seeded(42), '同 seed 必须逐字节一致')
assert.notEqual(seeded(42), seeded(43), '不同 seed 必须不同')
for (const id of POSTER_RECIPE_IDS) {
  const item = POSTER_RECIPES.find((entry) => entry.id === id)
  const params = resolveRecipeParams(id)
  const box = { x: 10, y: 20, w: 300, h: 200 }
  const a = item.render({ seed: 7, params, palette: { ink: '#111', accent: '#c00', secondary: '#333', muted: '#999', paper: '#fff' }, box })
  const b = item.render({ seed: 7, params, palette: { ink: '#111', accent: '#c00', secondary: '#333', muted: '#999', paper: '#fff' }, box })
  assert.equal(a, b, `${id} 渲染不确定`)
  assert.ok(a.length > 20, `${id} 没有输出内容`)
}

/* ---------- 3. 文本拟合 ---------- */

const longHeadline = '一二三四五六七八九十一二三四五'
const fitted = fitText(longHeadline, { maxWidth: 672, maxLines: 2, size: 72, tracking: -0.6 })
assert.ok(fitted.lines.length <= 2, '标题最多 2 行')
assert.ok(fitted.size <= 72 && fitted.size >= 72 * 0.68, '标题字号只允许在允许区间内降档')
for (const line of fitted.lines) {
  const width = wrapText(line, { maxWidth: 672, size: fitted.size, tracking: -0.6 })
  assert.equal(width.lines.length, 1, '拟合后的每一行都必须是单行')
}
const oneLine = fitText('周日，晴', { maxWidth: 672, maxLines: 1, size: 72 })
assert.equal(oneLine.lines.length, 1)
assert.equal(oneLine.truncated, false)

/* ---------- 4. 规格校验 ---------- */

const unknown = normalizePosterScheme(
  {
    poster_template: 'not_a_template',
    poster_variant: 'loud',
    color_preset: 'not_a_preset',
    font_pairing: 'grotesk',
    content,
    poster: { art: { recipe: 'not_a_recipe', params: { density: 999 }, seed: -5, shapes: new Array(12).fill({ kind: 'circle', x: 2, y: -1 }) } },
  },
  { angle: 'A', date },
)
assert.equal(unknown.scheme.poster.template, POSTER_TEMPLATE_IDS[0])
assert.equal(unknown.scheme.poster.art.seed, 0)
assert.equal(POSTER_RECIPE_IDS.includes(unknown.scheme.poster.art.recipe), true)
assert.ok(Object.keys(unknown.scheme.poster.art.params).length >= 1)
assert.ok(unknown.scheme.poster.art.shapes.length <= 8)
assert.ok(unknown.warnings.length >= 3)

const forbidden = normalizePosterScheme(
  {
    poster_template: 'poster_ark_file',
    content: { ...content, svg: '<svg/>' },
    poster: { art: { recipe: 'halftone_stars', params: {}, seed: 1, shapes: [] } },
    design_rationale: 'x',
  },
  { angle: 'A', date },
)
assert.ok(forbidden.warnings.some((warning) => warning.includes('不允许的字段')))

/* ---------- 5. 渲染：三套模板 × 两个变体，确定性、可重复 ---------- */

for (const templateId of POSTER_TEMPLATE_IDS) {
  for (const variant of POSTER_VARIANTS) {
    const { scheme } = normalizePosterScheme(payloadFor(templateId, variant), { angle: 'A', date })
    const a = renderPosterSvg(scheme)
    const b = renderPosterSvg(scheme)
    assert.equal(a.svg, b.svg, `${templateId}/${variant} 渲染不确定`)
    assert.match(a.svg, /<svg[^>]*viewBox="0 0 800 1000"/)
    assert.match(a.svg, /<text/)
    assert.doesNotMatch(a.svg, /NaN|undefined/)
    assert.doesNotMatch(a.svg, /<script|foreignObject|href="https?:/)
    assert.doesNotMatch(a.svg, /data:image/)
    assert.equal(a.meta.template, templateId)
    assert.equal(a.meta.variant, variant)
    assert.equal(a.meta.assetsVersion, POSTER_ASSET_VERSION)
    assert.match(a.svg, new RegExp(`data-assets="${POSTER_ASSET_VERSION}"`))
    assert.ok(a.meta.blocks.length >= 6, `${templateId}/${variant} 文字块过少`)
    assert.ok(
      a.meta.blocks.some((block) => block.id === 'info1'),
      `${templateId}/${variant} 缺少底部信息条`,
    )
    for (const block of a.meta.blocks) {
      const limit = block.id === 'headline' ? 2 : 4
      assert.ok(block.lines <= limit, `${block.id} 行数异常：${block.lines}`)
    }
    const layout = layoutPoster(scheme)
    for (const block of layout.blocks) {
      assert.ok(block.size > 0)
      assert.ok(block.w > 0)
      assert.ok(block.h > 0)
    }
  }
}

/* ---------- 6. 照片：内嵌 <image>，不输出图案层 ---------- */

const photo = { dataUrl: 'data:image/jpeg;base64,AAAA' }
const { scheme: withPhoto } = normalizePosterScheme(payloadFor('poster_ark_file', 'loud'), {
  angle: 'A',
  date,
})
const photoRender = renderPosterSvg(withPhoto, { photo })
assert.match(photoRender.svg, /<image href="data:image\/jpeg;base64,AAAA"/)
assert.equal(photoRender.meta.hasPhoto, true)

/* ---------- 6b. 双图：子图内嵌，所有模板都必须有合法位置 ---------- */

{
  const photo2 = { dataUrl: 'data:image/jpeg;base64,BBBB' }
  for (const templateId of POSTER_TEMPLATE_IDS) {
    for (const variant of POSTER_VARIANTS) {
      const { scheme } = normalizePosterScheme(payloadFor(templateId, variant), { angle: 'A', date })
      const dual = renderPosterSvg(scheme, { photo, photo2 })
      assert.equal(dual.meta.hasPhoto2, true)
      assert.match(dual.svg, /data-secondary="1"/)
      assert.equal((dual.svg.match(/<image /g) || []).length, 2)
      assert.doesNotMatch(dual.svg, /NaN|undefined/)
    }
  }
  const single = renderPosterSvg(withPhoto, { photo })
  assert.equal((single.svg.match(/<image /g) || []).length, 1)
  assert.equal(single.meta.hasPhoto2, false)
}

/* ---------- 7. 旧稿补默认规格 ---------- */

const legacy = { id: 'B', content, layout_variant: 'tabloid_bold', color_preset: 'financial_daily', font_pairing: 'serif_sans', style: {} }
const spec = defaultPosterSpec(legacy, { angle: 'B' })
assert.ok(POSTER_TEMPLATE_IDS.includes(spec.template))
assert.ok(POSTER_RECIPE_IDS.includes(spec.art.recipe))
assert.equal(spec.variant, 'quiet')

/* ---------- 8. 提示词：模板 / 配方 / 输出约束 ---------- */

const system = buildPosterSystemPrompt()
assert.ok(system.length < 12000, `海报系统提示过长：${system.length}`)
for (const templateId of POSTER_TEMPLATE_IDS) {
  assert.ok(system.includes(templateId), `提示词缺少模板 ${templateId}`)
}
for (const recipeId of POSTER_RECIPE_IDS) {
  assert.ok(system.includes(recipeId), `提示词缺少配方 ${recipeId}`)
}
assert.ok(system.includes('不要输出 SVG') || system.includes('不输出 SVG') || system.includes('不要 Markdown、注释、SVG'))
assert.ok(system.includes('poster_template'))
assert.ok(system.includes('seed'))

const userA = buildPosterUserPrompt({ angle: 'A', description: '巷口的咖啡馆', date })
assert.ok(userA.includes('poster_ark_file'))
assert.ok(userA.includes('poster_endfield_signal'))
assert.equal(userA.includes('poster_ark_hazard'), false, '角度 A 不应暴露全部模板')
assert.ok(userA.includes('巷口的咖啡馆'))

/* ---------- 角度互斥且覆盖全部模板 ---------- */

const angleSets = POSTER_ANGLES.map((angle) => angle.templates)
for (let i = 0; i < angleSets.length; i += 1) {
  for (let j = i + 1; j < angleSets.length; j += 1) {
    const overlap = angleSets[i].filter((id) => angleSets[j].includes(id))
    assert.equal(overlap.length, 0, `角度 ${POSTER_ANGLES[i].id}/${POSTER_ANGLES[j].id} 模板重叠：${overlap}`)
  }
}
const coveredByAngles = new Set(angleSets.flat())
assert.deepEqual(
  [...coveredByAngles].sort(),
  [...POSTER_TEMPLATE_IDS].sort(),
  '三路角度必须覆盖全部海报模板',
)

/* ---------- 9. 渲染规格带报纸布局，便于格式切换 ---------- */

assert.ok(photoRender.svg.includes('viewBox="0 0 800 1000"'))
assert.ok(withPhoto.layouts?.newspaper?.length > 3, '海报方案应保留报纸布局供切换')
assert.ok(withPhoto.layouts?.poster?.length > 3)

/* ---------- 8b. 海报主色覆盖：和报纸一样可自定义 accent ---------- */

{
  const custom = {
    ...withPhoto,
    style: { ...(withPhoto.style || {}), accent_color: '#123456' },
  }
  const customLayout = layoutPoster(custom)
  assert.equal(customLayout.palette.accent, '#123456')
  const customSvg = renderPosterSvg(custom).svg
  assert.match(customSvg, /#123456/i)
}

/* ---------- 9. 检查器 patch：参数 / 纹理不能覆盖 art.recipe ---------- */

{
  const basePoster = withPhoto.poster
  const originalRecipe = basePoster.art.recipe
  const originalSeed = basePoster.art.seed
  const paramsOnly = mergePosterPatch(basePoster, { art: { params: { angle: 24 } } })
  assert.equal(paramsOnly.art.recipe, originalRecipe, '参数滑块不能清掉图案配方')
  assert.equal(paramsOnly.art.seed, originalSeed, '参数滑块不能清掉 seed')
  assert.equal(paramsOnly.art.params.angle, 24)

  const textureOnly = mergePosterPatch(basePoster, { textures: { grain: 0.2 } })
  assert.equal(textureOnly.art.recipe, originalRecipe, '纸纹滑块不能清掉图案配方')
  assert.equal(textureOnly.textures.grain, 0.2)

  const recipePatch = mergePosterPatch(basePoster, { art: { recipe: 'diagonal_split', params: {} } })
  assert.equal(recipePatch.art.recipe, 'diagonal_split')
  assert.equal(recipePatch.art.seed, originalSeed)

  const noPhoto = { ...withPhoto, poster: paramsOnly }
  const noPhotoSvg = renderPosterSvg(noPhoto).svg
  assert.match(noPhotoSvg, new RegExp(`data-recipe="${originalRecipe}"`))
  assert.doesNotMatch(noPhotoSvg, /<image /)
}

/* ---------- 9. 对话 patch：换模板 / 配方 / seed，忽略坐标 ---------- */

{
  const { scheme: base } = normalizePosterScheme(payloadFor('poster_ark_file', 'quiet'), {
    angle: 'A',
    date,
  })
  const { scheme: patched, changed } = applyChatPatch(
    base,
    'poster',
    {
      poster: {
        template: 'poster_endfield_signal',
        variant: 'loud',
        art: { recipe: 'contour', params: { lines: 6 }, seed: 123 },
      },
      content: { headline: '对话改过的标题' },
      layout_moves: [{ block_id: 'headline', dx: 9, dy: 9 }],
    },
    { mode: 'design' },
  )
  assert.equal(changed, true)
  assert.equal(patched.poster.template, 'poster_endfield_signal')
  assert.equal(patched.poster.variant, 'loud')
  assert.equal(patched.poster.art.recipe, 'contour')
  assert.equal(patched.poster.art.params.lines, 6)
  assert.equal(patched.poster.art.seed, 123)
  assert.equal(patched.content.headline, '对话改过的标题')
  const before = base.layouts.poster.find((block) => block.id === 'headline')
  const after = patched.layouts.poster.find((block) => block.id === 'headline')
  assert.equal(after.x, before.x, '海报对话 patch 不应移动版块')
  const rendered = renderPosterSvg(patched)
  assert.match(rendered.svg, /data-template="poster_endfield_signal"/)
  assert.match(rendered.svg, /data-recipe="contour"/)

  const invalid = applyChatPatch(base, 'poster', { poster: { template: 'nope', art: { seed: 99999 } } }, { mode: 'design' })
  assert.equal(invalid.scheme.poster.template, base.poster.template)
  assert.equal(invalid.scheme.poster.art.seed, 9999)
}

console.log(
  `✓ 海报渲染通过：${POSTER_TEMPLATE_IDS.length} 套模板 × ${POSTER_VARIANTS.length} 变体 / ${POSTER_RECIPE_IDS.length} 个配方 / 文本拟合 + 规格校验`,
)
