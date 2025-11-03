"use client"

import { Cart } from '../types'
import { CartCard } from './CartCard'
import AdCard from '@/components/ads/AdCard'

interface CartGridProps {
  carts: Cart[]
  recentlyViewedIds: Set<string>
  onCardClick: (cartId: string) => void
  viewMode: 'grid' | 'list'
}

export function CartGrid({ carts, recentlyViewedIds, onCardClick, viewMode }: CartGridProps) {
  const containerClassName = viewMode === 'grid' 
    ? 'grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
    : 'space-y-4'

  return (
    <div className={containerClassName}>
      {carts.map((cart, index) => {
        // Render sponsored card when sentinel is hit
        if ('id' in cart && (cart as any).id?.toString().startsWith('__ad__')) {
          return <AdCard key={(cart as any).id} />
        }

        const isRecentlyViewed = recentlyViewedIds.has(cart.id)
        const animationDelayValue = (index * 50).toString() + 'ms'

        return (
          <CartCard
            key={cart.id}
            cart={cart}
            isRecentlyViewed={isRecentlyViewed}
            animationDelay={animationDelayValue}
            onCardClick={onCardClick}
          />
        )
      })}
    </div>
  )
}

