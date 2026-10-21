import { h } from 'preact'
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import htm from 'htm'
import { TopBar } from './components/TopBar.js'
import { InputRail } from './components/InputRail.js'
import { Intro } from './components/Intro.js'
import { Gallery } from './components/Gallery.js'
import { Editor } from './components/Editor.js'
import { Inspector } from './components/Inspector.js'
import { JsonModal, PromptModal, SkillModal } from './components/Modals.js'
import { buildDemoPayload } from './agent/demoData.js'
import { buildSystemPrompt, buildUserPrompt } from './agent/systemPrompt.js'
import { buildChatSystemPrompt, buildChatUserPrompt, applyChatPatch } from './agent/chat.js'
import { normalizeSchemes, rebuildLayout } from './agent/validate.js'
import { PROVIDERS, defaultSettings, requestEdit, requestSchemes } from './agent/llm.js'
import { chineseDate, clampText, shortDate } from './lib/format.js'
import { DEMO_PHOTO, DEMO_PHOTO_2, readPhoto, renderTreatedPhoto } from './lib/image.js'
import { downloadCanvas, printCanvas, renderPaperPng } from './lib/exportPaper.js'
import { FORMATS, resolveStyle } from './config/presets.js'

const html = htm.bind(h)

const LS_SETTINGS = 'fpl.settings.v1'
const LS_THEME = 'fpl.theme.v1'
const SS_KEY = 'fpl.apikey.v1'

function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_SETTINGS)
    if (!raw) return defaultSettings()
    return { ...defaultSettings(), ...JSON.parse(raw) }
  } catch {
    return defaultSettings()
  }
}

