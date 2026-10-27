# MASKGANGERSTORE — демо интернет-магазина

React + TypeScript + Vite + Tailwind CSS + Framer Motion. Сервера и базы данных нет: корзина хранится в браузере (localStorage), заказ оформляется через Telegram.

## Запуск

```bash
cd maskgangerstore
npm install
npm run dev      # локальный сайт: http://localhost:5173
npm run build    # готовые файлы в папке dist/ (можно залить на любой хостинг)
```

## Что менять владельцу

| Что | Где |
|---|---|
| Telegram для заказов | `src/config/store.ts` → `telegramUsername` (без @) |
| Валюта, название, демо-пометки | `src/config/store.ts` |
| Товары, цены, размеры, описания | `src/data/products.ts` |
| Фото товаров, hero, категорий | `src/data/products.ts` (поле `images`, объекты `images`, `categories`) |

Пока `telegramUsername` — заглушка, кнопка «Order via Telegram» показывает предупреждение и никуда не ведёт.

Свои фото: положите файлы в `public/images/` и укажите путь `'./images/имя.jpg'` вместо `unsplash('...')`.

## Важно

- Все товары, цены и фото — демонстрационные. Фото взяты с Unsplash (бесплатная лицензия Unsplash) и загружаются по ссылке; для реального магазина замените их своими.
- Переход в Telegram не отправляет заказ сам: покупатель должен нажать «Отправить» в Telegram. Корзина после этого не очищается.
