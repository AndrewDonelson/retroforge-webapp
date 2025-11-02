import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RetroForge Developer Guide',
  description: 'Complete guide for building retro-style games with RetroForge Engine',
}

export default function DeveloperGuideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

