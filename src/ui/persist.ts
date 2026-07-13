const DB_NAME = 'fencepix'
const STORE_NAME = 'projects'
const AUTOSAVE_KEY = 'autosave'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function saveAutosave(json: string): Promise<void> {
  await withStore('readwrite', s => s.put(json, AUTOSAVE_KEY))
}

export async function loadAutosave(): Promise<string | null> {
  const v = await withStore('readonly', s => s.get(AUTOSAVE_KEY))
  return typeof v === 'string' ? v : null
}

export async function clearAutosave(): Promise<void> {
  await withStore('readwrite', s => s.delete(AUTOSAVE_KEY))
}
