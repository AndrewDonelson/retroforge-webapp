"use client"

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function EditorPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Redirect to properties page by default, preserving cartId
    const cartId = searchParams?.get('cartId')
    if (cartId) {
      router.replace(`/editor/properties?cartId=${cartId}`)
    } else {
      router.replace('/editor/properties')
    }
  }, [router, searchParams])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-gray-400">Redirecting to editor...</p>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Loading...</p></div>}>
      <EditorPageInner />
    </Suspense>
  )
}

