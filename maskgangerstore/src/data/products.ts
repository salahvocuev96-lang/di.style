import type { Category, Product } from '../types/product'

/**
 * ДЕМО-КАТАЛОГ. Все товары, цены и фото — тестовые.
 * Чтобы заменить фото: поставьте в images свою ссылку
 * (например '/images/hoodie-1.jpg' из папки public) вместо unsplash('...').
 */

/** Фото с Unsplash (бесплатная лицензия Unsplash). id — код из адреса страницы фото. */
export const unsplash = (id: string, width = 1000) =>
  `https://unsplash.com/photos/${id}/download?w=${width}`

export const images = {
  hero: unsplash('3bNrXLwseCY', 1800),
  about: unsplash('WCWgY3L_xVw', 1400),
  lookbook: unsplash('aXPD9U7Owws', 1600),
  lookbookSide: unsplash('p25vHkG2Vt0', 1000),
}

export const categories: { id: Category; label: string; image: string; caption: string }[] = [
  { id: 'hoodies', label: 'Худи', image: unsplash('sYri5yWeYFs', 1200), caption: 'Плотный хлопок и свободный крой' },
  { id: 't-shirts', label: 'Футболки', image: unsplash('eDX5VWJDZRE', 1000), caption: 'Базовые модели и боксовый крой' },
  { id: 'shorts', label: 'Шорты', image: unsplash('zCeYxaGi5GU', 1000), caption: 'Карго и нейлон на тёплые дни' },
  { id: 'sneakers', label: 'Кроссовки', image: unsplash('SnwHgwQ085I', 1200), caption: 'Для города и каждого дня' },
]

export const categoryLabels: Record<Category, string> = {
  hoodies: 'Худи',
  't-shirts': 'Футболки',
  shorts: 'Шорты',
  sneakers: 'Кроссовки',
  jackets: 'Куртки',
  accessories: 'Аксессуары',
}

const APPAREL = ['XS', 'S', 'M', 'L', 'XL']
const SHOES = ['40', '41', '42', '43', '44', '45']

