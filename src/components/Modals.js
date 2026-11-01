import { h } from 'preact'
import { useEffect } from 'preact/hooks'
import htm from 'htm'
import { DESIGN_SKILL, DESIGN_SKILL_BULLETS } from '../agent/designSkill.js'

const html = htm.bind(h)

export function Modal({ title, subtitle, onClose, children, narrow = false }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return html`
    <div
      class="modal-backdrop"
      onMouseDown=${(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div class=${`modal ${narrow ? 'narrow' : ''}`} role="dialog" aria-modal="true">
        <div class="modal-head">
          <div>
            <h3 class="modal-title">${title}</h3>
            ${subtitle && html`<p class="modal-sub">${subtitle}</p>`}
          </div>
          <button class="modal-close" onClick=${onClose} aria-label="关闭">×</button>
        </div>
        <div class="modal-body">${children}</div>
      </div>
    </div>
  `
}

export function SkillModal({ onClose }) {
  return html`
    <${Modal}
      title="内置设计 Skill"
      subtitle="蒸馏自 garden-skills / web-design-engineer 的设计纪律，与报纸编辑设计合并，随系统提示词一起发送给模型。"
      onClose=${onClose}
    >
      <div class="skill-grid">
        ${DESIGN_SKILL_BULLETS.map(
          ([title, desc]) => html`
            <div class="skill-card">
              <div class="sk-t">${title}</div>
              <div class="sk-d">${desc}</div>
            </div>
          `,
        )}
      </div>
      <p class="skill-rule">Skill 全文</p>
      <pre>${DESIGN_SKILL}</pre>
    <//>
  `
}

export function PromptModal({ prompt, onClose }) {
  return html`
    <${Modal}
      title="系统提示词"
      subtitle="发给模型的完整 system prompt。当前日期在生成提示词时注入，模型只能输出受约束的 JSON。"
      onClose=${onClose}
    >
      <pre>${prompt}</pre>
      <p class="modal-sub" style="margin-top:12px">
        前端会对 JSON 做二次硬校验：版式 / 配色白名单、长度、body 段落数；越界会被修复并记录在「生成摘要」里。
      </p>
    <//>
  `
}

