"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useAuth } from '@/contexts/AuthContext'

interface LobbyBrowserModalProps {
  cartId: Id<'carts'>
  onJoinLobby: (lobbyId: Id<'lobbies'>) => void
  onCreateLobby: () => void
  onClose: () => void
}

export function LobbyBrowserModal({
  cartId,
  onJoinLobby,
  onCreateLobby,
  onClose,
}: LobbyBrowserModalProps) {
  const { isAuthenticated, user } = useAuth()
  const [mounted, setMounted] = useState(false)

  const lobbies = useQuery(
    api.lobbies.listLobbies,
    isAuthenticated ? { cartId, status: 'waiting' } : 'skip'
  )
  const joinLobby = useMutation(api.lobbies.joinLobby)

  const [joiningLobbyId, setJoiningLobbyId] = useState<Id<'lobbies'> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleJoin = async (lobbyId: Id<'lobbies'>) => {
    if (!user?.userId) {
      setError('You must be logged in to join a lobby')
      return
    }

    setJoiningLobbyId(lobbyId)
    setError(null)

    try {
      await joinLobby({ lobbyId, userId: user.userId })
      onJoinLobby(lobbyId)
    } catch (err: any) {
      setError(err.message || 'Failed to join lobby')
      setJoiningLobbyId(null)
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
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Browse Lobbies</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="text-center py-8">
            <p className="text-gray-300 mb-4">You must be logged in to join lobbies</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <button
                onClick={onCreateLobby}
                className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded"
              >
                Create New Lobby
              </button>
            </div>

            {error && (
              <div className="p-3 rounded bg-red-900/30 text-red-400 mb-4">{error}</div>
            )}

            {lobbies === undefined ? (
              <div className="text-center py-8 text-gray-400">Loading lobbies...</div>
            ) : lobbies.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No active lobbies. Create one to get started!
              </div>
            ) : (
              <div className="space-y-2">
                {lobbies.map((lobby) => (
                  <div
                    key={lobby._id}
                    className="bg-gray-700 rounded p-4 border border-gray-600 hover:border-retro-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{lobby.name}</h3>
                        <p className="text-sm text-gray-400">
                          {lobby.players.length} / {lobby.maxPlayers} players
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {lobby.players.map((player, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-gray-600 rounded"
                            >
                              {player.username}
                              {player.isReady && (
                                <span className="ml-1 text-green-400">✓</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoin(lobby._id)}
                        disabled={
                          joiningLobbyId === lobby._id ||
                          lobby.players.length >= lobby.maxPlayers
                        }
                        className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                      >
                        {joiningLobbyId === lobby._id
                          ? 'Joining...'
                          : lobby.players.length >= lobby.maxPlayers
                          ? 'Full'
                          : 'Join'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  if (!mounted) return null

  return createPortal(modalContent, document.body)
}

