"use client"

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface ProfileContentProps {
  userId?: Id<'users'> // If provided, show that user's profile. Otherwise show current user's
  isModal?: boolean // If false, render as a page (no close button)
  onClose?: () => void // Only used in modal mode
}

export function ProfileContent({ userId, isModal = false, onClose }: ProfileContentProps) {
  const { user } = useAuth()

  const profileUserId = userId || user?.userId
  const profile = useQuery(
    api.profiles.getProfile,
    profileUserId ? { userId: profileUserId } : 'skip'
  )

  // Get follow status and followed users
  const isFollowingUser = useQuery(
    api.follows.isFollowing,
    user?.userId && profileUserId && user.userId !== profileUserId
      ? { followerId: user.userId, followingId: profileUserId }
      : 'skip'
  )

  const followingList = useQuery(
    api.follows.getFollowing,
    profileUserId ? { userId: profileUserId } : 'skip'
  )

  const followMutation = useMutation(api.follows.followUser)
  const unfollowMutation = useMutation(api.follows.unfollowUser)

  const [isTogglingFollow, setIsTogglingFollow] = useState(false)

  const handleToggleFollow = async () => {
    if (!user?.userId || !profileUserId || user.userId === profileUserId) return
    if (isTogglingFollow) return

    setIsTogglingFollow(true)
    try {
      if (isFollowingUser) {
        await unfollowMutation({
          followerId: user.userId,
          followingId: profileUserId,
        })
      } else {
        await followMutation({
          followerId: user.userId,
          followingId: profileUserId,
        })
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error)
      alert(error.message || 'Failed to update follow status')
    } finally {
      setIsTogglingFollow(false)
    }
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 shadow-2xl border border-gray-700 ${isModal ? 'max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Player Profile</h2>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      {profile === undefined ? (
        <div className="text-center py-8 text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xl font-semibold mb-1">{profile.username}</h3>
                <p className="text-sm text-gray-400">
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
              {user?.userId && profileUserId && user.userId !== profileUserId && (
                <button
                  onClick={handleToggleFollow}
                  disabled={isTogglingFollow}
                  className={`px-4 py-2 rounded transition-colors ${
                    isFollowingUser
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-retro-600 hover:bg-retro-500 text-white'
                  } ${isTogglingFollow ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isTogglingFollow ? '...' : isFollowingUser ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          {/* Following section */}
          {followingList && followingList.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Following</h3>
              <div className="bg-gray-700 rounded p-4">
                <div className="flex flex-wrap gap-2">
                  {followingList.map((followedUser) => (
                    <Link
                      key={followedUser.userId}
                      href={`/user/${followedUser.username}`}
                      className="px-3 py-1 bg-gray-600 rounded text-sm text-gray-200 hover:bg-gray-500 transition-colors"
                    >
                      @{followedUser.username}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                {profile.recentMatches.map((match) => {
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
  )
}

