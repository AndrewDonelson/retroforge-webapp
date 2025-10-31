import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AdBanner from '@/components/ads/AdBanner'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { ConvexProvider } from '@/providers/ConvexProvider'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RetroForge - Forge Your Retro Dreams',
  description: 'A modern fantasy console for creating retro-style games with modern development tools.',
  keywords: ['retroforge', 'fantasy-console', 'game-development', 'retro-games', 'pixel-art'],
  authors: [{ name: 'Andrew Donelson', url: 'https://andrewdonelson.com' }],
  creator: 'Andrew Donelson',
  publisher: 'RetroForge',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://retroforge.dev',
    title: 'RetroForge - Forge Your Retro Dreams',
    description: 'A modern fantasy console for creating retro-style games with modern development tools.',
    siteName: 'RetroForge',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RetroForge - Forge Your Retro Dreams',
    description: 'A modern fantasy console for creating retro-style games with modern development tools.',
    creator: '@AndrewDonelson',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-900 text-white`}>
        <ConvexProvider>
          <AuthProvider>
            <div id="root" className="h-full">
              {/* Shared site header */}
              <SiteHeader />

              {/* Top inline banner ad - centered below header */}
              <AdBanner placement="top" />

              {children}

              {/* Bottom banner ad - centered above shared footer */}
              <AdBanner placement="bottom" />

              {/* Shared site footer */}
              <SiteFooter />
            </div>
          </AuthProvider>
        </ConvexProvider>
      </body>
    </html>
  )
}