import { h } from 'preact'
import htm from 'htm'

const html = htm.bind(h)

export function TopBar({
  view,
  keyReady,
  modelLabel,
  demo,
  theme,
  onToggleTheme,
  onOpenSkill,
  onOpenPrompt,
}) {
  const viewLabel = view === 'intro' ? '开始' : view === 'gallery' ? '方案对比' : '画布编辑'
  const isLight = theme === 'light'

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
      <span class="header-status">
        <span class=${`status-dot ${keyReady ? 'ok' : demo ? 'demo' : ''}`}></span>
        ${keyReady ? modelLabel || '模型已连接' : demo ? '示例模式 · 未连接模型' : '未连接模型'}
      </span>
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
