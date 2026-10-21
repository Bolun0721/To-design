import { h } from 'preact'
import htm from 'htm'
import { Modal } from './Modals.js'

const html = htm.bind(h)

function pad(n) {
  return String(n).padStart(2, '0')
}

function timeLabel(ts) {
  const date = new Date(ts)
  if (!Number.isFinite(date.getTime())) return ''
  const now = new Date()
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  if (date.toDateString() === now.toDateString()) return `今天 ${time}`
  return `${date.getMonth() + 1}月${date.getDate()}日 ${time}`
}

export function DraftsModal({ drafts = [], currentId, onOpen, onDelete, onNew, onClose }) {
  return html`
    <${Modal}
      title="本地草稿"
      subtitle="自动保存在本机浏览器 IndexedDB；API Key 不会写入草稿，清理浏览器数据会一并删除。"
      onClose=${onClose}
    >
      <div class="drafts-toolbar">
        <span class="drafts-count">${drafts.length} 份草稿</span>
        <button class="drafts-new" type="button" onClick=${onNew}>＋ 新建草稿</button>
      </div>

      ${drafts.length === 0
        ? html`
            <div class="drafts-empty">
              <p>还没有草稿。</p>
              <p class="chat-muted">生成或载入示例后会自动保存；也可以新建一份空白草稿。</p>
            </div>
          `
        : html`
            <div class="draft-list">
              ${drafts.map(
                (draft) => html`
                  <div class=${`draft-row ${draft.id === currentId ? 'current' : ''}`}>
                    <div
                      class="draft-thumb"
                      style=${`background:${draft.background || '#FFFFFF'};color:${draft.ink || '#1A1A1A'};border-color:${draft.accent || '#C8102E'}`}
                    >
                      <span class="draft-letter">${draft.letter || '·'}</span>
                      <i
                        class="draft-accent"
                        style=${`background:${draft.accent || '#C8102E'}`}
                      ></i>
                    </div>
                    <div class="draft-info">
                      <div class="draft-title">
                        ${draft.title || '未命名草稿'}
                        ${draft.id === currentId
                          ? html`<span class="draft-current">当前</span>`
                          : null}
                      </div>
                      <div class="draft-sub">
                        ${draft.schemeCount || 0} 套方案 · ${draft.format === 'poster' ? '海报' : '报纸'} · ${timeLabel(draft.updatedAt)}
                      </div>
                      <div class="draft-desc">
                        ${draft.description || draft.subtitle || '未填写描述'}
                      </div>
                    </div>
                    <div class="draft-actions">
                      <button class="slot-btn" type="button" onClick=${() => onOpen(draft.id)}>
                        打开
                      </button>
                      <button
                        class="slot-btn danger"
                        type="button"
                        onClick=${() => onDelete(draft.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                `,
              )}
            </div>
          `}

      <p class="modal-sub" style="margin-top:14px">
        打开草稿会恢复方案、照片、对话和画布位置；新建草稿不会删除当前草稿。
      </p>
    <//>
  `
}
