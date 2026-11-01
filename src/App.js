import { h } from 'preact'
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import htm from 'htm'
import { TopBar } from './components/TopBar.js'
import { InputRail } from './components/InputRail.js'
import { Intro } from './components/Intro.js'
import { Gallery } from './components/Gallery.js'
import { Editor } from './components/Editor.js'
import { Inspector } from './components/Inspector.js'
import { JsonModal, Modal, PromptModal, SkillModal } from './components/Modals.js'
import { DraftsModal } from './components/DraftsModal.js'
import { buildDemoPayload } from './agent/demoData.js'
import { buildCaptionSystemPrompt, buildCaptionUserPrompt } from './agent/captions.js'
import { buildArtSystemPrompt, buildArtUserPrompt } from './agent/artPrompt.js'
import {
  attachFallbackArtworks,
  buildFallbackArtwork,
  normalizeModelArtworks,
  rasterizeArtworks,
} from './agent/artwork.js'
import {
  buildDesignChatSystemPrompt,
  buildDesignSystemPrompt,
} from './agent/designPrompt.js'
import { buildSystemPrompt, buildUserPrompt } from './agent/systemPrompt.js'
import { buildChatSystemPrompt, buildChatUserPrompt, applyChatPatch } from './agent/chat.js'
import { cleanText, normalizeSchemes, rebuildLayout } from './agent/validate.js'
import {
  IMAGE_PROVIDERS,
  PROVIDERS,
  defaultSettings,
  requestArtworks,
  requestCaptions,
  requestEdit,
  requestSchemes,
} from './agent/llm.js'
import { buildImagePrompt, getImageStyle } from './config/imageStyles.js'
import { requestImage, resolveImageSize } from './agent/image.js'
import { chineseDate, clampText, shortDate } from './lib/format.js'
import { DEMO_PHOTO, DEMO_PHOTO_2, readGeneratedImage, readPhoto } from './lib/image.js'
import { downloadDataUrl, printDataUrl } from './lib/exportPaper.js'
import { FORMATS, buildLayout, resolveStyle } from './config/presets.js'
import { buildDesignLayout } from './config/designLayout.js'
import { applyStylePack, nextStylePack, STYLE_PACK_IDS } from './config/stylePacks.js'
import {
  clearCurrentDraftId,
  deleteDraftRecord,
  getCurrentDraftId,
  getDraftRecord,
  listDraftRecords,
  newDraftId,
  saveDraftRecord,
  setCurrentDraftId,
} from './lib/drafts.js'

const html = htm.bind(h)

const LS_SETTINGS = 'fpl.settings.v1'
const LS_THEME = 'fpl.theme.v1'
const LS_MODE = 'fpl.mode.v1'
const SS_KEY = 'fpl.apikey.v1'
const SS_IMAGE_KEY = 'fpl.imagekey.v1'

function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_SETTINGS)
    if (!raw) return defaultSettings()
    const parsed = JSON.parse(raw)
    const defaults = defaultSettings()
    return {
      ...defaults,
      ...parsed,
      image: { ...defaults.image, ...(parsed.image || {}) },
    }
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

function loadImageKey() {
  try {
    return sessionStorage.getItem(SS_IMAGE_KEY) || ''
  } catch {
    return ''
  }
}

function loadMode() {
  try {
    const saved = localStorage.getItem(LS_MODE)
    if (saved === 'design' || saved === 'free') return saved
    return 'standard'
  } catch {
    return 'standard'
  }
}

