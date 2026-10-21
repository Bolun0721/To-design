export function chineseDate(d = new Date()) {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${y}年${m}月${day}日`
}

export function weekdayCN(d = new Date()) {
  return ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getDay()]
}

export function shortDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function charLen(str) {
  return Array.from(String(str ?? '')).length
}

export function clampText(str, max) {
  const chars = Array.from(String(str ?? ''))
  return chars.length > max ? chars.slice(0, max).join('') : chars.join('')
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export function round(n, digits = 1) {
  const p = 10 ** digits
  return Math.round(n * p) / p
}
