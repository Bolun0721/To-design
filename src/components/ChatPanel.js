import { h } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import htm from 'htm'
import { CHAT_SUGGESTIONS } from '../agent/chat.js'

const html = htm.bind(h)

export function ChatPanel({
  messages = [],
  busy = false,
  keyReady = false,
  canUndo = false,
  reference = null,
  onClearReference,
  onSend,
  onUndo,
}) {
  const [text, setText] = useState('')
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, busy])

  useEffect(() => {
    if (reference?.nonce && inputRef.current) inputRef.current.focus()
  }, [reference?.nonce])

  const submit = (value) => {
    const instruction = String(value ?? text).trim()
    if (!instruction || busy || !keyReady) return
    const prefix = reference
      ? `【引用板块：${reference.label || reference.id}（${reference.id}）】`
      : ''
    onSend(`${prefix}${instruction}`)
    setText('')
    if (inputRef.current) inputRef.current.focus()
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return html`
    <section class="chat-panel">
      <div class="chat-head">
        <div>
          <span class="chat-kicker">自然语言微调</span>
          <p class="chat-title">改这一版</p>
        </div>
        ${canUndo
          ? html`<button class="chat-undo" onClick=${onUndo} type="button">撤销上次修改</button>`
          : null}
      </div>

      <div class="chat-messages" ref=${listRef}>
        ${messages.length === 0
          ? html`
              <div class="chat-empty">
                <p>用一句话改这一版，例如：</p>
                <p class="chat-examples">「标题再大一点」「换成财经日报配色」「把标题往下挪一点」</p>
                <p class="chat-muted">助手只会改你指出的部分，版式骨架和照片保持不变。</p>
              </div>
            `
          : null}
        ${messages.map(
          (message, index) => html`
            <div key=${index} class=${`chat-msg ${message.role}`}>
              <div class="chat-who">
                ${message.role === 'user' ? '你' : message.role === 'error' ? '请求失败' : '编辑助手'}
                ${message.applied ? html`<span class="chat-applied">已应用</span>` : null}
              </div>
              <div class="chat-text">${message.text}</div>
            </div>
          `,
        )}
        ${busy
          ? html`
              <div class="chat-msg assistant">
                <div class="chat-who">编辑助手</div>
                <div class="chat-text chat-typing"><span></span><span></span><span></span></div>
              </div>
            `
          : null}
      </div>

      ${!keyReady
        ? html`<div class="chat-note">先在左侧「03 / 模型」填写 API Key，对话微调才会生效。</div>`
        : null}

      <div class="chat-suggestions">
        ${CHAT_SUGGESTIONS.map(
          (suggestion) => html`
            <button
              class="chat-chip"
              type="button"
              disabled=${busy || !keyReady}
              onClick=${() => submit(suggestion)}
            >
              ${suggestion}
            </button>
          `,
        )}
      </div>

      ${reference
        ? html`
            <div class="chat-reference">
              <span class="chat-ref-kicker">引用板块</span>
              <strong>${reference.label || reference.id}</strong>
              <span class="chat-ref-id">${reference.id}</span>
              <button
                class="chat-ref-clear"
                type="button"
                title="取消引用"
                onClick=${onClearReference}
              >
                ×
              </button>
            </div>
          `
        : null}

      <div class="chat-compose">
        <textarea
          ref=${inputRef}
          class="chat-input"
          rows="2"
          value=${text}
          disabled=${busy || !keyReady}
          placeholder=${keyReady
            ? reference
              ? `针对「${reference.label || reference.id}」说明要改什么…`
              : '例如：标题再大一点，换成财经日报配色…'
            : '请先填写 API Key'}
          onInput=${(event) => setText(event.currentTarget.value)}
          onKeyDown=${onKeyDown}
        ></textarea>
        <button
          class="chat-send"
          type="button"
          disabled=${busy || !keyReady || !text.trim()}
          onClick=${() => submit()}
        >
          ${busy ? '…' : '发送'}
        </button>
      </div>

      <p class="chat-foot">Enter 发送 · Shift + Enter 换行 · 最多只改 1–3 个字段</p>
    </section>
  `
}
