"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Slide {
  id: number
  title: string
  subtitle?: string
  content: React.ReactNode
  backgroundColor?: string
  textColor?: string
}

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const slides: Slide[] = [
    {
      id: 0,
      title: 'Forge Your',
      subtitle: 'Retro Dreams',
      content: (
        <div className="text-center">
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            A modern fantasy console for creating retro-style games with creative constraints
            that encourage finished projects while offering more capability than traditional 8-bit consoles.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link 
              href="/editor" 
              className="btn-retro text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 animate-pixel-glow"
            >
              Start Creating
            </Link>
            <Link 
              href="/browser" 
              className="btn-retro-secondary text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4"
            >
              Browse Games
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: 'Privacy',
      subtitle: 'First',
      content: (
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
            Your privacy matters. No email, phone number, or personal information required.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50">
              <div className="text-2xl sm:text-3xl mb-3">🎮</div>
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-3">Play Anonymously</h3>
              <p className="text-sm sm:text-base text-gray-300">
                Browse and play games without creating an account. No registration required.
              </p>
            </div>
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50">
              <div className="text-2xl sm:text-3xl mb-3">🔐</div>
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-3">Keypair Authentication</h3>
              <p className="text-sm sm:text-base text-gray-300">
                To create and share carts, the system generates a cryptographic keypair. 
                Download and securely store your key—that's your account access.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Visual',
      subtitle: 'Foundation',
      content: (
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50">
              <div className="text-2xl sm:text-3xl mb-3">🖥️</div>
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-3">Display</h3>
              <ul className="text-sm sm:text-base text-gray-300 space-y-2">
                <li>• 480×270 (16:9)</li>
                <li>• 64-color palettes</li>
                <li>• 60 FPS rendering</li>
                <li>• Pixel-perfect scaling</li>
              </ul>
            </div>
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50">
              <div className="text-2xl sm:text-3xl mb-3">🎨</div>
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-3">Graphics</h3>
              <ul className="text-sm sm:text-base text-gray-300 space-y-2">
                <li>• 256 sprite slots</li>
                <li>• JSON-based sprites</li>
                <li>• 8-layer tilemaps</li>
                <li>• Parallax scrolling</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Development',
      subtitle: 'Experience',
      content: (
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50">
              <div className="text-2xl sm:text-3xl mb-3">💻</div>
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-3">Code</h3>
              <ul className="text-sm sm:text-base text-gray-300 space-y-2">
                <li>• Lua 5.1 scripting</li>
                <li>• 16,384 token limit</li>
                <li>• Module system</li>
                <li>• Hot reload support</li>
              </ul>
            </div>
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50">
              <div className="text-2xl sm:text-3xl mb-3">📦</div>
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-3">Assets</h3>
              <ul className="text-sm sm:text-base text-gray-300 space-y-2">
                <li>• 64 KB cart limit</li>
                <li>• Sprite editor</li>
                <li>• Map editor</li>
                <li>• Sound editor</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Game',
      subtitle: 'Systems',
      content: (
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50">
              <div className="text-2xl sm:text-3xl mb-3">⚙️</div>
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-3">Physics</h3>
              <ul className="text-sm sm:text-base text-gray-300 space-y-2">
                <li>• Box2D integration</li>
                <li>• Rigid body simulation</li>
                <li>• Collision detection</li>
                <li>• Sprite collision flags</li>
              </ul>
            </div>
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50">
              <div className="text-2xl sm:text-3xl mb-3">🔊</div>
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-3">Audio</h3>
              <ul className="text-sm sm:text-base text-gray-300 space-y-2">
                <li>• 8 audio channels</li>
                <li>• Chip-tune synthesis</li>
                <li>• 5 waveforms</li>
                <li>• Sound effects & music</li>
              </ul>
            </div>
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50">
              <div className="text-2xl sm:text-3xl mb-3">🎯</div>
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-3">State Machine</h3>
              <ul className="text-sm sm:text-base text-gray-300 space-y-2">
                <li>• Built-in state management</li>
                <li>• Lifecycle callbacks</li>
                <li>• State stacking</li>
                <li>• Shared context</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: 'Platforms &',
      subtitle: 'Multiplayer',
      content: (
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50">
              <div className="text-2xl sm:text-3xl mb-3">🌐</div>
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-3">Platforms</h3>
              <ul className="text-sm sm:text-base text-gray-300 space-y-2">
                <li>• Windows, macOS, Linux</li>
                <li>• Web (WASM)</li>
                <li>• Android</li>
                <li>• Single-file executables</li>
              </ul>
            </div>
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50">
              <div className="text-2xl sm:text-3xl mb-3">👥</div>
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-3">Multiplayer</h3>
              <ul className="text-sm sm:text-base text-gray-300 space-y-2">
                <li>• WebRTC networking</li>
                <li>• Up to 6 players</li>
                <li>• Automatic state sync</li>
                <li>• Peer-to-peer support</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      title: 'The Perfect',
      subtitle: 'Middle Ground',
      content: (
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
            If new game developers should learn fantasy consoles before jumping into Unity or Unreal, 
            then RetroForge is the perfect middle ground with professional features.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-10">
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50 text-center">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🎮</div>
              <h3 className="text-lg sm:text-xl font-pixel text-white mb-2 sm:mb-3">Fantasy Consoles</h3>
              <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">Start Here</p>
              <ul className="text-gray-300 text-xs sm:text-sm space-y-1 text-left">
                <li>• Simple constraints</li>
                <li>• Retro aesthetic</li>
                <li>• Fast prototyping</li>
              </ul>
            </div>
            <div className="card-retro p-4 sm:p-6 bg-retro-600/20 border-retro-500 text-center sm:transform sm:scale-105">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⚔️</div>
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-2 sm:mb-3">RetroForge</h3>
              <p className="text-retro-300 text-xs sm:text-sm mb-3 sm:mb-4 font-semibold">Perfect Middle Ground</p>
              <ul className="text-gray-300 text-xs sm:text-sm space-y-1 text-left">
                <li>• Module system</li>
                <li>• State machines</li>
                <li>• Built-in physics</li>
                <li>• Multiplayer ready</li>
              </ul>
            </div>
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50 text-center sm:col-span-2 lg:col-span-1">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚀</div>
              <h3 className="text-lg sm:text-xl font-pixel text-white mb-2 sm:mb-3">Unity/Unreal</h3>
              <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">End Goal</p>
              <ul className="text-gray-300 text-xs sm:text-sm space-y-1 text-left">
                <li>• Unlimited complexity</li>
                <li>• Full 3D graphics</li>
                <li>• Professional pipelines</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 7,
      title: 'Native Module Support',
      subtitle: 'Built for Structure',
      content: (
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed">
            Why are we the perfect middle ground? RetroForge natively supports and enforces 
            <span className="text-retro-400 font-semibold"> module development</span> with built-in 
            state machines, making it the ideal stepping stone to professional engines.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50">
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-3 sm:mb-4">📦 Module System</h3>
              <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4">
                Organize your code with <code className="bg-gray-900 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm">rf.import()</code> 
                for clean, maintainable projects.
              </p>
              <pre className="bg-gray-900 p-2 sm:p-3 rounded text-xs sm:text-sm text-gray-300 overflow-x-auto">
{`rf.import("menu_state.lua")
rf.import("playing_state.lua")
rf.import("game_over.lua")`}
              </pre>
            </div>
            <div className="card-retro p-4 sm:p-6 bg-gray-800/50">
              <h3 className="text-lg sm:text-xl font-pixel text-retro-400 mb-3 sm:mb-4">🎯 State Machines</h3>
              <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4">
                Built-in state management with automatic lifecycle handling—just like professional engines.
              </p>
              <pre className="bg-gray-900 p-2 sm:p-3 rounded text-xs sm:text-sm text-gray-300 overflow-x-auto">
{`function _INIT() -- Setup
function _UPDATE(dt) -- Game loop
function _DRAW() -- Rendering
function _EXIT() -- Cleanup`}
              </pre>
            </div>
          </div>
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-400 italic">
              Learn professional development patterns while staying focused on finishing games.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 8,
      title: 'Early Alpha',
      subtitle: 'Your Feedback Matters',
      content: (
        <div className="max-w-2xl mx-auto text-center px-4">
          <div className="mb-6 sm:mb-8">
            <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-600/20 border border-yellow-500 rounded mb-4 sm:mb-6">
              <span className="text-yellow-400 font-pixel text-base sm:text-lg">⚠️ ALPHA</span>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-4 sm:mb-6 leading-relaxed">
              This project is a baby. I'm sure there's stuff I forgot, and no doubt you'll find bugs.
            </p>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">
              Please report issues, bugs, and feature requests on GitHub. Your feedback helps shape RetroForge!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a
              href="https://github.com/AndrewDonelson/retroforge-webapp/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-retro text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 inline-flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="sm:w-5 sm:h-5">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Report Issues on GitHub
            </a>
            <Link 
              href="/docs/guide"
              className="btn-retro-secondary text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      ),
    },
  ]

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 8000) // 8 seconds per slide

    return () => clearInterval(interval)
  }, [isAutoPlaying, slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 30 seconds
    setTimeout(() => setIsAutoPlaying(true), 30000)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 30000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 30000)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Slide Container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{
              background: slide.backgroundColor || 'linear-gradient(to bottom right, #1f2937, #111827, #0f172a)',
            }}
          >
            <div className="h-full flex items-center justify-center px-3 sm:px-4 md:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
              <div className="max-w-6xl w-full">
                <div className={`text-center ${slide.textColor || 'text-white'}`}>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-pixel mb-3 sm:mb-4 leading-tight px-2">
                    {slide.title}
                    {slide.subtitle && (
                      <span className="block text-retro-400 mt-1 sm:mt-2">
                        {slide.subtitle}
                      </span>
                    )}
                  </h1>
                  <div className="mt-4 sm:mt-6 md:mt-8">
                    {slide.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 sm:gap-3 overflow-x-auto max-w-full px-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 sm:h-3 rounded-full transition-all duration-300 flex-shrink-0 ${
              index === currentSlide
                ? 'w-8 sm:w-12 bg-retro-400'
                : 'w-2 sm:w-3 bg-gray-600 hover:bg-gray-500'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Previous/Next Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-gray-800/70 hover:bg-gray-700/70 rounded-full transition-colors backdrop-blur-sm touch-manipulation"
        aria-label="Previous slide"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-6 sm:h-6">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-gray-800/70 hover:bg-gray-700/70 rounded-full transition-colors backdrop-blur-sm touch-manipulation"
        aria-label="Next slide"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-6 sm:h-6">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Pause/Resume Auto-play */}
      <button
        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20 p-1.5 sm:p-2 bg-gray-800/70 hover:bg-gray-700/70 rounded transition-colors backdrop-blur-sm touch-manipulation"
        aria-label={isAutoPlaying ? 'Pause slideshow' : 'Resume slideshow'}
        title={isAutoPlaying ? 'Pause slideshow' : 'Resume slideshow'}
      >
        {isAutoPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="sm:w-5 sm:h-5">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="sm:w-5 sm:h-5">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}

