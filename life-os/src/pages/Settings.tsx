import { useEffect, useRef, useState } from 'react'
import { Cloud, CloudOff, Download, HardDrive, Pencil, Plus, ShieldCheck, Trash2, Upload, Smartphone } from 'lucide-react'
import { useRows, create, update, remove, exportAll, importAll, validateBackup, wipeAll, type Backup } from '../data/repo'
import type { Category, Habit } from '../data/types'
import { seedIfEmpty } from '../data/seed'
import { PALETTE } from '../lib/labels'
import { Button, Card, Field, IconButton, PageHeader, Sheet, cx, confirmAction } from '../components/ui'
import { CategoryIcon, ICONS } from '../components/CategoryIcon'
import { toast } from '../components/Layout'

const LS_EXPORT = 'lifeos:lastExport'
const readLS = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }

export default function Settings() {
  const cats = useRows<Category>('categories')
  const habits = useRows<Habit>('habits')
  const [edit, setEdit] = useState<Category | 'new' | null>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [lastExport, setLastExport] = useState(readLS(LS_EXPORT))
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null)) }, [])
  if (!cats || !habits) return null

  const doExport = async () => {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `life-os-backup-${data.exportedAt.slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    try { localStorage.setItem(LS_EXPORT, data.exportedAt) } catch { /* ignore */ }
    setLastExport(data.exportedAt)
    toast('Резервная копия скачана')
  }

  const onFile = async (file?: File) => {
    if (!file) return
    try {
      const json = JSON.parse(await file.text())
      if (!validateBackup(json)) throw new Error('bad')
      setPending(json)
    } catch {
      toast('Файл не похож на резервную копию Life OS')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const doImport = async (mode: 'merge' | 'replace') => {
    if (!pending) return
    if (mode === 'replace' && !confirmAction('Текущие данные будут заменены копией. Продолжить?')) return
    await importAll(pending, mode)
    setPending(null)
    toast('Данные восстановлены')
  }

  const doWipe = async () => {
    if (!confirmAction('Удалить ВСЕ данные на этом устройстве? Сначала сделай резервную копию.')) return
    if (!confirmAction('Точно? Отменить будет нельзя.')) return
    await wipeAll()
    await seedIfEmpty()
    toast('Данные сброшены')
  }

  const habitCats = cats.filter((c) => c.kind === 'habit')
  const daysSinceExport = lastExport ? Math.floor((Date.now() - new Date(lastExport).getTime()) / 864e5) : null
  const counts = Object.fromEntries((pending ? Object.entries(pending.data) : []).map(([k, v]) => [k, v.filter((r) => !r.deletedAt).length]))

  return (
    <div className="max-w-3xl">
      <PageHeader title="Настройки" />

      <div className="space-y-4 sm:space-y-5">
        <Card title="Категории" action={<Button size="sm" variant="ghost" onClick={() => setEdit('new')}><Plus size={15} />Категория</Button>}>
          <div className="grid sm:grid-cols-2 gap-2">
            {habitCats.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl bg-surface-2 border border-line p-2.5">
                <CategoryIcon icon={c.icon} color={c.color} size={16} />
                <span className="flex-1 text-sm font-medium truncate">{c.name}</span>
                <span className="text-xs text-faint tabular">{habits.filter((h) => h.categoryId === c.id).length}</span>
                <IconButton label="Изменить категорию" className="size-8" onClick={() => setEdit(c)}><Pencil size={14} /></IconButton>
              </div>
            ))}
          </div>
        </Card>

        <Card title={<span className="inline-flex items-center gap-2"><HardDrive size={16} className="text-accent" />Резервная копия</span>}>
          <p className="text-sm text-muted mb-1">Все данные хранятся на этом устройстве. Скачивай копию раз в неделю — это твоя страховка.</p>
          <p className={cx('text-sm mb-4', daysSinceExport === null || daysSinceExport > 7 ? 'text-warn' : 'text-good')}>
            {daysSinceExport === null ? 'Копия ещё ни разу не сохранялась.' : daysSinceExport === 0 ? 'Последняя копия: сегодня.' : `Последняя копия: ${daysSinceExport} дн. назад.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={doExport}><Download size={16} />Скачать копию (JSON)</Button>
            <Button onClick={() => fileRef.current?.click()}><Upload size={16} />Восстановить из файла</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          <p className="text-xs text-faint mt-3 flex items-center gap-1.5">
            <ShieldCheck size={14} />
            {persisted === true ? 'Браузер обещал не удалять данные автоматически.' : persisted === false ? 'Браузер может очистить данные при нехватке места — установи приложение на экран и делай копии.' : 'Статус хранилища неизвестен.'}
          </p>
        </Card>

        <Card title={<span className="inline-flex items-center gap-2"><CloudOff size={16} className="text-muted" />Синхронизация</span>}>
          <p className="text-sm text-muted">Облако пока не подключено. Приложение уже готово к нему: каждое изменение помечается для отправки, удаления хранятся «мягко». После подключения Supabase данные синхронизируются между телефоном и компьютером.</p>
          <p className="text-xs text-faint mt-2 inline-flex items-center gap-1.5"><Cloud size={14} />А пока перенос между устройствами — через резервную копию (режим «Объединить»).</p>
        </Card>

        <Card title={<span className="inline-flex items-center gap-2"><Smartphone size={16} className="text-accent-2" />Установка на телефон</span>}>
          <ul className="text-sm text-muted space-y-1.5">
            <li><b className="text-ink">iPhone (Safari):</b> «Поделиться» → «На экран Домой».</li>
            <li><b className="text-ink">Android (Chrome):</b> меню ⋮ → «Установить приложение».</li>
            <li><b className="text-ink">Компьютер (Chrome/Edge):</b> значок установки в адресной строке.</li>
          </ul>
          <p className="text-xs text-faint mt-2">После установки приложение работает без интернета.</p>
        </Card>

        <Card title="Опасная зона">
          <Button variant="danger" onClick={doWipe}><Trash2 size={16} />Удалить все данные</Button>
        </Card>
      </div>

      <CategoryForm open={edit !== null} cat={edit === 'new' ? undefined : edit ?? undefined} used={edit && edit !== 'new' ? habits.some((h) => h.categoryId === edit.id) : false} onClose={() => setEdit(null)} />

      <Sheet open={!!pending} onClose={() => setPending(null)} title="Восстановление">
        {pending && (
          <>
            <p className="text-sm text-muted mb-3">Копия от {new Date(pending.exportedAt).toLocaleString('ru-RU')}.</p>
            <p className="text-xs text-faint mb-4">
              Привычек: {counts.habits ?? 0} · отметок: {counts.habitLogs ?? 0} · тренировок: {counts.workouts ?? 0} · проектов: {counts.projects ?? 0} · записей журнала: {counts.devLogs ?? 0}
            </p>
            <div className="space-y-2">
              <Button variant="primary" className="w-full" onClick={() => doImport('merge')}>Объединить (рекомендуется)</Button>
              <p className="text-xs text-faint px-1">Добавит недостающее; при совпадении останется более свежая версия записи.</p>
              <Button variant="danger" className="w-full mt-2" onClick={() => doImport('replace')}>Заменить всё копией</Button>
            </div>
          </>
        )}
      </Sheet>
    </div>
  )
}

