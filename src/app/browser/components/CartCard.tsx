"use client"

import Link from 'next/link'
import { Cart } from '../types'

interface CartCardProps {
  cart: Cart
  isRecentlyViewed: boolean
  animationDelay: string
  onCardClick: (cartId: string) => void
}

export function CartCard({ cart, isRecentlyViewed, animationDelay, onCardClick }: CartCardProps) {
  // Construct path to avoid Turbopack parser issues with template literals
  const arcadeBase = '/arcade'
  const arcadePath = arcadeBase + '/' + cart.id
  
  return (
    <Link 
      href={arcadePath}
      className="block group" 
      key={cart.id}
      onClick={() => onCardClick(cart.id)}
    >
      <article
        className="card-retro overflow-hidden bg-gray-800 border border-gray-700 hover:border-retro-400 hover:bg-gray-800/90 hover:scale-[1.03] hover:z-10 transition-all duration-200 h-full flex flex-col shadow-lg hover:shadow-xl hover:shadow-retro-500/20 relative animate-fade-in"
        style={{ animationDelay } as React.CSSProperties}
      >
        <div className="p-4 sm:p-5 flex flex-col flex-1 relative">
          {isRecentlyViewed && (
            <span className="absolute top-2 right-2 text-xs px-2 py-0.5 bg-retro-600/30 border border-retro-500/50 rounded text-retro-300">
              👁
            </span>
          )}
          
          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-retro-400 leading-tight mb-2 line-clamp-2 group-hover:text-retro-300 transition-colors">
            {cart.title}
          </h3>
          
          {/* Author */}
          <div className="text-xs sm:text-sm text-gray-400 mb-3">
            by{' '}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // This will be handled by parent
              }}
              className="hover:text-retro-400 hover:underline transition-colors bg-transparent border-none p-0 cursor-pointer text-inherit font-medium"
            >
              {cart.author}
            </button>
          </div>
          
          {/* Genre Tag - Now on its own row */}
          <div className="mb-3">
            <span className="inline-block text-[10px] sm:text-xs px-2.5 py-1 bg-gradient-to-r from-retro-600/20 to-retro-500/20 border border-retro-500/30 rounded-full uppercase tracking-wider font-semibold text-retro-400">
              {cart.genre}
            </span>
          </div>
          
          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-3 flex-1 mb-3">
            {cart.description}
          </p>
          
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-3" />
          
          {/* Footer Stats */}
          <div className="grid grid-cols-3 items-center mb-2">
            <span 
              className="flex items-center gap-1.5 text-retro-400 text-[10px] sm:text-xs cursor-default justify-start"
              title={cart.plays.toLocaleString() + ' plays'}
            >
              <span className="text-sm sm:text-base">▶</span>
              <span className="font-medium">{cart.plays.toLocaleString()}</span>
            </span>
            <span 
              className="flex items-center gap-1.5 text-yellow-400 text-[10px] sm:text-xs cursor-default justify-center"
              title={cart.favorites.toLocaleString() + ' favorites'}
            >
              <span className="text-sm sm:text-base">★</span>
              <span className="font-medium">{cart.favorites.toLocaleString()}</span>
            </span>
            <span 
              className="flex items-center gap-1.5 text-red-400 text-[10px] sm:text-xs cursor-default justify-end"
              title={cart.likes.toLocaleString() + ' likes'}
            >
              <span className="text-sm sm:text-base">♥</span>
              <span className="font-medium">{cart.likes.toLocaleString()}</span>
            </span>
          </div>
          
          {/* Date - On its own row at bottom */}
          <div className="text-[10px] sm:text-xs text-gray-500 mt-auto">
            Updated {new Date(cart.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </article>
    </Link>
  )
}

