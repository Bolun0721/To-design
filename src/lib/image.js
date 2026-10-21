import { hexHue } from '../config/presets.js'

/** 读取用户照片并压缩到适合排版 / 导出的尺寸 */
export const DEMO_PHOTO = {
  dataUrl: '/demo/coffee.jpg',
  width: 1400,
  height: 1050,
  name: 'demo-coffee.jpg',
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解码失败'))
    img.src = src
  })
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

export async function readPhoto(file) {
  if (!file) throw new Error('没有选择文件')
  if (!file.type.startsWith('image/')) throw new Error('请上传 JPG / PNG / WebP 图片')
  if (file.size > 15 * 1024 * 1024) throw new Error('图片超过 15MB，请先压缩')

  const dataUrl = await readAsDataUrl(file)
  const img = await loadImage(dataUrl)
  const maxSide = 1800
  const ratio = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))

  let out = dataUrl
  if (ratio < 1 || file.size > 1.6 * 1024 * 1024) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * ratio)
    canvas.height = Math.round(img.naturalHeight * ratio)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    out = canvas.toDataURL('image/jpeg', 0.9)
  }

  return {
    dataUrl: out,
    width: img.naturalWidth,
    height: img.naturalHeight,
    name: file.name,
  }
}

/**
 * 把图片处理（黑白半调 / 双色调）烘焙进像素，供导出使用。
 * 预览用 CSS filter，html2canvas 不渲染 filter，所以导出前换成烘焙图。
 */
export async function renderTreatedPhoto(photo, treatment, accent, displayWidth = 0) {
  if (!photo?.dataUrl || treatment === 'original') return photo?.dataUrl || null

  const img = await loadImage(photo.dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')

  if (treatment === 'duotone') {
    const hue = Math.round(hexHue(accent) - 38)
    ctx.filter = `grayscale(1) sepia(1) saturate(0.82) hue-rotate(${hue}deg) contrast(1.02) brightness(0.92)`
  } else {
    ctx.filter = 'grayscale(1) contrast(1.22) brightness(0.98)'
  }
  ctx.drawImage(img, 0, 0)
  ctx.filter = 'none'

  if (treatment === 'halftone_mono') {
    // 模拟 CSS 里 3px 的印刷网点，按图片实际显示尺寸换算
    const ratio = displayWidth > 0 ? img.naturalWidth / displayWidth : 2
    const step = Math.max(2, 3 * ratio)
    const radius = Math.max(0.5, 0.72 * ratio)
    ctx.globalAlpha = 0.26
    ctx.fillStyle = '#000'
    for (let y = step / 2; y < canvas.height; y += step) {
      for (let x = step / 2; x < canvas.width; x += step) {
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}
