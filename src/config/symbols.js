/**
 * 简单线条象征图案库。
 * 只用于自由模式的兜底和模型提示词参考：全部无填充、可替换颜色 token。
 */
export const SYMBOLS = {
  'glow-stick': {
    label: '荧光棒',
    keywords: ['偶像', '荧光棒', '应援', '演唱会', 'idol', 'fan'],
    svg: `
      <line x1="100" y1="55" x2="100" y2="155" stroke="{{accent}}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="100" cy="48" r="22" stroke="{{accent}}" stroke-width="4"/>
      <path d="M58 96 C46 76 58 50 82 42 M142 96 C154 76 142 50 118 42" stroke="{{muted}}" stroke-width="3"/>
      <path d="M60 148 H140" stroke="{{muted}}" stroke-width="2" stroke-dasharray="3 7"/>
    `,
  },
  sakura: {
    label: '樱花',
    keywords: ['日本', '樱花', '东京', '春天', 'japan', 'sakura', 'spring'],
    svg: `
      <g transform="translate(100 90)">
        <ellipse cx="0" cy="-28" rx="15" ry="24" stroke="{{accent}}" stroke-width="3"/>
        <ellipse cx="27" cy="-9" rx="15" ry="24" transform="rotate(72)" stroke="{{accent}}" stroke-width="3"/>
        <ellipse cx="17" cy="23" rx="15" ry="24" transform="rotate(144)" stroke="{{accent}}" stroke-width="3"/>
        <ellipse cx="-17" cy="23" rx="15" ry="24" transform="rotate(216)" stroke="{{accent}}" stroke-width="3"/>
        <ellipse cx="-27" cy="-9" rx="15" ry="24" transform="rotate(288)" stroke="{{accent}}" stroke-width="3"/>
        <circle cx="0" cy="0" r="7" stroke="{{ink}}" stroke-width="2"/>
      </g>
      <path d="M100 118 C84 142 70 150 42 166 M100 118 C118 138 136 154 162 164" stroke="{{muted}}" stroke-width="3"/>
    `,
  },
  'whale-tail': {
    label: '鲸鱼尾巴',
    keywords: ['deepseek', '鲸鱼', '鲸尾', '深海', 'whale', 'ocean', 'sea'],
    svg: `
      <path d="M100 145 C98 112 88 82 76 52 C96 62 110 78 116 98 C122 74 136 54 154 40 C146 74 134 104 120 126 C112 140 108 150 100 156 C92 150 88 140 80 126 C66 104 54 74 46 40 C64 54 78 74 84 98 C90 78 104 62 124 52 C112 82 102 112 100 145 Z" stroke="{{accent}}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M35 172 C60 162 78 178 100 168 C122 158 142 176 165 166" stroke="{{muted}}" stroke-width="2"/>
    `,
  },
  chip: {
    label: '芯片 / 神经元',
    keywords: ['ai', '人工智能', '芯片', '算法', '模型', '科技', 'neural', 'chip'],
    svg: `
      <rect x="62" y="62" width="76" height="76" rx="8" stroke="{{accent}}" stroke-width="4"/>
      <rect x="82" y="82" width="36" height="36" rx="4" stroke="{{ink}}" stroke-width="2"/>
      <g stroke="{{muted}}" stroke-width="3">
        <line x1="62" y1="82" x2="40" y2="82"/><line x1="62" y1="100" x2="40" y2="100"/><line x1="62" y1="118" x2="40" y2="118"/>
        <line x1="138" y1="82" x2="160" y2="82"/><line x1="138" y1="100" x2="160" y2="100"/><line x1="138" y1="118" x2="160" y2="118"/>
        <line x1="82" y1="62" x2="82" y2="40"/><line x1="100" y1="62" x2="100" y2="40"/><line x1="118" y1="62" x2="118" y2="40"/>
        <line x1="82" y1="138" x2="82" y2="160"/><line x1="100" y1="138" x2="100" y2="160"/><line x1="118" y1="138" x2="118" y2="160"/>
      </g>
      <circle cx="40" cy="82" r="4" stroke="{{accent}}" stroke-width="2"/>
      <circle cx="160" cy="118" r="4" stroke="{{accent}}" stroke-width="2"/>
    `,
  },
  coffee: {
    label: '咖啡杯',
    keywords: ['咖啡', '杯', 'coffee', 'cafe', '手冲', '下午茶'],
    svg: `
      <path d="M58 92 H138 V138 C138 154 126 164 110 164 H86 C70 164 58 154 58 138 Z" stroke="{{accent}}" stroke-width="4"/>
      <path d="M138 104 C166 100 172 140 142 142" stroke="{{accent}}" stroke-width="4"/>
      <path d="M72 92 C78 78 88 72 100 72 C112 72 122 78 128 92" stroke="{{muted}}" stroke-width="3"/>
      <path d="M78 48 C70 34 86 26 78 12 M100 44 C92 28 108 20 100 8 M122 48 C114 34 130 26 122 12" stroke="{{muted}}" stroke-width="2"/>
      <path d="M54 176 H146" stroke="{{muted}}" stroke-width="2"/>
    `,
  },
  skyline: {
    label: '城市天际线',
    keywords: ['城市', '夜景', '建筑', '上海', '北京', 'city', 'urban'],
    svg: `
      <path d="M30 160 V92 H64 V160 M64 160 V62 H98 V160 M98 160 V112 H128 V160 M128 160 V78 H162 V160 M162 160 V120 H186 V160" stroke="{{accent}}" stroke-width="4" stroke-linejoin="round"/>
      <g stroke="{{muted}}" stroke-width="2">
        <line x1="46" y1="108" x2="46" y2="126"/><line x1="78" y1="82" x2="78" y2="104"/><line x1="114" y1="126" x2="114" y2="142"/><line x1="146" y1="96" x2="146" y2="118"/>
      </g>
      <path d="M22 176 H190" stroke="{{muted}}" stroke-width="2"/>
    `,
  },
  plane: {
    label: '纸飞机 / 旅行',
    keywords: ['旅行', '出发', '飞机', '航线', 'travel', 'trip', 'flight'],
    svg: `
      <path d="M38 108 L170 58 L116 156 L96 116 Z" stroke="{{accent}}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M96 116 L170 58" stroke="{{muted}}" stroke-width="2"/>
      <path d="M30 154 C56 146 64 164 88 154" stroke="{{muted}}" stroke-width="2" stroke-dasharray="3 7"/>
      <circle cx="152" cy="148" r="4" stroke="{{accent}}" stroke-width="2"/>
    `,
  },
  clock: {
    label: '时间 / 表盘',
    keywords: ['时间', '下午', '早上', '分钟', '时刻', 'time', 'clock', 'hour'],
    svg: `
      <circle cx="100" cy="100" r="62" stroke="{{accent}}" stroke-width="4"/>
      <circle cx="100" cy="100" r="4" stroke="{{ink}}" stroke-width="2"/>
      <path d="M100 100 V60 M100 100 L132 116" stroke="{{ink}}" stroke-width="4" stroke-linecap="round"/>
      <g stroke="{{muted}}" stroke-width="2">
        <line x1="100" y1="44" x2="100" y2="52"/><line x1="156" y1="100" x2="148" y2="100"/><line x1="100" y1="156" x2="100" y2="148"/><line x1="44" y1="100" x2="52" y2="100"/>
      </g>
    `,
  },
  wave: {
    label: '声波 / 水波',
    keywords: ['音乐', '声音', '播客', '海浪', '水', 'music', 'sound', 'wave'],
    svg: `
      <path d="M24 100 C40 76 56 76 72 100 C88 124 104 124 120 100 C136 76 152 76 168 100 C180 118 188 120 196 112" stroke="{{accent}}" stroke-width="4" stroke-linecap="round"/>
      <path d="M24 130 C40 106 56 106 72 130 C88 154 104 154 120 130 C136 106 152 106 168 130 C180 148 188 150 196 142" stroke="{{muted}}" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="72" x2="196" y2="72" stroke="{{muted}}" stroke-width="2" stroke-dasharray="2 8"/>
    `,
  },
  book: {
    label: '翻开的书',
    keywords: ['阅读', '书', '文字', '故事', 'read', 'book', 'story'],
    svg: `
      <path d="M26 66 C56 54 82 60 100 74 C118 60 144 54 174 66 V150 C144 138 118 144 100 158 C82 144 56 138 26 150 Z" stroke="{{accent}}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M100 74 V158" stroke="{{ink}}" stroke-width="2"/>
      <g stroke="{{muted}}" stroke-width="2">
        <line x1="44" y1="86" x2="84" y2="80"/><line x1="44" y1="104" x2="84" y2="98"/><line x1="44" y1="122" x2="84" y2="116"/>
        <line x1="116" y1="80" x2="156" y2="86"/><line x1="116" y1="98" x2="156" y2="104"/><line x1="116" y1="116" x2="156" y2="122"/>
      </g>
    `,
  },
  orbit: {
    label: '轨道 / 宇宙',
    keywords: ['宇宙', '太空', '星球', '未来', 'space', 'orbit', 'planet', 'universe'],
    svg: `
      <circle cx="100" cy="100" r="32" stroke="{{accent}}" stroke-width="4"/>
      <ellipse cx="100" cy="100" rx="80" ry="30" transform="rotate(-28 100 100)" stroke="{{muted}}" stroke-width="2"/>
      <ellipse cx="100" cy="100" rx="70" ry="24" transform="rotate(32 100 100)" stroke="{{muted}}" stroke-width="2" stroke-dasharray="4 7"/>
      <circle cx="168" cy="72" r="5" stroke="{{accent}}" stroke-width="2"/>
      <circle cx="48" cy="136" r="3" stroke="{{accent}}" stroke-width="2"/>
    `,
  },
  camera: {
    label: '相机',
    keywords: ['照片', '摄影', '相机', '镜头', 'photo', 'camera', 'frame'],
    svg: `
      <rect x="34" y="72" width="132" height="92" rx="10" stroke="{{accent}}" stroke-width="4"/>
      <path d="M66 72 L78 52 H122 L134 72" stroke="{{accent}}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="100" cy="118" r="30" stroke="{{ink}}" stroke-width="3"/>
      <circle cx="100" cy="118" r="16" stroke="{{muted}}" stroke-width="2"/>
      <circle cx="144" cy="88" r="4" stroke="{{accent}}" stroke-width="2"/>
    `,
  },
  mountain: {
    label: '山',
    keywords: ['山', '自然', '户外', '远行', 'mountain', 'nature', 'hike'],
    svg: `
      <path d="M20 158 L74 74 L108 118 L134 84 L182 158 Z" stroke="{{accent}}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M74 74 L88 96 L74 92 L64 104" stroke="{{muted}}" stroke-width="2"/>
      <path d="M28 168 H176" stroke="{{muted}}" stroke-width="2"/>
    `,
  },
  moon: {
    label: '月亮',
    keywords: ['夜晚', '月亮', '夜', '安静', 'night', 'moon', 'quiet'],
    svg: `
      <path d="M120 48 C78 52 62 92 76 124 C90 156 130 164 156 142 C124 146 100 122 102 92 C104 70 112 56 120 48 Z" stroke="{{accent}}" stroke-width="4" stroke-linejoin="round"/>
      <g stroke="{{muted}}" stroke-width="2">
        <path d="M52 70 L60 78 M60 70 L52 78"/><path d="M164 66 L172 74 M172 66 L164 74"/><path d="M154 168 L160 174 M160 168 L154 174"/>
      </g>
    `,
  },
}

