"use client"

import { ViewMode } from '../types'

interface ViewModeToggleProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

export function ViewModeToggle({ viewMode, setViewMode }: ViewModeToggleProps) {
  const gridViewButtonClass = 'px-3 py-1 rounded text-sm font-medium transition-all ' + (viewMode === 'grid' ? 'bg-retro-500 text-white' : 'text-gray-400 hover:text-white')
  const listViewButtonClass = 'px-3 py-1 rounded text-sm font-medium transition-all ' + (viewMode === 'list' ? 'bg-retro-500 text-white' : 'text-gray-400 hover:text-white')

  return (
    <div className="flex bg-gray-800 border border-gray-700 rounded-lg p-1">
      <button
        onClick={() => setViewMode('grid')}
        className={gridViewButtonClass}
        aria-label="Grid view"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={listViewButtonClass}
        aria-label="List view"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  )
}

