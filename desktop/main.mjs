import { app, BrowserWindow, dialog, Menu, shell } from 'electron'
import path from 'node:path'
import { startAppServer } from '../server.mjs'

const APP_NAME = '头版智造局'
const FIXED_PORT = Number(process.env.FPL_PORT || 0)
const USER_DATA = process.env.FPL_USER_DATA

if (USER_DATA) app.setPath('userData', USER_DATA)
else app.setPath('userData', path.join(app.getPath('appData'), 'FrontPageLab'))

app.setName(APP_NAME)

let mainWindow = null
let httpServer = null
let baseUrl = ''

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })
}

app.setName(APP_NAME)

function createWindow() {
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

  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => {
    mainWindow = null
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

  mainWindow.loadURL(baseUrl)
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)
  try {
    const started = await startAppServer({ port: FIXED_PORT, host: '127.0.0.1' })
    httpServer = started.server
    baseUrl = `http://${started.host}:${started.port}/`
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  } catch (err) {
    dialog.showErrorBox('启动失败', `本地服务无法启动：${err.message}`)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }
})
