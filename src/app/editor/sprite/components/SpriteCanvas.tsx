import React, { useRef } from 'react'
import type { SpriteData, Selection } from '../types'
import type { Tool } from '../types'
import type { Palette } from '@/data/palettes'
import type { MountPoint } from '@/lib/cartUtils'

interface SpriteCanvasProps {
  sprite: SpriteData
  width: number
  height: number
  pixelSize: number
  tool: Tool
  currentPalette: Palette
  selection: Selection | null
  mountPoints: MountPoint[]
  pastePreview: { x: number; y: number } | null
  clipboard: { data: SpriteData; width: number; height: number } | null
  canvasRef: React.RefObject<HTMLDivElement | null>
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void
  onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void
}

export function SpriteCanvas({
  sprite,
  width,
  height,
  pixelSize,
  tool,
  currentPalette,
  selection,
  mountPoints,
  pastePreview,
  clipboard,
  canvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: SpriteCanvasProps) {
  return (
    <div className="inline-block border-2 border-gray-600 shadow-lg bg-gray-900 relative">
      <div
        ref={canvasRef}
        className={`grid select-none ${
          tool === 'select' ? 'cursor-crosshair' :
          tool === 'eyedropper' ? 'cursor-pointer' :
          'cursor-crosshair'
        }`}
        style={{
          gridTemplateColumns: `repeat(${width}, ${pixelSize}px)`,
          gridTemplateRows: `repeat(${height}, ${pixelSize}px)`,
          width: `${width * pixelSize}px`,
          height: `${height * pixelSize}px`,
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        {sprite.map((row, y) =>
          row.map((colorIndex, x) => (
            <div
              key={`${x}-${y}`}
              className="border border-gray-800 transition-opacity hover:opacity-70"
              style={{
                width: `${pixelSize}px`,
                height: `${pixelSize}px`,
                backgroundColor: colorIndex === -1
                  ? 'transparent'
                  : currentPalette.colors[colorIndex] || '#000000',
                backgroundImage: colorIndex === -1
                  ? 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)'
                  : 'none',
                backgroundSize: colorIndex === -1 ? '4px 4px' : 'auto',
                backgroundPosition: colorIndex === -1 ? '0 0, 0 2px, 2px -2px, -2px 0px' : 'auto',
              }}
            />
          ))
        )}
      </div>
      {/* Selection rectangle overlay */}
      {selection && (
        <div
          className="absolute border-2 border-retro-500 pointer-events-none bg-retro-500/10"
          style={{
            left: `${Math.min(selection.x0, selection.x1) * pixelSize}px`,
            top: `${Math.min(selection.y0, selection.y1) * pixelSize}px`,
            width: `${(Math.abs(selection.x1 - selection.x0) + 1) * pixelSize}px`,
            height: `${(Math.abs(selection.y1 - selection.y0) + 1) * pixelSize}px`,
          }}
        />
      )}
      {/* Paste preview overlay */}
      {pastePreview && clipboard && (
        <div
          className="absolute border-2 border-blue-500 pointer-events-auto bg-blue-500/20 cursor-move"
          style={{
            left: `${pastePreview.x * pixelSize}px`,
            top: `${pastePreview.y * pixelSize}px`,
            width: `${clipboard.width * pixelSize}px`,
            height: `${clipboard.height * pixelSize}px`,
            zIndex: 15,
          }}
        >
          {clipboard.data.map((row, sy) =>
            row.map((colorIndex, sx) => (
              <div
                key={`${sx}-${sy}`}
                className="absolute border border-blue-400/30"
                style={{
                  left: `${sx * pixelSize}px`,
                  top: `${sy * pixelSize}px`,
                  width: `${pixelSize}px`,
                  height: `${pixelSize}px`,
                  backgroundColor: colorIndex === -1
                    ? 'transparent'
                    : currentPalette.colors[colorIndex] || '#000000',
                  backgroundImage: colorIndex === -1
                    ? 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)'
                    : 'none',
                  backgroundSize: colorIndex === -1 ? '4px 4px' : 'auto',
                  opacity: 0.7,
                }}
              />
            ))
          )}
        </div>
      )}
      {/* Mount points overlay */}
      {mountPoints.map((mp, idx) => (
        <div
          key={idx}
          className="absolute pointer-events-none"
          style={{
            left: `${mp.x * pixelSize - 3}px`,
            top: `${mp.y * pixelSize - 3}px`,
            width: '6px',
            height: '6px',
            border: '2px solid #00ff00',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 255, 0, 0.3)',
            zIndex: 10,
          }}
          title={mp.name 
            ? `Mount Point ${idx + 1} "${mp.name}": (${mp.x}, ${mp.y})`
            : `Mount Point ${idx + 1}: (${mp.x}, ${mp.y})`}
        />
      ))}
    </div>
  )
}

