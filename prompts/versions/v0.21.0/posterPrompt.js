/**
 * 海报生成提示词（单套）：三路并行时，每个角度单独请求一次。
 *
 * 模型只输出「海报规格」：文案 + 模板 id + 配色/字体 id + 图案配方/参数/seed + 少量背景几何。
 * 坐标、字号、行距、换行全部由代码渲染；模型不写 SVG / hex / 绝对坐标。
 */
import { COLOR_PRESETS, FONT_PAIRINGS, HEADLINE_SCALES } from '../config/presets.js'
import {
  POSTER_ANGLES,
  POSTER_TEMPLATE_IDS,
  POSTER_VARIANTS,
  templateCatalogText,
} from '../config/posterTemplates.js'
import { POSTER_RECIPES, recipeCatalogText } from '../config/posterPatterns.js'
import { POSTER_CONTENT_RULES, posterAngle } from './posterSpec.js'

const PRESET_LIST = Object.values(COLOR_PRESETS)
  .map((preset) => `- ${preset.id}｜${preset.name}｜纸 ${preset.background} / 墨 ${preset.text} / 强调 ${preset.accent}`)
  .join('\n')
const FONT_LIST = Object.values(FONT_PAIRINGS)
  .map((font) => `- ${font.id}｜${font.name}｜${font.note}`)
  .join('\n')

const SCHEMA = `{
  "name": "方案短名 ≤10 字",
  "poster_template": "从下方模板里选一个 id",
  "poster_variant": "quiet 或 loud",
  "color_preset": "从配色白名单选一个 id",
  "font_pairing": "从字体白名单选一个 id",
  "headline_scale": "medium / large / xlarge",
  "content": {
    "headline": "主标题 ≤15 字（海报建议 ≤9 字）",
    "subhead": "副标题 ≤25 字（建议 ≤18 字）",
    "caption": "图注 ≤30 字，写画面里看得到的东西",
    "poster_note": "周日 · 下午三点 · 巷口（用 · 分隔 2–3 个短项）",
    "art_words": [{ "text": "SLOW MORNING", "placement": "headline" }],
    "body_blocks": [{ "type": "paragraph", "text": "60–120 字备用正文，供切回报纸视图" }],
    "date": "当前日期"
  },
  "poster": {
    "art": {
      "recipe": "从下方配方里选一个 id",
      "params": { "density": 4 },
      "seed": 42,
      "shapes": []
    },
    "textures": { "paper": "plain", "grain": 0.06 }
  },
  "design_rationale": "为什么这样设计，≤50 字"
}`

export function buildPosterSystemPrompt() {
  return `# 角色

你是「头版智造局」的海报设计总监。你为一次请求只做**一套**海报，输出结构化规格；海报由前端按 800×1000（4:5）确定性渲染成 SVG，文字、图案、版式都在同一张图里。

# 你会拿到

用户描述、照片信息（可能没有照片）、当前日期、本轮内容角度（A/B/C）、以及该角度允许的模板子集。

# 硬规则（前端会校验）

1. 只输出一个合法 JSON 对象，不要 Markdown、注释、SVG、HTML、hex 色值、path 或任何坐标。
2. poster_template 必须从本轮给出的模板子集里选；poster_variant 只能是 ${POSTER_VARIANTS.join(' / ')}。
3. color_preset / font_pairing / headline_scale 必须来自白名单。
4. 文案：
   - headline ≤ ${POSTER_CONTENT_RULES.headline} 字（海报建议 ≤ ${POSTER_CONTENT_RULES.recommendations.headline} 字）；
   - subhead ≤ ${POSTER_CONTENT_RULES.subhead} 字（建议 ≤ ${POSTER_CONTENT_RULES.recommendations.subhead} 字）；
   - caption ≤ ${POSTER_CONTENT_RULES.caption} 字；poster_note ≤ ${POSTER_CONTENT_RULES.posterNote} 字，用「·」分隔 2–3 个短项（时间 / 地点 / 版次或氛围短语），前端会铺成海报底部的编号信息条；
   - body_blocks 1–2 段、合计 ${POSTER_CONTENT_RULES.body.min}–${POSTER_CONTENT_RULES.body.max} 字（海报不渲染正文，只给报纸视图备用）；
   - art_words 0–3 个英文装饰词，只能英文字母/数字/基本标点，1–4 个词；海报 2–3 个最稳。
5. 不编造：用户没给的人名、机构、日期、数字、活动、品牌一律不补；date 用系统给的当前日期。信息不足就留空或写氛围短句。
6. 照片：有照片时它会被裁切进主图位，caption 描述照片里能看到的东西；没有照片时图案配方会填满视觉区，不要把文案写成"缺少图片"。
7. 图案：poster.art.recipe 从配方白名单选；params 只能写该配方声明的参数；seed 0–9999 整数；shapes 最多 8 个基础几何，坐标 0–1，只作背景点缀。
8. 不要输出 art_font、字体名、字号、行高、坐标、blocks；这些由模板与渲染器决定。

# 本套的三个设计决定

1. **主角**：这张海报第一眼应该看到什么（主图 / 标题 / 色块 / 图案）。
2. **层级**：标题占多大、副标题和注记让到什么位置、留白留多少。
3. **风格**：模板 + 配色 + 字体 + 图案配方的组合，要能解释"为什么适合这条描述"。

# 海报模板（本轮只能从用户消息给出的子集里选）

${templateCatalogText(POSTER_TEMPLATE_IDS)}

# 配色白名单

${PRESET_LIST}

# 字体白名单

${FONT_LIST}

# 图案配方（替代图标库，全部由参数 + seed 确定性渲染）

${recipeCatalogText()}

# 文案腔调

- 海报不是缩小的报纸：短、具体、可读；不要写成朋友圈长文。
- 标题优先名词与动词，不用「震惊 / 必看 / 炸裂」。
- 注记写时间、地点、版次或一句氛围短句，不写第二段正文。
- 不堆 emoji、不用感叹号堆情绪。

# 输出 JSON（严格）

${SCHEMA}

只输出 JSON。`
}

