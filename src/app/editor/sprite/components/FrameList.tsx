import React, { useState } from 'react'
import type { SpriteFrame } from '@/lib/cartUtils'
import type { Palette } from '@/data/palettes'

interface FrameListProps {
  frames: SpriteFrame[]
  currentFrameName: string | null
  spriteWidth: number
  spriteHeight: number
  currentPalette: Palette
  onSelectFrame: (frameName: string) => void
  onAddFrame: () => void
  onDeleteFrame: (frameName: string) => void
  onDuplicateFrame: (frameName: string) => void
  onRenameFrame: (oldName: string, newName: string) => void
  onImportSpriteSheet?: () => void
}

export function FrameList({
  frames,
  currentFrameName,
  spriteWidth,
  spriteHeight,
  currentPalette,
  onSelectFrame,
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  onRenameFrame,
  onImportSpriteSheet,
}: FrameListProps) {
  const [editingFrameName, setEditingFrameName] = React.useState<string | null>(null)
  const [newFrameName, setNewFrameName] = React.useState('')

  const handleStartRename = (frameName: string) => {
    setEditingFrameName(frameName)
    setNewFrameName(frameName)
  }

  const handleSaveRename = (oldName: string) => {
    if (newFrameName.trim() && newFrameName !== oldName) {
      // Validate frame name: alphanumeric, underscore, hyphen; starts with letter/underscore
      const validName = /^[a-zA-Z_][a-zA-Z0-9_-]*$/
      if (validName.test(newFrameName.trim())) {
        onRenameFrame(oldName, newFrameName.trim())
      } else {
        alert('Invalid frame name. Must start with a letter or underscore and contain only alphanumeric characters, underscores, and hyphens.')
        setNewFrameName(oldName)
      }
    } else {
      setNewFrameName(oldName)
    }
    setEditingFrameName(null)
  }

  return (
    <div className="card-retro p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-200">Frames</div>
        <div className="flex gap-2">
          {onImportSpriteSheet && (
            <button
              className="btn-retro-secondary text-xs h-7 px-2"
              onClick={onImportSpriteSheet}
              title="Import from sprite sheet"
            >
              📥 Import
            </button>
          )}
          <button
            className="btn-retro text-xs h-7 px-2"
            onClick={onAddFrame}
            title="Add new frame"
          >
            + Add Frame
          </button>
        </div>
      </div>
      {frames.length === 0 ? (
        <div className="text-xs text-gray-500 text-center py-4">
          No frames defined. Click "Add Frame" to create one.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {frames.map((frame) => {
            const pixels = frame.pixels || []
            const isSelected = currentFrameName === frame.name
            return (
              <div
                key={frame.name}
                className={`p-2 rounded border cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-retro-500 bg-retro-500/20'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                }`}
                onClick={() => onSelectFrame(frame.name)}
              >
                <div className="flex items-center justify-between mb-1">
                  {editingFrameName === frame.name ? (
                    <input
                      type="text"
                      className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-1 text-gray-200"
                      value={newFrameName}
                      onChange={(e) => setNewFrameName(e.target.value)}
                      onBlur={() => handleSaveRename(frame.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveRename(frame.name)
                        } else if (e.key === 'Escape') {
                          setEditingFrameName(null)
                          setNewFrameName(frame.name)
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <>
                      <div
                        className="text-xs font-semibold text-gray-200 truncate flex-1 cursor-text"
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          handleStartRename(frame.name)
                        }}
                        title="Double-click to rename"
                      >
                        {frame.name}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          className="text-blue-400 hover:text-blue-300 text-sm p-1 rounded hover:bg-gray-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDuplicateFrame(frame.name)
                          }}
                          title="Duplicate frame"
                        >
                          ⧉
                        </button>
                        <button
                          className="text-red-400 hover:text-red-300 text-base font-bold p-1 rounded hover:bg-gray-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`Delete frame "${frame.name}"?`)) {
                              onDeleteFrame(frame.name)
                            }
                          }}
                          title="Delete frame"
                        >
                          ×
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {frame.duration !== undefined && (
                  <div className="text-xs text-gray-500 mb-1">
                    Duration: {frame.duration}ms
                  </div>
                )}
                {/* Frame preview */}
                <div className="mt-1 inline-block border border-gray-600">
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${spriteWidth}, 2px)`,
                      gridTemplateRows: `repeat(${spriteHeight}, 2px)`,
                      width: `${spriteWidth * 2}px`,
                      height: `${spriteHeight * 2}px`,
                    }}
                  >
                    {pixels.flatMap((row: number[], y: number) =>
                      row.map((colorIndex: number, x: number) => (
                        <div
                          key={`${x}-${y}`}
                          style={{
                            width: '2px',
                            height: '2px',
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
          })}
        </div>
      )}
    </div>
  )
}

