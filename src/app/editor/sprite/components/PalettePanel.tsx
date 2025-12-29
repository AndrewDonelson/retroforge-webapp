import React from 'react'
import type { Palette } from '@/data/palettes'
import { PalettePicker } from './PalettePicker'

interface PalettePanelProps {
  palette: Palette
  selectedColor: number
  onSelectColor: (color: number) => void
}

export function PalettePanel({ palette, selectedColor, onSelectColor }: PalettePanelProps) {
  // Use PalettePicker for RetroForge 48 palette (64-color system)
  const isRetroForge48 = palette.name.toLowerCase() === 'retroforge 48' || palette.name.toLowerCase() === 'retroforge48'

  if (isRetroForge48) {
    return (
      <div className="card-retro p-4 space-y-4 sticky top-4">
        <div>
          <div className="text-sm font-semibold text-gray-200 mb-1">Palette</div>
          <div className="text-xs text-gray-500">{palette.name}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1.5">Transparent</div>
          <div
            className={`w-full h-10 border-2 cursor-pointer transition-all ${
              selectedColor === -1 ? 'border-retro-500 ring-2 ring-retro-500/50' : 'border-gray-600 hover:border-gray-500'
            }`}
            style={{
              backgroundImage:
                'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
              backgroundSize: '8px 8px',
            }}
            onClick={() => onSelectColor(-1)}
          >
            <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">-1</div>
          </div>
        </div>
        <PalettePicker selectedColor={selectedColor} onColorSelect={onSelectColor} />
        <div className="pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">Selected: {selectedColor}</div>
          <div
            className="w-full h-16 border-2 border-gray-600"
            style={{
              backgroundColor: selectedColor === -1 ? 'transparent' : 
                selectedColor >= 0 && selectedColor < 64 ? getColorForIndex(selectedColor) : '#000000',
              backgroundImage:
                selectedColor === -1
                  ? 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)'
                  : 'none',
              backgroundSize: selectedColor === -1 ? '8px 8px' : 'auto',
            }}
          />
        </div>
      </div>
    )
  }

  // Legacy palette display (for non-RetroForge 48 palettes)
  return (
    <div className="card-retro p-4 space-y-4 sticky top-4">
      <div>
        <div className="text-sm font-semibold text-gray-200 mb-1">Palette</div>
        <div className="text-xs text-gray-500">{palette.name}</div>
      </div>
      <div>
        <div className="text-xs text-gray-400 mb-1.5">Transparent</div>
        <div
          className={`w-full h-10 border-2 cursor-pointer transition-all ${
            selectedColor === -1 ? 'border-retro-500 ring-2 ring-retro-500/50' : 'border-gray-600 hover:border-gray-500'
          }`}
          style={{
            backgroundImage:
              'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
            backgroundSize: '8px 8px',
          }}
          onClick={() => onSelectColor(-1)}
        >
          <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">-1</div>
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-400 mb-1.5">Colors (0-{palette.colors.length - 1})</div>
        <div className="grid grid-cols-10 gap-0.5">
          {palette.colors.map((color, idx) => (
            <div
              key={idx}
              className={`aspect-square border cursor-pointer hover:scale-110 transition-transform ${
                selectedColor === idx ? 'border-retro-500 ring-1 ring-retro-500/50 scale-110' : 'border-gray-700 hover:border-gray-600'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onSelectColor(idx)}
              title={`Index ${idx}: ${color}`}
            />
          ))}
        </div>
      </div>
      <div className="pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Selected: {selectedColor}</div>
        <div
          className="w-full h-16 border-2 border-gray-600"
          style={{
            backgroundColor: selectedColor === -1 ? 'transparent' : palette.colors[selectedColor] || '#000000',
            backgroundImage:
              selectedColor === -1
                ? 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)'
                : 'none',
            backgroundSize: selectedColor === -1 ? '8px 8px' : 'auto',
          }}
        />
      </div>
    </div>
  )
}

// Helper function to get color for 64-color system
function getColorForIndex(index: number): string {
  // Built-in colors (0-15)
  const builtinColors = [
    "#000000", "#202020", "#464646", "#6D6D6D",
    "#939393", "#BABABA", "#E0E0E0", "#FFFFFF",
    "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
    "#00FFFF", "#FF00FF", "#FFA500", "#800080",
  ]
  
  if (index >= 0 && index < 16) {
    return builtinColors[index]
  }
  
  // Game palette (16-63) - generate from RetroForge base hues
  const baseHues = [
    "#ff4d4d", "#ff914d", "#ffd84d", "#b6ff4d",
    "#4dd487", "#36d8c7", "#4dd5ff", "#66bfff",
    "#6f88ff", "#8a75ff", "#b478ff", "#ff6fb1",
    "#ff7fa0", "#a8795a", "#a0b15a", "#38bdf8",
  ]
  
  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '')
    const bigint = parseInt(h, 16)
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    }
  }
  
  function rgbToHex(r: number, g: number, b: number): string {
    const clamp = (n: number) => Math.max(0, Math.min(255, n))
    return `#${[r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('')}`
  }
  
  function shade(hex: string, amount: number): string {
    const { r, g, b } = hexToRgb(hex)
    return rgbToHex(r + amount, g + amount, b + amount)
  }
  
  if (index >= 16 && index < 64) {
    const gameIndex = index - 16
    const hueIndex = Math.floor(gameIndex / 3)
    const shadeType = gameIndex % 3
    
    if (hueIndex < baseHues.length) {
      const base = baseHues[hueIndex]
      if (shadeType === 0) return shade(base, 60)      // highlight
      if (shadeType === 1) return base                  // base
      if (shadeType === 2) return shade(base, -60)     // shadow
    }
    
    // Fallback grayscale
    const v = (gameIndex * 5) & 255
    return rgbToHex(v, v, v)
  }
  
  return "#000000"
}

