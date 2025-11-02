"use client"

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { ProfileContent } from '@/components/profile/ProfileContent'

export default function UserProfilePage() {
  const params = useParams<{ username: string }>()
  const router = useRouter()
  const username = params?.username

  // Get user by username
  const userData = useQuery(
    api.follows.getUserByUsername,
    username ? { username } : 'skip'
  )

  if (userData === undefined) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (userData === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">User not found</p>
          <button
            onClick={() => router.push('/browser')}
            className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded"
          >
            Go to Browse
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileContent userId={userData.userId} isModal={false} />
      </div>
    </div>
  )
}

