import { useLiveQuery } from 'dexie-react-hooks'
import { db, type TableName, TABLES } from './db'
import type { SyncFields } from './types'

// Единственная точка записи данных. UI не обращается к IndexedDB напрямую.
// Когда подключим Supabase, sync-движок будет брать «грязные» записи
// (updatedAt > syncedAt) и отправлять их в облако — UI менять не придётся.

type Row = SyncFields & Record<string, unknown>
type Input<T extends SyncFields> = Omit<T, keyof SyncFields> & { id?: string }

const now = () => new Date().toISOString()
export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)

function table(name: TableName) {
  return db.table<Row, string>(name)
}

export async function create<T extends SyncFields>(name: TableName, data: Input<T>): Promise<T> {
  const t = now()
  const row = { ...data, id: data.id ?? uid(), createdAt: t, updatedAt: t, deletedAt: null, syncedAt: null } as unknown as T
  await table(name).put(row as unknown as Row)
  notifyChange()
  return row
}

export async function update<T extends SyncFields>(name: TableName, id: string, patch: Partial<Omit<T, keyof SyncFields>>) {
  await table(name).update(id, { ...(patch as Record<string, unknown>), updatedAt: now() })
  notifyChange()
}

export async function remove(name: TableName, id: string) {
  const t = now()
  await table(name).update(id, { deletedAt: t, updatedAt: t })
  notifyChange()
}

export async function getAll<T extends SyncFields>(name: TableName): Promise<T[]> {
  const rows = await table(name).toArray()
  return rows.filter((r) => !r.deletedAt) as unknown as T[]
}

/** Живой список записей таблицы (без удалённых). Перерисовывает компонент при изменениях. */
export function useRows<T extends SyncFields>(name: TableName, deps: unknown[] = []): T[] | undefined {
  return useLiveQuery(() => getAll<T>(name), [name, ...deps])
}

// ---------- Резервная копия ----------

export interface Backup {
  app: 'life-os'
  version: 1
  exportedAt: string
  data: Record<string, Row[]>
}

export async function exportAll(): Promise<Backup> {
  const data: Record<string, Row[]> = {}
  for (const name of TABLES) data[name] = await table(name).toArray()
  return { app: 'life-os', version: 1, exportedAt: now(), data }
}

export function validateBackup(x: unknown): x is Backup {
  if (!x || typeof x !== 'object') return false
  const b = x as Backup
  if (b.app !== 'life-os' || b.version !== 1 || !b.data || typeof b.data !== 'object') return false
  return Object.entries(b.data).every(
    ([k, v]) => TABLES.includes(k as TableName) && Array.isArray(v) && v.every((r) => r && typeof r.id === 'string'),
  )
}

/**
 * Восстановление. mode='merge' — для каждой записи побеждает более свежая (по updatedAt).
 * mode='replace' — полностью заменить текущие данные копией.
 */
export async function importAll(backup: Backup, mode: 'merge' | 'replace') {
  await db.transaction('rw', TABLES.map((n) => db.table(n)), async () => {
    for (const name of TABLES) {
      const rows = backup.data[name] ?? []
      const t = table(name)
      if (mode === 'replace') {
        await t.clear()
        await t.bulkPut(rows)
        continue
      }
      for (const r of rows) {
        const cur = await t.get(r.id)
        if (!cur || (r.updatedAt ?? '') > (cur.updatedAt ?? '')) await t.put(r)
      }
    }
  })
  notifyChange()
}

export async function wipeAll() {
  await db.transaction('rw', TABLES.map((n) => db.table(n)), async () => {
    for (const name of TABLES) await table(name).clear()
  })
}

/** Записи, ещё не отправленные в облако (для будущей синхронизации). */
export async function dirtyRows(name: TableName): Promise<Row[]> {
  const rows = await table(name).toArray()
  return rows.filter((r) => !r.syncedAt || r.updatedAt > r.syncedAt)
}

// Отметка последнего изменения — для напоминания о резервной копии.
function notifyChange() {
  try {
    localStorage.setItem('lifeos:lastChange', now())
  } catch {
    /* приватный режим — не критично */
  }
}
