"use client"

import { useState } from 'react'

interface ShareButtonProps {
  url: string
  title?: string
  text?: string
  className?: string
  variant?: 'default' | 'icon-only' | 'compact'
}

export function ShareButton({ 
  url, 
  title = 'RetroForge Game',
  text,
  className = '',
  variant = 'default'
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    // Check if Web Share API is available (mobile-friendly)
    if (navigator.share) {
      try {
        setSharing(true)
        await navigator.share({
          title: title,
          text: text || `Check out ${title} on RetroForge!`,
          url: url,
        })
      } catch (err: any) {
        // User cancelled or error occurred - fall back to copy
        if (err.name !== 'AbortError') {
          await handleCopy()
        }
      } finally {
        setSharing(false)
      }
    } else {
      // Fallback: Copy to clipboard
      await handleCopy()
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (e) {
        console.error('Fallback copy failed:', e)
      }
      document.body.removeChild(textArea)
    }
  }

  const shareIcon = (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  )

  if (variant === 'icon-only') {
    return (
      <button
        onClick={handleShare}
        disabled={sharing}
        className={`p-2 bg-retro-600 hover:bg-retro-500 rounded-lg text-white transition-all shadow-md disabled:opacity-50 ${className}`}
        title="Share game"
        aria-label="Share game"
      >
        {shareIcon}
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleShare}
        disabled={sharing}
        className={`px-3 py-1.5 bg-retro-600 hover:bg-retro-500 rounded-lg text-white text-sm font-medium transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 ${className}`}
        aria-label="Share"
      >
        {shareIcon}
        {copied ? 'Copied!' : sharing ? 'Sharing...' : 'Share'}
      </button>
    )
  }

  // Determine background color classes - allow className to override
  const bgClasses = className.includes('bg-') ? '' : 'bg-retro-600 hover:bg-retro-500'
  
  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className={`px-4 py-2 ${bgClasses} rounded-lg text-white font-medium transition-all shadow-md disabled:opacity-50 flex items-center gap-2 ${className}`}
      aria-label="Share game"
    >
      {shareIcon}
      {copied ? 'Link copied!' : sharing ? 'Sharing...' : 'Share'}
    </button>
  )
}

