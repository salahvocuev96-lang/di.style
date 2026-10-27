import { useCallback, useEffect, useState } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Marquee } from './components/Marquee'
import { CategoryGrid } from './components/CategoryGrid'
import { NewArrivals } from './components/NewArrivals'
import { Catalog, type CatalogFilters } from './components/Catalog'
import { About } from './components/About'
import { Lookbook } from './components/Lookbook'
import { OrderSteps } from './components/OrderSteps'
import { Footer } from './components/Footer'
import { ProductDetails } from './components/ProductDetails'
import { CartDrawer } from './components/CartDrawer'
import { SearchOverlay } from './components/SearchOverlay'
import { getProduct } from './data/products'
import { useCart } from './context/CartContext'
import { scrollToId } from './lib/scroll'
import type { Category } from './types/product'

const productFromUrl = () => {
  const id = new URLSearchParams(window.location.search).get('product')
  return id && getProduct(id) ? id : null
}

export default function App() {
  const [filters, setFilters] = useState<CatalogFilters>({ category: 'all', sort: 'featured', query: '' })
  const [productId, setProductId] = useState<string | null>(productFromUrl)
  const [searchOpen, setSearchOpen] = useState(false)
  const { closeCart } = useCart()

  // Страница товара живёт в адресе (?product=id): работает кнопка «Назад», фильтры каталога сохраняются в памяти
  useEffect(() => {
    const onPop = () => setProductId(productFromUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const openProduct = useCallback((id: string) => {
    setSearchOpen(false)
    closeCart()
    const url = `${window.location.pathname}?product=${encodeURIComponent(id)}`
    try {
      if (productFromUrl()) window.history.replaceState({ product: id }, '', url)
      else window.history.pushState({ product: id }, '', url)
    } catch {
      /* в некоторых встроенных окнах адрес менять нельзя — просто открываем товар */
    }
    setProductId(id)
  }, [closeCart])

  const closeProduct = useCallback(() => {
    if (window.history.state?.product && productFromUrl()) window.history.back()
    else {
      try {
        window.history.replaceState(null, '', window.location.pathname)
      } catch {
        /* см. openProduct */
      }
      setProductId(null)
    }
  }, [])

  const goToShop = (patch: Partial<CatalogFilters> = {}) => {
    setFilters((f) => ({ ...f, ...patch }))
    requestAnimationFrame(() => scrollToId('shop'))
  }

  const product = productId ? getProduct(productId) ?? null : null

  return (
    <>
      <a href="#shop" className="sr-only z-[100] bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Перейти к каталогу
      </a>
      <Header onSearch={() => setSearchOpen(true)} />
      <main>
        <Hero onOpen={openProduct} />
        <Marquee />
        <CategoryGrid onSelect={(c: Category) => goToShop({ category: c, query: '' })} />
        <NewArrivals onOpen={openProduct} onViewAll={() => goToShop({ category: 'all', query: '' })} />
        <Lookbook onOpen={openProduct} />
        <Catalog filters={filters} onChange={setFilters} onOpen={openProduct} />
        <OrderSteps />
        <About />
      </main>
      <Footer />

      <ProductDetails product={product} onClose={closeProduct} onOpen={openProduct} />
      <CartDrawer
        onOpenProduct={openProduct}
        onShop={() => {
          if (productId) closeProduct()
          requestAnimationFrame(() => scrollToId('shop'))
        }}
      />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenProduct={openProduct}
        onSubmit={(query) => {
          setSearchOpen(false)
          goToShop({ query, category: 'all' })
        }}
      />
    </>
  )
}