export function HelpModal({ onClose }) {
  return html`
    <${Modal}
      title="推荐模型与 API 申请"
      subtitle="两个平台对新用户都有免费额度；具体额度和有效期以官网活动页 / 控制台为准。"
      onClose=${onClose}
    >
      <div class="help-intro">
        <p>
          推荐组合：<strong>DeepSeek V4.1 Flash</strong> 负责写稿和排版，
          <strong>火山方舟 Seedream 4.0</strong> 负责生图。两个 Key 在应用里分开填写，
          生图 Key 不会复用排版 Key。
        </p>
      </div>

      <div class="help-grid">
        <section class="help-card">
          <div class="help-card-head">
            <span class="help-badge">排版推荐</span>
            <span class="help-platform">DeepSeek 开放平台</span>
          </div>
          <h4 class="help-model">DeepSeek V4.1 Flash</h4>
          <p class="help-desc">
            中文写稿、JSON 结构稳定，适合直接作为「排版模型」。控制台显示为 DeepSeek V4.1 Flash，
            模型名请填 <code>deepseek-flash</code>（旧版 <code>deepseek-v4-flash</code> 也仍可兼容）。
          </p>
          <ol class="help-steps">
            <li>打开 DeepSeek 开放平台，注册并登录；</li>
            <li>进入「API Keys」，创建一个新 Key 并立即复制保存；</li>
            <li>在应用「03 / 模型」选择「排版模型」，服务商选 DeepSeek；</li>
            <li>填入 Key，Base URL 使用 <code>https://api.deepseek.com/v1</code>，模型填 <code>deepseek-flash</code>。</li>
          </ol>
          <div class="help-links">
            <a class="help-link" href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer">开放平台</a>
            <a class="help-link" href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">创建 API Key</a>
            <a class="help-link" href="https://api-docs.deepseek.com/" target="_blank" rel="noopener noreferrer">API 文档</a>
          </div>
        </section>

        <section class="help-card">
          <div class="help-card-head">
            <span class="help-badge accent">生图推荐</span>
            <span class="help-platform">火山引擎 · 火山方舟</span>
          </div>
          <h4 class="help-model">Seedream 4.0</h4>
          <p class="help-desc">
            图片生成 / 图片编辑模型，适合生成或处理海报素材图。
            <strong>Seedance 是视频模型，不返回图片</strong>；这里请选择 Seedream。
          </p>
          <ol class="help-steps">
            <li>打开火山引擎，注册并完成实名认证；</li>
            <li>进入火山方舟控制台，开通图片生成 / Seedream 模型；</li>
            <li>在「API Key 管理」创建 Key，并复制保存；</li>
            <li>在应用「03 / 模型」选择「生图模型」→ 火山方舟；</li>
            <li>Base URL 填 <code>https://ark.cn-beijing.volces.com/api/v3</code>，模型填 <code>doubao-seedream-4-0</code>（以控制台模型 ID 为准），尺寸选 2K。</li>
          </ol>
          <div class="help-links">
            <a class="help-link" href="https://www.volcengine.com/product/ark" target="_blank" rel="noopener noreferrer">火山方舟</a>
            <a class="help-link" href="https://ai.volcengine.com/docs/ark-aihub/2647391?lang=zh" target="_blank" rel="noopener noreferrer">获取 API Key</a>
            <a class="help-link" href="https://ark.volcengine.com/region:cn-beijing/docs/image-generation-api" target="_blank" rel="noopener noreferrer">图片生成 API</a>
            <a class="help-link" href="https://ark.volcengine.com/region:cn-beijing/model/detail?Id=doubao-seedream-4-0" target="_blank" rel="noopener noreferrer">Seedream 4.0</a>
          </div>
        </section>
      </div>

      <h4 class="help-section-title">在应用里怎么填</h4>
      <div class="help-table-wrap">
        <table class="help-table">
          <thead>
            <tr><th>用途</th><th>服务商</th><th>Base URL</th><th>模型</th><th>Key</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>排版</td>
              <td>DeepSeek</td>
              <td><code>https://api.deepseek.com/v1</code></td>
              <td><code>deepseek-flash</code></td>
              <td>排版 Key</td>
            </tr>
            <tr>
              <td>生图</td>
              <td>火山方舟</td>
              <td><code>https://ark.cn-beijing.volces.com/api/v3</code></td>
              <td><code>doubao-seedream-4-0</code></td>
              <td>生图 Key（独立）</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 class="help-section-title">常见问题</h4>
      <ul class="help-faq">
        <li><strong>401 / 403：</strong>Key 复制不完整、未开通对应模型，或 Key 与平台不匹配。</li>
        <li><strong>404：</strong>Base URL 或模型 ID 不对。DeepSeek 用 <code>/v1</code>，火山方舟用 <code>/api/v3</code>。</li>
        <li><strong>生图报“无权限 / 模型不存在”：</strong>先在火山方舟控制台开通 Seedream，不要把 Seedance 填进来。</li>
        <li><strong>免费额度：</strong>两个平台的活动、额度和有效期会变化，以官网活动页和控制台显示为准。</li>
      </ul>

      <p class="help-footnote">
        官方链接均在下方新标签页打开；应用不会保存 Key 到服务器，只写入当前标签页的 sessionStorage。
      </p>
    <//>
  `
}

export function JsonModal({ scheme, onClose }) {
  const { layouts, ...rest } = scheme
  const json = JSON.stringify(rest, null, 2)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
    } catch {
      /* ignore */
    }
  }

  return html`
    <${Modal}
      title=${`方案 ${scheme.id} · ${scheme.name}`}
      subtitle="剥离 layouts 后的渲染规格：颜色由 preset 决定，坐标由前端模板给出，模型只提供内容与选择。"
      onClose=${onClose}
    >
      <div class="json-head">
        <span>JSON · ${json.length} chars</span>
        <button class="mini-btn" onClick=${copy}>复制</button>
      </div>
      <pre>${json}</pre>
    <//>
  `
}
