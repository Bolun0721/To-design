# 头版智造局 · FRONT PAGE LAB

> 一张照片 → 三套报纸/海报头版 → 拖动微调 → 导出 PNG / 打印 PDF。
> 纯前端、零构建、BYOK（用户自带模型 Key）的落地 demo。

![落地页](docs/01-intro.png)

---

## 这是什么

一个网页端的「智能头版」agent：

1. 用户上传一张照片，写一句描述，填入任意 OpenAI 兼容模型的 API Key；
2. 模型按内置的**报纸设计总监提示词 + 设计 Skill**，输出 3 套结构化方案；视觉模板可从 **9 种报纸/海报模板**中按三组风格包切换（经典 / 几何 / 系统）；
3. 前端模板引擎做**确定性渲染**——颜色只能来自预设白名单，版式坐标由模板给出，模型只写内容；
4. 用户并排比较三套方案，选一套进入画布：版块可拖动、可缩放、双击改字，主色 / 栏数 / 字号 / 图片处理实时重排；
5. 画布左下角提供 **20–100% 缩放条**与「适应」；单击板块出现选中框和加粗名称卡片，双击卡片可把该板块**引用到对话**；
6. 编辑器画布在**同源 iframe 沙箱**中渲染，拖动 / 双击 / 导出都在沙箱内完成，父页面只通过 `postMessage` 同步状态；
7. 经典大报的报纸版支持「主图 + 次图」双图位：右侧「图片槽位」上传第二张，或保留占位块；
8. 右侧「对话微调」用一句话改这一版（标题放大、换配色、正文两栏、标题下移），模型返回最小 JSON patch，可撤销；
9. 顶栏一键切换**暗色（原版）/ 亮色（米白 + 电光蓝）**工作室主题，选择会记住；
10. **本地草稿自动保存**：方案、照片、对话和画布位置写入 IndexedDB，刷新恢复；顶栏「草稿」可查看 / 打开 / 删除；
11. 导出 2× PNG，或打印 / 存为 A4 PDF（海报为 4:5）。

产物是真实的排版图片，不是聊天窗口里的一段文字。

![三套方案](docs/02-gallery.png)

## 快速开始

不需要 `npm install`，运行时依赖已经 vendor 到 `public/vendor/`：

```bash
node server.mjs
# → http://127.0.0.1:5173
```

要求 Node 18+（推荐 20+，使用全局 `fetch`）。

打开页面后：

- 点 **「载入示例，先看效果」**，用内置示例稿件直接体验完整流程（不需要 Key）；
- 或上传照片、填写描述、配置模型 Key，点 **「生成 3 个方案」**。

### 桌面一键启动（本机）

本机桌面已放置 **`启动头版智造局.bat`**，双击即可：检测是否已运行 → 启动本地服务 → 2 秒后自动打开浏览器。

- 启动窗口需要保持打开；**关闭窗口即停止服务**。
- 再次双击只会打开浏览器，不会重复启动。
- 项目内的对应脚本是 `scripts/launch-demo.bat`；加 `nobrowser` 参数可只启动服务、不打开浏览器（用于测试）。
- 如果移动了项目目录，编辑桌面 `.bat` 里的 `PROJECT` 路径即可。

也可以直接用 URL 进入某个状态（方便演示 / 截图）：

```
http://127.0.0.1:5173/?demo=1                      # 示例稿件 → 三套方案
http://127.0.0.1:5173/?demo=1&scheme=B             # 直接打开方案 B 画布
http://127.0.0.1:5173/?demo=1&scheme=B&format=poster  # 海报模式
http://127.0.0.1:5173/?theme=light                 # 亮色主题
http://127.0.0.1:5173/?demo=1&theme=light          # 亮色 + 示例
```

![编辑画布](docs/03-editor.png)

## 接入真实模型（BYOK）

左侧「03 / 模型」里填写：

