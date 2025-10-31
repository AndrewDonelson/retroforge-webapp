"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'

interface CreateCartModalProps {
  onCreate: (fullName: string) => Promise<void>
  onCancel: () => void
}

export function CreateCartModal({ onCreate, onCancel }: CreateCartModalProps) {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [fullName, setFullName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    // Pre-fill with username/cartname format
    if (user?.username) {
      setFullName(`${user.username}/untitled-cart`)
    }
  }, [user])

  const handleCreate = async () => {
    if (!fullName.trim()) {
      setError('Please enter a cart name')
      return
    }

    // Validate format: username/cartname
    const parts = fullName.split('/')
    if (parts.length !== 2) {
      setError('Format must be: username/cartname')
      return
    }

    // Validate username matches
    if (parts[0] !== user?.username) {
      setError(`Username must match your username: ${user?.username}`)
      return
    }

    // Validate cart name
    const cartName = parts[1].trim()
    if (!cartName || cartName.length < 1) {
      setError('Cart name is required')
      return
    }

    if (!/^[a-z0-9-]+$/.test(cartName)) {
      setError('Cart name can only contain lowercase letters, numbers, and hyphens')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      await onCreate(fullName)
      // Modal will be closed by parent component after successful creation
    } catch (err: any) {
      setError(err.message || 'Failed to create cart')
      setIsCreating(false)
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
        if (e.target === e.currentTarget && !isCreating) {
          onCancel()
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-700"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-3">Create New Cart</h2>
        
        <p className="text-gray-300 mb-4">
          Enter a name for your new cart. Format: <code className="bg-gray-700 px-1 rounded">username/cartname</code>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cart Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating) {
                  handleCreate()
                }
              }}
              disabled={isCreating}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-retro-500 disabled:opacity-50"
              placeholder="username/cartname"
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-400">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="flex-1 px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Cart'}
            </button>
            <button
              onClick={onCancel}
              disabled={isCreating}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
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

