import assert from 'node:assert/strict'
import { IMAGE_STYLES, buildImagePrompt } from '../src/config/imageStyles.js'
import { defaultSettings, IMAGE_PROVIDERS } from '../src/agent/llm.js'
import { normalizeImageBase, resolveImageSize, requestImage } from '../src/agent/image.js'

assert.equal(IMAGE_STYLES.length, 10, '应为原图 + 9 种风格')
assert.equal(IMAGE_STYLES[0].id, 'original')
assert.equal(new Set(IMAGE_STYLES.map((s) => s.id)).size, 10)
assert.equal(IMAGE_STYLES.filter((s) => s.prompt).length, 9)
assert.ok(IMAGE_STYLES.every((s) => s.label))

assert.throws(() => buildImagePrompt({ styleId: 'original' }), /原图/)
const styled = buildImagePrompt({
  description: '咖啡馆靠窗',
  styleId: 'bauhaus',
  hasReference: true,
})
assert.ok(styled.includes('包豪斯'))
assert.ok(styled.includes('参考图'))
assert.ok(styled.includes('不要生成文字'))
assert.ok(styled.includes('logo'))

const settings = defaultSettings()
assert.ok(settings.image)
assert.ok(settings.image.provider)
assert.ok(IMAGE_PROVIDERS.some((p) => p.id === settings.image.provider))
assert.equal(resolveImageSize({ provider: 'ark', size: 'auto' }, 'newspaper'), '2K')
assert.equal(resolveImageSize({ provider: 'openai', size: 'auto' }, 'poster'), '1024x1536')
assert.equal(
  normalizeImageBase('https://ark.cn-beijing.volces.com/api/v3/images/generations'),
  'https://ark.cn-beijing.volces.com/api/v3',
)

await assert.rejects(
  requestImage({
    imageApiKey: '',
    settings: settings.image,
    prompt: 'test',
    size: '1024x1024',
  }),
  /生图 Key/,
)

console.log('✓ image styles / prompt / size / independent-key guard')