| 字段 | 说明 |
|---|---|
| API Key | 只存 `sessionStorage`，关闭标签页即失效 |
| 服务商 | DeepSeek / OpenAI / Moonshot / 智谱 / SiliconFlow / 自定义 |
| Base URL | OpenAI 兼容地址，如 `https://api.deepseek.com/v1` |
| 模型名 | 如 `deepseek-chat`、`gpt-4o-mini`、`glm-4-flash` |
| 请求方式 | `自动`：本地开发走中继，静态部署走直连；也可手动切换 |
| 让模型直接看图 | 仅视觉模型可用；不勾选时模型只根据文字描述写稿 |

本地中继（`POST /api/llm`）只做一件事：把请求转发到你填的 Base URL，解决部分模型的 CORS 限制。
它**不落盘、不记录 Key**，并拒绝非 https、本机地址。生产部署可改为直连或自己加一层 Serverless 中继。

> 如果你不是用 `node server.mjs` 启动，而是用任意静态服务器打开本项目，请把「请求方式」改成
> **浏览器直连**——那种情况下没有本地中继，需要模型服务商允许浏览器 CORS。

DeepSeek 示例配置：

```
服务商：DeepSeek
Base URL：https://api.deepseek.com/v1
模型名：deepseek-chat
```

> DeepSeek 的对话模型不接收图片，勾选「让模型直接看图」会失败；需要读图时换 OpenAI / 智谱视觉模型。

## 三套方案、九种模板与风格包

模型被要求输出三套**角度不同**的稿子（正式纪念 / 社交传播 / 克制动人），前端再用模板渲染。下表是「经典三式」风格包的默认组合：

| 方案 | 版式 | 配色 | 特征 | 适合 |
|---|---|---|---|---|
| A | `classic_broadsheet` 经典大报 | `classic_serious` 经典严肃 | 双线报头、**主图 + 次图双图位**、三栏正文、红色首字 | 打印留存 / 纪念 |
| B | `tabloid_bold` 小报冲击 | `financial_daily` 财经日报 | 满版压图标题、强调色横幅、双栏 | 社交分享 / 活动 |
| C | `minimal_masthead` 极简报头 | `newsprint_single_accent` 新闻纸单色 | 居中窄图、细线分区、大留白 | 展陈 / 画册 |

目前共 **9 种模板 / 3 组风格包**，一次仍然只显示 3 套：

| 风格包 | 三种模板 | 关键词 |
|---|---|---|
| 经典三式 | 经典大报 · 小报冲击 · 极简报头 | 正式、冲击、留白 |
| 几何三式 | 构成主义 · 包豪斯 · 风格派 | 斜切红黑、红黄蓝积木、粗黑线分格 |
| 系统三式 | NASA 朋克 · 瑞士风格 · 卡带未来 | 硬件面板、模块网格、黑底显像管 |

- 六个新风格按《六种经典设计风格提示词》整理：构成主义 / 包豪斯 / NASA 朋克 / 风格派 / 瑞士风格 / 卡带未来；
- 每个模板都有**报纸 + 海报两套坐标**、独立配色、字体和 CSS 装饰；
- 生成仍只出 3 套；画廊顶部的「换一组」或底部「再换三种风格」会切到下一包，**保留三套稿子的内容**，只重排版式、配色和字体；
- 生成时模型只负责 A/B/C 三种内容角度，视觉层由当前风格包覆盖；
- 换风格包会重排模板并恢复该包默认色 / 字体，**之前手动拖过的位置、改过的颜色会被重置**；建议在进入画布前先选好风格包。

![几何三式](docs/11-styles.png)

![系统三式](docs/14-styles-system.png)

同一套内容可在**报纸（A4 210×297）**与**海报（4:5 800×1000）**之间切换，两套版式坐标独立保存：

![海报模式](docs/04-poster.png)

### 多图：经典大报的双图位

- **经典三式**的报纸版方案 A 使用 **主图 63% + 次图 25%** 的双图位，两张图各自有图注，都可拖动、缩放、单独导出；
- 上传入口在右侧检查器「图片槽位」：主图沿用左侧上传，次图可在这里 **上传 / 更换 / 移除**；
- 没有次图时渲染设计过的占位块，不会复用主图、不会编造 URL；
- 海报与其它版式保持单图，避免两张图抢同一个视觉焦点；切回经典三式时次图仍会保留；
- LLM 侧新增 `caption_secondary` 与 `image_placeholders[{ slot, aspect_ratio, purpose }]`，由前端校验后渲染。

