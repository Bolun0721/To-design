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
```

## 当前快照

| 版本 | 日期 | 说明 |
|---|---|---|
| `v0.5.0` | 2026-10-22 | 九套模板 / 三组风格包完成，双图与海报装饰文案优化前的基线 |
| `v0.6.0` | 2026-10-22 | 九套模板双图、海报装饰注记、多图补充图注；新增 `captions.js` |

## 新增版本

1. 复制 `src/agent/systemPrompt.js`、`src/agent/chat.js`、`src/agent/designSkill.js` 到 `versions/vX.Y.Z/`；
2. 写 `manifest.json`，记录日期、变更点和对应 Git 提交；
3. 在表格里加一行；
4. 改完源码后再把新版本复制一份，旧目录保持不动。
