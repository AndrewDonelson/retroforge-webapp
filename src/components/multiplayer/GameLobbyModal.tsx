"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useAuth } from '@/contexts/AuthContext'

interface GameLobbyModalProps {
  lobbyId: Id<'lobbies'>
  cartId: Id<'carts'>
  minPlayers: number
  supportsSolo: boolean
  onStartGame: (isSolo: boolean) => void
  onLeave: () => void
}

export function GameLobbyModal({ 
  lobbyId, 
  cartId: _cartId, // Reserved for future use
  minPlayers,
  supportsSolo,
  onStartGame, 
  onLeave 
}: GameLobbyModalProps) {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  const lobby = useQuery(api.lobbies.getLobby, { lobbyId })
  const setReady = useMutation(api.lobbies.setReady)
  const leaveLobby = useMutation(api.lobbies.leaveLobby)
  const startGame = useMutation(api.lobbies.startGame)

  const [isLeaving, setIsLeaving] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggleReady = async () => {
    if (!user?.userId || !lobby) return

    const player = lobby.players.find((p) => p.userId === user.userId)
    if (!player) return

    try {
      await setReady({
        lobbyId,
        userId: user.userId,
        isReady: !player.isReady,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to update ready status')
    }
  }

  const handleStart = async (isSolo: boolean = false) => {
    if (!user?.userId || !lobby) return

    if (lobby.hostId !== user.userId) {
      setError('Only the host can start the game')
      return
    }

    // Check minimum players (unless solo mode)
    if (!isSolo && lobby.players.length < minPlayers) {
      setError(`Need at least ${minPlayers} players to start`)
      return
    }

    setIsStarting(true)
    setError(null)

    try {
      await startGame({
        lobbyId,
        hostId: user.userId,
      })
      onStartGame(isSolo)
    } catch (err: any) {
      setError(err.message || 'Failed to start game')
      setIsStarting(false)
    }
  }

  const handleLeave = async () => {
    if (!user?.userId) return

    setIsLeaving(true)
    try {
      await leaveLobby({
        lobbyId,
        userId: user.userId,
      })
      onLeave()
    } catch (err: any) {
      setError(err.message || 'Failed to leave lobby')
      setIsLeaving(false)
    }
  }

  if (!lobby) {
    return null // Loading
  }

  const isHost = user?.userId === lobby.hostId
  const currentPlayer = lobby.players.find((p) => p.userId === user?.userId)
  const allReady = lobby.players.length > 0 && lobby.players.every((p) => p.isReady)
  const hasMinPlayers = lobby.players.length >= minPlayers
  const canStart = isHost && allReady && hasMinPlayers && lobby.status === 'waiting'
  const canStartSolo = isHost && supportsSolo && lobby.status === 'waiting'

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLeaving && !isStarting) {
          // Don't close on background click - force explicit leave
        }
      }}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-700"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{lobby.name}</h2>
            <p className="text-sm text-gray-400">
              {lobby.players.length} / {lobby.maxPlayers} players
              {lobby.players.length < minPlayers && (
                <span className="ml-2 text-yellow-400">
                  (Need {minPlayers - lobby.players.length} more)
                </span>
              )}
            </p>
          </div>
          {isHost && (
            <span className="px-2 py-1 bg-retro-600 rounded text-xs">HOST</span>
          )}
        </div>

        {error && (
          <div className="p-3 rounded bg-red-900/30 text-red-400 mb-4">{error}</div>
        )}

        <div className="space-y-2 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Players</h3>
          {lobby.players.map((player, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded ${
                player.userId === user?.userId
                  ? 'bg-retro-900/30 border border-retro-500'
                  : 'bg-gray-700'
              }`}
            >
              <span className="text-sm">
                {player.username}
                {player.userId === lobby.hostId && (
                  <span className="ml-2 text-xs text-retro-400">(Host)</span>
                )}
              </span>
              {player.isReady ? (
                <span className="text-green-400 text-xs">✓ Ready</span>
              ) : (
                <span className="text-gray-500 text-xs">Not ready</span>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {currentPlayer && (
            <button
              onClick={handleToggleReady}
              disabled={isLeaving || isStarting}
              className={`w-full px-4 py-2 rounded ${
                currentPlayer.isReady
                  ? 'bg-yellow-600 hover:bg-yellow-500'
                  : 'bg-green-600 hover:bg-green-500'
              } disabled:opacity-50`}
            >
              {currentPlayer.isReady ? 'Mark Not Ready' : 'Mark Ready'}
            </button>
          )}

          {canStartSolo && !hasMinPlayers && (
            <button
              onClick={() => handleStart(true)}
              disabled={isStarting || isLeaving}
              className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded disabled:opacity-50 mb-2"
            >
              {isStarting ? 'Starting...' : 'Play Solo'}
            </button>
          )}

          {canStart && (
            <button
              onClick={() => handleStart(false)}
              disabled={isStarting || isLeaving}
              className="w-full px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded disabled:opacity-50"
            >
              {isStarting ? 'Starting...' : 'Start Game'}
            </button>
          )}

          {!canStart && !canStartSolo && hasMinPlayers && (
            <div className="p-2 rounded bg-gray-700 text-sm text-gray-400 text-center mb-2">
              {!allReady && 'Waiting for all players to be ready...'}
            </div>
          )}

          <button
            onClick={handleLeave}
            disabled={isLeaving || isStarting}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
          >
            {isLeaving ? 'Leaving...' : 'Leave Lobby'}
          </button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null

  return createPortal(modalContent, document.body)
}

