"use client"

import { SortKey } from '../types'

interface AdvancedFiltersProps {
  showAdvancedFilters: boolean
  setShowAdvancedFilters: (show: boolean) => void
  minPlays: string
  setMinPlays: (value: string) => void
  maxPlays: string
  setMaxPlays: (value: string) => void
  minDate: string
  setMinDate: (value: string) => void
  maxDate: string
  setMaxDate: (value: string) => void
  sort: SortKey
}

export function AdvancedFilters({
  showAdvancedFilters,
  setShowAdvancedFilters,
  minPlays,
  setMinPlays,
  maxPlays,
  setMaxPlays,
  minDate,
  setMinDate,
  maxDate,
  setMaxDate,
  sort,
}: AdvancedFiltersProps) {
  return (
    <>
      {/* Advanced filters toggle */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="text-sm text-gray-400 hover:text-retro-400 transition-colors flex items-center gap-1"
        >
          {showAdvancedFilters ? '▼' : '▶'} Advanced Filters
        </button>
      </div>

      {/* Advanced filters panel */}
      {showAdvancedFilters && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Min Plays</label>
              <input
                type="number"
                value={minPlays}
                onChange={(e) => setMinPlays(e.target.value)}
                className="input-retro w-full text-sm"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Max Plays</label>
              <input
                type="number"
                value={maxPlays}
                onChange={(e) => setMaxPlays(e.target.value)}
                className="input-retro w-full text-sm"
                placeholder="∞"
                min="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {sort === 'latest' ? 'From Date (Created)' : 'From Date (Updated)'}
              </label>
              <input
                type="date"
                value={minDate}
                onChange={(e) => setMinDate(e.target.value)}
                className="input-retro w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {sort === 'latest' ? 'To Date (Created)' : 'To Date (Updated)'}
              </label>
              <input
                type="date"
                value={maxDate}
                onChange={(e) => setMaxDate(e.target.value)}
                className="input-retro w-full text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