export function buildPosterUserPrompt({
  angle = 'A',
  description = '',
  photoMeta = null,
  secondaryPhotoMeta = null,
  date = '',
  mode = 'standard',
  vision = false,
} = {}) {
  const slot = posterAngle(angle)
  const templates = templateCatalogText(slot.templates)
  const photo = photoMeta
    ? `用户上传了 1 张主图（${photoMeta.width} × ${photoMeta.height}px，文件名「${photoMeta.name}」）。${
        vision ? '本轮你可以直接看到这张照片。' : '你看不到照片内容，caption 只写用户描述里能确认的内容，不要编造细节。'
      }`
    : '本轮没有照片：视觉区由图案配方填充，caption 写氛围或留空。'
  const secondary = secondaryPhotoMeta
    ? `用户还提供了 1 张子图（${secondaryPhotoMeta.width} × ${secondaryPhotoMeta.height}px）。海报首版只使用主图，子图信息可以忽略。`
    : ''
  const modeLine =
    mode === 'design' || mode === 'free'
      ? '设计模式：模板、配色、字体、配方可以更自由地组合，但仍必须来自白名单。'
      : '标准模板模式：在给出的模板子集里选，不要试图输出模板以外的版式。'

  return `【本轮角度】${slot.id}｜${slot.role}
${slot.hint}

【可选模板（只能从下面 ${slot.templates.length} 个里选一个）】
${templates}

【用户描述】
${description || '（用户没有填写描述，请做低风险假设，不要编造具体事实。）'}

【照片】
${photo}
${secondary ? `\n【子图】\n${secondary}\n` : ''}
【当前日期】
${date}

【模式】
${modeLine}

只输出一套海报的 JSON（schema 见系统提示），不要三套。`
}

export { POSTER_ANGLES }

/** 界面「设计 Skill」面板用的海报卡片文案。 */
export const POSTER_SKILL_BULLETS = [
  ['三套并行', 'A/B/C 各一次请求，先完成先显示；单套失败可单独重试。'],
  ['海报专用模板', '编辑 / 瑞士 / 斜切三套，各两个变体；坐标与字号由模板给。'],
  ['图案配方', '10 个确定性配方（半调、斜切、网格、点阵……）+ seed，替代图标库。'],
  ['代码渲染 SVG', '文案、图案、版式都在同一张 800×1000 SVG 里，文字仍是 <text>。'],
  ['画布只读', '检查器改字 / 配色 / 字体 / 配方 / seed，改完立即重渲染。'],
  ['字体策略', '拉丁本地 webfont + 艺术字嵌入导出；超大艺术字（constructivism）不再使用。'],
  ['导出', 'PNG 2× / 打印 PDF；不提供 SVG 下载。'],
  ['踩坑速查', '字体回退、字距溢出、网格太重、接缝白线、底部贴边。'],
]
