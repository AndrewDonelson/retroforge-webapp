import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RetroForge - Forge Your Retro Dreams',
  description: 'A modern fantasy console for creating retro-style games with modern development tools.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Shared header lives in layout */}

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-pixel text-white mb-6">
            Forge Your
            <span className="text-retro-400 block">Retro Dreams</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            A modern fantasy console for creating retro-style games with the creative constraints 
            that encourage finished projects while offering more capability than traditional 8-bit consoles.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/editor" 
              className="btn-retro text-lg px-8 py-4 animate-pixel-glow"
            >
              Start Creating
            </Link>
            <Link 
              href="/browser" 
              className="btn-retro-secondary text-lg px-8 py-4"
            >
              Browse Games
            </Link>
          </div>

          {/* Engine GitHub CTA */}
          <div className="mx-auto max-w-3xl mb-16">
            <a
              href="https://github.com/AndrewDonelson/retroforge-engine"
              target="_blank"
              rel="noopener noreferrer"
              className="block card-retro p-4 hover:border-retro-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-sm text-gray-300">Open Source Engine</div>
                  <div className="text-lg font-pixel text-retro-400">retroforge-engine on GitHub</div>
                </div>
                <span className="text-retro-400">↗</span>
              </div>
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          <div className="card-retro p-6">
            <div className="text-retro-400 text-2xl mb-4">🎮</div>
            <h3 className="text-xl font-pixel mb-3">Complete Development Environment</h3>
            <p className="text-gray-300">
              Code editor, sprite editor, map editor, and audio editor - all in your browser.
            </p>
          </div>
          
          <div className="card-retro p-6">
            <div className="text-retro-400 text-2xl mb-4">⚡</div>
            <h3 className="text-xl font-pixel mb-3">Instant Preview</h3>
            <p className="text-gray-300">
              See your changes in real-time with the integrated WASM engine preview.
            </p>
          </div>
          
          <div className="card-retro p-6">
            <div className="text-retro-400 text-2xl mb-4">🔒</div>
            <h3 className="text-xl font-pixel mb-3">Privacy First</h3>
            <p className="text-gray-300">
              All your projects are stored locally. No accounts, no cloud, no data collection.
            </p>
          </div>
          
          <div className="card-retro p-6">
            <div className="text-retro-400 text-2xl mb-4">🎨</div>
            <h3 className="text-xl font-pixel mb-3">Retro Aesthetic</h3>
            <p className="text-gray-300">
              480×270 resolution, 50-color palettes, and authentic pixel-perfect rendering.
            </p>
          </div>
          
          <div className="card-retro p-6">
            <div className="text-retro-400 text-2xl mb-4">🔧</div>
            <h3 className="text-xl font-pixel mb-3">Modern Tools</h3>
            <p className="text-gray-300">
              Node system, Box2D physics, and Lua scripting with a Godot-inspired API.
            </p>
          </div>
          
          <div className="card-retro p-6">
            <div className="text-retro-400 text-2xl mb-4">🌐</div>
            <h3 className="text-xl font-pixel mb-3">Cross-Platform</h3>
            <p className="text-gray-300">
              Play and create on desktop, mobile, and web. Export to multiple platforms.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-pixel text-white mb-8">Community Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-pixel text-retro-400">0</div>
              <div className="text-gray-400">Games Created</div>
            </div>
            <div>
              <div className="text-4xl font-pixel text-retro-400">0</div>
              <div className="text-gray-400">Active Developers</div>
            </div>
            <div>
              <div className="text-4xl font-pixel text-retro-400">0</div>
              <div className="text-gray-400">Games Played</div>
            </div>
            <div>
              <div className="text-4xl font-pixel text-retro-400">100%</div>
              <div className="text-gray-400">Open Source</div>
            </div>
          </div>
        </div>
      </main>

      {/* Shared footer lives in layout */}
    </div>
  )
}