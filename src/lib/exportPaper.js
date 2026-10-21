/** 确定性导出：PNG（html2canvas）与打印 / PDF（同一张高清 PNG） */

export async function renderPaperPng(paperEl, { scale = 2, background = '#FFFFFF' } = {}) {
  if (!paperEl) throw new Error('画布还没准备好')
  if (!window.html2canvas) throw new Error('导出组件未加载，请刷新页面重试')

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* ignore */
    }
  }

  // 画布在界面上是缩放的；导出前临时取消父层 transform，保证按 794×1123 原始尺寸渲染
  const zoom = paperEl.parentElement
  const previousTransform = zoom ? zoom.style.transform : ''
  if (zoom) zoom.style.transform = 'none'
  if (paperEl) void paperEl.offsetWidth

  try {
    const canvas = await window.html2canvas(paperEl, {
      scale,
      backgroundColor: background,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: paperEl.offsetWidth,
      height: paperEl.offsetHeight,
    })
    return canvas
  } finally {
    if (zoom) zoom.style.transform = previousTransform
  }
}

export function downloadCanvas(canvas, filename) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('生成图片失败'))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      resolve()
    }, 'image/png')
  })
}

export function printCanvas(canvas, { widthMm, heightMm, title = '头版智造局' }) {
  const dataUrl = canvas.toDataURL('image/png')
  const win = window.open('', '_blank', 'width=900,height=1200')
  if (!win) throw new Error('浏览器拦截了打印窗口，请允许弹窗后重试')

  win.document.write(`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  img { display: block; width: ${widthMm}mm; height: ${heightMm}mm; object-fit: contain; }
</style>
</head>
<body><img src="${dataUrl}" alt="${title}" /></body>
</html>`)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
  }, 450)
}
