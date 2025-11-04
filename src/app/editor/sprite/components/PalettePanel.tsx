import React from 'react'
import type { Palette } from '@/data/palettes'

interface PalettePanelProps {
  palette: Palette
  selectedColor: number
  onSelectColor: (color: number) => void
}

export function PalettePanel({ palette, selectedColor, onSelectColor }: PalettePanelProps) {
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
        <div className="text-xs text-gray-400 mb-1.5">Colors (0-49)</div>
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

