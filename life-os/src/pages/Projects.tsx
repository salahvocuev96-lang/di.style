import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Circle, Code2, FolderKanban, Lightbulb, Pencil, Plus, Trash2, Sun, X } from 'lucide-react'
import { useRows, create, update, remove, getAll } from '../data/repo'
import type { DevLog, Idea, Project, ProjectStatus, Task } from '../data/types'
import { useNow } from '../lib/hooks'
import { formatDateLong, formatDateShort, formatDuration, lastNDates } from '../lib/date'
import { DIRECTIONS, PROJECT_STATUS } from '../lib/labels'
import { Bar, Bars, Button, Card, Empty, Field, IconButton, PageHeader, Pill, Segmented, Sheet, cx, confirmAction } from '../components/ui'
import { toast } from '../components/Layout'

type Tab = 'projects' | 'log' | 'ideas' | 'tech'

export default function Projects() {
  const [tab, setTab] = useState<Tab>('projects')
  return (
    <div>
      <PageHeader title="Проекты" subtitle="Разработка, задачи, что сделано за день, идеи и изученные технологии." />
      <Segmented value={tab} onChange={setTab} className="mb-5"
        options={[
          { value: 'projects', label: 'Проекты' }, { value: 'log', label: 'Журнал' },
          { value: 'ideas', label: 'Идеи' }, { value: 'tech', label: 'Технологии' },
        ]} />
      {tab === 'projects' && <ProjectsTab />}
      {tab === 'log' && <LogTab />}
      {tab === 'ideas' && <IdeasTab />}
      {tab === 'tech' && <TechTab />}
    </div>
  )
}

// ---------------- Проекты ----------------

