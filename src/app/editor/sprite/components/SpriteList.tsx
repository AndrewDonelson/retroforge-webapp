import React from 'react'
import type { SpriteMap } from '@/lib/cartUtils'
import type { Palette } from '@/data/palettes'
import { AnimatedSpritePreview } from './AnimatedSpritePreview'

interface SpriteListProps {
  sprites: SpriteMap
  selectedSpriteName: string | null
  editingSpriteName: string | null
  newSpriteName: string
  currentPalette: Palette
  onSelectSprite: (name: string) => void
  onRenameSprite: (name: string) => void
  onSaveRename: (oldName: string) => void
  onSetNewSpriteName: (name: string) => void
  onSetEditingSpriteName: (name: string | null) => void
  onDuplicateSprite: (name: string) => void
  onDeleteSprite: (name: string) => void
}

export function SpriteList({
  sprites,
  selectedSpriteName,
  editingSpriteName,
  newSpriteName,
  currentPalette,
  onSelectSprite,
  onRenameSprite,
  onSaveRename,
  onSetNewSpriteName,
  onSetEditingSpriteName,
  onDuplicateSprite,
  onDeleteSprite,
}: SpriteListProps) {
  const spriteNames = Object.keys(sprites)

  return (
    <div className="w-64 border-r border-gray-800 bg-gray-900 overflow-y-auto">
      <div className="p-3">
        <div className="text-sm font-semibold text-gray-200 mb-3">Sprites</div>
        {spriteNames.length === 0 ? (
          <div className="text-xs text-gray-500 mb-3">
            No sprites defined. Click "Add Sprite" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {spriteNames.map((name) => (
              <div
                key={name}
                className={`p-2 rounded border cursor-pointer transition-colors ${
                  selectedSpriteName === name
                    ? 'border-retro-500 bg-retro-500/20'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                }`}
                onClick={() => onSelectSprite(name)}
              >
                <div className="flex items-center justify-between mb-1">
                  {editingSpriteName === name ? (
                    <input
                      type="text"
                      className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-1 text-gray-200"
                      value={newSpriteName}
                      onChange={(e) => onSetNewSpriteName(e.target.value)}
                      onBlur={() => onSaveRename(name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onSaveRename(name)
                        } else if (e.key === 'Escape') {
                          onSetEditingSpriteName(null)
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
                          onRenameSprite(name)
                        }}
                        title="Double-click to rename"
                      >
                        {name}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          className="text-blue-400 hover:text-blue-300 text-sm p-1 rounded hover:bg-gray-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDuplicateSprite(name)
                          }}
                          title="Duplicate sprite"
                        >
                          ⧉
                        </button>
                        <button
                          className="text-red-400 hover:text-red-300 text-base font-bold p-1 rounded hover:bg-gray-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteSprite(name)
                          }}
                          title="Delete sprite"
                        >
                          ×
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {sprites[name] && (
                  <>
                    <div className="text-xs text-gray-500">
                      {sprites[name].width}×{sprites[name].height}
                      {sprites[name].type && ` • ${sprites[name].type}`}
                      {sprites[name].isUI === false && ' • Gameplay'}
                    </div>
                    {/* Tiny preview - animated for animation/frames types */}
                    <div className="mt-1 inline-block border border-gray-600">
                      <AnimatedSpritePreview
                        spriteData={sprites[name]}
                        width={sprites[name].width}
                        height={sprites[name].height}
                        currentPalette={currentPalette}
                        pixelSize={2}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

