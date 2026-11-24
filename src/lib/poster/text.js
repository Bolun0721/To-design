/**
 * 海报文本拟合：中文按 1em、拉丁按字宽近似估宽，
 * 先换行，超行再降字号，最后才截断并加省略号。
 *
 * 不依赖 canvas measureText（跨平台不可复现），用字宽表 + 6% 余量，
 * 保证同一 spec 在任何机器上得到同样的行数与字号。
 */

const CJK_RE = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef\u3000-\u303f]/
const CLOSING_PUNCT = new Set([
  '，', '。', '、', '；', '：', '？', '！', '）', '》', '」', '』', '】', '〕', '…',
  ',', '.', ';', ':', '?', '!', ')', ']', '}', '”', '’',
])
const OPENING_PUNCT = new Set(['（', '《', '「', '『', '【', '〔', '(', '[', '{', '“', '‘'])

function isCjk(ch) {
  return CJK_RE.test(ch)
}

function isSpace(ch) {
  return ch === ' ' || ch === '\t' || ch === '\u00a0'
}

function charWidth(ch) {
  if (isSpace(ch)) return 0.28
  if (isCjk(ch)) return 1
  if (/[A-Z]/.test(ch)) return 0.64
  if (/[a-z]/.test(ch)) return 0.54
  if (/[0-9]/.test(ch)) return 0.56
  if (/[.,;:!?'"()[\]{}\-–—/%&]/.test(ch)) return 0.34
  return 0.58
}

/** 返回 { tokens: [{ text, width, space }] }，拉丁单词整体成 token。 */
export function tokenize(text, size, tracking = 0) {
  const chars = Array.from(String(text ?? ''))
  const tokens = []
  let buffer = ''
  const flush = () => {
    if (!buffer) return
    const width = Array.from(buffer).reduce((sum, ch) => sum + charWidth(ch) * size, 0)
    tokens.push({ text: buffer, width, space: false })
    buffer = ''
  }
  for (const ch of chars) {
    if (isSpace(ch)) {
      flush()
      tokens.push({ text: ' ', width: charWidth(' ') * size, space: true })
      continue
    }
    if (isCjk(ch) || ch === '\n') {
      flush()
      if (ch === '\n') {
        tokens.push({ text: '\n', width: 0, space: false, newline: true })
      } else {
        tokens.push({ text: ch, width: charWidth(ch) * size, space: false })
      }
      continue
    }
    buffer += ch
  }
  flush()
  // 拉丁 token 内部若含标点，粗估宽度即可；tracking 统一按字符数补
  for (const token of tokens) {
    if (token.newline) continue
    const n = Array.from(token.text).length
    token.width += tracking * Math.max(0, n - 1)
  }
  return tokens
}

function lineWidth(line, size, tracking) {
  const n = Array.from(line).length
  return (
    Array.from(line).reduce((sum, ch) => sum + charWidth(ch) * size, 0) + tracking * Math.max(0, n - 1)
  )
}

/**
 * 贪心换行：超宽换行；行首禁止标点（把标点回挂到上一行）。
 * 返回 { lines, overflow }。
 */
export function wrapText(text, { maxWidth, size, tracking = 0 }) {
  const tokens = tokenize(text, size, tracking)
  const lines = []
  let current = []
  let currentWidth = 0
  let overflow = false

  const pushLine = () => {
    const joined = current.map((t) => t.text).join('')
    if (joined.trim()) lines.push(joined.replace(/\s+$/, ''))
    current = []
    currentWidth = 0
  }

  for (const token of tokens) {
    if (token.newline) {
      pushLine()
      continue
    }
    if (token.space && current.length === 0) continue
    const nextWidth = currentWidth + token.width
    if (nextWidth > maxWidth && current.length > 0) {
      // 行首标点：允许略微超出，挂在上一行
      if (CLOSING_PUNCT.has(token.text) && nextWidth - maxWidth < size * 0.5) {
        current.push(token)
        currentWidth = nextWidth
        pushLine()
        continue
      }
      pushLine()
      if (token.space) continue
      if (token.width > maxWidth) {
        // 超长英文单词：按字符拆
        const chars = Array.from(token.text)
        for (const ch of chars) {
          const w = charWidth(ch) * size + tracking
          if (currentWidth + w > maxWidth && current.length) pushLine()
          current.push({ text: ch, width: w, space: false })
          currentWidth += w
        }
        continue
      }
      current.push(token)
      currentWidth = token.width
      continue
    }
    if (token.space && current.length === 0) continue
    if (OPENING_PUNCT.has(token.text) && current.length && currentWidth + token.width > maxWidth) {
      pushLine()
    }
    current.push(token)
    currentWidth = nextWidth
  }
  pushLine()

  // 单行超宽（例如整段无空格的中文被拉满仍超出）时标记，交由调用方降字号
  for (const line of lines) {
    if (lineWidth(line, size, tracking) > maxWidth * 1.02) overflow = true
  }
  return { lines, overflow }
}

function truncateLine(line, maxWidth, size, tracking) {
  const chars = Array.from(line)
  let out = ''
  for (const ch of chars) {
    const next = out + ch
    if (lineWidth(next, size, tracking) + lineWidth('…', size, tracking) > maxWidth) break
    out = next
  }
  return `${out}…`
}

/**
 * 拟合一个文字块：返回 { size, lines, truncated }。
 * - 先按目标字号换行；
 * - 行数超限或单行溢出 → 逐档降字号（最低 minSize）；
 * - 仍超 → 截断最后一行加省略号。
 */
export function fitText(
  text,
  { maxWidth, maxLines = 1, size, tracking = 0, minSize = 0, minScale = 0.72 } = {},
) {
  const floor = minSize || size * minScale
  let currentSize = size
  let result = wrapText(text, { maxWidth, size: currentSize, tracking })
  while ((result.lines.length > maxLines || result.overflow) && currentSize > floor) {
    currentSize = Math.max(floor, currentSize * 0.94)
    result = wrapText(text, { maxWidth, size: currentSize, tracking })
  }
  if (result.lines.length > maxLines) {
    const lines = result.lines.slice(0, maxLines)
    lines[maxLines - 1] = truncateLine(lines[maxLines - 1] || '', maxWidth, currentSize, tracking)
    return { size: currentSize, lines, truncated: true }
  }
  if (result.overflow) {
    const lines = result.lines.map((line) => truncateLine(line, maxWidth, currentSize, tracking))
    return { size: currentSize, lines, truncated: true }
  }
  return { size: currentSize, lines: result.lines, truncated: false }
}

export function lineHeightPx(size, lineHeight = 1.2) {
  return size * lineHeight
}

/** 文本块的纵向占用（用于调试与碰撞检查）。 */
export function blockHeight(size, lineHeight, lineCount) {
  return lineHeightPx(size, lineHeight) * lineCount
}
