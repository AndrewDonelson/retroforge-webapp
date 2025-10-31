"use client"

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { RecoveryKeyModal } from './RecoveryKeyModal'
import { generateKeypair, hashString } from '@/lib/auth'

interface AuthModalProps {
  onClose?: () => void
}

type AuthMode = 'create' | 'login'

export function AuthModal({ onClose }: AuthModalProps) {
  const { createAccount, checkUsernameAvailable, loginWithRecoveryKey } = useAuth()
  const [mode, setMode] = useState<AuthMode>('create')
  const [username, setUsername] = useState('')
  const [recoveryKey, setRecoveryKey] = useState('')
  const [recoveryKeyFile, setRecoveryKeyFile] = useState<File | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showRecoveryKey, setShowRecoveryKey] = useState(false)
  const [newRecoveryKey, setNewRecoveryKey] = useState<string | null>(null)
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean
    reason?: string
  } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDropAreaRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle drag and drop
  useEffect(() => {
    const area = dragDropAreaRef.current
    if (!area || mode !== 'login') return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      
      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        handleFileSelect(files[0])
      }
    }

    area.addEventListener('dragover', handleDragOver)
    area.addEventListener('dragleave', handleDragLeave)
    area.addEventListener('drop', handleDrop)

    return () => {
      area.removeEventListener('dragover', handleDragOver)
      area.removeEventListener('dragleave', handleDragLeave)
      area.removeEventListener('drop', handleDrop)
    }
  }, [mode])

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.txt')) {
      setError('Please select a .txt recovery key file')
      return
    }

    try {
      const text = await file.text()
      // Try to extract username from the file
      // Format: "Username: <username>" or look for it
      const usernameMatch = text.match(/Username:\s*([a-z0-9_-]+)/i)
      if (usernameMatch && usernameMatch[1]) {
        setUsername(usernameMatch[1].toLowerCase().trim())
      }
      
      // Try to extract the recovery key from the file
      // Format: "Recovery Key: <key>" or just the key itself (64 hex chars)
      const keyMatch = text.match(/Recovery Key:\s*([a-f0-9]+)/i) || text.match(/([a-f0-9]{64})/i)
      if (keyMatch && keyMatch[1]) {
        setRecoveryKey(keyMatch[1])
        setRecoveryKeyFile(file)
        setError(null)
      } else {
        setError('Could not find recovery key in file. Please check the file format.')
      }
    } catch (err: any) {
      setError('Failed to read file: ' + err.message)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

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
        setNewRecoveryKey(key)
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

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Username is required')
      return
    }

    if (!recoveryKey.trim()) {
      setError('Recovery key is required')
      return
    }

    setIsLoggingIn(true)
    setError(null)

    try {
      // Clean the recovery key (remove whitespace)
      const cleanKey = recoveryKey.trim().replace(/\s/g, '')
      await loginWithRecoveryKey(username, cleanKey)
      // Small delay to let state update
      await new Promise(resolve => setTimeout(resolve, 200))
      onClose?.()
    } catch (err: any) {
      setError(err.message || 'Failed to login')
      setIsLoggingIn(false)
    }
  }

  const handleRecoveryKeyDismiss = () => {
    setShowRecoveryKey(false)
    setNewRecoveryKey(null)
    onClose?.()
  }

  const isValidUsername = /^[a-z0-9_-]{3,20}$/i.test(username)
  // Recovery key validation - should be 64 hex characters (32 bytes * 2)
  // Allow whitespace for pasting convenience
  const cleanRecoveryKey = recoveryKey.trim().replace(/\s/g, '')
  const isValidRecoveryKey = /^[a-f0-9]{64}$/i.test(cleanRecoveryKey)

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
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-900 rounded">
          <button
            onClick={() => {
              setMode('create')
              setError(null)
              setAvailabilityStatus(null)
            }}
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
              mode === 'create'
                ? 'bg-retro-600 text-white'
                : 'bg-transparent text-gray-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => {
              setMode('login')
              setError(null)
              setAvailabilityStatus(null)
            }}
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-retro-600 text-white'
                : 'bg-transparent text-gray-400 hover:text-white'
            }`}
          >
            Login
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-3">
          {mode === 'create' ? 'Create Account' : 'Login to Your Account'}
        </h2>

        {mode === 'create' ? (
          <>
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
          </>
        ) : (
          <>
            <p className="text-gray-300 mb-4 text-sm">
              Enter your username and recovery key to login. You can paste the key or upload the recovery key file.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="login-username" className="block text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().trim())
                    setError(null)
                  }}
                  placeholder="Enter your username"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-retro-500"
                  disabled={isLoggingIn}
                />
              </div>

              <div>
                <label htmlFor="recovery-key" className="block text-sm font-medium mb-2">
                  Recovery Key
                </label>
                
                {/* Drag and Drop Area */}
                <div
                  ref={dragDropAreaRef}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded p-4 mb-2 cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-retro-500 bg-retro-900/20'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-900/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📁</div>
                    <p className="text-sm text-gray-400">
                      {recoveryKeyFile
                        ? `File selected: ${recoveryKeyFile.name}`
                        : 'Click or drag recovery key file here'}
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isLoggingIn}
                />

                <div className="text-center text-xs text-gray-500 mb-2">or</div>

                <textarea
                  id="recovery-key"
                  value={recoveryKey}
                  onChange={(e) => {
                    setRecoveryKey(e.target.value)
                    setRecoveryKeyFile(null) // Clear file when manually typing
                    setError(null)
                  }}
                  placeholder="Paste your recovery key here (64+ hex characters)"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-retro-500 font-mono text-sm"
                  rows={3}
                  disabled={isLoggingIn}
                />
                
                {!isValidRecoveryKey && recoveryKey && (
                  <p className="text-sm text-red-400 mt-1">
                    Recovery key should be exactly 64 hexadecimal characters
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 rounded bg-red-900/30 text-red-400">{error}</div>
              )}

              {isLoggingIn && (
                <div className="text-xs text-gray-400 mb-2">
                  Verifying recovery key and generating new session keys...
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleLogin}
                  disabled={!username.trim() || !isValidRecoveryKey || isLoggingIn}
                  className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                >
                  {isLoggingIn ? 'Logging in...' : 'Login'}
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    disabled={isLoggingIn}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {mode === 'create' && (
          <div className="text-xs text-gray-400 mt-4 space-y-1">
            <p>Your account uses cryptographic keys stored in your browser.</p>
            <p>⚠️ Clearing browser data will log you out. Make sure to save your recovery key if provided.</p>
          </div>
        )}
      </div>
    </div>
  )

  if (!mounted) return null
  
  return (
    <>
      {createPortal(modalContent, document.body)}
      {showRecoveryKey && newRecoveryKey && (
        <RecoveryKeyModal
          recoveryKey={newRecoveryKey}
          username={username}
          onDismiss={handleRecoveryKeyDismiss}
        />
      )}
    </>
  )
}

