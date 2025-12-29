'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { BannerAd, InArticleAd, DisplayAd } from '@/components/ads'
import { AD_SLOTS } from '@/lib/adSlots'

export default function DeveloperGuidePage() {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/DEVELOPER_GUIDE.md')
      .then(res => res.text())
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load developer guide:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="wasm-loading mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Developer Guide...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* AD 1: Banner after page load */}
        <BannerAd adSlot={AD_SLOTS.banner1} />
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-retro-400 hover:text-retro-300 mb-4 transition-colors"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-pixel text-white mb-4">
            RetroForge Developer Guide
          </h1>
          <p className="text-xl text-gray-300">
            Complete guide for building retro-style games with RetroForge Engine
          </p>
        </div>

        {/* AD 2: Before content */}
        <DisplayAd adSlot={AD_SLOTS.display1} size="300x250" />

        {/* Content */}
        <div className="card-retro p-8 markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>

        {/* AD 3: After content */}
        <InArticleAd adSlot={AD_SLOTS.article1} />

        {/* Footer Navigation */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Link 
            href="/docs/api-reference"
            className="btn-retro"
          >
            View API Reference →
          </Link>
          <Link 
            href="/docs/comparison"
            className="btn-retro-secondary"
          >
            View PICO-8 Comparison →
          </Link>
          <Link 
            href="/"
            className="btn-retro-secondary"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}