function ProjectsTab() {
  const { date: today } = useNow()
  const projects = useRows<Project>('projects')
  const tasks = useRows<Task>('tasks')
  const [form, setForm] = useState<Project | 'new' | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all')
  if (!projects || !tasks) return null

  const list = projects.filter((p) => status === 'all' || p.status === status)
    .sort((a, b) => ['active', 'idea', 'paused', 'done'].indexOf(a.status) - ['active', 'idea', 'paused', 'done'].indexOf(b.status) || b.updatedAt.localeCompare(a.updatedAt))
  const loose = tasks.filter((t) => !t.projectId && !t.done)
  const opened = projects.find((p) => p.id === open)

  return (
    <>
      <div className="flex gap-2 mb-4">
        <Segmented value={status} onChange={setStatus} className="flex-1"
          options={[{ value: 'all', label: 'Все' }, ...(Object.keys(PROJECT_STATUS) as ProjectStatus[]).map((s) => ({ value: s, label: PROJECT_STATUS[s].label }))]} />
        <Button variant="primary" className="h-11" onClick={() => setForm('new')}><Plus size={16} /><span className="hidden sm:inline">Проект</span></Button>
      </div>

      {list.length ? (
        <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
          {list.map((p) => {
            const pt = tasks.filter((t) => t.projectId === p.id)
            const done = pt.filter((t) => t.done).length
            return (
              <Card key={p.id} className="cursor-pointer hover:border-line-strong transition">
                <div role="button" tabIndex={0} onClick={() => setOpen(p.id)} onKeyDown={(e) => e.key === 'Enter' && setOpen(p.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{p.name}</p>
                    <Pill color={PROJECT_STATUS[p.status].color}>{PROJECT_STATUS[p.status].label}</Pill>
                  </div>
                  {p.description && <p className="text-sm text-muted mt-1 line-clamp-2">{p.description}</p>}
                  <div className="flex justify-between text-xs mt-4 mb-1.5">
                    <span className="text-muted">Задачи</span><span className="tabular">{done}/{pt.length}</span>
                  </div>
                  <Bar value={pt.length ? done / pt.length : 0} />
                  {p.deadline && (
                    <p className={cx('text-xs mt-3 inline-flex items-center gap-1', p.deadline < today && p.status !== 'done' ? 'text-warn' : 'text-faint')}>
                      <CalendarDays size={13} />Дедлайн: {formatDateShort(p.deadline)}
                    </p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card><Empty icon={<FolderKanban size={20} />} title="Проектов пока нет" text="Сайт для портфолио, учебный проект или заказ клиента — всё сюда."
          action={<Button variant="primary" size="sm" onClick={() => setForm('new')}><Plus size={16} />Создать проект</Button>} /></Card>
      )}

      {loose.length > 0 && (
        <Card className="mt-4" title="Задачи без проекта">
          <TaskList tasks={loose} today={today} />
        </Card>
      )}

      <ProjectForm open={form !== null} project={form === 'new' ? undefined : form ?? undefined} onClose={() => setForm(null)} />
      {opened && <ProjectDetail project={opened} tasks={tasks.filter((t) => t.projectId === opened.id)} today={today}
        onClose={() => setOpen(null)} onEdit={() => { setOpen(null); setForm(opened) }} />}
    </>
  )
}

function TaskList({ tasks, today }: { tasks: Task[]; today: string }) {
  const sorted = [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || a.priority - b.priority || (a.deadline ?? '9').localeCompare(b.deadline ?? '9'))
  return (
    <ul className="divide-y divide-line -my-1">
      {sorted.map((t) => (
        <li key={t.id} className="flex items-center gap-2 py-1.5">
          <button className="flex items-center gap-3 flex-1 min-w-0 py-1 text-left" onClick={() => update<Task>('tasks', t.id, { done: !t.done, doneAt: t.done ? null : new Date().toISOString() })}>
            {t.done ? <CheckCircle2 size={19} className="text-good shrink-0" /> : <Circle size={19} className={cx('shrink-0', t.priority === 1 ? 'text-bad' : 'text-faint')} />}
            <span className="min-w-0">
              <span className={cx('block text-sm truncate', t.done && 'line-through text-faint')}>{t.title}</span>
              {(t.deadline || t.plannedDate) && (
                <span className="block text-[11px] text-faint">
                  {t.plannedDate === today ? 'Сегодня' : t.plannedDate ? `План: ${formatDateShort(t.plannedDate)}` : ''}
                  {t.deadline ? `${t.plannedDate ? ' · ' : ''}Дедлайн ${formatDateShort(t.deadline)}` : ''}
                </span>
              )}
            </span>
          </button>
          {!t.done && t.plannedDate !== today && (
            <IconButton label="На сегодня" onClick={async () => { await update<Task>('tasks', t.id, { plannedDate: today }); toast('Добавлено на сегодня') }}><Sun size={15} /></IconButton>
          )}
          <IconButton label="Удалить задачу" onClick={() => remove('tasks', t.id)}><X size={15} /></IconButton>
        </li>
      ))}
    </ul>
  )
}

function ProjectDetail({ project, tasks, today, onClose, onEdit }: { project: Project; tasks: Task[]; today: string; onClose: () => void; onEdit: () => void }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<1 | 2 | 3>(2)
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState(project.notes)
  const ideas = useRows<Idea>('ideas')?.filter((i) => i.projectId === project.id) ?? []
  const logs = useRows<DevLog>('devLogs')?.filter((l) => l.projectId === project.id).sort((a, b) => b.date.localeCompare(a.date)) ?? []

  const addTask = async () => {
    if (!title.trim()) return
    await create<Task>('tasks', { title: title.trim(), projectId: project.id, done: false, doneAt: null, priority, plannedDate: null, deadline: deadline || null })
    setTitle(''); setDeadline(''); setPriority(2)
  }
  const saveNotes = () => notes !== project.notes && update<Project>('projects', project.id, { notes })

  return (
    <Sheet open onClose={() => { saveNotes(); onClose() }} title={project.name}>
      <div className="flex items-center gap-2 -mt-2 mb-4 flex-wrap">
        <Pill color={PROJECT_STATUS[project.status].color}>{PROJECT_STATUS[project.status].label}</Pill>
        {project.deadline && <Pill>Дедлайн {formatDateShort(project.deadline)}</Pill>}
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onEdit}><Pencil size={14} />Изменить</Button>
      </div>
      {project.description && <p className="text-sm text-muted mb-4">{project.description}</p>}

      <p className="text-sm font-semibold mb-2">Задачи</p>
      <form onSubmit={(e) => { e.preventDefault(); addTask() }} className="space-y-2 mb-3">
        <input className="input" placeholder="Новая задача" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="flex gap-2">
          <select className="input" value={priority} onChange={(e) => setPriority(Number(e.target.value) as 1 | 2 | 3)} aria-label="Приоритет">
            <option value={1}>Важно</option><option value={2}>Обычно</option><option value={3}>Потом</option>
          </select>
          <input type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-label="Дедлайн" />
          <Button variant="primary" type="submit" disabled={!title.trim()} className="shrink-0 w-11 px-0" aria-label="Добавить задачу"><Plus size={18} /></Button>
        </div>
      </form>
      {tasks.length ? <TaskList tasks={tasks} today={today} /> : <p className="text-sm text-faint">Задач пока нет.</p>}

      <p className="text-sm font-semibold mt-5 mb-2">Заметки</p>
      <textarea className="input min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} placeholder="Контакты клиента, ссылки, требования…" />

      {ideas.length > 0 && (
        <>
          <p className="text-sm font-semibold mt-5 mb-2">Идеи</p>
          <ul className="space-y-1.5">{ideas.map((i) => <li key={i.id} className="text-sm text-muted flex gap-2"><Lightbulb size={14} className="text-warn mt-0.5 shrink-0" />{i.text}</li>)}</ul>
        </>
      )}
      {logs.length > 0 && (
        <>
          <p className="text-sm font-semibold mt-5 mb-2">История работы</p>
          <ul className="divide-y divide-line">{logs.slice(0, 15).map((l) => (
            <li key={l.id} className="py-2 text-sm"><span className="text-faint text-xs">{formatDateShort(l.date)}{l.minutes ? ` · ${formatDuration(l.minutes)}` : ''}</span><p>{l.text}</p></li>
          ))}</ul>
        </>
      )}
    </Sheet>
  )
}

type ProjectDraft = Pick<Project, 'name' | 'description' | 'status' | 'deadline' | 'notes' | 'categoryId'>

function ProjectForm({ open, project, onClose }: { open: boolean; project?: Project; onClose: () => void }) {
  const blank: ProjectDraft = { name: '', description: '', status: 'active', deadline: null, notes: '', categoryId: null }
  const [f, setF] = useState<ProjectDraft>(blank)
  useEffect(() => {
    if (open) setF(project ? { name: project.name, description: project.description, status: project.status, deadline: project.deadline, notes: project.notes, categoryId: project.categoryId } : blank)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project])
  const save = async () => {
    const data = { ...f, name: f.name.trim() }
    if (project) await update<Project>('projects', project.id, data)
    else await create<Project>('projects', data)
    toast('Проект сохранён')
    onClose()
  }
  const del = async () => {
    if (!project || !confirmAction(`Удалить проект «${project.name}»? Задачи проекта останутся в «Задачах без проекта».`)) return
    const orphan = (await getAll<Task>('tasks')).filter((t) => t.projectId === project.id)
    for (const t of orphan) await update<Task>('tasks', t.id, { projectId: null })
    await remove('projects', project.id)
    toast('Проект удалён')
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title={project ? 'Изменить проект' : 'Новый проект'}>
      <Field label="Название"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Например: Сайт-портфолио" /></Field>
      <Field label="Описание"><textarea className="input min-h-20" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Статус">
        <Segmented value={f.status} onChange={(s) => setF({ ...f, status: s })} options={(Object.keys(PROJECT_STATUS) as ProjectStatus[]).map((s) => ({ value: s, label: PROJECT_STATUS[s].label }))} />
      </Field>
      <Field label="Дедлайн (необязательно)"><input type="date" className="input" value={f.deadline ?? ''} onChange={(e) => setF({ ...f, deadline: e.target.value || null })} /></Field>
      <div className="flex gap-2 mt-2">
        {project && <Button variant="danger" onClick={del} aria-label="Удалить проект"><Trash2 size={16} /></Button>}
        <Button variant="ghost" className="flex-1" onClick={onClose}>Отмена</Button>
        <Button variant="primary" className="flex-1" disabled={!f.name.trim()} onClick={save}>Сохранить</Button>
      </div>
    </Sheet>
  )
}

// ---------------- Журнал «что сделал» ----------------

function LogTab() {
  const { date: today } = useNow()
  const logs = useRows<DevLog>('devLogs')
  const projects = useRows<Project>('projects')
  const [text, setText] = useState('')
  const [minutes, setMinutes] = useState('')
  const [projectId, setProjectId] = useState('')
  const [tech, setTech] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [date, setDate] = useState(today)

  const grouped = useMemo(() => {
    const m = new Map<string, DevLog[]>()
    for (const l of [...(logs ?? [])].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))) {
      if (!m.has(l.date)) m.set(l.date, [])
      m.get(l.date)!.push(l)
    }
    return [...m.entries()]
  }, [logs])
  if (!logs || !projects) return null

  const allTech = [...new Set([...DIRECTIONS, ...logs.flatMap((l) => l.tech)])]
  const add = async () => {
    await create<DevLog>('devLogs', { date, projectId: projectId || null, text: text.trim(), minutes: Number(minutes) || 0, tech })
    setText(''); setMinutes(''); setTech([])
    toast('Записано')
  }
  const addCustom = () => {
    const t = custom.trim()
    if (t && !tech.includes(t)) setTech([...tech, t])
    setCustom('')
  }
  const pmap = new Map(projects.map((p) => [p.id, p.name]))
  const last14 = lastNDates(today, 14).map((d) => {
    const m = logs.filter((l) => l.date === d).reduce((s, l) => s + l.minutes, 0)
    return { d, m }
  })
  const max = Math.max(60, ...last14.map((x) => x.m))

  return (
    <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
      <div className="min-w-0 lg:col-span-2 space-y-4">
        <Card title="Что я сделал">
          <Field label="Описание"><textarea className="input min-h-24" value={text} onChange={(e) => setText(e.target.value)} placeholder="Сверстал шапку сайта, разобрался с flexbox…" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Минут"><input type="number" min={0} inputMode="numeric" className="input" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="60" /></Field>
            <Field label="Дата"><input type="date" className="input" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} /></Field>
          </div>
          <Field label="Проект">
            <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Без проекта</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <p className="text-xs font-medium text-muted mb-1.5">Технологии / направления</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {allTech.map((t) => (
              <button key={t} type="button" onClick={() => setTech(tech.includes(t) ? tech.filter((x) => x !== t) : [...tech, t])}
                className={cx('px-2.5 h-7 rounded-full text-xs border transition', tech.includes(t) ? 'bg-accent/15 border-accent/50 text-ink' : 'border-line text-muted hover:text-ink')}>{t}</button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); addCustom() }} className="flex gap-2 mb-4">
            <input className="input" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Своя технология (React, Figma…)" />
            <Button type="submit" disabled={!custom.trim()} className="shrink-0">Добавить</Button>
          </form>
          <Button variant="primary" className="w-full" disabled={!text.trim()} onClick={add}><Plus size={16} />Записать</Button>
        </Card>
        <Card title="14 дней">
          <Bars height={56} data={last14.map((x) => ({ label: x.d.slice(8), value: x.m / max, highlight: x.d === today, title: formatDuration(x.m) }))} />
        </Card>
      </div>

      <Card className="lg:col-span-3" title="История">
        {grouped.length ? (
          <div className="space-y-5">
            {grouped.map(([d, items]) => (
              <div key={d}>
                <p className="text-xs text-muted capitalize mb-2">{formatDateLong(d)} · {formatDuration(items.reduce((s, l) => s + l.minutes, 0))}</p>
                <div className="space-y-2">
                  {items.map((l) => (
                    <div key={l.id} className="rounded-xl bg-surface-2 border border-line p-3 group">
                      <div className="flex gap-2">
                        <p className="text-sm flex-1 whitespace-pre-wrap">{l.text}</p>
                        <IconButton label="Удалить запись" className="size-7 -mr-1 -mt-1" onClick={() => confirmAction('Удалить запись?') && remove('devLogs', l.id)}><Trash2 size={14} /></IconButton>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {l.minutes > 0 && <Pill>{formatDuration(l.minutes)}</Pill>}
                        {l.projectId && pmap.get(l.projectId) && <Pill color="#22d3ee">{pmap.get(l.projectId)}</Pill>}
                        {l.tech.map((t) => <Pill key={t} color="#a78bfa">{t}</Pill>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : <Empty icon={<Code2 size={20} />} title="Журнал пуст" text="Записывай каждый день хотя бы одну строчку — через месяц увидишь, сколько сделано." />}
      </Card>
    </div>
  )
}

// ---------------- Идеи ----------------

function IdeasTab() {
  const ideas = useRows<Idea>('ideas')
  const projects = useRows<Project>('projects')
  const [text, setText] = useState('')
  const [projectId, setProjectId] = useState('')
  if (!ideas || !projects) return null
  const pmap = new Map(projects.map((p) => [p.id, p.name]))
  const add = async () => {
    await create<Idea>('ideas', { text: text.trim(), projectId: projectId || null })
    setText('')
  }
  return (
    <div className="max-w-2xl">
      <Card>
        <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) add() }} className="space-y-2">
          <textarea className="input min-h-20" value={text} onChange={(e) => setText(e.target.value)} placeholder="Идея для сайта, проекта, заработка…" />
          <div className="flex gap-2">
            <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Проект">
              <option value="">Без проекта</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Button variant="primary" type="submit" disabled={!text.trim()} className="shrink-0"><Plus size={16} />Сохранить</Button>
          </div>
        </form>
      </Card>
      <div className="space-y-2 mt-4">
        {[...ideas].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((i) => (
          <div key={i.id} className="card p-4 flex gap-3 animate-fade-up">
            <Lightbulb size={18} className="text-warn shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm whitespace-pre-wrap">{i.text}</p>
              <p className="text-[11px] text-faint mt-1">{formatDateShort(i.createdAt.slice(0, 10))}{i.projectId && pmap.get(i.projectId) ? ` · ${pmap.get(i.projectId)}` : ''}</p>
            </div>
            <IconButton label="Удалить идею" onClick={() => confirmAction('Удалить идею?') && remove('ideas', i.id)}><Trash2 size={15} /></IconButton>
          </div>
        ))}
        {!ideas.length && <Card><Empty icon={<Lightbulb size={20} />} title="Идей пока нет" text="Сохраняй любые мысли сразу — потом разберёшь." /></Card>}
      </div>
    </div>
  )
}

// ---------------- Технологии ----------------

function TechTab() {
  const logs = useRows<DevLog>('devLogs')
  if (!logs) return null
  const stats = new Map<string, { days: Set<string>; minutes: number; last: string }>()
  for (const l of logs) for (const t of l.tech) {
    const s = stats.get(t) ?? { days: new Set(), minutes: 0, last: '' }
    s.days.add(l.date)
    s.minutes += l.tech.length ? Math.round(l.minutes / l.tech.length) : 0
    if (l.date > s.last) s.last = l.date
    stats.set(t, s)
  }
  const rows = [...new Set([...DIRECTIONS, ...stats.keys()])].map((t) => ({ t, s: stats.get(t) }))
    .sort((a, b) => (b.s?.minutes ?? 0) - (a.s?.minutes ?? 0))
  const max = Math.max(1, ...rows.map((r) => r.s?.minutes ?? 0))
  const totalMin = logs.reduce((s, l) => s + l.minutes, 0)
  const days = new Set(logs.map((l) => l.date)).size

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card><p className="text-xs text-muted">Всего времени</p><p className="text-2xl font-bold tabular mt-1">{formatDuration(totalMin)}</p></Card>
        <Card><p className="text-xs text-muted">Дней практики</p><p className="text-2xl font-bold tabular mt-1">{days}</p></Card>
      </div>
      <Card title="Направления" action={<span className="text-xs text-faint">по записям журнала</span>}>
        <div className="space-y-3">
          {rows.map(({ t, s }) => (
            <div key={t}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className={s ? '' : 'text-faint'}>{t}</span>
                <span className="text-xs text-muted tabular">{s ? `${s.days.size} дн · ${formatDuration(s.minutes)}` : 'ещё не начато'}</span>
              </div>
              <Bar value={(s?.minutes ?? 0) / max} />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-faint mt-4">Время записи делится поровну между отмеченными технологиями.</p>
      </Card>
    </div>
  )
}
