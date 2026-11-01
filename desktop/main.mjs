import { app, BrowserWindow, dialog, Menu, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { startAppServer } from '../server.mjs'

const APP_NAME = '头版智造局'
const FIXED_PORT = Number(process.env.FPL_PORT || 0)
const USER_DATA = process.env.FPL_USER_DATA
const PORTABLE_DIR = process.env.PORTABLE_EXECUTABLE_DIR

app.setName(APP_NAME)
app.disableHardwareAcceleration()
// Some Windows machines / portable extraction paths reject the Chromium sandbox
// before Electron reaches app.whenReady(). This is a local-only desktop shell.
if (process.platform === 'win32') app.commandLine.appendSwitch('no-sandbox')

function canWriteDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true })
    const probe = path.join(dir, `.write-test-${process.pid}`)
    fs.writeFileSync(probe, 'ok')
    fs.unlinkSync(probe)
    return true
  } catch {
    return false
  }
}

function resolveUserData() {
  const candidates = []
  if (USER_DATA) candidates.push(USER_DATA)
  if (PORTABLE_DIR) candidates.push(path.join(PORTABLE_DIR, 'FrontPageLab-data'))
  try {
    candidates.push(path.join(app.getPath('appData'), 'FrontPageLab'))
  } catch {
    /* ignore */
  }
  try {
    candidates.push(path.join(app.getPath('temp'), 'FrontPageLab-data'))
  } catch {
    /* ignore */
  }
  for (const dir of candidates) {
    if (canWriteDir(dir)) return dir
  }
  return candidates[0] || process.cwd()
}

const DATA_DIR = resolveUserData()
const LOG_FILE = process.env.FPL_LOG_FILE || path.join(DATA_DIR, 'desktop.log')

try {
  app.setPath('userData', DATA_DIR)
} catch {
  /* keep Electron default */
}

function log(event, detail = '') {
  const line = `${new Date().toISOString()} [${event}] ${detail}\n`
  try {
    fs.appendFileSync(LOG_FILE, line)
  } catch {
    /* logging must never block startup */
  }
}

function showFatal(title, error) {
  log('fatal', error?.stack || String(error))
  try {
    dialog.showErrorBox(title, `${error?.message || error}\n\n日志：${LOG_FILE}`)
  } catch {
    /* ignore */
  }
}

process.on('uncaughtException', (error) => showFatal('桌面程序异常', error))
process.on('unhandledRejection', (error) => showFatal('桌面程序异常', error))

log('boot', `version=${app.getVersion()} data=${DATA_DIR} portable=${PORTABLE_DIR || '-'}`)

let mainWindow = null
let httpServer = null
let baseUrl = ''

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  log('single-instance', 'another instance is already running')
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })
}

function createWindow() {
  log('window', 'creating BrowserWindow')
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: APP_NAME,
    backgroundColor: '#0b0b0c',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  })

  const showWindow = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    if (!mainWindow.isVisible()) mainWindow.show()
  }
  const showFallback = setTimeout(showWindow, 6000)

  mainWindow.once('ready-to-show', () => {
    log('window', 'ready-to-show')
    clearTimeout(showFallback)
    showWindow()
  })
  mainWindow.on('closed', () => {
    clearTimeout(showFallback)
    mainWindow = null
  })
  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    log('load-failed', `${code} ${description} ${url}`)
  })
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    log('render-gone', JSON.stringify(details))
  })
  mainWindow.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2) log('renderer-console', message)
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url) && !url.startsWith(baseUrl)) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(baseUrl)) {
      event.preventDefault()
      if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    }
  })

  mainWindow.loadURL(baseUrl).catch((error) => {
    log('load-error', error?.stack || String(error))
    showFatal('页面加载失败', error)
  })
}

app.whenReady().then(async () => {
  log('app-ready', '')
  Menu.setApplicationMenu(null)
  try {
    const started = await startAppServer({ port: FIXED_PORT, host: '127.0.0.1' })
    httpServer = started.server
    baseUrl = `http://${started.host}:${started.port}/`
    log('server', baseUrl)
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  } catch (error) {
    log('server-error', error?.stack || String(error))
    showFatal('启动失败', new Error(`本地服务无法启动：${error.message}`))
    app.quit()
  }
})

app.on('window-all-closed', () => {
  log('window-all-closed', '')
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  log('before-quit', '')
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }
})
