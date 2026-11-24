# Prompt 版本备份

每次调整生成提示词 / 对话提示词 / 设计 Skill 前，先把当前版本复制到 `versions/<版本号>/`，不要直接覆盖旧快照。

## 目录约定

```
prompts/
  versions/
    README.md
    v0.5.0/
      manifest.json
      systemPrompt.js       # 生成提示词 + Schema + 白名单
      chat.js               # 对话微调提示词 + patch 校验
      designSkill.js        # 内置设计 Skill
      six-style-reference.md # 六种经典风格参考原文
    v0.6.0/
      manifest.json
      systemPrompt.js
      chat.js
      designSkill.js
      captions.js           # 多图补充图注
    v0.7.0/
      manifest.json
      systemPrompt.js
      chat.js
      designPrompt.js       # 设计模式生成 + 对话提示词
      designSkill.js
      captions.js
    v0.8.0/
      manifest.json
      systemPrompt.js
      chat.js
      designPrompt.js       # 设计模式自定义板块 / 坐标 / 互换
      designSkill.js
      captions.js
    v0.9.0/
      manifest.json
      systemPrompt.js
      chat.js
      designPrompt.js       # 同类型编号 / 页脚等类型 / 删除后新增
      designSkill.js
      captions.js
    v0.10.0/
      manifest.json
      systemPrompt.js
      chat.js
      designPrompt.js
      artPrompt.js          # 自由模式 SVG 线条图案
      designSkill.js
      captions.js
    v0.11.0/
      manifest.json
      systemPrompt.js
      chat.js
      designPrompt.js
      artPrompt.js          # 图标库组合 + 样式 + 额外元素
      designSkill.js
      captions.js
    v0.12.0/
      manifest.json
      systemPrompt.js       # 海报也写 1–2 段报纸备用正文
      chat.js
      designPrompt.js       # 正文 1–4 段；海报不输出空数组
      artPrompt.js
      designSkill.js
      captions.js
    v0.13.0/
      manifest.json
      systemPrompt.js
      chat.js
      designPrompt.js
      artPrompt.js
      imagePrompt.js        # 原图 + 9 种生图风格提示词
      designSkill.js
      captions.js
    v0.14.0/
      manifest.json
      systemPrompt.js
      chat.js
      designPrompt.js       # 英文艺术字标题 + 6 款版式字体
      artPrompt.js
      imagePrompt.js
      designSkill.js
      captions.js
    v0.15.0/
      manifest.json
      systemPrompt.js       # 三模式英文装饰词
      chat.js
      designPrompt.js       # 描述关键词 → 艺术字 headline/masthead/note
      artPrompt.js
      imagePrompt.js
      designSkill.js
      captions.js
    v0.18.0/
      manifest.json
      systemPrompt.js       # 海报格式追加海报 skill
      designPrompt.js       # 设计 / 自由模式追加海报 skill（含 art_font 与坐标边界）
      chat.js               # 对话微调追加海报短护栏
      posterSkill.js        # 海报专属 skill：资产表、目录、白名单、踩坑、自检、对话护栏
      designSkill.js
    v0.19.0/
      manifest.json
      posterPrompt.js       # 海报单套生成提示词（文案 + 模板 + 配方 + seed）
      posterSpec.js         # 海报规格归一化 / 白名单 / 参数夹紧
      posterTemplates.js    # 3 套海报模板 × 2 变体（含字体与艺术字上限）
      posterPatterns.js     # 10 个图案配方
      posterSkill.js        # 自检与对话护栏（旧版资产表暂留）
      systemPrompt.js
      designPrompt.js
      chat.js
      designSkill.js
      llm.js
    v0.20.0/
      manifest.json
      posterPrompt.js       # 6 套模板目录 + 角度子集
      posterSpec.js
      posterTemplates.js    # 6 套 × 2 变体（新增影像 / 原色 / 手作）
      posterPatterns.js
      posterSkill.js        # 对话可改模板 / 配方 / seed
      systemPrompt.js
      designPrompt.js
      chat.js
      designSkill.js
      llm.js
    v0.21.0/
      manifest.json
      posterPrompt.js       # poster_note 用「·」分段 → 信息条
      posterSpec.js         # 模板默认纸纹颗粒
      posterTemplates.js    # 富元素版：信息条 / 信息卡 / 徽章 / 角标 / 条码
      posterPatterns.js
      posterSkill.js
      systemPrompt.js
      designPrompt.js
      chat.js
      designSkill.js
      llm.js
    v0.22.0/
      manifest.json
      posterPrompt.js       # 双图子图提示 + 艺术字子集化说明
      posterSpec.js
      posterTemplates.js    # 子图 secondary 位置 / 资产版本 3.0.0 / constructivism 重新启用
      posterPatterns.js
      posterSkill.js
      systemPrompt.js
      designPrompt.js
      chat.js
      designSkill.js
      llm.js
    v0.23.0/
      manifest.json
      posterPrompt.js
      posterSpec.js
      posterTemplates.js    # 4 套方舟/终末地语言模板 / 资产版本 4.0.0
      posterPatterns.js     # 新增 contour 等高线
      posterSkill.js
      systemPrompt.js
      designPrompt.js
      chat.js
      designSkill.js
      llm.js
    v0.24.0/
      manifest.json
      posterPrompt.js
      posterSpec.js         # mergePosterPatch 修复参数滑块清 recipe
      posterTemplates.js    # 7 套（新四 + 影像/原色/斜切）/ 资产版本 4.1.0
      posterPatterns.js
      posterSkill.js
      systemPrompt.js
      designPrompt.js
      chat.js
      designSkill.js
      llm.js
```

