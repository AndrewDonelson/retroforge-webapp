import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Reference - RetroForge',
  description: 'Complete documentation for all RetroForge Engine Lua functions and APIs',
}

export default function APIReferenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

