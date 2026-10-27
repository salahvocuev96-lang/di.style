import { ShoppingBag, Ruler, Send } from 'lucide-react'
import { Reveal, Stagger, StaggerItem } from './Reveal'

const STEPS = [
  { icon: Ruler, t: 'Выберите вещь и размер', d: 'Откройте карточку товара, укажите размер и количество.' },
  { icon: ShoppingBag, t: 'Соберите корзину', d: 'Корзина сохранится, даже если вы закроете страницу.' },
  { icon: Send, t: 'Отправьте заказ в Telegram', d: 'Мы сформируем текст заказа — останется нажать «Отправить» в чате с продавцом.' },
]

export function OrderSteps() {
  return (
    <section aria-labelledby="steps-title" className="relative overflow-hidden bg-accent text-white">
      <span aria-hidden className="pointer-events-none absolute -top-10 -right-6 font-display text-[16rem] leading-none font-black text-white/10 select-none">
        TG
      </span>
      <div className="relative mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
        <Reveal>
          <h2 id="steps-title" className="font-display text-[clamp(1.9rem,4.4vw,3.6rem)] leading-none font-black tracking-[-0.03em] uppercase">
            Как сделать заказ
          </h2>
        </Reveal>
        <Stagger as="ul" className="mt-10 grid gap-3 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <StaggerItem as="li" key={s.t} className="flex gap-4 bg-white p-5 text-ink sm:p-6">
              <span className="font-display text-4xl leading-none font-black text-accent">{i + 1}</span>
              <span>
                <span className="flex items-center gap-2 text-lg font-extrabold">
                  <s.icon size={18} className="text-accent" /> {s.t}
                </span>
                <span className="mt-1.5 block text-[15px] leading-snug text-ink/75">{s.d}</span>
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
