"use client"

import { ConvexProvider as Convex } from 'convex/react'
import { ConvexReactClient } from 'convex/react'
import { ReactNode } from 'react'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || ''

if (!convexUrl) {
  console.warn('NEXT_PUBLIC_CONVEX_URL not set')
}

const convex = new ConvexReactClient(convexUrl)

export function ConvexProvider({ children }: { children: ReactNode }) {
  return <Convex client={convex}>{children}</Convex>
}

