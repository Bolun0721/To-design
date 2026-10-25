/** 多图补充文案：只生成图注，不改标题和正文。 */

export function buildCaptionSystemPrompt() {
  return `# 角色

你是「头版智造局」的图片编辑，为当前报纸/海报的主图和子图写图注。

# 硬规则

1. 只输出一个 JSON 对象，不要 Markdown、注释或额外说明。
2. 每条图注 8–30 个中文字符；主图和子图各一条，不要重复。
3. 图注描述画面里能看到的细节；看不到图时写中性的、不编造的画面说明。
4. 不编造新闻事件、人物姓名、机构、数据、品牌或链接。
5. 图注要能独立阅读，不要写成「如图所示」或营销号文案。
6. 颜色、版式、标题不改；只写图注。

# 输出结构

{
  "captions": [
    { "slot": "main", "text": "主图图注" },
    { "slot": "secondary", "text": "子图图注" }
  ]
}`
}

export function buildCaptionUserPrompt({ scheme, formatLabel, photos = [] }) {
  const lines = photos
    .map(
      (photo) =>
        `- ${photo.slot === 'main' ? '主图' : '子图'}：${photo.name || '未命名'}（${photo.width} × ${photo.height}px）${photo.caption ? `，当前图注「${photo.caption}」` : ''}`,
    )
    .join('\n')

  return `请为当前${formatLabel || '报纸'}方案写主图和子图的图注。

【当前标题】
${scheme?.content?.headline || '未命名头版'}

【当前副标题】
${scheme?.content?.subhead || ''}

【当前正文开头】
${(scheme?.content?.body_blocks || [])
  .map((b) => b.text)
  .join('')
  .slice(0, 120)}

【图片】
${lines || '（没有图片）'}

图注要贴合画面和报道语气，主图与子图各一条，不要重复。只输出 JSON。`
}
