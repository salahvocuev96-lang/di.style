import { useState } from 'react'
import { BookA, Check, Languages, Plus, Search, Trash2 } from 'lucide-react'
import { useRows, create, update, remove } from '../data/repo'
import type { EnglishSession, EnglishWord, Habit } from '../data/types'
import { useNow } from '../lib/hooks'
import { formatDateShort, formatDuration, lastNDates } from '../lib/date'
import { Bars, Button, Card, Empty, Field, IconButton, PageHeader, Ring, Segmented, cx, confirmAction } from '../components/ui'
import { LinkHabitToggle, autoMarkHabit, linkedHabit } from '../components/habits'
import { toast } from '../components/Layout'

const ACTIVITIES = ['Урок', 'Видео', 'Сериал / фильм', 'Приложение', 'Чтение', 'Разговор', 'Грамматика']
const GOAL = 25 // середина цели 20–30 минут

export default function English() {
  const { date: today } = useNow()
  const sessions = useRows<EnglishSession>('englishSessions')
  const words = useRows<EnglishWord>('englishWords')
  const habits = useRows<Habit>('habits')
  const habit = linkedHabit(habits, 'cat-english')
  const [tab, setTab] = useState<'sessions' | 'words'>('sessions')
  const [minutes, setMinutes] = useState('25')
  const [activity, setActivity] = useState(ACTIVITIES[0])
  const [note, setNote] = useState('')
  const [mark, setMark] = useState(true)
  if (!sessions || !words) return null

  const todayMin = sessions.filter((s) => s.date === today).reduce((a, s) => a + s.minutes, 0)
  const days30 = lastNDates(today, 30)
  const activeDays = (n: number) => new Set(sessions.filter((s) => lastNDates(today, n).includes(s.date)).map((s) => s.date)).size
  const bars = days30.slice(-14).map((d) => {
    const m = sessions.filter((s) => s.date === d).reduce((a, s) => a + s.minutes, 0)
    return { label: d.slice(8), value: Math.min(1, m / 45), highlight: d === today, title: `${m} мин` }
  })

  const add = async () => {
    const m = Number(minutes) || 0
    await create<EnglishSession>('englishSessions', { date: today, minutes: m, activity, note: note.trim() })
    if (mark && habit) {
      const total = todayMin + m
      await autoMarkHabit(habit.id, today, total >= 45 ? 'extra' : total >= 20 ? 'normal' : 'min')
    }
    setNote('')
    toast(`+${m} мин английского`)
  }

  return (
    <div>
      <PageHeader title="Английский" subtitle="Цель — 20–30 минут в день. Даже 10 минут лучше, чем ничего." />

      <div className="grid sm:grid-cols-3 gap-3 mb-4 sm:mb-5">
        <Card className="flex items-center gap-4">
          <Ring value={todayMin / GOAL} size={64}><span className="text-sm font-bold tabular">{todayMin}</span></Ring>
          <div><p className="text-xs text-muted">Сегодня, мин</p><p className="text-sm mt-0.5">{todayMin >= 20 ? 'Цель дня выполнена' : `до цели ${Math.max(0, 20 - todayMin)} мин`}</p></div>
        </Card>
        <Card><p className="text-xs text-muted">Дней за 7 / 30</p><p className="text-2xl font-bold tabular mt-1">{activeDays(7)} <span className="text-faint text-lg">/ {activeDays(30)}</span></p></Card>
        <Card><p className="text-xs text-muted">Слов в словаре</p><p className="text-2xl font-bold tabular mt-1">{words.length} <span className="text-sm text-faint">· выучено {words.filter((w) => w.learned).length}</span></p></Card>
      </div>

      <Segmented value={tab} onChange={setTab} className="mb-4 max-w-sm" options={[{ value: 'sessions', label: 'Занятия' }, { value: 'words', label: 'Слова' }]} />

      {tab === 'sessions' ? (
        <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
          <div className="min-w-0 lg:col-span-2 space-y-4 sm:space-y-5">
            <Card title="Записать занятие">
              <div className="flex gap-1.5 mb-3">
                {[10, 20, 30, 45].map((m) => (
                  <button key={m} onClick={() => setMinutes(String(m))} className={cx('flex-1 h-9 rounded-xl border text-sm font-semibold', minutes === String(m) ? 'bg-white/10 border-line-strong' : 'border-line text-muted')}>{m}</button>
                ))}
              </div>
              <Field label="Минут"><input type="number" min={1} inputMode="numeric" className="input" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></Field>
              <Field label="Чем занимался">
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVITIES.map((a) => (
                    <button key={a} type="button" onClick={() => setActivity(a)} className={cx('px-2.5 h-8 rounded-full text-xs border', activity === a ? 'bg-accent-2/15 border-accent-2/50 text-ink' : 'border-line text-muted')}>{a}</button>
                  ))}
                </div>
              </Field>
              <Field label="Урок / заметка"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Например: Present Perfect, урок 12" /></Field>
              <LinkHabitToggle habit={habit} checked={mark} onChange={setMark} />
              <Button variant="primary" className="w-full" disabled={!(Number(minutes) > 0)} onClick={add}><Plus size={16} />Записать</Button>
            </Card>
            <Card title="14 дней"><Bars height={56} data={bars} /></Card>
          </div>
          <Card className="lg:col-span-3" title="История занятий">
            {sessions.length ? (
              <ul className="divide-y divide-line">
                {[...sessions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 60).map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-2.5">
                    <div className="w-14 text-xs text-muted">{formatDateShort(s.date)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{s.activity} <span className="text-faint font-normal">· {formatDuration(s.minutes)}</span></p>
                      {s.note && <p className="text-xs text-muted truncate">{s.note}</p>}
                    </div>
                    <IconButton label="Удалить занятие" onClick={() => confirmAction('Удалить занятие?') && remove('englishSessions', s.id)}><Trash2 size={15} /></IconButton>
                  </li>
                ))}
              </ul>
            ) : <Empty icon={<Languages size={20} />} title="Занятий пока нет" text="Запиши первое занятие слева." />}
          </Card>
        </div>
      ) : <Words words={words} />}
    </div>
  )
}

