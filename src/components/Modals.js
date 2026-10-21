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
