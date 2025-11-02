"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Logo from '@/components/common/Logo'
import { LoginButton } from '@/components/auth/LoginButton'
import { useAuth } from '@/contexts/AuthContext'

type LabelMode = 'icons' | 'icons+text'

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function IconPencil() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zm2.92 2.83H5.5v-.42l9.56-9.56.42.42-9.56 9.56zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.34 1.34 3.75 3.75 1.34-1.34z" />
    </svg>
  )
}

function IconFolder() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z" />
    </svg>
  )
}

export default function SiteHeader() {
  const { isAuthenticated } = useAuth()
  const [labelMode, setLabelMode] = useState<LabelMode>('icons+text')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem('rf_nav_label_mode')) as LabelMode | null
    if (saved === 'icons' || saved === 'icons+text') setLabelMode(saved)
  }, [])

  function toggleLabels() {
    const next: LabelMode = labelMode === 'icons+text' ? 'icons' : 'icons+text'
    setLabelMode(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('rf_nav_label_mode', next)
      const root = document.documentElement
      if (next === 'icons') root.classList.add('rf-labels-off')
      else root.classList.remove('rf-labels-off')
      window.dispatchEvent(new CustomEvent('rf:label-mode', { detail: next }))
    }
  }

  return (
    <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="RetroForge Home" className="flex items-center">
              <Logo className="h-7" />
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="px-2 py-1.5 border border-gray-600 bg-gray-700 hover:bg-gray-600 rounded text-gray-200"
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
            >
              {/* three dots icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
          </div>

          <nav className={`items-center gap-2 sm:gap-4 ${menuOpen ? 'flex' : 'hidden'} md:flex`}>
            <Link
              href="/browser"
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700/50 text-gray-200"
              aria-label="Browse Games"
            >
              <IconGrid />
              {labelMode === 'icons+text' && <span className="hidden xs:inline">Browse Games</span>}
            </Link>
            <Link
              href="/editor"
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700/50 text-gray-200"
              aria-label="Create"
            >
              <IconPencil />
              {labelMode === 'icons+text' && <span className="hidden xs:inline">Create</span>}
            </Link>
            {isAuthenticated && (
              <Link
                href="/projects"
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-700/50 text-gray-200"
                aria-label="My Projects"
              >
                <IconFolder />
                {labelMode === 'icons+text' && <span className="hidden xs:inline">My Projects</span>}
              </Link>
            )}

            <button
              type="button"
              onClick={toggleLabels}
              className="ml-1 px-2 py-1.5 text-xs border border-gray-600 bg-gray-700 hover:bg-gray-600 rounded text-gray-200"
              aria-pressed={labelMode === 'icons'}
              aria-label={labelMode === 'icons' ? 'Show labels' : 'Hide labels'}
              title={labelMode === 'icons' ? 'Show labels' : 'Hide labels'}
            >
              {labelMode === 'icons' ? 'Aa' : '🔤'}
            </button>
            <div className="ml-2 border-l border-gray-700 pl-4">
              <LoginButton />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}


