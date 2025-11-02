"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Id } from '@/convex/_generated/dataModel'

export default function ProjectsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  
  const myCarts = useQuery(
    api.cartActions.getMyCarts,
    isAuthenticated && user ? { ownerId: user.userId } : 'skip'
  )
  
  const updateCart = useMutation(api.cartActions.updateCart)
  const [updatingCartId, setUpdatingCartId] = useState<Id<'carts'> | null>(null)

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">My Projects</h1>
        <p className="text-gray-400">Please log in to view your projects.</p>
      </div>
    )
  }

  if (myCarts === undefined) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">My Projects</h1>
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  const handleTogglePublish = async (cartId: Id<'carts'>, currentIsPublic: boolean) => {
    if (!user) return
    
    setUpdatingCartId(cartId)
    try {
      await updateCart({
        cartId,
        ownerId: user.userId,
        updates: {
          isPublic: !currentIsPublic,
        },
      })
    } catch (error) {
      console.error('Failed to toggle publish status:', error)
      alert('Failed to update publish status. Please try again.')
    } finally {
      setUpdatingCartId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Projects</h1>
        <Link
          href="/editor/properties"
          className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded"
        >
          Create New Project
        </Link>
      </div>

      {myCarts.length === 0 ? (
        <div className="card-retro p-6 text-center">
          <p className="text-gray-400 mb-4">You don't have any projects yet.</p>
          <Link
            href="/arcade"
            className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded inline-block"
          >
            Fork a Cart
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-sm font-medium text-gray-300">Title</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-300 hidden md:table-cell">Description</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-300 hidden lg:table-cell">Genre</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-300 hidden lg:table-cell">Created</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-300 hidden xl:table-cell">Updated</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myCarts.map((cart) => {
                  const created = new Date(cart.createdAt)
                  const updated = new Date(cart.updatedAt)
                  
                  return (
                    <tr
                      key={cart._id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-medium text-white">{cart.title}</div>
                        <div className="text-xs text-gray-500 md:hidden mt-1">
                          {cart.description?.substring(0, 50)}
                          {cart.description && cart.description.length > 50 ? '...' : ''}
                        </div>
                      </td>
                      <td className="p-3 text-gray-400 text-sm hidden md:table-cell">
                        {cart.description || '-'}
                      </td>
                      <td className="p-3 text-gray-400 text-sm hidden lg:table-cell">
                        {cart.genre}
                      </td>
                      <td className="p-3 text-gray-400 text-xs hidden lg:table-cell">
                        {created.toLocaleDateString()}
                      </td>
                      <td className="p-3 text-gray-400 text-xs hidden xl:table-cell">
                        {updated.toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              cart.isPublic
                                ? 'bg-green-900/30 text-green-400'
                                : 'bg-gray-700 text-gray-400'
                            }`}
                          >
                            {cart.isPublic ? 'Public' : 'Private'}
                          </span>
                          {cart.isExample && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-900/30 text-blue-400">
                              Example
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 flex-wrap">
                          {!cart.isExample && (
                            <button
                              onClick={() => handleTogglePublish(cart._id, cart.isPublic)}
                              disabled={updatingCartId === cart._id}
                              className={`text-xs px-3 py-1 rounded whitespace-nowrap transition-colors ${
                                cart.isPublic
                                  ? 'bg-green-700 hover:bg-green-600 text-white'
                                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                              } ${updatingCartId === cart._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={cart.isPublic ? 'Unpublish - Hide from browse/search' : 'Publish - Show in browse/search'}
                            >
                              {updatingCartId === cart._id 
                                ? '...' 
                                : cart.isPublic 
                                  ? 'Unpublish' 
                                  : 'Publish'
                              }
                            </button>
                          )}
                          <Link
                            href={`/editor?cartId=${cart._id}`}
                            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded whitespace-nowrap"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/arcade/${cart._id}`}
                            className="text-xs px-3 py-1 bg-retro-600 hover:bg-retro-500 rounded whitespace-nowrap"
                          >
                            Play
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

