"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { RecoveryKeyModal } from './RecoveryKeyModal'

interface UsernameModalProps {
  onClose?: () => void
}

export function UsernameModal({ onClose }: UsernameModalProps) {
  const { createAccount, checkUsernameAvailable } = useAuth()
  const [username, setUsername] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showRecoveryKey, setShowRecoveryKey] = useState(false)
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null)
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean
    reason?: string
  } | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handleCheckUsername = async () => {
    if (!username.trim()) {
      setError('Username is required')
      return
    }

    setIsChecking(true)
    setError(null)
    setAvailabilityStatus(null)

    try {
      const available = await checkUsernameAvailable(username)
      if (available) {
        setAvailabilityStatus({ available: true })
      } else {
        setAvailabilityStatus({ available: false, reason: 'Username already taken' })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check username')
      setAvailabilityStatus({ available: false, reason: err.message })
    } finally {
      setIsChecking(false)
    }
  }

  const handleCreateAccount = async () => {
    if (!username.trim()) {
      setError('Username is required')
      return
    }

    if (availabilityStatus && !availabilityStatus.available) {
      setError('Please choose a different username')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const key = await createAccount(username)
      if (key) {
        setRecoveryKey(key)
        setShowRecoveryKey(true)
      } else {
        onClose?.()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRecoveryKeyDismiss = () => {
    setShowRecoveryKey(false)
    setRecoveryKey(null)
    onClose?.()
  }

  const isValidUsername = /^[a-z0-9_-]{3,20}$/i.test(username)

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-3">Choose Your Username</h2>
        <p className="text-gray-300 mb-4 text-sm">
          Pick a unique username to start creating and forking carts. This is the only identifier
          tied to your account.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().trim())
                setAvailabilityStatus(null)
                setError(null)
              }}
              placeholder="3-20 characters, letters, numbers, _, -"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-retro-500"
              disabled={isCreating}
            />
            {!isValidUsername && username && (
              <p className="text-sm text-red-400 mt-1">
                Username must be 3-20 characters (letters, numbers, _, -)
              </p>
            )}
          </div>

          {availabilityStatus && (
            <div
              className={`p-3 rounded ${
                availabilityStatus.available
                  ? 'bg-green-900/30 text-green-400'
                  : 'bg-red-900/30 text-red-400'
              }`}
            >
              {availabilityStatus.available
                ? '✓ Username is available!'
                : `✗ ${availabilityStatus.reason}`}
            </div>
          )}

          {error && (
            <div className="p-3 rounded bg-red-900/30 text-red-400">{error}</div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCheckUsername}
              disabled={!isValidUsername || isChecking || isCreating}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? 'Checking...' : 'Check Availability'}
            </button>
            <button
              onClick={handleCreateAccount}
              disabled={!isValidUsername || !availabilityStatus?.available || isCreating}
              className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            >
              {isCreating ? 'Creating Account...' : 'Create Account'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                disabled={isCreating}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-400 mt-4 space-y-1">
          <p>Your account uses cryptographic keys stored in your browser.</p>
          <p>⚠️ Clearing browser data will log you out. Make sure to save your recovery key if provided.</p>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  
  return (
    <>
      {createPortal(modalContent, document.body)}
      {showRecoveryKey && recoveryKey && (
        <RecoveryKeyModal
          recoveryKey={recoveryKey}
          username={username}
          onDismiss={handleRecoveryKeyDismiss}
        />
      )}
    </>
  )
}

