/**
 * 海报图案配方：替代 emoji 图标表。
 *
 * 每个配方是「参数 + seed → 确定性 <g> 片段」：
 * - 只用基础图形（rect / circle / line / path / polygon），不依赖图标库；
 * - 颜色只从当前方案 palette 的 ink / accent / secondary / muted / paper 取；
 * - 内部禁用 Math.random，统一用 LCG，保证同 seed 逐字节一致；
 * - 由 renderPosterSvg 裁切到 artBox，不会盖住文字层。
 *
 * 新增配方 = 加一条记录 + 一个 render()，海报提示词与校验白名单自动跟随。
 */

export const POSTER_RECIPES = [
  {
    id: 'halftone_stars',
    label: '半调星星',
    when: '怀旧档案 / 刊头装饰 / 留白较多',
    notWhen: '正文密集 / 极简商务',
    params: {
      density: { type: 'int', min: 1, max: 5, default: 3, step: 1, label: '密度' },
      size: { type: 'num', min: 0.6, max: 2, default: 1, step: 0.1, label: '大小' },
    },
    render({ seed, params, palette, box }) {
      const rnd = rng(seed)
      const count = Math.round(((box.w * box.h) / 5000) * params.density) + 8
      const parts = []
      for (let i = 0; i < count; i += 1) {
        const x = box.x + rnd() * box.w
        const y = box.y + rnd() * box.h
        const s = (3.2 + rnd() * 7) * params.size
        const op = 0.28 + rnd() * 0.4
        parts.push(starPath(x, y, s, palette.accent, op))
      }
      return parts.join('')
    },
  },
  {
    id: 'halftone_gradient',
    label: '半调渐变',
    when: '过渡 / 大面积留白 / 复古印刷',
    notWhen: '需要硬边几何',
    params: {
      steps: { type: 'int', min: 4, max: 10, default: 7, step: 1, label: '层数' },
      angle: { type: 'num', min: 0, max: 90, default: 24, step: 1, label: '角度' },
      size: { type: 'num', min: 0.6, max: 1.8, default: 1, step: 0.1, label: '点径' },
    },
    render({ seed, params, palette, box }) {
      const rnd = rng(seed)
      const cols = Math.max(6, Math.round(box.w / 26))
      const rows = params.steps
      const gapX = box.w / cols
      const gapY = box.h / rows
      const parts = []
      for (let row = 0; row < rows; row += 1) {
        const t = row / Math.max(1, rows - 1)
        const radius = (1.2 + (1 - t) * 4.2) * params.size
        for (let col = 0; col < cols; col += 1) {
          const x = box.x + col * gapX + gapX / 2 + (rnd() - 0.5) * gapX * 0.3
          const y = box.y + row * gapY + gapY / 2 + (rnd() - 0.5) * gapY * 0.3
          parts.push(
            `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius.toFixed(2)}" fill="${palette.accent}" opacity="${(0.1 + (1 - t) * 0.22).toFixed(2)}"/>`,
          )
        }
      }
      return `<g transform="rotate(${params.angle} ${box.x + box.w / 2} ${box.y + box.h / 2})">${parts.join('')}</g>`
    },
  },
  {
    id: 'diagonal_split',
    label: '斜切色块',
    when: '构成主义 / 宣言 / 高对比',
    notWhen: '温柔生活 / 大量小字',
    params: {
      cuts: { type: 'int', min: 1, max: 3, default: 1, step: 1, label: '斜带数' },
      angle: { type: 'num', min: 6, max: 32, default: 18, step: 1, label: '角度' },
    },
    render({ seed, params, palette, box }) {
      const rnd = rng(seed)
      const k = Math.tan((params.angle * Math.PI) / 180)
      const parts = []
      for (let i = 0; i < params.cuts; i += 1) {
        const offset = box.h * (0.18 + 0.58 * i) / Math.max(1, params.cuts)
        const drop = box.w * k
        const pts = [
          [box.x, box.y + offset],
          [box.x + box.w, box.y + offset - drop],
          [box.x + box.w, box.y + offset - drop + box.h * 0.16],
          [box.x, box.y + offset + box.h * 0.16],
        ]
        const fill = i % 2 === 0 ? palette.accent : palette.ink
        parts.push(
          `<polygon points="${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}" fill="${fill}" opacity="${(0.1 + rnd() * 0.08).toFixed(2)}"/>`,
        )
      }
      return parts.join('')
    },
  },
  {
    id: 'grid_columns',
    label: '栏网格',
    when: '瑞士网格 / 机构 / 专业',
    notWhen: '手作 / 复古',
    params: {
      columns: { type: 'int', min: 8, max: 12, default: 12, step: 1, label: '栏数' },
      opacity: { type: 'num', min: 0.05, max: 0.15, default: 0.08, step: 0.01, label: '透明度' },
    },
    render({ params, palette, box }) {
      const parts = []
      const step = box.w / params.columns
      for (let i = 0; i <= params.columns; i += 1) {
        const x = box.x + i * step
        parts.push(
          `<line x1="${x.toFixed(1)}" y1="${box.y}" x2="${x.toFixed(1)}" y2="${box.y + box.h}" stroke="${palette.muted}" stroke-width="1" opacity="${params.opacity}"/>`,
        )
      }
      const rows = Math.max(2, Math.round(box.h / 120))
      for (let i = 1; i < rows; i += 1) {
        const y = box.y + (box.h / rows) * i
        parts.push(
          `<line x1="${box.x}" y1="${y.toFixed(1)}" x2="${box.x + box.w}" y2="${y.toFixed(1)}" stroke="${palette.muted}" stroke-width="1" opacity="${params.opacity * 0.8}"/>`,
        )
      }
      return parts.join('')
    },
  },
  {
    id: 'paper_grain',
    label: '纸纹颗粒',
    when: '印刷质感 / 旧纸 / 纪实',
    notWhen: '屏幕 / 霓虹',
    params: {
      density: { type: 'num', min: 0.02, max: 0.2, default: 0.08, step: 0.01, label: '密度' },
    },
    render({ seed, params, palette, box }) {
      const rnd = rng(seed)
      const count = Math.round(((box.w * box.h) / 900) * params.density)
      const parts = []
      for (let i = 0; i < count; i += 1) {
        const x = box.x + rnd() * box.w
        const y = box.y + rnd() * box.h
        const r = 0.4 + rnd() * 1.1
        parts.push(
          `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${palette.ink}" opacity="${(0.04 + rnd() * 0.08).toFixed(2)}"/>`,
        )
      }
      return parts.join('')
    },
  },
  {
    id: 'tape_strips',
    label: '胶带彩条',
    when: '手作志 / 拼贴 / 活动',
    notWhen: '正式纪念 / 极简',
    params: {
      strips: { type: 'int', min: 3, max: 6, default: 4, step: 1, label: '条数' },
      angle: { type: 'num', min: 0, max: 20, default: 7, step: 1, label: '倾角' },
    },
    render({ seed, params, palette, box }) {
      const rnd = rng(seed)
      const parts = []
      const colors = [palette.accent, palette.secondary, palette.muted, palette.ink]
      for (let i = 0; i < params.strips; i += 1) {
        const top = i % 2 === 0
        const w = box.w * (0.24 + rnd() * 0.28)
        const h = 10 + rnd() * 12
        const x = box.x + rnd() * (box.w - w)
        const y = top ? box.y + 10 + rnd() * 24 : box.y + box.h - 34 - rnd() * 24
        const rotate = (rnd() - 0.5) * params.angle * 2
        parts.push(
          `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${colors[i % colors.length]}" opacity="0.85" transform="rotate(${rotate.toFixed(1)} ${(x + w / 2).toFixed(1)} ${(y + h / 2).toFixed(1)})"/>`,
        )
      }
      return parts.join('')
    },
  },
  {
    id: 'arc_rainbow',
    label: '弧线彩虹',
    when: '纪念 / 留白 / 柔和',
    notWhen: '硬边几何 / 工业',
    params: {
      arcs: { type: 'int', min: 3, max: 6, default: 4, step: 1, label: '弧数' },
      stroke: { type: 'num', min: 0.8, max: 3, default: 1.4, step: 0.1, label: '线宽' },
    },
    render({ params, palette, box }) {
      const parts = []
      const cx = box.x + box.w * 0.5
      const cy = box.y + box.h * 0.92
      const base = box.w * 0.42
      for (let i = 0; i < params.arcs; i += 1) {
        const r = base * (0.5 + i * 0.16)
        parts.push(
          `<path d="M${(cx - r).toFixed(1)} ${cy.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx + r).toFixed(1)} ${cy.toFixed(1)}" fill="none" stroke="${i === 0 ? palette.accent : palette.muted}" stroke-width="${params.stroke}" opacity="${i === 0 ? 0.7 : 0.28}"/>`,
        )
      }
      return parts.join('')
    },
  },
  {
    id: 'wave_lines',
    label: '水波线',
    when: '音乐 / 流体 / 夜色',
    notWhen: '硬边网格',
    params: {
      lines: { type: 'int', min: 8, max: 24, default: 14, step: 1, label: '线数' },
      amplitude: { type: 'num', min: 0.02, max: 0.08, default: 0.04, step: 0.005, label: '振幅' },
    },
    render({ params, palette, box }) {
      const parts = []
      const gap = box.h / params.lines
      const amp = box.h * params.amplitude
      for (let i = 0; i < params.lines; i += 1) {
        const y = box.y + gap * (i + 0.5)
        const d = `M${box.x} ${y.toFixed(1)} C${(box.x + box.w * 0.25).toFixed(1)} ${(y - amp).toFixed(1)} ${(box.x + box.w * 0.55).toFixed(1)} ${(y + amp).toFixed(1)} ${(box.x + box.w).toFixed(1)} ${y.toFixed(1)}`
        parts.push(
          `<path d="${d}" fill="none" stroke="${i % 4 === 0 ? palette.accent : palette.muted}" stroke-width="1.2" opacity="${i % 4 === 0 ? 0.5 : 0.22}"/>`,
        )
      }
      return parts.join('')
    },
  },
  {
    id: 'dot_matrix',
    label: '点阵',
    when: '电子 / 像素 / 数据',
    notWhen: '古典 / 纸感',
    params: {
      cols: { type: 'int', min: 12, max: 24, default: 18, step: 1, label: '列数' },
      rows: { type: 'int', min: 12, max: 24, default: 18, step: 1, label: '行数' },
    },
    render({ seed, params, palette, box }) {
      const rnd = rng(seed)
      const gapX = box.w / params.cols
      const gapY = box.h / params.rows
      const parts = []
      for (let row = 0; row < params.rows; row += 1) {
        for (let col = 0; col < params.cols; col += 1) {
          const on = rnd() > 0.62
          parts.push(
            `<circle cx="${(box.x + gapX * (col + 0.5)).toFixed(1)}" cy="${(box.y + gapY * (row + 0.5)).toFixed(1)}" r="${(gapX * (on ? 0.22 : 0.1)).toFixed(2)}" fill="${on ? palette.accent : palette.muted}" opacity="${on ? 0.55 : 0.18}"/>`,
          )
        }
      }
      return parts.join('')
    },
  },
  {
    id: 'scribble',
    label: '划痕涂鸦',
    when: '手写 / 青年 / 实验',
    notWhen: '正式 / 财经',
    params: {
      strokes: { type: 'int', min: 3, max: 12, default: 6, step: 1, label: '划痕数' },
    },
    render({ seed, params, palette, box }) {
      const rnd = rng(seed)
      const parts = []
      for (let i = 0; i < params.strokes; i += 1) {
        const x = box.x + rnd() * box.w
        const y = box.y + rnd() * box.h
        const len = 30 + rnd() * 140
        const ang = -0.4 + rnd() * 0.8
        const dx = Math.cos(ang) * len
        const dy = Math.sin(ang) * len
        parts.push(
          `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + dx).toFixed(1)}" y2="${(y + dy).toFixed(1)}" stroke="${i % 3 === 0 ? palette.accent : palette.muted}" stroke-width="${(1 + rnd() * 2).toFixed(1)}" stroke-linecap="round" opacity="${(0.18 + rnd() * 0.3).toFixed(2)}"/>`,
        )
      }
      return parts.join('')
    },
  },
  {
    id: 'contour',
    label: '等高线',
    when: '勘测 / 地图 / 场地记录 / 工业地形',
    notWhen: '纯商业 / 需要干净留白',
    params: {
      lines: { type: 'int', min: 4, max: 14, default: 9, step: 1, label: '线数' },
      amplitude: { type: 'num', min: 1, max: 6, default: 2.6, step: 0.2, label: '起伏' },
      thickness: { type: 'num', min: 0.5, max: 1.8, default: 0.9, step: 0.1, label: '线宽' },
    },
    render({ params, palette, box }) {
      const lines = Math.max(2, Math.round(params.lines))
      const amp = (params.amplitude / 100) * box.h
      const parts = []
      for (let i = 0; i < lines; i += 1) {
        const yb = box.y + (box.h / (lines + 1)) * (i + 1)
        const d = `M ${box.x.toFixed(1)} ${yb.toFixed(1)} C ${(box.x + box.w * 0.24).toFixed(1)} ${(yb - amp).toFixed(1)}, ${(box.x + box.w * 0.52).toFixed(1)} ${(yb + amp).toFixed(1)}, ${(box.x + box.w).toFixed(1)} ${yb.toFixed(1)}`
        parts.push(
          `<path d="${d}" fill="none" stroke="${i % 4 === 0 ? palette.muted : palette.ink}" stroke-width="${params.thickness}" opacity="${(0.22 + (i % 3) * 0.08).toFixed(2)}"/>`,
        )
      }
      return parts.join('')
    },
  },
]

