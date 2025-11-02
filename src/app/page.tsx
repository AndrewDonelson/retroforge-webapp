"use client"

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { HeroSlider } from '@/components/landing/HeroSlider'

export default function HomePage() {
  // Fetch community statistics (optional, won't break if fails)
  const stats = useQuery(api.stats.getStats) ?? {
    games_created: 0,
    active_devs: 0,
    games_played: 0,
    total_lobbies: 0,
    total_matches: 0,
    last_updated: Date.now(),
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Fullscreen Hero Slider */}
      <HeroSlider />

      {/* Stats Section - Below the slider */}
      <section className="py-16 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-pixel text-white mb-8 text-center">Community Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-pixel text-retro-400">{stats.games_created.toLocaleString()}</div>
              <div className="text-gray-400 mt-2">Games Created</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-pixel text-retro-400">{stats.active_devs.toLocaleString()}</div>
              <div className="text-gray-400 mt-2">Active Developers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-pixel text-retro-400">{stats.games_played.toLocaleString()}</div>
              <div className="text-gray-400 mt-2">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-pixel text-retro-400">100%</div>
              <div className="text-gray-400 mt-2">Open Source</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <a
              href="/docs/guide"
              className="card-retro p-6 hover:border-retro-500 transition-all hover:scale-105 group text-center"
            >
              <div className="text-retro-400 text-4xl mb-4">📖</div>
              <h3 className="text-xl font-pixel text-white mb-2 group-hover:text-retro-400 transition-colors">
                Developer Guide
              </h3>
              <p className="text-gray-300 text-sm">
                Complete guide: what, how, and why. Learn to build RetroForge carts.
              </p>
            </a>
            
            <a
              href="/docs/api-reference"
              className="card-retro p-6 hover:border-retro-500 transition-all hover:scale-105 group text-center"
            >
              <div className="text-retro-400 text-4xl mb-4">📚</div>
              <h3 className="text-xl font-pixel text-white mb-2 group-hover:text-retro-400 transition-colors">
                API Reference
              </h3>
              <p className="text-gray-300 text-sm">
                Complete documentation for all RetroForge Engine Lua functions and APIs
              </p>
            </a>
            
            <a
              href="/docs/comparison"
              className="card-retro p-6 hover:border-retro-500 transition-all hover:scale-105 group text-center"
            >
              <div className="text-retro-400 text-4xl mb-4">⚖️</div>
              <h3 className="text-xl font-pixel text-white mb-2 group-hover:text-retro-400 transition-colors">
                PICO-8 Comparison
              </h3>
              <p className="text-gray-300 text-sm">
                Feature-by-feature comparison between PICO-8 and RetroForge Engine
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* Engine GitHub CTA */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <a
            href="https://github.com/AndrewDonelson/retroforge-engine"
            target="_blank"
            rel="noopener noreferrer"
            className="block card-retro p-6 hover:border-retro-500 transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-2">Open Source Engine</div>
                <div className="text-2xl font-pixel text-retro-400">retroforge-engine on GitHub</div>
                <div className="text-sm text-gray-400 mt-2">View source code, contribute, or report issues</div>
              </div>
              <span className="text-retro-400 text-2xl">↗</span>
            </div>
          </a>
        </div>
      </section>
    </div>
  )
}
