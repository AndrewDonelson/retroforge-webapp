import pkg from '../../../package.json'

export default function SiteFooter() {
  const webappVersion = (pkg as any).version || '0.0.0'
  const engineVersion = process.env.NEXT_PUBLIC_ENGINE_VERSION || 'v1.0 Alpha'
  return (
    <footer className="border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
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
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="https://github.com/AndrewDonelson/retroforge-engine"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Engine (Open Source)
            </a>
            <a
              href="https://github.com/AndrewDonelson/retroforge-webapp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              WebApp (Private)
            </a>
          </div>
          <div className="text-gray-400 text-xs mt-4 md:mt-0">
            WebApp v{webappVersion} • Engine v{engineVersion}
          </div>
        </div>
      </div>
    </footer>
  )
}


