"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useAuth } from '@/contexts/AuthContext'

interface CreateLobbyModalProps {
  cartId: Id<'carts'>
  maxPlayers: number // From cart manifest
  onLobbyCreated: (lobbyId: Id<'lobbies'>) => void
  onCancel: () => void
}

export function CreateLobbyModal({
  cartId,
  maxPlayers,
  onLobbyCreated,
  onCancel,
}: CreateLobbyModalProps) {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [lobbyName, setLobbyName] = useState('')
  const [selectedMaxPlayers, setSelectedMaxPlayers] = useState(maxPlayers)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createLobby = useMutation(api.lobbies.createLobby)

  useEffect(() => {
    setMounted(true)
    // Default lobby name
    if (user?.username) {
      setLobbyName(`${user.username}'s Lobby`)
    }
  }, [user])

  const handleCreate = async () => {
    if (!user?.userId) {
      setError('You must be logged in to create a lobby')
      return
    }

    if (!lobbyName.trim()) {
      setError('Lobby name is required')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const lobbyId = await createLobby({
        cartId,
        name: lobbyName.trim(),
        maxPlayers: selectedMaxPlayers,
        hostId: user.userId,
      })
      onLobbyCreated(lobbyId)
    } catch (err: any) {
      setError(err.message || 'Failed to create lobby')
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
        <h2 className="text-2xl font-bold mb-3">Create Lobby</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="lobby-name" className="block text-sm font-medium mb-2">
              Lobby Name
            </label>
            <input
              id="lobby-name"
              type="text"
              value={lobbyName}
              onChange={(e) => {
                setLobbyName(e.target.value)
                setError(null)
              }}
              placeholder="My Awesome Lobby"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-retro-500"
              disabled={isCreating}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating) {
                  handleCreate()
                }
              }}
            />
          </div>

          <div>
            <label htmlFor="max-players" className="block text-sm font-medium mb-2">
              Max Players ({selectedMaxPlayers})
            </label>
            <input
              id="max-players"
              type="range"
              min="2"
              max={maxPlayers}
              value={selectedMaxPlayers}
              onChange={(e) => setSelectedMaxPlayers(parseInt(e.target.value))}
              className="w-full"
              disabled={isCreating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Cart supports up to {maxPlayers} players
            </p>
          </div>

          {error && (
            <div className="p-3 rounded bg-red-900/30 text-red-400">{error}</div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!lobbyName.trim() || isCreating}
              className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            >
              {isCreating ? 'Creating...' : 'Create Lobby'}
            </button>
            <button
              onClick={onCancel}
              disabled={isCreating}
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