![多图导出](docs/08-export.png)

颜色、字体、版式全部来自 `src/config/presets.js`（移植自 `newspaper-design-presets.json`）。模型不输出任何 hex 色值，越界会被前端硬校验回退。

## 内置提示词与设计 Skill

- `src/agent/systemPrompt.js`：角色、能力边界、写作流程、反俗套清单、白名单、JSON Schema、自检项；
- `src/agent/designSkill.js`：蒸馏自 `garden-skills/web-design-engineer` 的设计纪律（阅读顺序、网格留白、字体层级、色彩纪律、印刷工艺、反 AI 味），随系统提示词一起发送；
- `src/agent/chat.js`：对话微调的专用提示词 + `patch` 白名单 / 应用 / 夹紧，与生成提示词分开；
- 页面右上角 **「设计 SKILL」/「系统提示词」** 可以看到全文，方便调参。

![设计 Skill](docs/05-skill.png)

模型只被允许输出这个结构（节选）：

```json
{
  "summary": "…推荐 B…",
  "meta": { "date": "2026年10月20日", "disclaimer": "创意报纸版式，非真实新闻" },
  "schemes": [
    {
      "id": "A",
      "name": "巷口纪事",
      "layout_variant": "classic_broadsheet",
      "color_preset": "classic_serious",
      "font_pairing": "serif_serif",
      "style": { "columns": 3, "headline_scale": "large", "image_treatment": "original" },
      "content": {
        "headline": "巷口那杯手冲",
        "subhead": "…",
        "body_blocks": [{ "type": "paragraph", "text": "…" }],
        "caption": "…",
        "caption_secondary": "次图说明（仅经典大报，可选）",
        "pullquote": "…",
        "date": "2026年10月20日",
        "image_placeholders": [
          { "slot": "secondary", "aspect_ratio": "3:4", "purpose": "次图占位说明" }
        ]
      },
      "design_rationale": "正式报道腔，适合打印留存与纪念"
    }
  ]
}
```

前端 `src/agent/validate.js` 做二次硬校验：3 套方案、版式 / 配色 / 字体白名单、三者互不重复、标题与正文字数、脚本 / HTML 清洗、颜色从 preset 派生、越界修复并在「生成摘要」中列出警告。

## 交互与导出

- **拖动版块**：按住任意版块拖动，带版心参考线和 5% / 中线吸附；显示实时坐标；
- **画布缩放**：左下角 20–100% 滑条 + 「适应」按钮；手动放大超过适应比例后，舞台出现滚动条，纸张不会被裁切；
- **缩放版块**：悬停右下角手柄拖动（图片块会同时改变高度）；
- **双击改字**：标题 / 副标题 / 图注 / 引语 / 正文段落均可直接编辑，`Esc` 取消，`⌘/Ctrl+Enter` 提交；
- **板块选中与引用**：单击任意板块出现选中框和加粗名称卡片；双击这张卡片（或按 Alt 双击图片 / 板块）把该板块引用到对话，右侧自动切到对话 tab，输入框上方出现引用 chip，发送时自动带上 `【引用板块：名称（block_id）】`；点画布空白处取消选中；
- **iframe 画布**：编辑器 Paper 渲染在同源 `srcdoc` iframe 内；父页面发送方案 / 缩放 / 主题，iframe 内处理拖动、双击和导出，再通过 `postMessage` 回传。父页面样式不会穿透到纸张（同源 CSS/DOM 隔离，不是安全边界）；
- **Tweak 控件**：主色（含对比度提示）、正文栏数 1/2/3、标题字号三档、图片处理（原图 / 黑白半调 / 双色调）、字体搭配；
- **图片槽位**：主图 / 次图缩略图与上传状态；次图支持更换、移除，移除后自动变成占位块；
- **对话微调**：右侧 tab，一句话 → 最小 patch，可撤销（见下节）；
- **明暗主题**：顶栏切换暗色原版 / 米白 + 电光蓝，`localStorage` 记忆；
- **导出**：iframe 内 html2canvas 2× PNG，结果经 `postMessage` 回传父页面下载；打印把同一张高清图放进 `@page` A4 / 4:5 的打印窗口；
- 导出前会把半调 / 双色调**烘焙进图片像素**（html2canvas 不渲染 CSS filter），保证预览与导出基本一致；同时临时取消 iframe 内的画布缩放，按 794×1123 / 800×1000 原始尺寸渲染。
  > 注意：html2canvas 1.4 不能解析 `color-mix()` 计算出的 `color(srgb …)`，纸张相关样式不要用 `color-mix`，否则导出会抛 `unsupported color function "color"`；当前纸张样式全部使用 hex / rgba。