export const SYMBOL_IDS = Object.keys(SYMBOLS)

export function pickSymbols(text = '') {
  const lower = String(text).toLowerCase()
  const matches = []
  for (const [id, symbol] of Object.entries(SYMBOLS)) {
    const index = symbol.keywords
      .map((word) => lower.indexOf(word))
      .filter((value) => value >= 0)
      .sort((a, b) => a - b)[0]
    if (index != null) matches.push({ id, index })
  }
  return matches
    .sort((a, b) => a.index - b.index)
    .map((item) => item.id)
    .slice(0, 2)
}

export function buildFallbackSvg(symbolIds = []) {
  const ids = symbolIds.filter((id) => SYMBOLS[id]).slice(0, 2)
  if (!ids.length) ids.push('orbit')
  const positions =
    ids.length === 1
      ? [{ x: 150, y: 105, scale: 1.55 }]
      : [
          { x: 70, y: 92, scale: 1.18 },
          { x: 330, y: 155, scale: 1.28 },
        ]

  const body = ids
    .map((id, index) => {
      const pos = positions[index]
      return `<g transform="translate(${pos.x} ${pos.y}) scale(${pos.scale})">${SYMBOLS[id].svg}</g>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" fill="none">
    <g stroke="{{muted}}" stroke-width="2" opacity="0.55">
      <line x1="24" y1="52" x2="576" y2="52"/>
      <line x1="24" y1="398" x2="576" y2="398"/>
      <circle cx="520" cy="92" r="42"/>
      <circle cx="520" cy="92" r="3"/>
      <path d="M40 360 C120 326 196 392 280 354 C360 318 442 388 560 344"/>
    </g>
    ${body}
    <g stroke="{{accent}}" stroke-width="2">
      <line x1="24" y1="52" x2="96" y2="52"/>
      <line x1="24" y1="398" x2="96" y2="398"/>
    </g>
  </svg>`
}
