import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AdBanner from '@/components/ads/AdBanner'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { ConvexProvider } from '@/providers/ConvexProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import Script from 'next/script'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  title: 'RetroForge - Forge Your Retro Dreams',
  description: 'A modern fantasy console for creating retro-style games with modern development tools.',
  keywords: ['retroforge', 'fantasy-console', 'game-development', 'retro-games', 'pixel-art'],
  authors: [{ name: 'Andrew Donelson', url: 'https://andrewdonelson.com' }],
  creator: 'Andrew Donelson',
  publisher: 'RetroForge',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/RetroForge-Icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RetroForge',
  },
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
  themeColor: '#8b5cf6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
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
            
            {/* PWA Install Prompt */}
            <PWAInstallPrompt />
          </AuthProvider>
        </ConvexProvider>
        
        {/* Service Worker Registration */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('[SW] Registered:', registration.scope);
                  })
                  .catch((error) => {
                    console.error('[SW] Registration failed:', error);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}