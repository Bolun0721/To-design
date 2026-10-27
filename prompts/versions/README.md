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

## 新增版本

1. 复制 `src/agent/systemPrompt.js`、`src/agent/chat.js`、`src/agent/designPrompt.js`、`src/agent/artPrompt.js`、`src/agent/designSkill.js`、`src/agent/captions.js` 到 `versions/vX.Y.Z/`；
2. 写 `manifest.json`，记录日期、变更点和对应 Git 提交；
3. 在表格里加一行；
4. 改完源码后再把新版本复制一份，旧目录保持不动。
