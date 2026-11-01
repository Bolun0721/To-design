/** 艺术英文字体：只用于英文装饰标题，不用于中文正文。 */
export const ART_FONTS = {
  constructivism: {
    id: 'constructivism',
    label: '构成主义',
    family: 'FPL Constructivism',
    variant: 'constructivism',
    file: '/fonts/fpl-constructivism.ttf',
    note: '粗重、几何、宣传画感',
  },
  bauhaus: {
    id: 'bauhaus',
    label: '包豪斯',
    family: 'FPL Bauhaus',
    variant: 'bauhaus',
    file: '/fonts/fpl-bauhaus.otf',
    note: '几何无衬线、秩序感',
  },
  nasa_punk: {
    id: 'nasa_punk',
    label: 'NASA 朋克',
    family: 'FPL Nasa',
    variant: 'nasa_punk',
    file: '/fonts/fpl-nasa.otf',
    note: '复古未来、技术标签',
  },
  de_stijl: {
    id: 'de_stijl',
    label: '风格派',
    family: 'FPL Stencil',
    variant: 'de_stijl',
    file: '/fonts/fpl-stencil.ttf',
    note: '模板字、硬边几何',
  },
  swiss_style: {
    id: 'swiss_style',
    label: '瑞士风格',
    family: 'FPL Swiss',
    variant: 'swiss_style',
    file: '/fonts/fpl-swiss.ttf',
    note: '中性、精确、国际主义',
  },
  cassette_futurism: {
    id: 'cassette_futurism',
    label: '卡带未来',
    family: 'FPL Cassette',
    variant: 'cassette_futurism',
    file: '/fonts/fpl-cassette.ttf',
    note: '像素 / 磁带 / CRT 感',
  },
}

export const ART_FONT_IDS = Object.keys(ART_FONTS)

export const ART_FONT_BY_VARIANT = Object.fromEntries(
  Object.values(ART_FONTS).map((font) => [font.variant, font.id]),
)

export function getArtFont(id) {
  return ART_FONTS[id] || null
}

export function artFontForVariant(variant) {
  return ART_FONT_BY_VARIANT[variant] || ''
}

export const ART_FONT_TABLE_TEXT = Object.values(ART_FONTS)
  .map((font) => `- ${font.id}｜${font.label}｜${font.note}`)
  .join('\n')