export const products: Product[] = [
  {
    id: 'utility-shell-jacket',
    name: 'Куртка Utility Shell',
    category: 'jackets',
    price: 129,
    images: [unsplash('RdZ6Q7z8sPM'), unsplash('o_2ceg1bMTs')],
    badge: 'Новинка',
    sizes: APPAREL,
    isNew: true,
    description:
      'Лёгкая техническая куртка-шелл с укороченным боксовым силуэтом. Водоотталкивающая пропитка, проклеенные швы и капюшон, который убирается в воротник.',
    details: ['Водоотталкивающий нейлон', 'Капюшон убирается в воротник', 'Два нагрудных кармана на молнии', 'Свободная посадка, размер в размер'],
  },
  {
    id: 'heavyweight-oversized-hoodie',
    name: 'Худи Heavyweight Oversized',
    category: 'hoodies',
    price: 79,
    images: [unsplash('sYri5yWeYFs'), unsplash('9O2F5D4FvZg')],
    badge: 'Новинка',
    sizes: APPAREL,
    isNew: true,
    description:
      'Плотный начёсный футер, спущенное плечо и двойной капюшон. Держит форму после многих стирок.',
    details: ['Плотный начёсный футер', 'Двойной капюшон', 'Спущенная линия плеча', 'Оверсайз: для обычной посадки берите на размер меньше'],
  },
  {
    id: 'core-logo-tee',
    name: 'Футболка Core Logo',
    category: 't-shirts',
    price: 35,
    images: [unsplash('eDX5VWJDZRE'), unsplash('oxbix0AlxrQ')],
    badge: 'База',
    sizes: APPAREL,
    description:
      'Футболка на каждый день: хлопковый джерси средней плотности, небольшой логотип на груди и воротник, который не растягивается.',
    details: ['Хлопковый джерси средней плотности', 'Небольшой принт-логотип', 'Плотная горловина в рубчик', 'Прямая посадка'],
  },
  {
    id: 'technical-cargo-shorts',
    name: 'Шорты Technical Cargo',
    category: 'shorts',
    price: 59,
    images: [unsplash('zCeYxaGi5GU'), unsplash('CihXnvELE00')],
    badge: 'Новинка',
    sizes: ['S', 'M', 'L', 'XL'],
    isNew: true,
    description:
      'Шорты-карго из рипстопа с регулируемым ремнём-стропой и объёмными боковыми карманами. Длина чуть выше колена.',
    details: ['Рипстоп с хлопком', 'Ремень-стропа с металлической пряжкой', 'Объёмные карманы-карго', 'Свободная посадка'],
  },
  {
    id: 'urban-runner-sneakers',
    name: 'Кроссовки Urban Runner',
    category: 'sneakers',
    price: 119,
    images: [unsplash('SnwHgwQ085I'), unsplash('bi3wh6S3xts')],
    badge: 'Новинка',
    sizes: SHOES,
    isNew: true,
    description:
      'Низкие кроссовки с сетчатым верхом, замшевыми вставками и мягкой подошвой для долгих прогулок по городу.',
    details: ['Верх из сетки и замши', 'Амортизирующая промежуточная подошва', 'Резиновая подошва с протектором', 'Европейская размерная сетка'],
  },
  {
    id: 'boxy-fit-tee',
    name: 'Футболка Boxy Fit',
    category: 't-shirts',
    price: 39,
    images: [unsplash('oxbix0AlxrQ'), unsplash('eDX5VWJDZRE')],
    sizes: APPAREL,
    description:
      'Широкая укороченная футболка из плотного хлопка. Чистая форма без принтов — основа любого образа.',
    details: ['Плотный хлопок', 'Широкий укороченный крой', 'Плотная горловина', 'Боксовая посадка'],
  },
  {
    id: 'essential-zip-hoodie',
    name: 'Зип-худи Essential',
    category: 'hoodies',
    price: 85,
    images: [unsplash('p25vHkG2Vt0'), unsplash('rdfwoxxYPRs')],
    sizes: APPAREL,
    description:
      'Худи на молнии с двусторонним металлическим замком, карманами-кенгуру и манжетами в рубчик. Подходит под любую верхнюю одежду.',
    details: ['Хлопковый футер', 'Двусторонняя металлическая молния', 'Раздельные карманы-кенгуру', 'Прямая посадка'],
  },
  {
    id: 'nylon-track-shorts',
    name: 'Шорты Nylon Track',
    category: 'shorts',
    price: 45,
    images: [unsplash('N1KAn_yK6Kg'), unsplash('zCeYxaGi5GU')],
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Лёгкие нейлоновые шорты с сетчатой подкладкой и резинкой на поясе. Быстро сохнут и почти не занимают места.',
    details: ['Жатый нейлон', 'Сетчатая подкладка', 'Резинка и шнурок на поясе', 'Прямая посадка'],
  },
  {
    id: 'everyday-crewneck',
    name: 'Свитшот Everyday',
    category: 'hoodies',
    price: 69,
    images: [unsplash('JhKblPS3kc8'), unsplash('9O2F5D4FvZg')],
    badge: 'База',
    sizes: APPAREL,
    description:
      'Свитшот из мягкого хлопкового футера без капюшона и лишних деталей. Просто хорошая посадка.',
    details: ['Мягкий хлопковый футер', 'Манжеты и низ в рубчик', 'Вышивка в тон', 'Прямая посадка'],
  },
  {
    id: 'technical-windbreaker',
    name: 'Ветровка Technical',
    category: 'jackets',
    price: 109,
    images: [unsplash('aXPD9U7Owws'), unsplash('YhgXfs80RJo')],
    badge: 'Новинка',
    sizes: APPAREL,
    isNew: true,
    description:
      'Ветрозащитный анорак на короткой молнии с регулируемым низом и капюшоном, который можно спрятать. Для вечерних прогулок по городу.',
    details: ['Ветрозащитный рипстоп', 'Короткая молния с планкой', 'Регулируемый низ на кулиске', 'Свободная посадка'],
  },
  {
    id: 'street-runner',
    name: 'Кеды Street Runner',
    category: 'sneakers',
    price: 99,
    images: [unsplash('bi3wh6S3xts'), unsplash('SnwHgwQ085I')],
    sizes: SHOES,
    description:
      'Простые низкие кеды с мягким кантом и прочной подошвой-чашкой. Сочетаются со всем гардеробом.',
    details: ['Верх под кожу', 'Мягкий кант вокруг щиколотки', 'Прошитая подошва', 'Европейская размерная сетка'],
  },
  {
    id: 'utility-crossbody-bag',
    name: 'Сумка Utility Crossbody',
    category: 'accessories',
    price: 49,
    images: [unsplash('Mr71a9W9FWg'), unsplash('nKK32qJheBY')],
    badge: 'Один размер',
    sizes: [],
    description:
      'Компактная сумка через плечо: основное отделение на молнии, передний карман для мелочей и регулируемый ремень.',
    details: ['Водостойкий нейлон', 'Два отделения на молнии', 'Регулируемый ремень-стропа', 'Один размер'],
  },
  {
    id: 'insulated-puffer-jacket',
    name: 'Куртка Insulated Puffer',
    category: 'jackets',
    price: 149,
    images: [unsplash('VpsoFlLWp-8'), unsplash('RdZ6Q7z8sPM')],
    sizes: APPAREL,
    description:
      'Стёганая куртка с синтетическим утеплителем, высоким воротником и матовой поверхностью. Тепло без лишнего объёма.',
    details: ['Синтетический утеплитель', 'Матовая ткань верха', 'Высокий воротник-стойка', 'Свободная посадка'],
  },
]

export const getProduct = (id: string) => products.find((p) => p.id === id)