![导出结果](docs/08-export.png)

![板块选中卡片](docs/12-selection.png)

![引用到对话](docs/13-reference.png)

## 明暗主题

- 顶栏「亮色 / 暗色」切换，`localStorage` 记住选择；`?theme=light` / `?theme=dark` 可直接进入。
- 暗色：原来的黑红工作室；亮色：米白纸感 + 电光蓝 `#4D6BFE` 的 DeepSeek 主题。
- 主题只改工作室外壳（导航、输入、画布背景、检查器、弹窗、聊天），**不改报纸/海报自身的 `color_preset`**——导出的图片仍然是方案本身的配色。
- 首次加载时在 `index.html` 的内联脚本里先写 `data-theme`，避免闪白 / 闪黑。

![亮色主题](docs/06-light.png)

## 对话微调（Phase 3）

右侧检查器的「对话微调」tab：用一句话改当前这一版。

![对话微调](docs/07-chat.png)

- 输入指令（或点快捷 chips）→ 模型读取**当前方案 JSON + 当前画布坐标 + 最近 4 句对话**，返回 `{ reply, patch }`；
- patch 只能落在白名单：`color_preset` / `font_pairing` / `style.columns|headline_scale|image_treatment` / `content.*` / `layout_moves`（dx / dy ±12、dw ±15 个百分点）；
- 前端 `applyChatPatch` 做夹紧与清洗：版式骨架、照片、日期、块数量都不能改；越界坐标会被 clamp；
- 「撤销上次修改」保留每个方案最近 10 次对话 patch 的快照；
- 没有 Key 时对话输入禁用；对话失败会以红色气泡显示原因，不影响画布；
- 提示词独立在 `src/agent/chat.js`，与生成提示词分开，便于单独调。

> 对话记录会随草稿保存，打开草稿后 ChatPanel 会恢复消息；但发给模型的上下文仍然只带最近 4 句（不做长期记忆）。要整版重构，回左侧重新生成更稳。

## 本地草稿 / 对话历史

- **自动保存**：800ms 防抖，把 `schemes / photo / photo2 / chats / view / active / format / meta` 写入 IndexedDB；
- **刷新恢复**：`localStorage` 只存当前草稿 id，启动时读取草稿并恢复到画廊 / 画布；
- **草稿列表**：顶栏「草稿 N」→ 打开 / 删除 / 新建；当前草稿有「当前」标记；
- 照片以 data URL 存 IndexedDB；**API Key 不写入草稿**，仍在 `sessionStorage`；
- 对话历史随草稿保存，恢复后能看到之前的指令与回复；
- 浏览器禁用 IndexedDB 或配额不足时会提示保存失败，但不影响当前编辑。

![草稿列表](docs/09-drafts.png)

![刷新恢复](docs/10-drafts-restored.png)

## 架构

