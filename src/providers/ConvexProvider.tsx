"use client"

import { ConvexProvider as Convex } from 'convex/react'
import { ConvexReactClient } from 'convex/react'
import { ReactNode, useMemo } from 'react'

export function ConvexProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || ''
    if (!convexUrl && typeof window !== 'undefined') {
      console.warn('NEXT_PUBLIC_CONVEX_URL not set')
    }
    // Use a placeholder URL during SSR if not available
    return new ConvexReactClient(convexUrl || 'https://placeholder.convex.site')
  }, [])

  return <Convex client={convex}>{children}</Convex>
}

