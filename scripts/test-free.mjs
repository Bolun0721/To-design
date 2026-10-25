import assert from 'node:assert/strict'
import { sanitizeSvg } from '../src/lib/svg.js'
import { pickSymbols } from '../src/config/symbols.js'
import {
  attachFallbackArtworks,
  buildFallbackArtwork,
  normalizeModelArtworks,
} from '../src/agent/artwork.js'

const palette = {
  background: '#FFFFFF',
  text: '#1A1A1A',
  accent: '#C8102E',
  secondary: '#4A4A4A',
  muted: '#9E9E9E',
  tertiary: '#C8102E',
}

const clean = sanitizeSvg(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450"><path d="M20 20 L200 100" stroke="{{accent}}" fill="#ff0000"/></svg>',
  palette,
)
assert.equal(clean.ok, true)
assert.ok(clean.svg.includes('#c8102e'))
assert.equal(clean.svg.includes('#ff0000'), false)
assert.ok(clean.dataUrl.startsWith('data:image/svg+xml'))

for (const bad of [
  '<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>',
  '<svg viewBox="0 0 10 10"><foreignObject></foreignObject></svg>',
  '<svg viewBox="0 0 10 10"><image href="https://x.test/a.png"/></svg>',
  '<svg viewBox="0 0 10 10"><text>hello</text></svg>',
  '<svg viewBox="0 0 10 10"><path d="M0 0" onload="x()"/></svg>',
  '<svg viewBox="0 0 10 10"><path d="M0 0" stroke="url(#x)"/></svg>',
]) {
  assert.equal(sanitizeSvg(bad, palette).ok, false)
}

const symbols = pickSymbols('DeepSeek 日本 偶像')
assert.ok(symbols.includes('whale-tail'))
assert.ok(symbols.includes('sakura') || symbols.includes('glow-stick'))

const scheme = {
  id: 'A',
  layout_variant: 'classic_broadsheet',
  color_preset: 'classic_serious',
  font_pairing: 'serif_serif',
  content: { headline: '偶像与日本', subhead: 'DeepSeek', body_blocks: [] },
}
const fallback = buildFallbackArtwork(scheme, '荧光棒、樱花和鲸鱼尾巴')
assert.ok(fallback)
assert.ok(fallback.dataUrl.startsWith('data:image/svg+xml'))
assert.ok(fallback.source === 'fallback')

const attached = attachFallbackArtworks([scheme], '日本 DeepSeek')
assert.ok(attached[0].artwork?.dataUrl)

const oneInvalid = normalizeModelArtworks(
  {
    artworks: [
      {
        id: 'A',
        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450"><circle cx="100" cy="100" r="40" stroke="{{accent}}"/></svg>',
      },
      { id: 'B', svg: '<svg><script>alert(1)</script></svg>' },
    ],
  },
  [
    scheme,
    { ...scheme, id: 'B' },
    { ...scheme, id: 'C' },
  ],
  '日本 DeepSeek',
)
assert.equal(oneInvalid.schemes[0].artwork.source, 'model')
assert.equal(oneInvalid.schemes[1].artwork.source, 'fallback')
assert.equal(oneInvalid.schemes[2].artwork.source, 'fallback')
assert.equal(oneInvalid.warnings, 2)

console.log('✓ free-mode SVG sanitizer, symbol fallback and per-scheme artwork merge')
