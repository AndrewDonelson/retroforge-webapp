"use client"

import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { EditorProvider } from '@/contexts/EditorContext'

type LabelMode = 'icons' | 'icons+text'

function NavItem({ href, label, icon, cartId }: { href: string; label: string; icon: React.ReactNode; cartId?: string | null }) {
  const pathname = usePathname()
  const active = pathname?.startsWith(href)
  const finalHref = cartId ? `${href}?cartId=${cartId}` : href
  return (
    <Link
      href={finalHref}
      className={`nav-item inline-flex items-center gap-2 px-3 py-2 rounded border ${
        active ? 'border-retro-500 bg-gray-800' : 'border-transparent hover:border-gray-600 hover:bg-gray-800/60'
      }`}
    >
      <span className="text-retro-400">{icon}</span>
      <span className="label hidden sm:inline text-sm">{label}</span>
    </Link>
  )
}

function EditorLayoutInner({ children }: { children: React.ReactNode }) {
  const [labelMode, setLabelMode] = useState<LabelMode>('icons+text')
  const searchParams = useSearchParams()
  const cartId = searchParams?.get('cartId')

  useEffect(() => {
    const read = () => {
      const saved = (typeof window !== 'undefined' && localStorage.getItem('rf_nav_label_mode')) as LabelMode | null
      if (saved === 'icons' || saved === 'icons+text') setLabelMode(saved)
    }
    read()
    const onCustom = (e: any) => setLabelMode(e.detail)
    window.addEventListener('rf:label-mode', onCustom)
    window.addEventListener('storage', read)
    // Sync with global class on first mount
    const hasGlobal = document.documentElement.classList.contains('rf-labels-off')
    if (hasGlobal) setLabelMode('icons')
    return () => {
      window.removeEventListener('rf:label-mode', onCustom)
      window.removeEventListener('storage', read)
    }
  }, [])

  useEffect(() => {
    const root = document.querySelector('#editor-shell')
    if (!root) return
    root.classList.toggle('labels-off', labelMode === 'icons')
  }, [labelMode])

  return (
    <EditorProvider>
      <div id="editor-shell" className="min-h-[calc(100vh-200px)] grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
      {/* Sidebar (top docked on mobile) */}
      <aside className="card-retro p-3 h-max lg:sticky lg:top-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-300">Editor</div>
        </div>
        <nav className="flex lg:flex-col flex-wrap gap-2">
          <NavItem href="/editor/properties" label="Properties" icon={<span>⚙️</span>} cartId={cartId} />
          <NavItem href="/editor/code" label="Code" icon={<span>💻</span>} cartId={cartId} />
          <NavItem href="/editor/palette" label="Palette" icon={<span>🎨</span>} cartId={cartId} />
          <NavItem href="/editor/map" label="Map" icon={<span>🗺️</span>} cartId={cartId} />
          <NavItem href="/editor/tile" label="Tiles" icon={<span>🧩</span>} cartId={cartId} />
          <NavItem href="/editor/sprite" label="Sprite" icon={<span>👾</span>} cartId={cartId} />
          <NavItem href="/editor/sound" label="Sound" icon={<span>🔊</span>} cartId={cartId} />
          <NavItem href="/editor/music" label="Music" icon={<span>🎵</span>} cartId={cartId} />
        </nav>
      </aside>

      {/* Main editor surface */}
      <section className="card-retro p-3 overflow-hidden min-h-[60vh]">{children}</section>

      <style jsx global>{`
        #editor-shell.labels-off .label { display: none; }
        #editor-shell.labels-off .nav-item { 
          column-gap: 0.25rem; /* tighter icon-only spacing */
          padding-left: 0.5rem; 
          padding-right: 0.5rem; 
        }
        @media (min-width: 1024px) {
          #editor-shell.labels-off, .rf-labels-off #editor-shell { grid-template-columns: 56px 1fr; }
          #editor-shell.labels-off aside { padding-left: 0.5rem; padding-right: 0.5rem; }
          #editor-shell.labels-off nav { row-gap: 0.25rem; }
        }
      `}</style>
      </div>
    </EditorProvider>
  )
}

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-4 text-gray-400">Loading editor...</div>}>
      <EditorLayoutInner>{children}</EditorLayoutInner>
    </Suspense>
  )
}


