"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getStoredKeys } from '@/lib/auth'
import { AuthModal } from './AuthModal'
import { RecoveryKeyModal } from './RecoveryKeyModal'

export function LoginButton() {
  const { user, logout, isLoading } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [showRecoveryKey, setShowRecoveryKey] = useState(false)

  if (isLoading) {
    return (
      <button className="px-4 py-2 bg-gray-700 rounded opacity-50 cursor-not-allowed">
        Loading...
      </button>
    )
  }

  if (user) {
    const handleShowRecoveryKey = () => {
      const stored = getStoredKeys()
      if (stored.serverKey) {
        setShowRecoveryKey(true)
      } else {
        alert('Recovery key not found in browser storage. If you clear your browser data, you will lose access to your account.')
      }
    }

    return (
      <>
        <div className="flex items-center gap-2">
          <span className="text-gray-300">@{user.username}</span>
          {!user.hasAcknowledgedRecoveryKey && (
            <button
              onClick={handleShowRecoveryKey}
              className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded text-sm"
              title="View recovery key (You haven't confirmed you saved it)"
            >
              🔑 Key
            </button>
          )}
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Logout
          </button>
        </div>
        {showRecoveryKey && (
          <RecoveryKeyModal
            recoveryKey={getStoredKeys().serverKey || ''}
            username={user.username}
            onDismiss={() => setShowRecoveryKey(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded"
      >
        Sign Up / Login
      </button>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  )
}