```
index.html (import map + vendored Preact/htm/html2canvas + theme 预置)
  └─ src/App.js                 状态机：intro → gallery → editor；主题 / 对话 / 草稿 / 自动保存
       ├─ components/InputRail  素材 / 格式 / BYOK / 生成
       ├─ components/Gallery    三套方案并排 + 风格包切换
       ├─ components/Editor     画布 + 缩放条 + 方案 tab
       ├─ components/IframePaper iframe 沙箱宿主：状态发送 / 选中引用 / 事件接收 / 导出请求
       ├─ components/Paper      模板引擎：blocks → 报纸/海报 DOM（预览 + iframe 内）
       ├─ components/Inspector  设计 tab / 对话 tab + 图片槽位 + 导出 + JSON
       ├─ components/ChatPanel  对话消息 / 快捷指令 / 引用 chip / 撤销
       ├─ components/DraftsModal 草稿列表 / 打开 / 删除 / 新建
       └─ components/Modals     Skill / Prompt / JSON 查看
  └─ sandbox/entry.js           iframe 内入口：渲染 Paper、拖动/改字、选中卡片、html2canvas 导出
  └─ agent/
       ├─ systemPrompt.js       生成提示词 + Schema + 白名单
       ├─ designSkill.js        内置设计 Skill
       ├─ chat.js               对话微调提示词 + patch 校验 / 应用
       ├─ llm.js                OpenAI 兼容请求、JSON 提取、错误翻译
       ├─ validate.js           硬校验 / 修复 / 布局注入
       └─ demoData.js           离线示例稿件
  └─ config/presets.js          11 组配色、5 组字体、9 套版式 × 2 格式
  └─ config/stylePacks.js       3 组风格包：经典 / 几何 / 系统
  └─ lib/                       image / exportPaper / drafts（IndexedDB 草稿）
  └─ styles.css / theme-chat.css 工作室外壳 / 9 套模板样式 + 明暗主题 + 对话面板 + 草稿
server.mjs                      静态服务 + /api/llm 极薄中继（零依赖）
```

**和 Open Design 的对应关系**（按其交互纪律做的垂直化简化）：

| Open Design | 本 demo |
|---|---|
| 多方案画布并排 | 三套版式缩略图并排 |
| 点选深入 | 点卡片进入大画布，顶部 tab 切换 |
| Tweak controls | 主色 / 栏数 / 标题字号 / 图片处理 / 画布缩放 |
| 持续对话 | 右侧「对话微调」：一句话 → 最小 JSON patch → 可撤销；可引用选中板块 |
| 模板库 | 9 套报纸/海报模板，按 3 组风格包轮换；内容保留，视觉重排 |
| iframe 沙箱画布 | 编辑器 Paper 渲染在同源 srcdoc iframe 内；拖动 / 双击 / 导出在沙箱内，`postMessage` 回传；父页面样式不穿透 |
| 确定性导出 | 2× PNG + 打印 PDF |
| BYOK 本地优先 | Key 只存 sessionStorage，中继不落盘 |
| 本地 daemon | 不需要：模型只写 JSON，不碰文件系统 |

**为什么没有做成图片生成模型？** 报纸的可信度来自「可读的文字 + 稳定的版式」，扩散模型画不出可排版的正文。这里让 LLM 写稿、模板引擎排版、浏览器导出图片——每一步都是确定性的，也才能支持拖动、改字和打印。

## 目录

