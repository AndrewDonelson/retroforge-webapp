"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ForkModalProps {
  originalCartName: string
  onFork: (fullName: string) => Promise<void>
  onCancel: () => void
}

export function ForkModal({ originalCartName, onFork, onCancel }: ForkModalProps) {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [cartName, setCartName] = useState('')
  const [isForking, setIsForking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    // Pre-fill with suggested cart name
    if (originalCartName) {
      const suggestedName = originalCartName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      setCartName(suggestedName)
    }
  }, [originalCartName])

  const handleFork = async () => {
    if (!cartName.trim()) {
      setError('Cart name is required')
      return
    }

    if (!user?.username) {
      setError('You must be logged in to fork')
      return
    }

    // Validate cart name
    const trimmedCartName = cartName.trim()
    if (trimmedCartName.length < 1) {
      setError('Cart name cannot be empty')
      return
    }

    if (!/^[a-z0-9_-]+$/i.test(trimmedCartName)) {
      setError('Cart name can only contain letters, numbers, _, and -')
      return
    }

    setIsForking(true)
    setError(null)

    try {
      // Construct full name: username/cartname
      const fullName = `${user.username}/${trimmedCartName}`
      await onFork(fullName)
    } catch (err: any) {
      setError(err.message || 'Failed to fork cart')
      setIsForking(false)
    }
  }

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isForking) {
          onCancel()
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-700"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2">Fork Cart</h2>
        
        <p className="text-gray-300 mb-4 text-sm leading-relaxed">
          <strong className="text-white">What is a Fork?</strong><br />
          A fork is like making your own copy of this game. It's like taking a toy from a friend and making your own exact copy that you can change however you want! You can edit your copy, but the original stays the same.
        </p>
        
        <p className="text-gray-300 mb-4 text-sm">
          Enter a name for your forked cart. Your username will be automatically added.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="fork-name" className="block text-sm font-medium mb-2">
              Cart Name
            </label>
            <div className="flex items-center">
              {user && (
                <span className="px-4 py-2 bg-gray-700 border border-gray-600 border-r-0 rounded-l text-gray-300 font-mono text-sm">
                  {user.username}/
                </span>
              )}
              <input
                id="fork-name"
                type="text"
                value={cartName}
                onChange={(e) => {
                  // Only allow alphanumeric, _, and - characters
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                  setCartName(value)
                  setError(null)
                }}
                placeholder="cart-name"
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-r text-white placeholder-gray-400 focus:outline-none focus:border-retro-500 font-mono text-sm"
                disabled={isForking}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isForking) {
                    handleFork()
                  }
                }}
              />
            </div>
            {user && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">
                  Your username: <span className="text-retro-400">{user.username}</span>
                </p>
                {cartName.trim() && (
                  <p className="text-xs text-gray-500">
                    Your Forked Cart Name: <span className="text-retro-400">{user.username}/{cartName.trim()}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded bg-red-900/30 text-red-400">{error}</div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleFork}
              disabled={!cartName.trim() || isForking}
              className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex items-center justify-center gap-2 font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
              </svg>
              {isForking ? 'Forking...' : 'Fork'}
            </button>
            <button
              onClick={onCancel}
              disabled={isForking}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  
  return createPortal(modalContent, document.body)
}