function loadTheme() {
  try {
    return localStorage.getItem(LS_THEME) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function loadKey() {
  try {
    return sessionStorage.getItem(SS_KEY) || ''
  } catch {
    return ''
  }
}

export function App() {
  const [view, setView] = useState('intro')
  const [format, setFormat] = useState('newspaper')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photo2, setPhoto2] = useState(null)
  const [settings, setSettings] = useState(loadSettings)
  const [apiKey, setApiKey] = useState(loadKey)
  const [schemes, setSchemes] = useState([])
  const [active, setActive] = useState(0)
  const [summary, setSummary] = useState('')
  const [meta, setMeta] = useState({ date: chineseDate(), disclaimer: '创意报纸版式，非真实新闻' })
  const [warnings, setWarnings] = useState([])
  const [recommended, setRecommended] = useState('B')
  const [busy, setBusy] = useState(false)
  const [busyLabel, setBusyLabel] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)
  const [demoMode, setDemoMode] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [theme, setTheme] = useState(loadTheme)
  const [chats, setChats] = useState({})
  const [chatBusy, setChatBusy] = useState(false)
  const [chatUndo, setChatUndo] = useState({})

  const paperRef = useRef(null)
  const abortRef = useRef(null)
  const chatAbortRef = useRef(null)
  const toastTimer = useRef(null)
  const schemesRef = useRef(schemes)
  schemesRef.current = schemes

  const demo = useMemo(() => {
    try {
      const date = chineseDate()
      return normalizeSchemes(buildDemoPayload({ date, format: 'newspaper' }), {
        date,
        format: 'newspaper',
      }).schemes
    } catch {
      return []
    }
  }, [])

  const systemPrompt = useMemo(() => buildSystemPrompt(), [])
  const activeScheme = schemes[active] || null
  const provider = PROVIDERS.find((p) => p.id === settings.provider) || PROVIDERS[0]
  const keyReady = Boolean(apiKey.trim())

  useEffect(() => {
    try {
      localStorage.setItem(LS_SETTINGS, JSON.stringify(settings))
    } catch {
      /* ignore */
    }
  }, [settings])

  useEffect(() => {
    try {
      if (apiKey) sessionStorage.setItem(SS_KEY, apiKey)
      else sessionStorage.removeItem(SS_KEY)
    } catch {
      /* ignore */
    }
  }, [apiKey])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark'
    try {
      localStorage.setItem(LS_THEME, theme)
    } catch {
      /* ignore */
    }
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F6F1E6' : '#0b0b0c')
  }, [theme])

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
      if (chatAbortRef.current) chatAbortRef.current.abort()
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const showToast = useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  const applyResult = useCallback((result) => {
    if (chatAbortRef.current) {
      chatAbortRef.current.abort()
      chatAbortRef.current = null
    }
    setChats({})
    setChatUndo({})
    setChatBusy(false)
    setSchemes(result.schemes)
    setSummary(result.summary)
    setWarnings(result.warnings || [])
    setRecommended(result.recommended || 'B')
    setMeta({
      date: result.meta?.date || chineseDate(),
      disclaimer: result.meta?.disclaimer || '创意报纸版式，非真实新闻',
    })
    const idx = result.schemes.findIndex((s) => s.id === (result.recommended || 'B'))
    setActive(idx >= 0 ? idx : 0)
    setView('gallery')
  }, [])

  const loadDemo = useCallback(
    ({ targetView = 'gallery', letter = null, fmt = format } = {}) => {
      try {
        const date = chineseDate()
        const normalized = normalizeSchemes(buildDemoPayload({ date, format: fmt }), {
          date,
          format: fmt,
        })
        applyResult(normalized)
        setDemoMode(true)
        if (!photo) {
          setPhoto(DEMO_PHOTO)
          setPhoto2(DEMO_PHOTO_2)
        }
        setError('')
        if (letter) {
          const idx = normalized.schemes.findIndex((s) => s.id === letter)
          if (idx >= 0) {
            setActive(idx)
            setView(targetView)
            return
          }
        }
        setView(targetView)
      } catch (err) {
        setError(`示例稿件载入失败：${err.message}`)
      }
    },
    [applyResult, format, photo],
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requested = params.get('theme')
    if (requested === 'light' || requested === 'dark') setTheme(requested)
  }, [])

  // 方便演示 / 截图：?demo=1&scheme=B&format=poster
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') !== '1') return
    const fmt = params.get('format') === 'poster' ? 'poster' : 'newspaper'
    const letter = params.get('scheme')?.toUpperCase() || null
    setFormat(fmt)
    loadDemo({ targetView: letter ? 'editor' : 'gallery', letter, fmt })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generate = useCallback(async () => {
    if (busy) return
    if (!apiKey.trim()) {
      setError('还没有填写模型 API Key。请在左侧「03 / 模型」里填写，或点「用示例稿件预览」先看效果。')
      return
    }
    setBusy(true)
    setBusyLabel('模型正在写稿…')
    setError('')
    const controller = new AbortController()
    abortRef.current = controller
    const timer = setTimeout(() => controller.abort(), 120_000)
    const date = chineseDate()

    try {
      const result = await requestSchemes({
        apiKey,
        settings,
        system: buildSystemPrompt({ date }),
        user: buildUserPrompt({
          description,
          photoMeta: photo,
          secondaryPhotoMeta: photo2,
          formatLabel: FORMATS[format].label,
          date,
          vision: Boolean(settings.vision && (photo || photo2)),
        }),
        photoDataUrl: photo?.dataUrl,
        photo2DataUrl: photo2?.dataUrl,
        signal: controller.signal,
      })
      const normalized = normalizeSchemes(result.json, { date, format })
      applyResult(normalized)
      setDemoMode(false)
      showToast('三套头版方案已生成')
    } catch (err) {
      setError(
        err.name === 'AbortError'
          ? '请求超时（120 秒）。请检查网络，或换一个模型重试。'
          : err.message || '生成失败',
      )
    } finally {
      clearTimeout(timer)
      abortRef.current = null
      setBusy(false)
      setBusyLabel('')
    }
  }, [apiKey, applyResult, busy, description, format, photo, settings, showToast])

  const handlePhotoFile = useCallback(
    async (file, slot = 'hero') => {
      try {
        const next = await readPhoto(file)
        if (slot === 'secondary') {
          setPhoto2(next)
          showToast('次图已载入')
        } else {
          setPhoto(next)
          showToast('照片已载入')
        }
        setError('')
      } catch (err) {
        setError(err.message)
      }
    },
    [showToast],
  )

  const updateStyle = useCallback(
    (patch, target = 'style') => {
      setSchemes((prev) =>
        prev.map((scheme, index) => {
          if (index !== active) return scheme
          if (target === 'scheme') return { ...scheme, ...patch }
          return { ...scheme, style: { ...scheme.style, ...patch } }
        }),
      )
    },
    [active],
  )

  const commitBlock = useCallback(
    (blockId, patch) => {
      setSchemes((prev) =>
        prev.map((scheme, index) => {
          if (index !== active) return scheme
          const layout = (scheme.layouts[format] || []).map((block) =>
            block.id === blockId ? { ...block, ...patch } : block,
          )
          return { ...scheme, layouts: { ...scheme.layouts, [format]: layout } }
        }),
      )
    },
    [active, format],
  )

  const editText = useCallback(
    (key, value) => {
      setSchemes((prev) =>
        prev.map((scheme, index) => {
          if (index !== active) return scheme
          const content = { ...scheme.content }
          if (key === 'headline') content.headline = clampText(value, 60)
          else if (key === 'subhead') content.subhead = clampText(value, 80)
          else if (key === 'caption') content.caption = clampText(value, 80)
          else if (key === 'caption_secondary') content.caption_secondary = clampText(value, 80)
          else if (key === 'pullquote') content.pullquote = clampText(value, 60)
          else if (key.startsWith('paragraph:')) {
            const i = Number(key.split(':')[1])
            const blocks = [...(content.body_blocks || [])]
            if (blocks[i]) blocks[i] = { ...blocks[i], text: clampText(value, 500) }
            content.body_blocks = blocks
          }
          return { ...scheme, content }
        }),
      )
    },
    [active],
  )

  const sendChat = useCallback(
    async (text) => {
      const instruction = String(text || '').trim()
      if (!instruction || chatBusy || !activeScheme) return
      if (!apiKey.trim()) {
        showToast('先在左侧填写模型 API Key，再用对话微调', 'error')
        return
      }

      const scheme = activeScheme
      const id = scheme.id
      const history = (chats[id] || [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-4)
        .map((m) => `${m.role === 'user' ? '用户' : '助手'}：${m.text}`)

      setChats((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), { role: 'user', text: instruction }],
      }))
      setChatBusy(true)
      setError('')

      const controller = new AbortController()
      chatAbortRef.current = controller
      const timer = setTimeout(() => controller.abort(), 90_000)

      try {
        const result = await requestEdit({
          apiKey,
          settings,
          system: buildChatSystemPrompt(),
          user: buildChatUserPrompt({ scheme, format, instruction, history }),
          signal: controller.signal,
        })

        let patch = result.json?.patch
        if (typeof patch === 'string') {
          try {
            patch = JSON.parse(patch)
          } catch {
            patch = null
          }
        }
        const latest = schemesRef.current.find((item) => item.id === id) || scheme
        const { scheme: nextScheme, changed } = applyChatPatch(latest, format, patch)
        if (changed) {
          setChatUndo((prev) => ({
            ...prev,
            [id]: [...(prev[id] || []).slice(-9), latest],
          }))
          setSchemes((prev) => prev.map((item) => (item.id === id ? nextScheme : item)))
        }

        const reply =
          clampText(String(result.json?.reply || '').trim(), 120) ||
          (changed ? '已按你的要求调整。' : '这条指令暂时没有可应用的修改。')
        setChats((prev) => ({
          ...prev,
          [id]: [...(prev[id] || []), { role: 'assistant', text: reply, applied: changed }],
        }))
      } catch (err) {
        const message =
          err.name === 'AbortError'
            ? '请求超时（90 秒），请重试。'
            : err.message || '对话请求失败'
        setChats((prev) => ({
          ...prev,
          [id]: [...(prev[id] || []), { role: 'error', text: message }],
        }))
      } finally {
        clearTimeout(timer)
        chatAbortRef.current = null
        setChatBusy(false)
      }
    },
    [activeScheme, apiKey, chatBusy, chats, format, settings, showToast],
  )

  const undoChat = useCallback(() => {
    if (!activeScheme) return
    const id = activeScheme.id
    const stack = chatUndo[id] || []
    if (!stack.length) return
    const previous = stack[stack.length - 1]
    setSchemes((prev) => prev.map((item) => (item.id === id ? previous : item)))
    setChatUndo((prev) => ({ ...prev, [id]: stack.slice(0, -1) }))
    setChats((prev) => ({
      ...prev,
      [id]: [
        ...(prev[id] || []),
        { role: 'assistant', text: '已撤销上一步对话修改。', applied: false },
      ],
    }))
  }, [activeScheme, chatUndo])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
    // 主题参数只用于首次进入；手动切换后清掉，刷新时以 localStorage 为准
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.has('theme')) {
        url.searchParams.delete('theme')
        window.history.replaceState({}, '', url)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const resetLayout = useCallback(() => {
    setSchemes((prev) =>
      prev.map((scheme, index) => (index === active ? rebuildLayout(scheme, format) : scheme)),
    )
    showToast('版式已重置')
  }, [active, format, showToast])

  const prepareExportImage = useCallback(async () => {
    const paper = paperRef.current
    if (!paper || !activeScheme) return () => {}
    const images = [...paper.querySelectorAll('.hero img')]
    if (!images.length) return () => {}

    const st = resolveStyle(activeScheme)
    const dots = [...paper.querySelectorAll('.halftone-dots')]
    const previousSrc = images.map((img) => img.getAttribute('src'))
    const displayWidths = images.map((img) => img.clientWidth)

    const treated = await Promise.all(
      images.map((img, index) =>
        renderTreatedPhoto(
          { dataUrl: img.src },
          st.imageTreatment,
          st.palette.accent,
          displayWidths[index],
        ),
      ),
    )
    await Promise.all(
      images.map(async (img, index) => {
        if (treated[index] && treated[index] !== img.src) {
          img.src = treated[index]
          try {
            await img.decode()
          } catch {
            /* ignore */
          }
        }
      }),
    )
    dots.forEach((el) => {
      el.style.display = 'none'
    })

    return () => {
      images.forEach((img, index) => {
        if (previousSrc[index]) img.src = previousSrc[index]
      })
      dots.forEach((el) => {
        el.style.display = ''
      })
    }
  }, [activeScheme])

  const doExport = useCallback(async () => {
    if (!activeScheme || !paperRef.current || exporting) return
    setExporting(true)
    let restore = () => {}
    try {
      restore = await prepareExportImage()
      const st = resolveStyle(activeScheme)
      const canvas = await renderPaperPng(paperRef.current, {
        scale: 2,
        background: st.palette.background,
      })
      await downloadCanvas(
        canvas,
        `头版智造局_${activeScheme.name}_${FORMATS[format].label}_${shortDate()}.png`,
      )
      showToast('PNG 已导出（2× 分辨率）')
    } catch (err) {
      setError(`导出失败：${err.message}`)
      showToast('导出失败，请重试', 'error')
    } finally {
      restore()
      setExporting(false)
    }
  }, [activeScheme, exporting, format, prepareExportImage, showToast])

  const doPrint = useCallback(async () => {
    if (!activeScheme || !paperRef.current || exporting) return
    setExporting(true)
    let restore = () => {}
    try {
      restore = await prepareExportImage()
      const st = resolveStyle(activeScheme)
      const canvas = await renderPaperPng(paperRef.current, {
        scale: 2,
        background: st.palette.background,
      })
      printCanvas(canvas, {
        widthMm: format === 'newspaper' ? 210 : 200,
        heightMm: format === 'newspaper' ? 297 : 250,
        title: `头版智造局 · ${activeScheme.name}`,
      })
    } catch (err) {
      setError(`打印失败：${err.message}`)
    } finally {
      restore()
      setExporting(false)
    }
  }, [activeScheme, exporting, format, prepareExportImage])

  const regenerate = useCallback(() => {
    if (keyReady) generate()
    else loadDemo({ targetView: 'gallery' })
  }, [generate, keyReady, loadDemo])

  const modelLabel = `${provider.name} · ${settings.model}`

  return html`
    <div class="app">
      <${TopBar}
        view=${view}
        keyReady=${keyReady}
        modelLabel=${modelLabel}
        demo=${demoMode}
        theme=${theme}
        onToggleTheme=${toggleTheme}
        onOpenSkill=${() => setModal('skill')}
        onOpenPrompt=${() => setModal('prompt')}
      />

      <div class=${`workspace ${view === 'editor' ? 'with-inspector' : ''}`}>
        <${InputRail}
          photo=${photo}
          description=${description}
          setDescription=${setDescription}
          format=${format}
          setFormat=${setFormat}
          settings=${settings}
          setSettings=${setSettings}
          apiKey=${apiKey}
          setApiKey=${setApiKey}
          busy=${busy}
          busyLabel=${busyLabel}
          onGenerate=${generate}
          onDemo=${() => loadDemo({ targetView: 'gallery' })}
          onPhotoFile=${handlePhotoFile}
          onRemovePhoto=${() => setPhoto(null)}          error=${error}
          onDismissError=${() => setError('')}
        />

        <main class="main">
          ${view === 'intro' &&
          html`
            <${Intro}
              demo=${demo}
              photo=${photo || DEMO_PHOTO}
              photo2=${photo ? photo2 : photo2 || DEMO_PHOTO_2}
              onDemo=${() => loadDemo({ targetView: 'gallery' })}
              onOpenSkill=${() => setModal('skill')}
            />
          `}
          ${view === 'gallery' &&
          html`
            <${Gallery}
              schemes=${schemes}
              summary=${summary}
              recommended=${recommended}
              format=${format}
              photo=${photo}
              photo2=${photo2}
              busy=${busy}
              onSelect=${(index) => {
                setActive(index)
                setView('editor')
              }}
              onRegenerate=${regenerate}
            />
          `}
          ${view === 'editor' &&
          activeScheme &&
          html`
            <${Editor}
              schemes=${schemes}
              active=${active}
              format=${format}
              photo=${photo}
              photo2=${photo2}
              paperRef=${paperRef}
              disclaimer=${meta.disclaimer}
              onSelect=${(index) => setActive(index)}
              onBack=${() => setView('gallery')}
              onBlockCommit=${commitBlock}
              onEditText=${editText}
            />
          `}
        </main>

        ${view === 'editor' &&
        activeScheme &&
        html`
          <${Inspector}
            scheme=${activeScheme}
            format=${format}
            summary=${summary}
            warnings=${warnings}
            demo=${demoMode}
            exporting=${exporting}
            photo=${photo}
            photo2=${photo2}
            onPhotoFile=${handlePhotoFile}
            onRemovePhoto2=${() => setPhoto2(null)}
            messages=${chats[activeScheme.id] || []}
            chatBusy=${chatBusy}
            keyReady=${keyReady}
            canUndo=${(chatUndo[activeScheme.id] || []).length > 0}
            onSendChat=${sendChat}
            onUndoChat=${undoChat}
            onChangeStyle=${updateStyle}
            onChangeFormat=${setFormat}
            onResetLayout=${resetLayout}
            onOpenJson=${() => setModal('json')}
            onExport=${doExport}
            onPrint=${doPrint}
          />
        `}
      </div>

      ${modal === 'skill' && html`<${SkillModal} onClose=${() => setModal(null)} />`}
      ${modal === 'prompt' &&
      html`<${PromptModal} prompt=${systemPrompt} onClose=${() => setModal(null)} />`}
      ${modal === 'json' &&
      activeScheme &&
      html`<${JsonModal} scheme=${activeScheme} onClose=${() => setModal(null)} />`}

      ${toast && html`<div class=${`toast ${toast.kind === 'error' ? 'error' : ''}`}>${toast.msg}</div>`}
    </div>
  `
}