function Words({ words }: { words: EnglishWord[] }) {
  const [word, setWord] = useState('')
  const [tr, setTr] = useState('')
  const [ex, setEx] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'new' | 'learned'>('all')

  const add = async () => {
    await create<EnglishWord>('englishWords', { word: word.trim(), translation: tr.trim(), example: ex.trim(), learned: false })
    setWord(''); setTr(''); setEx('')
  }
  const list = words
    .filter((w) => filter === 'all' || (filter === 'learned' ? w.learned : !w.learned))
    .filter((w) => !q || (w.word + ' ' + w.translation).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="grid lg:grid-cols-5 gap-4 sm:gap-5">
      <Card className="lg:col-span-2" title="Новое слово">
        <form onSubmit={(e) => { e.preventDefault(); if (word.trim()) add() }}>
          <Field label="Слово / фраза"><input className="input" value={word} onChange={(e) => setWord(e.target.value)} placeholder="to get used to" autoCapitalize="none" /></Field>
          <Field label="Перевод"><input className="input" value={tr} onChange={(e) => setTr(e.target.value)} placeholder="привыкать к" /></Field>
          <Field label="Пример"><input className="input" value={ex} onChange={(e) => setEx(e.target.value)} placeholder="I got used to waking up early" /></Field>
          <Button variant="primary" type="submit" className="w-full" disabled={!word.trim()}><Plus size={16} />Добавить</Button>
        </form>
      </Card>
      <Card className="lg:col-span-3" title="Словарь">
        <div className="flex gap-2 mb-3 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск" />
          </div>
          <Segmented value={filter} onChange={setFilter} options={[{ value: 'all', label: 'Все' }, { value: 'new', label: 'Учу' }, { value: 'learned', label: 'Выучено' }]} />
        </div>
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map((w) => (
              <li key={w.id} className="flex items-center gap-3 py-2.5">
                <button onClick={() => update<EnglishWord>('englishWords', w.id, { learned: !w.learned })} aria-label={w.learned ? 'Отметить как невыученное' : 'Отметить как выученное'}
                  className={cx('size-7 rounded-lg border grid place-items-center shrink-0', w.learned ? 'bg-good/15 border-good/40 text-good' : 'border-line text-transparent hover:text-faint')}>
                  <Check size={15} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm"><b className="font-semibold">{w.word}</b>{w.translation && <span className="text-muted"> — {w.translation}</span>}</p>
                  {w.example && <p className="text-xs text-faint italic truncate">{w.example}</p>}
                </div>
                <IconButton label="Удалить слово" onClick={() => remove('englishWords', w.id)}><Trash2 size={15} /></IconButton>
              </li>
            ))}
          </ul>
        ) : <Empty icon={<BookA size={20} />} title={words.length ? 'Ничего не найдено' : 'Словарь пуст'} />}
      </Card>
    </div>
  )
}
