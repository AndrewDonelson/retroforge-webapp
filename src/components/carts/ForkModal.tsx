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
  const [fullName, setFullName] = useState('')
  const [isForking, setIsForking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    // Pre-fill with username/cartname format
    if (user?.username) {
      const suggestedName = originalCartName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      setFullName(`${user.username}/${suggestedName}`)
    }
  }, [user, originalCartName])

  const handleFork = async () => {
    if (!fullName.trim()) {
      setError('Cart name is required')
      return
    }

    // Validate format: username/cartname
    const parts = fullName.trim().split('/')
    if (parts.length !== 2) {
      setError('Cart name must be in format: username/cartname')
      return
    }

    const [usernamePart, cartNamePart] = parts

    // Validate username part matches current user
    if (user && usernamePart !== user.username) {
      setError(`Username must be your own: ${user.username}`)
      return
    }

    // Validate cart name
    if (!cartNamePart || cartNamePart.length < 1) {
      setError('Cart name cannot be empty')
      return
    }

    if (!/^[a-z0-9_-]+$/i.test(cartNamePart)) {
      setError('Cart name can only contain letters, numbers, _, and -')
      return
    }

    setIsForking(true)
    setError(null)

    try {
      await onFork(fullName.trim())
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
        <h2 className="text-2xl font-bold mb-3">Fork Cart</h2>
        
        <p className="text-gray-300 mb-4 text-sm">
          Enter a name for your forked cart. The format should be <code className="text-retro-400">username/cartname</code>
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="fork-name" className="block text-sm font-medium mb-2">
              Cart Name
            </label>
            <input
              id="fork-name"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value.toLowerCase())
                setError(null)
              }}
              placeholder="username/cartname"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-retro-500 font-mono text-sm"
              disabled={isForking}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isForking) {
                  handleFork()
                }
              }}
            />
            {user && (
              <p className="text-xs text-gray-500 mt-1">
                Your username: <span className="text-retro-400">{user.username}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded bg-red-900/30 text-red-400">{error}</div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleFork}
              disabled={!fullName.trim() || isForking}
              className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            >
              {isForking ? 'Forking...' : 'Fork'}
            </button>
            <button
              onClick={onCancel}
              disabled={isForking}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
            >
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

