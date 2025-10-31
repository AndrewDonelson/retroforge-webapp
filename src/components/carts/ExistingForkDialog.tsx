"use client"

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'

interface ExistingForkDialogProps {
  existingCartId: Id<'carts'>
  existingCartTitle: string
  onForkNew: () => void
  onCancel: () => void
}

export function ExistingForkDialog({
  existingCartId,
  existingCartTitle,
  onForkNew,
  onCancel,
}: ExistingForkDialogProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleOpenExisting = () => {
    router.push(`/editor?cartId=${existingCartId}`)
    onCancel()
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
          onCancel()
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-700"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-3">Cart Already Forked</h2>
        
        <p className="text-gray-300 mb-4">
          You already have a fork of this cart: <strong className="text-white">{existingCartTitle}</strong>
        </p>

        <div className="space-y-3">
          <button
            onClick={handleOpenExisting}
            className="w-full px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded"
          >
            Open Existing Fork
          </button>
          <button
            onClick={onForkNew}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Fork with New Name
          </button>
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  
  return createPortal(modalContent, document.body)
}

