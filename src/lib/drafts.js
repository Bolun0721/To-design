/**
 * 本地草稿：IndexedDB 存完整项目（方案 / 照片 / 对话），localStorage 只存当前草稿 id。
 * API Key 不进入这里（仍在 sessionStorage）。
 */
const DB_NAME = 'front-page-lab'
const DB_VERSION = 1
const DRAFT_STORE = 'drafts'
const META_STORE = 'draftMeta'
const CURRENT_KEY = 'fpl.draft.current.v1'

let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('当前浏览器不支持 IndexedDB'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        const store = db.createObjectStore(META_STORE, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('IndexedDB 打开失败'))
  })
  return dbPromise
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error || new Error('IndexedDB 事务失败'))
    tx.onabort = () => reject(tx.error || new Error('IndexedDB 事务中止'))
  })
}

export function newDraftId() {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  } catch {
    /* ignore */
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function saveDraftRecord(draft) {
  if (!draft?.id) throw new Error('缺少草稿 id')
  const db = await openDb()
  const tx = db.transaction([DRAFT_STORE, META_STORE], 'readwrite')
  tx.objectStore(DRAFT_STORE).put(draft)
  if (draft.metaInfo) tx.objectStore(META_STORE).put(draft.metaInfo)
  await txDone(tx)
}

export async function listDraftRecords() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(META_STORE, 'readonly').objectStore(META_STORE).getAll()
    request.onsuccess = () => {
      const list = Array.isArray(request.result) ? request.result : []
      resolve(list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)))
    }
    request.onerror = () => reject(request.error || new Error('读取草稿列表失败'))
  })
}

export async function getDraftRecord(id) {
  if (!id) return null
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(DRAFT_STORE, 'readonly').objectStore(DRAFT_STORE).get(id)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error || new Error('读取草稿失败'))
  })
}

export async function deleteDraftRecord(id) {
  if (!id) return
  const db = await openDb()
  const tx = db.transaction([DRAFT_STORE, META_STORE], 'readwrite')
  tx.objectStore(DRAFT_STORE).delete(id)
  tx.objectStore(META_STORE).delete(id)
  await txDone(tx)
}

export function getCurrentDraftId() {
  try {
    return localStorage.getItem(CURRENT_KEY)
  } catch {
    return null
  }
}

export function setCurrentDraftId(id) {
  try {
    if (id) localStorage.setItem(CURRENT_KEY, id)
    else localStorage.removeItem(CURRENT_KEY)
  } catch {
    /* ignore */
  }
}

export function clearCurrentDraftId() {
  setCurrentDraftId(null)
}