export const POSTER_RECIPE_IDS = POSTER_RECIPES.map((recipe) => recipe.id)

export function getPosterRecipe(id) {
  return POSTER_RECIPES.find((recipe) => recipe.id === id) || null
}

export function defaultRecipeParams(id) {
  const recipe = getPosterRecipe(id)
  if (!recipe) return {}
  return Object.fromEntries(
    Object.entries(recipe.params).map(([key, rule]) => [key, rule.default]),
  )
}

/** 越界参数夹紧、未知参数丢弃；模型只需要回填 id 与数值。 */
export function resolveRecipeParams(id, params = {}) {
  const recipe = getPosterRecipe(id)
  if (!recipe) return {}
  const out = {}
  for (const [key, rule] of Object.entries(recipe.params)) {
    const raw = Number(params?.[key])
    const value = Number.isFinite(raw) ? raw : rule.default
    const clamped = Math.min(rule.max, Math.max(rule.min, value))
    out[key] = rule.type === 'int' ? Math.round(clamped) : Number(clamped.toFixed(2))
  }
  return out
}

export function recipeCatalogText() {
  return POSTER_RECIPES.map((recipe) => {
    const ranges = Object.entries(recipe.params)
      .map(([key, rule]) => `${key}:${rule.min}-${rule.max}`)
      .join('/')
    return `- ${recipe.id}｜${recipe.label}｜参数 ${ranges}｜适用 ${recipe.when}；不适用 ${recipe.notWhen}`
  }).join('\n')
}

function starPath(cx, cy, size, fill, opacity) {
  const s = size / 2
  const d = `M${(cx).toFixed(1)} ${(cy - s).toFixed(1)} L${(cx + s * 0.28).toFixed(1)} ${(cy - s * 0.28).toFixed(1)} L${(cx + s).toFixed(1)} ${(cy).toFixed(1)} L${(cx + s * 0.28).toFixed(1)} ${(cy + s * 0.28).toFixed(1)} L${(cx).toFixed(1)} ${(cy + s).toFixed(1)} L${(cx - s * 0.28).toFixed(1)} ${(cy + s * 0.28).toFixed(1)} L${(cx - s).toFixed(1)} ${(cy).toFixed(1)} L${(cx - s * 0.28).toFixed(1)} ${(cy - s * 0.28).toFixed(1)} Z`
  return `<path d="${d}" fill="${fill}" opacity="${opacity.toFixed(2)}"/>`
}

/** 固定种子 LCG：与渲染器其余部分共用，禁 Math.random。 */
export function rng(seed) {
  let s = (seed | 0) || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}