```
.
├── .github/workflows/ci.yml   # CI：语法检查 + npm test（导出矩阵需本地浏览器）
├── index.html                 # 入口（import map + 字体 + html2canvas）
├── server.mjs                 # 零依赖静态服务 + LLM 中继
├── src/
│   ├── App.js
│   ├── main.js
│   ├── styles.css             # 工作室外壳 + 报纸模板样式
│   ├── theme-chat.css         # 明暗主题 + 对话面板
│   ├── agent/                 # 提示词 / 校验 / 请求 / 示例 / 对话 patch
│   ├── components/            # Paper / IframePaper / Inspector / ChatPanel / DraftsModal …
│   ├── sandbox/entry.js       # iframe 内渲染 / 拖动 / 改字 / 选中卡片 / 导出
│   ├── config/presets.js      # 11 组配色 / 5 组字体 / 9 套版式
│   ├── config/stylePacks.js   # 3 组风格包与包切换
│   └── lib/                   # image / exportPaper / drafts（IndexedDB 草稿）
├── public/
│   ├── demo/coffee.jpg        # 程序化生成的示例照片（主图）
│   ├── demo/coffee-2.jpg      # 程序化生成的示例照片（次图）
│   └── vendor/                # preact / htm / html2canvas（浏览器直接加载）
├── scripts/
│   ├── launch-demo.bat        # Windows 一键启动（桌面 .bat 调用）
│   ├── make_demo_photo.py     # 生成示例主图（Pillow）
│   ├── make_demo_photo_2.py   # 生成示例次图（Pillow）
│   ├── test-validate.mjs      # 校验层单测
│   ├── test-chat.mjs          # 对话 patch 单测
│   ├── check-css.mjs          # 护栏：禁止 html2canvas 不支持的 CSS 颜色函数
│   ├── export-matrix.mjs      # 3 方案 × 2 格式 × 2 主题 导出矩阵
│   ├── mock-llm.mjs           # 本地 mock 模型（生成 + 对话 patch）
│   ├── cdp-check.mjs          # iframe 隔离：父页面无 .paper / 样式不穿透
│   ├── cdp-sandbox.mjs        # 缩放条 / 选中卡片 / 引用对话 / iframe 拖动 / 导出
│   ├── cdp-styles.mjs         # 3 组风格包轮换 + 六种新风格截图
│   ├── cdp-style-export.mjs   # 六种新风格 × 报纸/海报导出 12 例
│   ├── cdp-generate.mjs       # 真实点击生成的端到端测试
│   ├── cdp-chat.mjs           # 对话 patch / 撤销 / 主题切换 自检
│   ├── cdp-export.mjs         # 亮色主题下报纸 / 海报按钮导出 自检
│   ├── cdp-multi.mjs          # 双图 → 占位 → 重新上传 自检
│   ├── cdp-drafts.mjs         # 自动保存 / 刷新恢复 / 对话历史 / 删除 自检
│   └── cdp-modals.mjs         # 弹窗自检
└── docs/                      # README 截图
```

## 自检脚本

```bash
# 1. 单测 + CSS 颜色护栏（无需浏览器）
npm test
# PowerShell 执行策略禁止 npm.ps1 时用：npm.cmd test

# 2. 本地 mock 模型（另开终端）
node scripts/mock-llm.mjs

# 3. 启动 demo
node server.mjs

# 4. 用 Edge/Chrome 无头 + CDP 跑交互 / 生成 / 对话 / 弹窗
#    先启动浏览器：
#    msedge --headless=new --remote-debugging-port=9222 \
#      --user-data-dir=%TEMP%\edge-demo http://127.0.0.1:5173/?demo=1&scheme=B
node scripts/cdp-check.mjs
node scripts/cdp-sandbox.mjs
node scripts/cdp-styles.mjs
node scripts/cdp-style-export.mjs
node scripts/cdp-generate.mjs
node scripts/cdp-chat.mjs
node scripts/cdp-export.mjs
node scripts/cdp-multi.mjs
node scripts/cdp-drafts.mjs
node scripts/cdp-modals.mjs

# 5. 经典导出矩阵：3 方案 × 2 格式 × 2 主题 = 12 例
node scripts/export-matrix.mjs
```

当前自检结果：

- `npm test` 通过（校验 / 对话 patch / CSS 颜色护栏，含 9 模板 / 3 风格包断言）；
- iframe 隔离：父页面不再渲染 `.paper`，iframe 内 12 个版块；父页面注入 `.headline` 样式不穿透，0 异常；
- 画布缩放：52% → 100% → 52%，100% 时舞台 `scrollWidth > clientWidth`，纸张不被裁切；
- 板块选中：单击出现选中框与「主标题」卡片；双击卡片切到对话 tab 并出现引用 chip；发送指令中带 `【引用板块：主标题（headline）】`；
- iframe 交互：沙箱内拖动（left 5→10）、双击改字、换色回渲染；父页面触发导出得到 1588×2246 PNG，0 异常；
- 风格包：经典三式 → 几何三式 → 系统三式 → 回到经典，三套内容摘要保持不变，0 异常；
- 六种新风格 × 报纸/海报：**12/12 导出通过**，0 未捕获异常；页脚、斜线、彩条和网格都进入 PNG；
- 多图自检：示例 2 图 → 移除次图变占位（仍可导出）→ 重新上传恢复 2 图，0 异常；
- 草稿自检：自动保存 → 刷新恢复方案 + 对话历史 → 新建草稿 → 从列表打开 → 删除，0 异常；
- 经典导出矩阵 **12/12 通过**：暗色、亮色 × 报纸、海报 × 方案 A/B/C，报纸 1588×2246、海报 1600×2000，单例约 1.3–1.9s，**0 未捕获异常**；
- mock 模型端到端生成 3 套方案；对话 patch 应用与撤销通过；明暗主题切换 + `localStorage` 持久化通过；三个弹窗渲染正常。

