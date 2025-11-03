import Link from 'next/link'
import pkg from '../../../package.json'

export default function SiteFooter() {
  const webappVersion = (pkg as any).version || '0.0.0'
  const engineVersion = process.env.NEXT_PUBLIC_ENGINE_VERSION || 'v1.0 Alpha'
  return (
    <footer className="border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            © 2025 RetroForge. Built with ❤️ by{' '}
            <a
              href="https://andrewdonelson.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-retro-400 hover:text-retro-300"
            >
              Andrew Donelson
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-4 justify-center">
            <Link
              href="/terms"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Privacy
            </Link>
            <Link
              href="/license"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              License
            </Link>
            <a
              href="https://github.com/AndrewDonelson/retroforge-engine"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Engine (Open Source)
            </a>
            <a
              href="https://github.com/AndrewDonelson/retroforge-webapp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              WebApp (Private)
            </a>
          </div>
          <div className="text-gray-400 text-xs">
            WebApp v{webappVersion} • Engine v{engineVersion}
          </div>
        </div>
      </div>
    </footer>
  )
}


