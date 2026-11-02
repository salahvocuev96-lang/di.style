import { useEffect, useState } from 'react'
import { toISODate, nowHM } from './date'

/** Текущая дата и время; обновляется раз в минуту и при возвращении в приложение. */
export function useNow() {
  const [now, setNow] = useState(() => ({ date: toISODate(), time: nowHM() }))
  useEffect(() => {
    const tick = () => setNow((p) => {
      const n = { date: toISODate(), time: nowHM() }
      return n.date === p.date && n.time === p.time ? p : n
    })
    const id = setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return now
}
