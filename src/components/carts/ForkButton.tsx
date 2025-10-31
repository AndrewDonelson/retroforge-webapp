"use client"

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useAuth } from '@/contexts/AuthContext'
import { ForkModal } from './ForkModal'
import { ExistingForkDialog } from './ExistingForkDialog'

interface ForkButtonProps {
  cartId?: Id<'carts'> // Optional - if not provided, will create from scratch
  originalCartName: string
  cartFile?: string // For hardcoded carts, the file path
  onForked?: (newCartId: Id<'carts'>) => void
}

export function ForkButton({ cartId, originalCartName, cartFile, onForked }: ForkButtonProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const forkCartMutation = useMutation(api.cartActions.forkCart)
  const createCartMutation = useMutation(api.cartActions.createCart)
  const [showModal, setShowModal] = useState(false)
  const [showExistingForkDialog, setShowExistingForkDialog] = useState(false)

  // Check if user already has a fork of this cart
  const existingFork = useQuery(
    api.cartActions.getExistingFork,
    isAuthenticated && user && cartId
      ? { originalCartId: cartId, ownerId: user.userId }
      : 'skip'
  )

  if (!isAuthenticated || !user) {
    return null // Don't show fork button if not logged in
  }

  const handleFork = async (fullName: string) => {
    if (!user) return

    // Extract cart name from fullName (username/cartname)
    const parts = fullName.split('/')
    const cartName = parts[1] || fullName

    let result: { cartId: Id<'carts'> }

    if (cartId) {
      // Fork existing cart from database
      result = await forkCartMutation({
        cartId,
        ownerId: user.userId,
        title: cartName,
      })
    } else if (cartFile) {
      // Create new cart from file (for hardcoded example carts)
      // Load cart data from file
      const res = await fetch(cartFile)
      const buf = await res.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
      
      result = await createCartMutation({
        ownerId: user.userId,
        title: cartName,
        description: `Fork of ${originalCartName}`,
        genre: 'Arcade',
        cartData: base64,
        isPublic: false,
      })
    } else {
      throw new Error('Cannot fork: no cart ID or file provided')
    }

    setShowModal(false)
    onForked?.(result.cartId)
    
    // Redirect to editor with cartId
    router.push(`/editor?cartId=${result.cartId}`)
  }

  const handleForkClick = () => {
    // If user already has a fork, show dialog
    if (existingFork && !showExistingForkDialog) {
      setShowExistingForkDialog(true)
    } else {
      // No existing fork, proceed with normal fork flow
      setShowModal(true)
    }
  }

  const handleForkNew = () => {
    setShowExistingForkDialog(false)
    setShowModal(true)
  }

  return (
    <>
      <button
        onClick={handleForkClick}
        className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded"
        disabled={existingFork === undefined} // Disable while checking
      >
        Fork
      </button>
      {showExistingForkDialog && existingFork && (
        <ExistingForkDialog
          existingCartId={existingFork._id}
          existingCartTitle={existingFork.title}
          onForkNew={handleForkNew}
          onCancel={() => setShowExistingForkDialog(false)}
        />
      )}
      {showModal && (
        <ForkModal
          originalCartName={originalCartName}
          onFork={handleFork}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  )
}

