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
}

export const categories: { id: Category; label: string; image: string; caption: string }[] = [
  { id: 'hoodies', label: 'Hoodies', image: unsplash('sYri5yWeYFs', 1000), caption: 'Heavy cotton. Daily armour.' },
  { id: 't-shirts', label: 'T-Shirts', image: unsplash('eDX5VWJDZRE', 1000), caption: 'Boxy cuts. Clean basics.' },
  { id: 'shorts', label: 'Shorts', image: unsplash('zCeYxaGi5GU', 1000), caption: 'Utility for warm days.' },
  { id: 'sneakers', label: 'Sneakers', image: unsplash('SnwHgwQ085I', 1000), caption: 'Built for the pavement.' },
]

export const categoryLabels: Record<Category, string> = {
  hoodies: 'Hoodies',
  't-shirts': 'T-Shirts',
  shorts: 'Shorts',
  sneakers: 'Sneakers',
  jackets: 'Jackets',
  accessories: 'Accessories',
}

const APPAREL = ['XS', 'S', 'M', 'L', 'XL']
const SHOES = ['40', '41', '42', '43', '44', '45']

export const products: Product[] = [
  {
    id: 'utility-shell-jacket',
    name: 'Utility Shell Jacket',
    category: 'jackets',
    price: 129,
    images: [unsplash('RdZ6Q7z8sPM'), unsplash('o_2ceg1bMTs')],
    sizes: APPAREL,
    badge: 'New',
    isNew: true,
    description:
      'A lightweight technical shell with a boxy, cropped silhouette. Water-repellent finish, taped seams and a hood that packs into the collar.',
    details: ['Water-repellent nylon shell', 'Packable hood', 'Two zip chest pockets', 'Relaxed fit — true to size'],
  },
  {
    id: 'heavyweight-oversized-hoodie',
    name: 'Heavyweight Oversized Hoodie',
    category: 'hoodies',
    price: 79,
    images: [unsplash('sYri5yWeYFs'), unsplash('9O2F5D4FvZg')],
    sizes: APPAREL,
    badge: 'New',
    isNew: true,
    description:
      'Dense brushed fleece with a dropped shoulder and a double-layer hood. Built to hold its shape wash after wash.',
    details: ['Heavyweight brushed fleece', 'Double-layer hood', 'Dropped shoulders', 'Oversized fit — size down for regular'],
  },
  {
    id: 'core-logo-tee',
    name: 'Core Logo T-Shirt',
    category: 't-shirts',
    price: 35,
    images: [unsplash('eDX5VWJDZRE'), unsplash('oxbix0AlxrQ')],
    sizes: APPAREL,
    badge: 'Core',
    description: 'The everyday tee. Mid-weight cotton jersey, small chest wordmark, ribbed collar that stays flat.',
    details: ['Mid-weight cotton jersey', 'Small printed wordmark', 'Ribbed crew neck', 'Regular fit'],
  },
  {
    id: 'technical-cargo-shorts',
    name: 'Technical Cargo Shorts',
    category: 'shorts',
    price: 59,
    images: [unsplash('zCeYxaGi5GU'), unsplash('CihXnvELE00')],
    sizes: ['S', 'M', 'L', 'XL'],
    badge: 'New',
    isNew: true,
    description: 'Ripstop cargo shorts with an adjustable webbing belt and bellowed side pockets. Hits just above the knee.',
    details: ['Ripstop cotton blend', 'Webbing belt with metal buckle', 'Bellowed cargo pockets', 'Relaxed fit'],
  },
  {
    id: 'urban-runner-sneakers',
    name: 'Urban Runner Sneakers',
    category: 'sneakers',
    price: 119,
    images: [unsplash('SnwHgwQ085I'), unsplash('bi3wh6S3xts')],
    sizes: SHOES,
    badge: 'New',
    isNew: true,
    description: 'Low-profile runner with a mesh upper, suede overlays and a cushioned foam sole for all-day city miles.',
    details: ['Mesh and suede upper', 'Cushioned foam midsole', 'Rubber grip outsole', 'EU sizing'],
  },
  {
    id: 'boxy-fit-tee',
    name: 'Boxy Fit Tee',
    category: 't-shirts',
    price: 39,
    images: [unsplash('oxbix0AlxrQ'), unsplash('eDX5VWJDZRE')],
    sizes: APPAREL,
    description: 'A wide, cropped body in heavy cotton. Clean, structured, no graphics — the base of every fit.',
    details: ['Heavyweight cotton', 'Wide cropped body', 'Thick ribbed collar', 'Boxy fit'],
  },
  {
    id: 'essential-zip-hoodie',
    name: 'Essential Zip Hoodie',
    category: 'hoodies',
    price: 85,
    images: [unsplash('p25vHkG2Vt0'), unsplash('rdfwoxxYPRs')],
    sizes: APPAREL,
    description: 'Full-zip hoodie with a two-way metal zipper, kangaroo pockets and rib cuffs. Layer it under anything.',
    details: ['Cotton fleece', 'Two-way metal zip', 'Split kangaroo pockets', 'Regular fit'],
  },
  {
    id: 'nylon-track-shorts',
    name: 'Nylon Track Shorts',
    category: 'shorts',
    price: 45,
    images: [unsplash('N1KAn_yK6Kg'), unsplash('zCeYxaGi5GU')],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Lightweight nylon with a mesh lining and elastic waist. Quick-drying and easy to pack.',
    details: ['Crinkle nylon shell', 'Mesh lining', 'Elastic drawcord waist', 'Regular fit'],
  },
  {
    id: 'everyday-crewneck',
    name: 'Everyday Crewneck',
    category: 'hoodies',
    price: 69,
    images: [unsplash('JhKblPS3kc8'), unsplash('9O2F5D4FvZg')],
    sizes: APPAREL,
    badge: 'Core',
    description: 'A clean crewneck sweatshirt in soft loopback cotton. No hood, no noise — just a good fit.',
    details: ['Loopback cotton', 'Ribbed hem and cuffs', 'Tonal embroidery', 'Regular fit'],
  },
  {
    id: 'technical-windbreaker',
    name: 'Technical Windbreaker',
    category: 'jackets',
    price: 109,
    images: [unsplash('aXPD9U7Owws'), unsplash('YhgXfs80RJo')],
    sizes: APPAREL,
    badge: 'New',
    isNew: true,
    description: 'Wind-resistant half-zip shell with an adjustable hem and a stowable hood. Made for night city walks.',
    details: ['Wind-resistant ripstop', 'Half-zip with storm flap', 'Adjustable toggle hem', 'Relaxed fit'],
  },
  {
    id: 'street-runner',
    name: 'Street Runner',
    category: 'sneakers',
    price: 99,
    images: [unsplash('bi3wh6S3xts'), unsplash('SnwHgwQ085I')],
    sizes: SHOES,
    description: 'A simple low-top with a padded collar and a durable cupsole. Pairs with everything in the rotation.',
    details: ['Leather-look upper', 'Padded collar', 'Stitched cupsole', 'EU sizing'],
  },
  {
    id: 'utility-crossbody-bag',
    name: 'Utility Crossbody Bag',
    category: 'accessories',
    price: 49,
    images: [unsplash('Mr71a9W9FWg'), unsplash('nKK32qJheBY')],
    sizes: [],
    badge: 'One size',
    description: 'Compact crossbody with a main zip compartment, a front quick-access pocket and an adjustable strap.',
    details: ['Water-resistant nylon', 'Two zip compartments', 'Adjustable webbing strap', 'One size'],
  },
  {
    id: 'insulated-puffer-jacket',
    name: 'Insulated Puffer Jacket',
    category: 'jackets',
    price: 149,
    images: [unsplash('VpsoFlLWp-8'), unsplash('RdZ6Q7z8sPM')],
    sizes: APPAREL,
    description: 'Box-quilted puffer with synthetic insulation, a high collar and a matte finish. Warmth without bulk.',
    details: ['Synthetic insulation', 'Matte shell', 'High stand collar', 'Relaxed fit'],
  },
]

export const getProduct = (id: string) => products.find((p) => p.id === id)
