import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PICO-8 Comparison - RetroForge',
  description: 'Feature-by-feature comparison between PICO-8 and RetroForge Engine',
}

export default function ComparisonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

