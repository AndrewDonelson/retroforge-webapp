"use client"

import { useEditor } from '@/contexts/EditorContext'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function PropertiesPageInner() {
  const { cart, isLoading, updateManifest, error, cartId } = useEditor()
  const searchParams = useSearchParams()
  
  // Debug logging
  const urlCartId = searchParams?.get('cartId')
  if (urlCartId && urlCartId !== cartId) {
    console.log('[PropertiesPage] Mismatch - URL cartId:', urlCartId, 'Context cartId:', cartId)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-pixel text-white">Project Properties</h1>
        <p className="text-gray-400">Loading cart...</p>
      </div>
    )
  }

  if (!cart) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-pixel text-white">Project Properties</h1>
        {error && (
          <div className="p-3 rounded bg-red-900/30 text-red-400">
            Error: {error}
          </div>
        )}
        {cartId && (
          <p className="text-gray-400">
            Loading cart {cartId}...
          </p>
        )}
        {!cartId && !error && (
          <p className="text-gray-400">No cart loaded. Please fork or create a cart first.</p>
        )}
      </div>
    )
  }

  const { manifest } = cart
  const genres = ['Action', 'Adventure', 'Puzzle', 'Platformer', 'RPG', 'Shooter', 'Strategy', 'Simulation', 'Sports', 'Racing', 'Arcade', 'Demo', 'Other']

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-pixel text-white">Project Properties</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card-retro p-3">
          <div className="text-sm text-gray-300 mb-2">Basics</div>
          <div className="space-y-2">
            <input
              className="input-retro w-full"
              placeholder="Title"
              value={manifest.title || ''}
              onChange={(e) => updateManifest({ title: e.target.value })}
            />
            <input
              className="input-retro w-full"
              placeholder="Author"
              value={manifest.author || ''}
              onChange={(e) => updateManifest({ author: e.target.value })}
            />
            <select
              className="input-retro w-full"
              value={manifest.genre || 'Arcade'}
              onChange={(e) => updateManifest({ genre: e.target.value })}
            >
              {genres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <textarea
              className="input-retro w-full h-24"
              placeholder="Description"
              value={manifest.description || ''}
              onChange={(e) => updateManifest({ description: e.target.value })}
            />
          </div>
        </div>
        <div className="card-retro p-3">
          <div className="text-sm text-gray-300 mb-2">Display</div>
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Resolution: 480×270 (fixed)</div>
            <div className="text-xs text-gray-400">Target FPS: 60</div>
          </div>
        </div>
        <div className="card-retro p-3 md:col-span-2">
          <div className="text-sm text-gray-300 mb-2">Tags (up to 5)</div>
          <div className="flex flex-wrap gap-2">
            {(manifest.tags || []).map((t, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-gray-700 border border-gray-600 cursor-pointer hover:bg-gray-600"
                onClick={() => {
                  const newTags = (manifest.tags || []).filter((_, idx) => idx !== i)
                  updateManifest({ tags: newTags })
                }}
              >
                {t} ×
              </span>
            ))}
            {(manifest.tags?.length || 0) < 5 && (
              <input
                className="input-retro"
                placeholder="Add tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const newTag = e.currentTarget.value.trim()
                    if (!manifest.tags?.includes(newTag)) {
                      updateManifest({
                        tags: [...(manifest.tags || []), newTag].slice(0, 5),
                      })
                    }
                    e.currentTarget.value = ''
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <h1 className="text-xl font-pixel text-white">Project Properties</h1>
        <p className="text-gray-400">Loading...</p>
      </div>
    }>
      <PropertiesPageInner />
    </Suspense>
  )
}


