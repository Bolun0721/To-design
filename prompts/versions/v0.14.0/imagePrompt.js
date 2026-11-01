/** 生图风格：原图 + 9 套已有模板视觉方向。 */
import { VARIANTS } from './presets.js'

const STYLE_PROMPTS = {
  classic_broadsheet:
    '黑白纪实编辑摄影，新闻纸颗粒，高对比度，克制的布光，适合报纸头版的经典纪实感',
  tabloid_bold:
    '小报封面摄影，硬闪光，高饱和，强戏剧性，主体突出，画面有冲击力',
  minimal_masthead:
    '极简编辑摄影，柔和自然光，干净背景，大留白，低饱和，安静克制',
  constructivism:
    '构成主义海报视觉，红黑米白，斜切构图，几何色块，强对比，平面化',
  bauhaus:
    '包豪斯视觉，三原色，圆形与矩形几何，工作室光，秩序化构成',
  nasa_punk:
    'NASA 朋克，复古未来主义，技术面板，青橙配色，轻微颗粒，硬件质感',
  de_stijl:
    '风格派，黑色网格，三原色平面，抽象几何构成，平涂',
  swiss_style:
    '瑞士国际主义编辑风格，中性色，精确构图，模块网格，干净排版感',
  cassette_futurism:
    '卡带未来主义，CRT 扫描线，荧光绿与琥珀色，暗色硬件，复古屏幕质感',
}

export const IMAGE_STYLES = [
  {
    id: 'original',
    label: '原图',
    en: 'ORIGINAL',
    description: '不调用生图模型，直接使用参考图',
    prompt: null,
  },
  ...Object.values(VARIANTS).map((variant) => ({
    id: variant.id,
    label: variant.name,
    en: variant.en,
    description: variant.tagline,
    prompt: STYLE_PROMPTS[variant.id] || variant.tagline,
  })),
]

export const IMAGE_STYLE_IDS = IMAGE_STYLES.map((style) => style.id)

export function getImageStyle(id) {
  return IMAGE_STYLES.find((style) => style.id === id) || IMAGE_STYLES[0]
}

export function buildImagePrompt({ description = '', styleId = 'original', hasReference = false } = {}) {
  const style = getImageStyle(styleId)
  if (!style.prompt) throw new Error('「原图」不调用生图模型')

  const subject = String(description || '').trim()
  const lines = [
    subject
      ? `以这段描述为画面主体：${subject}`
      : hasReference
        ? '以参考图为主体，保持主体身份、构图和关键物件。'
        : '生成一张适合报纸或海报头版的编辑图片。',
    `视觉风格：${style.prompt}。`,
    hasReference
      ? '保持参考图的主体、人物身份、构图和关键物件，只改变色彩、光线、材质和视觉风格；不要替换主体。'
      : '画面主体清晰，构图完整，适合作为报纸/海报主图。',
    '不要生成文字、字母、数字、logo、水印、二维码；不要生成拼贴或多格漫画。',
  ]
  return lines.join('\n')
}

export function getImageStyleLabel(id) {
  return getImageStyle(id).label
}
