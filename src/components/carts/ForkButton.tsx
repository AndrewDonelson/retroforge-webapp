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
      const uint8Array = new Uint8Array(buf)
      let binaryString = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i])
      }
      const base64 = btoa(binaryString)
      
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
        className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded flex items-center gap-2"
        disabled={existingFork === undefined} // Disable while checking
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
        </svg>
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