图标原始参考在 `prompts/references/emoji-outline/`，由 `scripts/import-icon-library.mjs` 生成 `src/config/icon-library.generated.js`；鱼、星星、彩虹和自定义图标在 `icon-library.overrides.js` 中手改。

## 当前快照

| 版本 | 日期 | 说明 |
|---|---|---|
| `v0.5.0` | 2026-10-22 | 九套模板 / 三组风格包完成，双图与海报装饰文案优化前的基线 |
| `v0.6.0` | 2026-10-22 | 九套模板双图、海报装饰注记、多图补充图注；新增 `captions.js` |
| `v0.7.0` | 2026-10-25 | 标准模板 / 设计模式切换；新增 `designPrompt.js`，设计模式可自由选模板、配色、字体和正文量 |
| `v0.8.0` | 2026-10-25 | 设计模式支持自定义板块、绝对坐标、删除板块、完整矩形互换；对话新增重叠回退 |
| `v0.9.0` | 2026-10-25 | 同类型板块编号；补全页脚 / 报头 / 日期栏 / 署名新增类型与内容渲染；删除后仍可新增同类型 |
| `v0.10.0` | 2026-10-25 | 自由模式：无图生成 SVG 线条图案，符号库兜底，有照片优先用照片 |
| `v0.11.0` | 2026-10-28 | 94 枚图标库 + 象征表 + 九套图案配方；模型从图标库组合并追加元素；修正鱼/星星/彩虹 |
| `v0.12.0` | 2026-10-28 | 海报也写 1–2 段报纸备用正文；空正文兜底并显示生成提示 |
| `v0.13.0` | 2026-11-01 | 生图模型 + 排版模型双阶段；原图 + 9 风格；独立生图 Key |
| `v0.14.0` | 2026-11-01 | 设计 / 自由模式英文艺术字标题与 6 款版式字体 |
| `v0.15.0` | 2026-11-01 | 三模式英文艺术字装饰；headline / masthead / note 三位置 |
| `v0.18.0` | 2026-11-24 | 海报设计 Skill：仅海报注入；版式目录 / 白名单 / patch 字段由 `posterSkill.js` 资产表派生；新增 12 条踩坑速查与生成后自检 |
| `v0.19.0` | 2026-11-24 | 海报 SVG 重构 M1：单套规格 + 海报专用模板 + 图案配方；三路并行；只读画布 + 检查器；字体嵌入导出 |
| `v0.20.0` | 2026-11-24 | 海报 M2：6 套模板 × 2 变体；对话换模板 / 配方；三路角度互斥；逐张唯一 clip id 修复多图裁切串台 |
| `v0.21.0` | 2026-11-24 | 海报富元素版：底部编号信息条 / 信息卡 / 徽章 / 角标 / 条码 / 纸纹；信息条由 `poster_note` 分段生成 |
| `v0.22.0` | 2026-11-24 | 海报 M3：双图拼贴 / 429 降并发 / 矢量 PDF / 艺术字子集化（constructivism 28KB 重新启用）/ 资产版本 3.0.0 |
| `v0.23.0` | 2026-11-24 | 海报 M4 视觉重做：4 套方舟/终末地语言模板；切角/点阵/等高线/空心字/单色照片；资产版本 4.0.0 |
| `v0.24.0` | 2026-11-24 | 恢复影像/原色/斜切三套，共 7 套；参数滑块不再清图案（mergePosterPatch）；资产版本 4.1.0 |

## 新增版本

1. 复制 `src/agent/systemPrompt.js`、`src/agent/chat.js`、`src/agent/designPrompt.js`、`src/agent/artPrompt.js`、`src/agent/designSkill.js`、`src/agent/posterSkill.js`、`src/agent/captions.js` 到 `versions/vX.Y.Z/`；
2. 写 `manifest.json`，记录日期、变更点和对应 Git 提交；
3. 在表格里加一行；
4. 改完源码后再把新版本复制一份，旧目录保持不动。
