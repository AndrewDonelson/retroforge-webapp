import React from 'react'
import type { SpriteData } from '../types'
import type { Palette } from '@/data/palettes'

interface SpritePreviewProps {
  sprite: SpriteData
  width: number
  height: number
  currentPalette: Palette
}

export function SpritePreview({
  sprite,
  width,
  height,
  currentPalette,
}: SpritePreviewProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-gray-400 font-semibold">Preview (1:1)</div>
      <div className="inline-block border-2 border-gray-600 shadow-lg bg-gray-900">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${width}, 1px)`,
            gridTemplateRows: `repeat(${height}, 1px)`,
            width: `${width}px`,
            height: `${height}px`,
          }}
        >
          {sprite.map((row, y) =>
            row.map((colorIndex, x) => (
              <div
                key={`preview-${x}-${y}`}
                style={{
                  width: '1px',
                  height: '1px',
                  backgroundColor: colorIndex === -1
                    ? 'transparent'
                    : currentPalette.colors[colorIndex] || '#000000',
                  backgroundImage: colorIndex === -1
                    ? 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)'
                    : 'none',
                  backgroundSize: colorIndex === -1 ? '1px 1px' : 'auto',
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

