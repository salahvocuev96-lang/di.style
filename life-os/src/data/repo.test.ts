import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { create, update, remove, getAll, exportAll, importAll, validateBackup, wipeAll, dirtyRows } from './repo'
import { seedIfEmpty } from './seed'
import type { Idea } from './types'

beforeEach(async () => { await wipeAll() })

describe('repo', () => {
  it('создаёт, обновляет и мягко удаляет', async () => {
    const i = await create<Idea>('ideas', { text: 'a', projectId: null })
    await update<Idea>('ideas', i.id, { text: 'b' })
    expect((await getAll<Idea>('ideas'))[0].text).toBe('b')
    await remove('ideas', i.id)
    expect(await getAll('ideas')).toHaveLength(0)
    // удалённая запись остаётся «грязной» для будущей синхронизации
    expect((await dirtyRows('ideas'))[0].deletedAt).toBeTruthy()
  })

  it('seed идемпотентен', async () => {
    await seedIfEmpty()
    await seedIfEmpty()
    expect((await getAll('habits')).length).toBe(5)
    expect((await getAll('scheduleBlocks')).length).toBe(15)
  })

  it('экспорт → очистка → импорт восстанавливает данные', async () => {
    await seedIfEmpty()
    await create<Idea>('ideas', { text: 'сайт для барбершопа', projectId: null })
    const backup = JSON.parse(JSON.stringify(await exportAll()))
    expect(validateBackup(backup)).toBe(true)
    await wipeAll()
    expect(await getAll('ideas')).toHaveLength(0)
    await importAll(backup, 'merge')
    expect((await getAll<Idea>('ideas'))[0].text).toBe('сайт для барбершопа')
    expect((await getAll('habits')).length).toBe(5)
  })

  it('merge оставляет более свежую версию', async () => {
    const i = await create<Idea>('ideas', { text: 'old', projectId: null })
    const backup = await exportAll()
    await new Promise((r) => setTimeout(r, 5))
    await update<Idea>('ideas', i.id, { text: 'new' })
    await importAll(backup, 'merge')
    expect((await getAll<Idea>('ideas'))[0].text).toBe('new')
  })

  it('отклоняет чужой файл', () => {
    expect(validateBackup({ foo: 1 })).toBe(false)
    expect(validateBackup({ app: 'life-os', version: 1, data: { hacker: [] } })).toBe(false)
  })
})
