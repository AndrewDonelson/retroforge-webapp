"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Id } from '@/convex/_generated/dataModel'
import { ProfileContent } from '@/components/profile/ProfileContent'

interface ProfileModalProps {
  userId?: Id<'users'> // If provided, show that user's profile. Otherwise show current user's
  onClose: () => void
}

export function ProfileModal({ userId, onClose }: ProfileModalProps) {
  const [mounted, setMounted] = useState(false)

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
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <ProfileContent userId={userId} isModal={true} onClose={onClose} />
      </div>
    </div>
  )

  if (!mounted) return null

  return createPortal(modalContent, document.body)
}

