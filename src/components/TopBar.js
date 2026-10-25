import { h } from 'preact'
import htm from 'htm'

const html = htm.bind(h)

export function TopBar({
  view,
  keyReady,
  modelLabel,
  demo,
  theme,
  mode = 'standard',
  onModeChange,
  draftCount = 0,
  saveState = 'idle',
  onToggleTheme,
  onOpenDrafts,
  onOpenSkill,
  onOpenPrompt,
}) {
  const viewLabel = view === 'intro' ? '开始' : view === 'gallery' ? '方案对比' : '画布编辑'
  const isLight = theme === 'light'
  const draftTitle =
    saveState === 'saving'
      ? '正在保存草稿…'
      : saveState === 'error'
        ? '草稿保存失败'
        : '本地草稿（自动保存）'

  return html`
    <header class="app-header">
      <div class="brand">
        <span class="brand-mark">头</span>
        <span class="brand-text">
          <span class="brand-name">头版智造局</span>
          <span class="brand-en">Front Page Lab</span>
        </span>
      </div>
      <span class="header-sep"></span>
      <span class="header-crumb">BYOK 智能头版 <strong>/ ${viewLabel}</strong></span>
      <span class="header-fill"></span>
      <label class=${`mode-select ${mode === 'design' ? 'is-design' : ''}`}>
        <span class="mode-label">模式</span>
        <select
          value=${mode}
          onChange=${(event) => onModeChange?.(event.currentTarget.value)}
          aria-label="生成模式"
          title=${mode === 'design' ? '设计模式：自由选模板/配色/字体' : '标准模板模式：按风格包生成'}
        >
          <option value="standard">标准模板</option>
          <option value="design">设计模式</option>
        </select>
      </label>
      <span class="header-status">
        <span class=${`status-dot ${keyReady ? 'ok' : demo ? 'demo' : ''}`}></span>
        ${keyReady ? modelLabel || '模型已连接' : demo ? '示例模式 · 未连接模型' : '未连接模型'}
      </span>
      <button
        class=${`header-btn draft-btn ${saveState}`}
        onClick=${onOpenDrafts}
        type="button"
        title=${draftTitle}
        aria-label="本地草稿"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
        </svg>
        <span class="draft-label">草稿</span>
        <span class="draft-count">${draftCount}</span>
      </button>
      <button
        class="header-btn theme-btn"
        onClick=${onToggleTheme}
        type="button"
        title=${isLight ? '切换到暗色主题' : '切换到亮色主题'}
        aria-label=${isLight ? '切换到暗色主题' : '切换到亮色主题'}
      >
        ${isLight
          ? html`
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
              </svg>
            `
          : html`
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            `}
        <span>${isLight ? '暗色' : '亮色'}</span>
      </button>
      <button class="header-btn" onClick=${onOpenSkill}>设计 SKILL</button>
      <button class="header-btn accent" onClick=${onOpenPrompt}>系统提示词</button>
    </header>
  `
}
