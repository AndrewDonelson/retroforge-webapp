"use client"

import { useRef, useEffect } from 'react'

interface SearchBarProps {
  search: string
  setSearch: (value: string) => void
}

export function SearchBar({ search, setSearch }: SearchBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const slashKey = String.fromCharCode(47)
      if (e.key === slashKey && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative w-full">
      <input
        ref={searchInputRef}
        type="text"
        className="input-retro w-full"
        placeholder="Search by title, author, description... (Press '?' to focus)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search && (
        <button
          onClick={() => setSearch('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  )
}