export function App() {
  const [view, setView] = useState('intro')
  const [format, setFormat] = useState('newspaper')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)
  const [sourcePhoto, setSourcePhoto] = useState(null)
  const [photo2, setPhoto2] = useState(null)
  const [imageMeta, setImageMeta] = useState(null)
  const [settings, setSettings] = useState(loadSettings)
  const [apiKey, setApiKey] = useState(loadKey)
  const [imageApiKey, setImageApiKey] = useState(loadImageKey)
  const [generationRole, setGenerationRole] = useState('layout')
  const [imageStyle, setImageStyle] = useState('original')
  const [autoLayout, setAutoLayout] = useState(true)
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
  const [mode, setMode] = useState(loadMode)
  const [modeWarning, setModeWarning] = useState(false)
  const [chats, setChats] = useState({})
  const [stylePack, setStylePack] = useState('classic')
  const [chatBusy, setChatBusy] = useState(false)
  const [chatUndo, setChatUndo] = useState({})
  const [chatReference, setChatReference] = useState(null)
  const [chatRequest, setChatRequest] = useState(0)
  const [captionBusy, setCaptionBusy] = useState(false)
  const [draftId, setDraftId] = useState(() => newDraftId())
  const [draftList, setDraftList] = useState([])
  const [draftCount, setDraftCount] = useState(0)
  const [saveState, setSaveState] = useState('idle')
  const [restoringDraft, setRestoringDraft] = useState(true)

  const sandboxRef = useRef(null)
  const abortRef = useRef(null)
  const chatAbortRef = useRef(null)
  const captionAbortRef = useRef(null)
  const toastTimer = useRef(null)
  const schemesRef = useRef(schemes)
  schemesRef.current = schemes
  const draftIdRef = useRef(draftId)
  draftIdRef.current = draftId
  const saveTimerRef = useRef(null)
  const saveErrorRef = useRef(false)

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

  const freeMode = mode === 'free'
  const designMode = mode === 'design' || freeMode
  const systemPrompt = useMemo(
    () => (designMode ? buildDesignSystemPrompt() : buildSystemPrompt()),
    [designMode],
  )
  const activeScheme = schemes[active] || null
  const provider = PROVIDERS.find((p) => p.id === settings.provider) || PROVIDERS[0]
  const keyReady = Boolean(apiKey.trim())

  useEffect(() => {
    try {
      localStorage.setItem(LS_MODE, mode)
    } catch {
      /* ignore */
    }
    document.documentElement.dataset.mode = mode
  }, [mode])

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
    try {
      if (imageApiKey) sessionStorage.setItem(SS_IMAGE_KEY, imageApiKey)
      else sessionStorage.removeItem(SS_IMAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [imageApiKey])

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
      if (captionAbortRef.current) captionAbortRef.current.abort()
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const showToast = useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }, [])

  const referenceBlock = useCallback(
    (block) => {
      if (!block?.id) return
      setChatReference({ ...block, nonce: Date.now() })
      setChatRequest((value) => value + 1)
      showToast(`已引用「${block.label || block.id}」到对话`)
    },
    [showToast],
  )

  const applyResult = useCallback(
    (result, hasSubOverride = null) => {
      if (chatAbortRef.current) {
        chatAbortRef.current.abort()
        chatAbortRef.current = null
      }
      if (captionAbortRef.current) {
        captionAbortRef.current.abort()
        captionAbortRef.current = null
        setCaptionBusy(false)
      }
      setChats({})
      setChatUndo({})
      setChatBusy(false)
      setChatReference(null)
      const hasSub = hasSubOverride ?? Boolean(photo2)
      const packed = designMode
        ? result.schemes.map((scheme) => ({
            ...scheme,
            layouts: {
              newspaper: buildDesignLayout(scheme, 'newspaper', hasSub),
              poster: buildDesignLayout(scheme, 'poster', hasSub),
            },
          }))
        : applyStylePack(result.schemes, stylePack, hasSub)
      setSchemes(packed)
      setSummary(result.summary)
      setWarnings(result.warnings || [])
      setRecommended(result.recommended || 'B')
      setMeta({
        date: result.meta?.date || chineseDate(),
        disclaimer: result.meta?.disclaimer || '创意报纸版式，非真实新闻',
      })
      const idx = packed.findIndex((s) => s.id === (result.recommended || 'B'))
      setActive(idx >= 0 ? idx : 0)
      setView('gallery')
    },
    [designMode, photo2, stylePack],
  )

  const loadDemo = useCallback(
    ({ targetView = 'gallery', letter = null, fmt = format } = {}) => {
      try {
        const date = chineseDate()
        const normalized = normalizeSchemes(buildDemoPayload({ date, format: fmt }), {
          date,
          format: fmt,
          mode,
        })
        applyResult(normalized, photo ? Boolean(photo2) : true)
        setDemoMode(true)
        if (!photo) {
          setPhoto(DEMO_PHOTO)
          setSourcePhoto(DEMO_PHOTO)
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
    [applyResult, format, mode, photo, photo2],
  )

  const applyDraft = useCallback((draft) => {
    if (!draft || draft.version !== 1) return false
    const nextSchemes = Array.isArray(draft.schemes) ? draft.schemes : []
    const nextActive = Math.min(
      Math.max(Number(draft.active) || 0, 0),
      Math.max(nextSchemes.length - 1, 0),
    )
    setDraftId(draft.id)
    setSchemes(nextSchemes)
    setActive(nextActive)
    setFormat(draft.format === 'poster' ? 'poster' : 'newspaper')
    setDescription(typeof draft.description === 'string' ? draft.description : '')
    setPhoto(draft.photo || null)
    setSourcePhoto(draft.sourcePhoto || draft.photo || null)
    setPhoto2(draft.photo2 || null)
    setSummary(draft.summary || '')
    setMeta(
      draft.meta && typeof draft.meta === 'object'
        ? draft.meta
        : { date: chineseDate(), disclaimer: '创意报纸版式，非真实新闻' },
    )
    setWarnings(Array.isArray(draft.warnings) ? draft.warnings : [])
    setRecommended(draft.recommended || 'B')
    setDemoMode(Boolean(draft.demoMode))
    setStylePack(STYLE_PACK_IDS.includes(draft.stylePack) ? draft.stylePack : 'classic')
    setChats(draft.chats && typeof draft.chats === 'object' ? draft.chats : {})
    setChatUndo({})
    setChatBusy(false)
    setChatReference(null)
    setView(nextSchemes.length ? (draft.view === 'editor' ? 'editor' : 'gallery') : 'intro')
    setError('')
    return true
  }, [])

  const refreshDrafts = useCallback(async () => {
    try {
      const list = await listDraftRecords()
      setDraftList(list)
      setDraftCount(list.length)
      return list
    } catch {
      return []
    }
  }, [])

  useEffect(() => {
    let alive = true
    const isDemo = new URLSearchParams(window.location.search).get('demo') === '1'
    ;(async () => {
      try {
        if (!isDemo) {
          const id = getCurrentDraftId()
          if (id) {
            const draft = await getDraftRecord(id)
            if (draft && draft.version === 1) {
              if (alive) applyDraft(draft)
            } else if (alive) {
              clearCurrentDraftId()
            }
          }
        }
      } catch {
        /* 浏览器禁用存储时静默降级为无草稿 */
      }
      try {
        const list = await listDraftRecords()
        if (alive) {
          setDraftList(list)
          setDraftCount(list.length)
        }
      } catch {
        /* ignore */
      }
      if (alive) setRestoringDraft(false)
    })()
    return () => {
      alive = false
    }
  }, [applyDraft])

  const hasDraftContent = Boolean(
    schemes.length || photo || photo2 || description.trim() || Object.keys(chats).length,
  )

  useEffect(() => {
    if (restoringDraft) return
    if (!hasDraftContent) {
      setSaveState('idle')
      return
    }

    setSaveState('saving')
    const id = draftIdRef.current
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(async () => {
      const schemeForMeta = schemes[active] || schemes[0] || null
      const styleForMeta = schemeForMeta ? resolveStyle(schemeForMeta) : null
      const titleSource =
        schemeForMeta?.content?.headline || description.trim() || '未命名草稿'
      const metaInfo = {
        id,
        title: clampText(titleSource, 24),
        subtitle: clampText(schemes.map((scheme) => scheme.name).join(' · '), 60),
        description: clampText(description.trim(), 80),
        updatedAt: Date.now(),
        format,
        schemeCount: schemes.length,
        accent: styleForMeta?.palette.accent || '#C8102E',
        background: styleForMeta?.palette.background || '#FFFFFF',
        ink: styleForMeta?.palette.text || '#1A1A1A',
        letter: schemeForMeta?.id || '·',
        demo: demoMode,
      }

      try {
        await saveDraftRecord({
          version: 1,
          id,
          savedAt: Date.now(),
          view,
          active,
          format,
          description,
          photo,
          photo2,
          schemes,
          summary,
          meta,
          warnings,
          recommended,
          demoMode,
          stylePack,
          chats,
          metaInfo,
        })
        setCurrentDraftId(id)
        setSaveState('saved')
        saveErrorRef.current = false
        await refreshDrafts()
      } catch (err) {
        setSaveState('error')
        if (!saveErrorRef.current) {
          saveErrorRef.current = true
          showToast(
            `本地草稿保存失败：${err.message || '浏览器存储不可用'}`,
            'error',
          )
        }
      }
    }, 800)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [
    restoringDraft,
    hasDraftContent,
    draftId,
    schemes,
    active,
    format,
    description,
    photo,
    photo2,
    summary,
    meta,
    warnings,
    recommended,
    chats,
    demoMode,
    view,
    stylePack,
    refreshDrafts,
    showToast,
  ])

  const startNewDraft = useCallback(() => {
    if (busy) {
      showToast('正在生成方案，完成后再新建草稿', 'error')
      return
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    clearCurrentDraftId()
    setDraftId(newDraftId())
    setSchemes([])
    setActive(0)
    setFormat('newspaper')
    setDescription('')
    setPhoto(null)
    setSourcePhoto(null)
    setPhoto2(null)
    setImageMeta(null)
    setSummary('')
    setWarnings([])
    setRecommended('B')
    setMeta({ date: chineseDate(), disclaimer: '创意报纸版式，非真实新闻' })
    setChats({})
    setChatUndo({})
    setChatBusy(false)
    setChatReference(null)
    setDemoMode(false)
    setView('intro')
    setModal(null)
    setError('')
    setSaveState('idle')
  }, [busy, showToast])

  const openDrafts = useCallback(async () => {
    setModal('drafts')
    await refreshDrafts()
  }, [refreshDrafts])

  const openDraft = useCallback(
    async (id) => {
      if (busy) {
        showToast('正在生成方案，完成后再打开草稿', 'error')
        return
      }
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      try {
        const draft = await getDraftRecord(id)
        if (!draft) throw new Error('草稿不存在或已被删除')
        applyDraft(draft)
        setCurrentDraftId(id)
        setModal(null)
        showToast('草稿已打开')
      } catch (err) {
        showToast(err.message || '打开草稿失败', 'error')
      }
    },
    [applyDraft, busy, showToast],
  )

  const discardDraft = useCallback(
    async (id) => {
      if (busy) {
        showToast('正在生成方案，完成后再删除草稿', 'error')
        return
      }
      if (!window.confirm('删除这份草稿？此操作不可撤销。')) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      try {
        await deleteDraftRecord(id)
        if (id === draftIdRef.current) startNewDraft()
        await refreshDrafts()
        showToast('草稿已删除')
      } catch (err) {
        showToast(`删除草稿失败：${err.message}`, 'error')
      }
    },
    [busy, refreshDrafts, showToast, startNewDraft],
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

  const generate = useCallback(async (options = {}) => {
    const activePhoto = 'photo' in options ? options.photo : photo
    if (busy && !options.force) return
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
        system: designMode ? buildDesignSystemPrompt() : buildSystemPrompt({ date }),
        user: buildUserPrompt({
          description,
          photoMeta: activePhoto,
          secondaryPhotoMeta: photo2,
          formatLabel: FORMATS[format].label,
          date,
          mode,
          vision: Boolean(settings.vision && (activePhoto || photo2)),
        }),
        photoDataUrl: activePhoto?.dataUrl,
        photo2DataUrl: photo2?.dataUrl,
        signal: controller.signal,
      })
      const normalized = normalizeSchemes(result.json, { date, format, mode })
      let finalSchemes = normalized.schemes
      let finalWarnings = normalized.warnings || []
      let artFallback = false
      if (freeMode) {
        finalSchemes = attachFallbackArtworks(finalSchemes, description)
        if (!activePhoto) {
          setBusyLabel('正在生成自由图案…')
          try {
            const artResult = await requestArtworks({
              apiKey,
              settings,
              system: buildArtSystemPrompt(),
              user: buildArtUserPrompt({
                schemes: finalSchemes,
                formatLabel: FORMATS[format].label,
              }),
              signal: controller.signal,
            })
            const merged = normalizeModelArtworks(artResult.json, finalSchemes, description)
            finalSchemes = merged.schemes
            if (merged.warnings) {
              artFallback = true
              finalWarnings = [
                ...finalWarnings,
                `${merged.warnings} 套图案未通过校验，已使用符号库兜底。`,
              ]
            }
          } catch (artErr) {
            artFallback = true
            finalWarnings = [
              ...finalWarnings,
              `图案生成未完成，已使用符号库兜底：${artErr.message || '模型没有返回可用 SVG'}`,
            ]
          }
        }
      }
      if (freeMode) {
        setBusyLabel('正在准备 SVG 图案…')
        finalSchemes = await rasterizeArtworks(finalSchemes)
      }
      applyResult({ ...normalized, schemes: finalSchemes, warnings: finalWarnings })
      setDemoMode(false)
      showToast(
        freeMode && !activePhoto
          ? artFallback
            ? '三套方案已生成，部分图案使用了兜底'
            : '三套自由方案与 SVG 图案已生成'
          : '三套头版方案已生成',
      )
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
  }, [apiKey, applyResult, busy, description, designMode, format, freeMode, mode, photo, settings, showToast])

  const generateImage = useCallback(async () => {
    if (busy) return
    const style = getImageStyle(imageStyle)
    setError('')

    if (style.id === 'original') {
      if (!sourcePhoto) {
        setError('「原图」需要先上传一张参考图；如果想直接生成，请选择一个生图风格。')
        return
      }
      setPhoto(sourcePhoto)
      setImageMeta(null)
      setGenerationRole('layout')
      showToast('已使用原图素材，已切回排版模型')
      if (autoLayout) await generate({ photo: sourcePhoto, force: true })
      return
    }

    if (!imageApiKey.trim()) {
      setError('请填写「生图 Key」。生图 Key 独立保存，不会复用排版模型的 Key。')
      return
    }
    if (!settings.image?.model?.trim()) {
      setError('请填写生图模型名，例如火山方舟的 Seedream 模型 ID。')
      return
    }
    if (settings.image.provider === 'ark' && /seedance/i.test(settings.image.model)) {
      setError('Seedance 是视频生成模型，当前流程只接收图片。请改用火山方舟 Seedream 图片模型。')
      return
    }
    if (!description.trim() && !sourcePhoto) {
      setError('请描述画面，或先上传一张参考图，再生图。')
      return
    }

    setBusy(true)
    setBusyLabel(`正在用「${style.label}」生成素材图…`)
    const controller = new AbortController()
    abortRef.current = controller
    const timer = setTimeout(() => controller.abort(), 240_000)

    try {
      const useReference = Boolean(sourcePhoto && settings.image?.supportsReference)
      const prompt = buildImagePrompt({
        description,
        styleId: style.id,
        hasReference: useReference,
      })
      const result = await requestImage({
        imageApiKey,
        settings: settings.image,
        prompt,
        size: resolveImageSize(settings.image, format),
        referenceDataUrl: useReference ? sourcePhoto.dataUrl : null,
        signal: controller.signal,
      })
      const generated = await readGeneratedImage(result.dataUrl, `AI-${style.label}.png`)
      setPhoto(generated)
      setImageMeta({
        styleId: style.id,
        styleLabel: style.label,
        model: settings.image.model,
        prompt,
        generatedAt: Date.now(),
      })
      setGenerationRole('layout')
      setBusy(false)
      setBusyLabel('')
      showToast(`素材图已生成，已切回排版模型（${style.label}）`)
      if (autoLayout) await generate({ photo: generated, force: true })
    } catch (err) {
      setError(
        err.name === 'AbortError'
          ? '生图超时（240 秒）。请检查网络，或换一个生图模型重试。'
          : err.message || '生图失败',
      )
    } finally {
      clearTimeout(timer)
      abortRef.current = null
      setBusy(false)
      setBusyLabel('')
    }
  }, [
    autoLayout,
    busy,
    description,
    format,
    generate,
    imageApiKey,
    imageStyle,
    settings.image,
    showToast,
    sourcePhoto,
  ])

  const handleGenerate = useCallback(() => {
    if (generationRole === 'image') return generateImage()
    return generate()
  }, [generate, generateImage, generationRole])

  const relayoutAll = useCallback(
    (hasSub) => {
      setSchemes((prev) =>
        prev.map((scheme) => ({
          ...scheme,
          layouts: {
            newspaper: designMode
              ? buildDesignLayout(scheme, 'newspaper', hasSub)
              : buildLayout(scheme.layout_variant, 'newspaper', hasSub),
            poster: designMode
              ? buildDesignLayout(scheme, 'poster', hasSub)
              : buildLayout(scheme.layout_variant, 'poster', hasSub),
          },
        })),
      )
    },
    [designMode],
  )

  const handlePhotoFile = useCallback(
    async (file, slot = 'hero') => {
      try {
        const next = await readPhoto(file)
        if (slot === 'secondary') {
          if (captionAbortRef.current) {
            captionAbortRef.current.abort()
            captionAbortRef.current = null
            setCaptionBusy(false)
          }
          setPhoto2(next)
          setSchemes((prev) =>
            prev.map((scheme) => ({
              ...scheme,
              content: { ...scheme.content, caption_secondary: '' },
            })),
          )
          relayoutAll(true)
          showToast('子图已载入，版式已重排')
        } else {
          setSourcePhoto(next)
          setPhoto(next)
          setImageMeta(null)
          showToast('照片已载入')
        }
        setError('')
      } catch (err) {
        setError(err.message)
      }
    },
    [relayoutAll, showToast],
  )

  const removePhoto = useCallback(() => {
    setPhoto(null)
    setSourcePhoto(null)
    setImageMeta(null)
    setError('')
    showToast('素材已移除')
  }, [showToast])

  const restoreOriginal = useCallback(() => {
    if (!sourcePhoto) return
    setPhoto(sourcePhoto)
    setImageMeta(null)
    showToast('已恢复原图')
  }, [showToast, sourcePhoto])

  const removeSecondary = useCallback(() => {
    if (captionAbortRef.current) {
      captionAbortRef.current.abort()
      captionAbortRef.current = null
      setCaptionBusy(false)
    }
    setPhoto2(null)
    setSchemes((prev) =>
      prev.map((scheme) => ({
        ...scheme,
        content: { ...scheme.content, caption_secondary: '' },
        layouts: {
          newspaper: designMode
            ? buildDesignLayout(scheme, 'newspaper', false)
            : buildLayout(scheme.layout_variant, 'newspaper', false),
          poster: designMode
            ? buildDesignLayout(scheme, 'poster', false)
            : buildLayout(scheme.layout_variant, 'poster', false),
        },
      })),
    )
    showToast('子图已移除，版式已回收')
  }, [designMode, showToast])

  const enrichCaptions = useCallback(async () => {
    if (!activeScheme || !photo2 || captionBusy) return
    if (!apiKey.trim()) {
      showToast('先在左侧填写模型 API Key，再生成补充文案', 'error')
      return
    }

    const photos = [
      photo && {
        slot: 'main',
        name: photo.name,
        width: photo.width,
        height: photo.height,
        caption: activeScheme.content.caption,
        dataUrl: photo.dataUrl,
      },
      {
        slot: 'secondary',
        name: photo2.name,
        width: photo2.width,
        height: photo2.height,
        caption: activeScheme.content.caption_secondary,
        dataUrl: photo2.dataUrl,
      },
    ].filter(Boolean)

    setCaptionBusy(true)
    setError('')
    const controller = new AbortController()
    captionAbortRef.current = controller
    const timer = setTimeout(() => controller.abort(), 60_000)

    try {
      const result = await requestCaptions({
        apiKey,
        settings,
        system: buildCaptionSystemPrompt(),
        user: buildCaptionUserPrompt({
          scheme: activeScheme,
          formatLabel: FORMATS[format].label,
          photos,
        }),
        imageDataUrls: settings.vision ? photos.map((p) => p.dataUrl) : [],
        signal: controller.signal,
      })
      const captions = Array.isArray(result.json?.captions) ? result.json.captions : []
      const bySlot = Object.fromEntries(
        captions.map((item) => [
          String(item?.slot || '').toLowerCase(),
          clampText(cleanText(item?.text), 30),
        ]),
      )
      const nextMain = bySlot.main || activeScheme.content.caption
      const nextSub = bySlot.secondary || activeScheme.content.caption_secondary
      if (!bySlot.main && !bySlot.secondary) {
        throw new Error('模型没有返回图注，请重试')
      }

      setSchemes((prev) =>
        prev.map((scheme) =>
          scheme.id === activeScheme.id
            ? {
                ...scheme,
                content: {
                  ...scheme.content,
                  caption: nextMain || scheme.content.caption,
                  caption_secondary: nextSub || scheme.content.caption_secondary,
                },
                layouts: {
                  newspaper: designMode
                    ? buildDesignLayout(scheme, 'newspaper', true)
                    : buildLayout(scheme.layout_variant, 'newspaper', true),
                  poster: designMode
                    ? buildDesignLayout(scheme, 'poster', true)
                    : buildLayout(scheme.layout_variant, 'poster', true),
                },
              }
            : scheme,
        ),
      )
      showToast('补充图注已生成，版式已重排')
    } catch (err) {
      const message =
        err.name === 'AbortError' ? '补充文案超时（60 秒），请重试' : err.message || '生成失败'
      setError(`补充文案失败：${message}`)
      showToast(message, 'error')
    } finally {
      clearTimeout(timer)
      captionAbortRef.current = null
      setCaptionBusy(false)
    }
  }, [activeScheme, apiKey, captionBusy, designMode, format, photo, photo2, settings, showToast])

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
          if (key.startsWith('block:')) {
            const id = key.slice(6)
            const text = clampText(value, 160)
            const layouts = {}
            for (const fmt of ['newspaper', 'poster']) {
              layouts[fmt] = (scheme.layouts?.[fmt] || []).map((block) =>
                block.id === id ? { ...block, text } : block,
              )
            }
            const design = scheme.design_layout
              ? {
                  ...scheme.design_layout,
                  extra_blocks: (scheme.design_layout.extra_blocks || []).map((block) =>
                    block.id === id ? { ...block, text } : block,
                  ),
                }
              : null
            return { ...scheme, layouts, ...(design ? { design_layout: design } : {}) }
          }
          const content = { ...scheme.content }
          if (key === 'headline') content.headline = clampText(value, 60)
          else if (key === 'subhead') content.subhead = clampText(value, 80)
          else if (key === 'caption') content.caption = clampText(value, 80)
          else if (key === 'caption_secondary') content.caption_secondary = clampText(value, 80)
          else if (key === 'poster_note') content.poster_note = clampText(value, 80)
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
      setChatReference(null)
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
          system: designMode ? buildDesignChatSystemPrompt() : buildChatSystemPrompt(),
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
        const { scheme: nextScheme, changed, warning } = applyChatPatch(latest, format, patch, {
          mode,
          hasSub: Boolean(photo2),
        })
        if (changed) {
          setChatUndo((prev) => ({
            ...prev,
            [id]: [...(prev[id] || []).slice(-9), latest],
          }))
          setSchemes((prev) => prev.map((item) => (item.id === id ? nextScheme : item)))
        }
        if (warning) showToast(warning, 'error')

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
    [activeScheme, apiKey, chatBusy, chats, designMode, format, mode, photo2, settings, showToast],
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
      prev.map((scheme, index) => {
        if (index !== active) return scheme
        if (designMode) {
          const cleaned = { ...scheme, design_layout: null }
          return {
            ...cleaned,
            layouts: {
              newspaper: buildLayout(scheme.layout_variant, 'newspaper', Boolean(photo2)),
              poster: buildLayout(scheme.layout_variant, 'poster', Boolean(photo2)),
            },
          }
        }
        return rebuildLayout(scheme, format, Boolean(photo2))
      }),
    )
    showToast(designMode ? '已清除自定义版式，回到模板' : '版式已重置')
  }, [active, designMode, format, photo2, showToast])

  const doExport = useCallback(async () => {
    if (!activeScheme || exporting) return
    setExporting(true)
    try {
      const st = resolveStyle(activeScheme)
      const sandbox = sandboxRef.current
      if (!sandbox) throw new Error('画布还没准备好，请稍后再试')
      const result = await sandbox.exportPng({
        scale: 2,
        background: st.palette.background,
      })
      await downloadDataUrl(
        result.dataUrl,
        `头版智造局_${activeScheme.name}_${FORMATS[format].label}_${shortDate()}.png`,
      )
      showToast('PNG 已导出（2× 分辨率）')
    } catch (err) {
      setError(`导出失败：${err.message}`)
      showToast('导出失败，请重试', 'error')
    } finally {
      setExporting(false)
    }
  }, [activeScheme, exporting, format, showToast])

  const doPrint = useCallback(async () => {
    if (!activeScheme || exporting) return
    setExporting(true)
    try {
      const st = resolveStyle(activeScheme)
      const sandbox = sandboxRef.current
      if (!sandbox) throw new Error('画布还没准备好，请稍后再试')
      const result = await sandbox.exportPng({
        scale: 2,
        background: st.palette.background,
      })
      printDataUrl(result.dataUrl, {
        widthMm: format === 'newspaper' ? 210 : 200,
        heightMm: format === 'newspaper' ? 297 : 250,
        title: `头版智造局 · ${activeScheme.name}`,
      })
    } catch (err) {
      setError(`打印失败：${err.message}`)
    } finally {
      setExporting(false)
    }
  }, [activeScheme, exporting, format])

  const regenerate = useCallback(() => {
    if (keyReady) generate()
    else loadDemo({ targetView: 'gallery' })
  }, [generate, keyReady, loadDemo])

  const cycleStylePack = useCallback(() => {
    const current = schemesRef.current
    if (!current.length) return
    const next = nextStylePack(stylePack)
    setStylePack(next.id)
    setSchemes(applyStylePack(current, next.id, Boolean(photo2)))
    setChats({})
    setChatUndo({})
    setChatBusy(false)
    setChatReference(null)
    setError('')
    setSummary(`已换成「${next.name}」：${next.tagline}。内容保留，只换模板与配色。`)
    showToast(`已换成 ${next.name}`)
  }, [photo2, stylePack, showToast])

  const changeMode = useCallback(
    (next) => {
      if (!['standard', 'design', 'free'].includes(next)) return
      if (next === mode) return
      if (next === 'free') {
        setModeWarning(true)
        return
      }
      setMode(next)
      setChatReference(null)
      showToast(
        next === 'design'
          ? '设计模式：模型自由选择模板、配色与信息量'
          : '标准模板模式：按风格包生成三套',
      )
    },
    [mode, showToast],
  )

  const confirmFreeMode = useCallback(() => {
    setMode('free')
    setModeWarning(false)
    setChatReference(null)
    const withFallback = schemes.map((scheme) =>
      scheme.artwork?.dataUrl
        ? scheme
        : { ...scheme, artwork: buildFallbackArtwork(scheme, description) },
    )
    setSchemes(withFallback)
    rasterizeArtworks(withFallback)
      .then((next) => setSchemes(next))
      .catch(() => {})
    showToast('自由模式：无图时由模型生成 SVG 线条图案')
  }, [description, schemes, showToast])

  const imageProvider =
    IMAGE_PROVIDERS.find((p) => p.id === settings.image?.provider) || IMAGE_PROVIDERS[0]
  const modelLabel =
    generationRole === 'image'
      ? `${imageProvider.name} · ${settings.image?.model || '未设置'}`
      : `${provider.name} · ${settings.model}`

  return html`
    <div class="app">
      <${TopBar}
        view=${view}
        keyReady=${keyReady}
        modelLabel=${modelLabel}
        demo=${demoMode}
        theme=${theme}
        mode=${mode}
        onModeChange=${changeMode}
        draftCount=${draftCount}
        saveState=${saveState}
        onToggleTheme=${toggleTheme}
        onOpenDrafts=${openDrafts}
        onOpenSkill=${() => setModal('skill')}
        onOpenPrompt=${() => setModal('prompt')}
      />

      ${modeWarning &&
      html`
        <${Modal}
          title="自由模式"
          subtitle="推荐使用支持 SVG / 图像生成的结构化模型"
          narrow=${true}
          onClose=${() => setModeWarning(false)}
        >
          <div class="free-mode-warning">
            <p>
              自由模式会在<strong>没有照片</strong>时，由模型生成简单的 SVG
              线条图案；有照片时仍直接使用照片。
            </p>
            <p>
              当前版本生成 SVG 而不是位图。纯生图模型通常返回图片，无法直接走
              JSON / SVG 管线；推荐选择擅长 SVG、代码与结构化输出的模型。
            </p>
            <p class="free-mode-warning-note">
              图案只使用简单线条和象征符号；抽象名词会优先用荧光棒、樱花、鲸尾等符号表达。
            </p>
            <div class="free-mode-actions">
              <button class="btn" type="button" onClick=${() => setModeWarning(false)}>
                取消
              </button>
              <button class="btn accent" type="button" onClick=${confirmFreeMode}>
                继续使用
              </button>
            </div>
          </div>
        </${Modal}>
      `}

      <div class=${`workspace ${view === 'editor' ? 'with-inspector' : ''}`}>
        <${InputRail}
          mode=${mode}
          photo=${photo}
          imageMeta=${imageMeta}
          description=${description}
          setDescription=${setDescription}
          format=${format}
          setFormat=${setFormat}
          settings=${settings}
          setSettings=${setSettings}
          apiKey=${apiKey}
          setApiKey=${setApiKey}
          imageApiKey=${imageApiKey}
          setImageApiKey=${setImageApiKey}
          generationRole=${generationRole}
          setGenerationRole=${setGenerationRole}
          imageStyle=${imageStyle}
          setImageStyle=${setImageStyle}
          autoLayout=${autoLayout}
          setAutoLayout=${setAutoLayout}
          busy=${busy}
          busyLabel=${busyLabel}
          onGenerate=${handleGenerate}
          onDemo=${() => loadDemo({ targetView: 'gallery' })}
          onPhotoFile=${handlePhotoFile}
          onRemovePhoto=${removePhoto}
          onRestoreOriginal=${restoreOriginal}
          error=${error}
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
              warnings=${warnings}
              recommended=${recommended}
              format=${format}
              photo=${photo}
              photo2=${photo2}
              busy=${busy}
              stylePack=${stylePack}
              mode=${mode}
              onCycleStylePack=${cycleStylePack}
              onSelect=${(index) => {
                setActive(index)
                setView('editor')
                setChatReference(null)
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
              theme=${theme}
              freeMode=${freeMode}
              sandboxRef=${sandboxRef}
              disclaimer=${meta.disclaimer}
              onSelect=${(index) => {
                setActive(index)
                setChatReference(null)
              }}
              onBack=${() => setView('gallery')}
              onBlockCommit=${commitBlock}
              onEditText=${editText}
              onReferenceBlock=${referenceBlock}
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
            onRemovePhoto2=${removeSecondary}
            messages=${chats[activeScheme.id] || []}
            chatBusy=${chatBusy}
            keyReady=${keyReady}
            captionBusy=${captionBusy}
            onEnrichCaptions=${enrichCaptions}
            canUndo=${(chatUndo[activeScheme.id] || []).length > 0}
            chatRequest=${chatRequest}
            reference=${chatReference}
            onClearReference=${() => setChatReference(null)}
            onSendChat=${sendChat}
            onUndoChat=${undoChat}
            onChangeStyle=${updateStyle}
            onChangeFormat=${(next) => {
              setFormat(next)
              setChatReference(null)
            }}
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
      ${modal === 'drafts' &&
      html`
        <${DraftsModal}
          drafts=${draftList}
          currentId=${draftId}
          onOpen=${openDraft}
          onDelete=${discardDraft}
          onNew=${() => startNewDraft()}
          onClose=${() => setModal(null)}
        />
      `}

      ${toast && html`<div class=${`toast ${toast.kind === 'error' ? 'error' : ''}`}>${toast.msg}</div>`}
    </div>
  `
}