> `cdp-sandbox` 会写 mock Key 并真的发一条引用对话，所以需要先启动 `mock-llm.mjs`；`cdp-check` / `cdp-styles` / `cdp-style-export` 不需要 mock。
> CI 只跑语法检查 + `npm test`；导出矩阵需要本地服务与无头浏览器，放在本地 / 发布前手动跑。
> `check-css.mjs` 会拦住 `color-mix()` / `color()` / `oklch()` 等 html2canvas 无法解析的写法——这正是上次导出失败的根因。

## 第三方与许可

- **Preact**（MIT）、**htm**（Apache-2.0）、**html2canvas**（MIT）已 vendor 到 `public/vendor/`，运行时无需安装；`package.json` 里的依赖仅用于重新拉取 / 升级这些文件。
- 示例照片由 `scripts/make_demo_photo.py` 用 Pillow 程序化生成，不依赖外部图库。
- 英文字体 Playfair Display / Source Sans 3 / Source Serif 4 / PT Serif / IBM Plex Mono 为 OFL 许可，通过 Google Fonts **可选、非阻塞**加载；离线时回退到 Georgia / 系统无衬线 / 等宽，中文回退到宋体 / 苹方 / 思源。

## 已知边界 / 下一步

- **不生成照片**：图片来自用户上传；没有图片模型，也不编造 URL；无图时渲染占位块；
- **没有后端与账号**：项目只存本机 IndexedDB，不存 Key，不做多人协作；
- **对话是短上下文**：每次只带当前方案和最近 4 句，不做长期记忆；要整版重构，重新生成更稳；
- **主题只作用于外壳**：纸张 / 海报的配色仍由 `color_preset` 决定，切主题不会改变导出图片的颜色；
- **拖动是自由拖动**，不是网格约束的 DTP；复杂版面仍建议按预设生成后再微调；
- **字体依赖本机**：中文用宋体 / 苹方 / 思源回退，英文用 Playfair / Source Sans / IBM Plex Mono；Google Fonts 为可选增强（非阻塞加载），离线时会回退；
- **多图范围**：目前只有「经典三式」的经典大报报纸版使用双图位；其他风格和海报保持单图，避免视觉焦点分裂；
- **风格包会重置微调**：在画廊换风格包会重排版式并恢复默认色 / 字体，之前手动拖过的位置不会保留；建议先选包再进画布；
- **六种新风格是模板化演绎**：按提示词提炼几何、配色、字体和装饰，不是历史原作的精确复刻；
- **iframe 是同源隔离**：用于 CSS / DOM / 选择隔离，不宣称是安全沙箱；跨域嵌入或多实例需要额外 `sandbox` 属性与消息白名单；
- **草稿只在本机**：IndexedDB 按浏览器 / 设备隔离，没有账号同步；清理浏览器数据会删除草稿；
- **移动端**：当前以桌面工作台为主，≤1080px 会隐藏右侧检查器；移动端布局需要单独设计。

下一步优先级：移动端。P0（导出矩阵 + CSS 颜色护栏 + CI）、P1（双图位 + 本地草稿 / 对话历史）、iframe 沙箱与九套模板 / 风格包已完成，见 `scripts/export-matrix.mjs`、`scripts/check-css.mjs`、`scripts/cdp-check.mjs`、`scripts/cdp-sandbox.mjs`、`scripts/cdp-styles.mjs`、`scripts/cdp-style-export.mjs`、`scripts/cdp-drafts.mjs`。

---

参考：Open Design 的多方案画布 / Tweak controls / BYOK 交互纪律；garden-skills `web-design-engineer` 的设计素养；`newspaper-design-presets.json` 的配色与字体白名单；六种经典设计风格提示词（构成主义 / 包豪斯 / NASA 朋克 / 风格派 / 瑞士 / 卡带未来）。
