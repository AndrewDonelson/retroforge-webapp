"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useAuth } from '@/contexts/AuthContext'

interface ProfileModalProps {
  userId?: Id<'users'> // If provided, show that user's profile. Otherwise show current user's
  onClose: () => void
}

export function ProfileModal({ userId, onClose }: ProfileModalProps) {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  const profileUserId = userId || user?.userId
  const profile = useQuery(
    api.profiles.getProfile,
    profileUserId ? { userId: profileUserId } : 'skip'
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
          <h2 className="text-2xl font-bold">Player Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {profile === undefined ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">{profile.username}</h3>
              <p className="text-sm text-gray-400">
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700 rounded p-4">
                <div className="text-sm text-gray-400 mb-1">Games Played</div>
                <div className="text-2xl font-bold">{profile.stats.gamesPlayed}</div>
              </div>
              <div className="bg-gray-700 rounded p-4">
                <div className="text-sm text-gray-400 mb-1">Wins</div>
                <div className="text-2xl font-bold text-green-400">{profile.stats.wins}</div>
              </div>
              <div className="bg-gray-700 rounded p-4">
                <div className="text-sm text-gray-400 mb-1">Total Score</div>
                <div className="text-2xl font-bold text-retro-400">
                  {profile.stats.totalScore.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-700 rounded p-4">
                <div className="text-sm text-gray-400 mb-1">Average Score</div>
                <div className="text-2xl font-bold">
                  {profile.stats.averageScore.toFixed(0)}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Recent Matches</h3>
              {profile.recentMatches.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No matches yet</div>
              ) : (
                <div className="space-y-2">
                  {profile.recentMatches.map((match, idx) => {
                    const playerResult = match.players.find(
                      (p) => p.userId === profileUserId
                    )
                    if (!playerResult) return null

                    return (
                      <div
                        key={match._id}
                        className="bg-gray-700 rounded p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold">
                            Score: {playerResult.score.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(match.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold ${
                              playerResult.placement === 1
                                ? 'text-yellow-400'
                                : playerResult.placement === 2
                                ? 'text-gray-300'
                                : playerResult.placement === 3
                                ? 'text-orange-600'
                                : 'text-gray-400'
                            }`}
                          >
                            {playerResult.placement === 1 && '🥇 '}
                            {playerResult.placement === 2 && '🥈 '}
                            {playerResult.placement === 3 && '🥉 '}
                            {playerResult.placement}st place
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.floor(match.duration / 1000)}s
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )

  if (!mounted) return null

  return createPortal(modalContent, document.body)
}

