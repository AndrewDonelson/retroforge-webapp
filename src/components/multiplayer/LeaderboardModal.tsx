"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

interface LeaderboardModalProps {
  cartId?: Id<'carts'> // If provided, show cart-specific leaderboard
  onClose: () => void
}

export function LeaderboardModal({ cartId, onClose }: LeaderboardModalProps) {
  const [mounted, setMounted] = useState(false)
  const [viewMode, setViewMode] = useState<'global' | 'cart'>(cartId ? 'cart' : 'global')

  const globalLeaderboard = useQuery(
    api.profiles.getLeaderboard,
    viewMode === 'global' ? { limit: 50 } : 'skip'
  )
  const topScores = useQuery(
    api.profiles.getTopScores,
    viewMode === 'cart' && cartId ? { cartId, limit: 50 } : 'skip'
  )

  useEffect(() => {
    setMounted(true)
  }, [])

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
          <h2 className="text-2xl font-bold">Leaderboards</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {cartId && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setViewMode('global')}
              className={`px-4 py-2 rounded ${
                viewMode === 'global'
                  ? 'bg-retro-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setViewMode('cart')}
              className={`px-4 py-2 rounded ${
                viewMode === 'cart'
                  ? 'bg-retro-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              This Game
            </button>
          </div>
        )}

        {viewMode === 'global' ? (
          <div>
            <h3 className="text-lg font-semibold mb-3">Top Players (All Games)</h3>
            {globalLeaderboard === undefined ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : globalLeaderboard.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No scores yet</div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-2 text-sm font-semibold text-gray-400 pb-2 border-b border-gray-700">
                  <div>Rank</div>
                  <div>Player</div>
                  <div className="text-right">Total Score</div>
                  <div className="text-right">Games</div>
                  <div className="text-right">Wins</div>
                </div>
                {globalLeaderboard.map((entry) => (
                  <div
                    key={entry.userId}
                    className="grid grid-cols-5 gap-2 p-2 rounded bg-gray-700/50 hover:bg-gray-700"
                  >
                    <div className="font-semibold">#{entry.rank}</div>
                    <div>{entry.username}</div>
                    <div className="text-right">{entry.totalScore.toLocaleString()}</div>
                    <div className="text-right">{entry.gamesPlayed}</div>
                    <div className="text-right text-green-400">{entry.wins}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold mb-3">Top Scores</h3>
            {topScores === undefined ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : topScores.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No scores yet</div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-sm font-semibold text-gray-400 pb-2 border-b border-gray-700">
                  <div>Player</div>
                  <div className="text-right">Score</div>
                  <div className="text-right">Placement</div>
                  <div className="text-right">Date</div>
                </div>
                {topScores.map((entry, idx) => (
                  <div
                    key={`${entry.matchId}-${entry.userId}`}
                    className="grid grid-cols-4 gap-2 p-2 rounded bg-gray-700/50 hover:bg-gray-700"
                  >
                    <div className="font-semibold">
                      #{idx + 1} {entry.username}
                    </div>
                    <div className="text-right text-retro-400 font-semibold">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-right">
                      {entry.placement === 1 ? (
                        <span className="text-yellow-400">🥇 1st</span>
                      ) : entry.placement === 2 ? (
                        <span className="text-gray-300">🥈 2nd</span>
                      ) : entry.placement === 3 ? (
                        <span className="text-orange-600">🥉 3rd</span>
                      ) : (
                        `${entry.placement}th`
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (!mounted) return null

  return createPortal(modalContent, document.body)
}

