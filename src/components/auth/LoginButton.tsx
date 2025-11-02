"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getStoredKeys } from '@/lib/auth'
import { AuthModal } from './AuthModal'
import { RecoveryKeyModal } from './RecoveryKeyModal'

export function LoginButton() {
  const { user, logout, isLoading } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [showRecoveryKey, setShowRecoveryKey] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

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
        setShowDropdown(false)
      } else {
        alert('Recovery key not found in browser storage. If you clear your browser data, you will lose access to your account.')
      }
    }

    return (
      <>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-retro-400 transition-colors rounded hover:bg-gray-700/50"
          >
            <span>@{user.username}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L1 4h10z" />
            </svg>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setShowDropdown(false)}
                  className="block px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Profile
                </Link>
                {!user.hasAcknowledgedRecoveryKey && (
                  <button
                    onClick={handleShowRecoveryKey}
                    className="block w-full text-left px-4 py-2 text-yellow-400 hover:bg-gray-700 transition-colors"
                  >
                    🔑 View Recovery Key
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    logout()
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
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

