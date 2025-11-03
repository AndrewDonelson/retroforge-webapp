"use client"

import { useEffect, useMemo, useState } from 'react'
import { PRESET_50, type Palette } from '@/data/palettes'
import { useEditor } from '@/contexts/EditorContext'

// 50-color presets (from design doc and generative sets)
const PRESETS: Palette[] = PRESET_50

export default function PalettePage() {
  const { cart, isLoading, updateManifest } = useEditor()
  const [active, setActive] = useState<Palette>(PRESETS[0])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  // Try to match cart's palette if specified
  useEffect(() => {
    if (cart?.manifest?.palette) {
      const matched = PRESETS.find(p => p.name.toLowerCase() === cart.manifest.palette?.toLowerCase())
      if (matched) {
        setActive(matched)
      } else {
        // If palette not found in presets, default to first preset
        setActive(PRESETS[0])
      }
    } else {
      // No palette set in manifest, default to first preset
      setActive(PRESETS[0])
    }
  }, [cart])
  const [custom, setCustom] = useState<string>('')
  const parsedCustom = useMemo(() =>
    custom
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => /^#?[0-9a-fA-F]{6}$/.test(s))
      .map((s) => (s.startsWith('#') ? s : `#${s}`)),
    [custom]
  )

  const copyToClipboard = async (index: number) => {
    try {
      await navigator.clipboard.writeText(index.toString())
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getRelativeLuminance = (hex: string): number => {
    const rgb = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    if (!rgb) return 0
    const r = parseInt(rgb[1], 16) / 255
    const g = parseInt(rgb[2], 16) / 255
    const b = parseInt(rgb[3], 16) / 255
    const [rs, gs, bs] = [r, g, b].map(v => 
      v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    )
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const getTextColor = (bgColor: string): string => {
    return getRelativeLuminance(bgColor) > 0.5 ? '#000000' : '#ffffff'
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-pixel text-retro-400">Palette</h1>
        <p className="text-gray-400">Loading cart...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-pixel text-retro-400">Palette</h1>
      {cart && (
        <p className="text-xs text-gray-500">
          Current: {cart.manifest.palette || 'Not set (default)'}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-retro p-3">
          <div className="text-sm text-gray-300 mb-2">Predefined</div>
          <div className="flex items-center gap-2">
            <select
              className="input-retro"
              value={active.name}
              onChange={(e) => {
                const p = PRESETS.find((x) => x.name === e.target.value)
                if (p) {
                  setActive(p)
                  if (cart) {
                    updateManifest({ palette: p.name })
                  }
                }
              }}
            >
              {PRESETS.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            <button
              className="btn-retro"
              onClick={() => {
                setActive(PRESETS[0])
                if (cart) {
                  updateManifest({ palette: PRESETS[0].name })
                }
              }}
            >
              Reset to RetroForge 50
            </button>
          </div>
          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-2">{active.colors.length} colors</div>
            <div className="flex flex-wrap gap-x-1 gap-y-2">
              {/* Transparent (index -1) */}
              <div 
                className="relative w-8 h-8 border-2 border-gray-700 cursor-pointer transition-transform hover:scale-110 hover:z-10"
                onClick={() => copyToClipboard(-1)}
                onMouseEnter={() => setHoverIndex(-1)}
                onMouseLeave={() => setHoverIndex(null)}
                title="Index: -1\nTransparent (default)\nClick to copy index"
              >
                {/* Checkerboard pattern for transparency */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#808080_25%,transparent_25%,transparent_75%,#808080_75%),linear-gradient(45deg,#808080_25%,transparent_25%,transparent_75%,#808080_75%)] bg-[length:8px_8px] bg-[0_0,4px_4px]" />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-white">-1</div>
                {hoverIndex === -1 && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                    Index: -1<br />Transparent (default)
                  </div>
                )}
                {copiedIndex === -1 && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                    ✓ Copied!
                  </div>
                )}
              </div>
              
              {/* Black (index 0) */}
              <div className="relative w-8 h-8 border-2 border-gray-700 cursor-pointer transition-transform hover:scale-110 hover:z-10"
                style={{ backgroundColor: active.colors[0] }}
                onClick={() => copyToClipboard(0)}
                onMouseEnter={() => setHoverIndex(0)}
                onMouseLeave={() => setHoverIndex(null)}
                title={`Index: 0\nColor: ${active.colors[0]}\nClick to copy index`}
              >
                <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold" style={{ color: getTextColor(active.colors[0]) }}>0</div>
                {hoverIndex === 0 && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                    Index: 0<br />Color: {active.colors[0]}
                  </div>
                )}
                {copiedIndex === 0 && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                    ✓ Copied!
                  </div>
                )}
              </div>
              
              {/* White (index 1) */}
              <div className="relative w-8 h-8 border-2 border-gray-700 cursor-pointer transition-transform hover:scale-110 hover:z-10"
                style={{ backgroundColor: active.colors[1] }}
                onClick={() => copyToClipboard(1)}
                onMouseEnter={() => setHoverIndex(1)}
                onMouseLeave={() => setHoverIndex(null)}
                title={`Index: 1\nColor: ${active.colors[1]}\nClick to copy index`}
              >
                <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold" style={{ color: getTextColor(active.colors[1]) }}>1</div>
                {hoverIndex === 1 && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                    Index: 1<br />Color: {active.colors[1]}
                  </div>
                )}
                {copiedIndex === 1 && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                    ✓ Copied!
                  </div>
                )}
              </div>

              {/* Color sets (indices 2-49, groups of 3: shadow, base, highlight) */}
              {Array.from({ length: 16 }, (_, setIndex) => {
                const baseIndex = 2 + (setIndex * 3)
                return (
                  <div key={setIndex} className="inline-flex border-2 border-blue-500 rounded-sm p-0.5 gap-0.5">
                    {[0, 1, 2].map((offset) => {
                      const i = baseIndex + offset
                      if (i >= active.colors.length) return null
                      return (
                        <div
                          key={i}
                          className="relative w-8 h-8 border border-gray-600 cursor-pointer transition-transform hover:scale-110 hover:z-10"
                          style={{ backgroundColor: active.colors[i] }}
                          onClick={() => copyToClipboard(i)}
                          onMouseEnter={() => setHoverIndex(i)}
                          onMouseLeave={() => setHoverIndex(null)}
                          title={`Index: ${i}\nColor: ${active.colors[i]}\nClick to copy index`}
                        >
                          <div
                            className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold"
                            style={{ color: getTextColor(active.colors[i]) }}
                          >
                            {i}
                          </div>
                          {hoverIndex === i && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                              Index: {i}<br />Color: {active.colors[i]}
                            </div>
                          )}
                          {copiedIndex === i && (
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                              ✓ Copied!
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card-retro p-3">
          <div className="text-sm text-gray-300 mb-2">Custom</div>
          <p className="text-xs text-gray-400 mb-2">Enter hex colors separated by spaces or commas.</p>
          <textarea
            className="input-retro w-full h-24"
            placeholder="#000000 #ffffff #ff0000 ..."
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          {parsedCustom.length > 0 && (
            <div className="flex flex-wrap gap-x-1 gap-y-2 mt-3">
              {/* Transparent (index -1) */}
              <div 
                className="relative w-8 h-8 border-2 border-gray-700 cursor-pointer transition-transform hover:scale-110 hover:z-10"
                onClick={() => copyToClipboard(-1)}
                onMouseEnter={() => setHoverIndex(999)}
                onMouseLeave={() => setHoverIndex(null)}
                title="Index: -1\nTransparent (default)\nClick to copy index"
              >
                {/* Checkerboard pattern for transparency */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#808080_25%,transparent_25%,transparent_75%,#808080_75%),linear-gradient(45deg,#808080_25%,transparent_25%,transparent_75%,#808080_75%)] bg-[length:8px_8px] bg-[0_0,4px_4px]" />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-white">-1</div>
                {hoverIndex === 999 && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                    Index: -1<br />Transparent (default)
                  </div>
                )}
                {copiedIndex === -1 && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                    ✓ Copied!
                  </div>
                )}
              </div>
              
              {/* Black (index 0) if present */}
              {parsedCustom[0] && (
                <div className="relative w-8 h-8 border-2 border-gray-700 cursor-pointer transition-transform hover:scale-110 hover:z-10"
                  style={{ backgroundColor: parsedCustom[0] }}
                  onClick={() => copyToClipboard(0)}
                  onMouseEnter={() => setHoverIndex(1000)}
                  onMouseLeave={() => setHoverIndex(null)}
                  title={`Index: 0\nColor: ${parsedCustom[0]}\nClick to copy index`}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold" style={{ color: getTextColor(parsedCustom[0]) }}>0</div>
                  {hoverIndex === 1000 && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                      Index: 0<br />Color: {parsedCustom[0]}
                    </div>
                  )}
                  {copiedIndex === 0 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                      ✓ Copied!
                    </div>
                  )}
                </div>
              )}
              
              {/* White (index 1) if present */}
              {parsedCustom[1] && (
                <div className="relative w-8 h-8 border-2 border-gray-700 cursor-pointer transition-transform hover:scale-110 hover:z-10"
                  style={{ backgroundColor: parsedCustom[1] }}
                  onClick={() => copyToClipboard(1)}
                  onMouseEnter={() => setHoverIndex(1001)}
                  onMouseLeave={() => setHoverIndex(null)}
                  title={`Index: 1\nColor: ${parsedCustom[1]}\nClick to copy index`}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold" style={{ color: getTextColor(parsedCustom[1]) }}>1</div>
                  {hoverIndex === 1001 && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                      Index: 1<br />Color: {parsedCustom[1]}
                    </div>
                  )}
                  {copiedIndex === 1 && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                      ✓ Copied!
                    </div>
                  )}
                </div>
              )}

              {/* Color sets (indices 2+, groups of 3) */}
              {Array.from({ length: Math.ceil((parsedCustom.length - 2) / 3) }, (_, setIndex) => {
                const baseIndex = 2 + (setIndex * 3)
                const colorsInSet = Math.min(3, parsedCustom.length - baseIndex)
                if (colorsInSet <= 0) return null
                
                return (
                  <div key={setIndex} className="inline-flex border-2 border-blue-500 rounded-sm p-0.5 gap-0.5">
                    {Array.from({ length: colorsInSet }, (_, offset) => {
                      const i = baseIndex + offset
                      if (i >= parsedCustom.length) return null
                      return (
                        <div
                          key={i}
                          className="relative w-8 h-8 border border-gray-600 cursor-pointer transition-transform hover:scale-110 hover:z-10"
                          style={{ backgroundColor: parsedCustom[i] }}
                          onClick={() => copyToClipboard(i)}
                          onMouseEnter={() => setHoverIndex(i + 1000)}
                          onMouseLeave={() => setHoverIndex(null)}
                          title={`Index: ${i}\nColor: ${parsedCustom[i]}\nClick to copy index`}
                        >
                          <div
                            className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold"
                            style={{ color: getTextColor(parsedCustom[i]) }}
                          >
                            {i}
                          </div>
                          {hoverIndex === i + 1000 && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                              Index: {i}<br />Color: {parsedCustom[i]}
                            </div>
                          )}
                          {copiedIndex === i && (
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                              ✓ Copied!
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-2">Tip: RetroForge expects exactly 50 colors (black, white, 16×3).</div>
        </div>
      </div>
    </div>
  )
}