function CategoryForm({ open, cat, used, onClose }: { open: boolean; cat?: Category; used: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PALETTE[0])
  const [icon, setIcon] = useState('sparkles')
  useEffect(() => {
    if (!open) return
    setName(cat?.name ?? ''); setColor(cat?.color ?? PALETTE[0]); setIcon(cat?.icon ?? 'sparkles')
  }, [open, cat])

  const save = async () => {
    const data = { name: name.trim(), color, icon, kind: cat?.kind ?? ('habit' as const) }
    if (cat) await update<Category>('categories', cat.id, data)
    else await create<Category>('categories', data)
    toast('Категория сохранена')
    onClose()
  }
  const del = async () => {
    if (!cat) return
    if (used) { toast('Сначала перенеси привычки в другую категорию'); return }
    if (!confirmAction(`Удалить категорию «${cat.name}»?`)) return
    await remove('categories', cat.id)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={cat ? 'Категория' : 'Новая категория'}>
      <Field label="Название"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Чтение" /></Field>
      <Field label="Цвет">
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Цвет ${c}`}
              className={cx('size-8 rounded-full transition', color === c && 'ring-2 ring-offset-2 ring-offset-surface ring-white/70')} style={{ background: c }} />
          ))}
        </div>
      </Field>
      <Field label="Иконка">
        <div className="flex flex-wrap gap-2">
          {Object.keys(ICONS).map((k) => (
            <button key={k} type="button" onClick={() => setIcon(k)} aria-label={`Иконка ${k}`}
              className={cx('rounded-xl transition', icon === k ? 'ring-2 ring-white/60' : 'opacity-60 hover:opacity-100')}>
              <CategoryIcon icon={k} color={color} size={16} />
            </button>
          ))}
        </div>
      </Field>
      <div className="flex gap-2 mt-2">
        {cat && <Button variant="danger" onClick={del} aria-label="Удалить категорию"><Trash2 size={16} /></Button>}
        <Button variant="ghost" className="flex-1" onClick={onClose}>Отмена</Button>
        <Button variant="primary" className="flex-1" disabled={!name.trim()} onClick={save}>Сохранить</Button>
      </div>
    </Sheet>
  )
}
