import React from 'react'
import type { SpriteType } from '../types'
import { validateSpriteSize } from '../utils/spriteUtils'

interface SpriteEditorHeaderProps {
  onAddSprite: () => void
  onSave: () => Promise<void>
  hasUnsavedChanges: boolean
  selectedSpriteName: string | null
  width: number
  height: number
  isUI: boolean
  spriteType: SpriteType
  onWidthChange: (width: number) => void
  onHeightChange: (height: number) => void
  onIsUIChange: (isUI: boolean) => void
  onSpriteTypeChange: (type: SpriteType) => void
}

export function SpriteEditorHeader({
  onAddSprite,
  onSave,
  hasUnsavedChanges,
  selectedSpriteName,
  width,
  height,
  isUI,
  spriteType,
  onWidthChange,
  onHeightChange,
  onIsUIChange,
  onSpriteTypeChange,
}: SpriteEditorHeaderProps) {
  return (
    <div className="editor-toolbar flex items-center gap-2 p-2 border-b border-gray-800">
      <span className="font-pixel text-sm mr-2 text-retro-400">Sprite Editor</span>
      
      <button
        className="btn-retro text-xs h-8 px-3"
        onClick={onAddSprite}
      >
        + Add Sprite
      </button>
      
      <div className="h-6 w-px bg-gray-700" />
      <button
        className="btn-retro text-xs h-8 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onSave}
        disabled={!hasUnsavedChanges}
        title={hasUnsavedChanges ? "Save changes" : "No unsaved changes"}
      >
        💾 Save
      </button>
      {hasUnsavedChanges && (
        <span className="text-xs text-yellow-400">*</span>
      )}

      {selectedSpriteName && (
        <>
          <div className="h-6 w-px bg-gray-700" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Width:</label>
            <input
              type="number"
              min="2"
              max={isUI ? 256 : 32}
              value={width}
              onChange={(e) => {
                const newWidth = Math.max(2, Math.min(isUI ? 256 : 32, Number(e.target.value)))
                if (isUI && newWidth % 2 !== 0) {
                  onWidthChange(newWidth - (newWidth % 2))
                } else {
                  onWidthChange(newWidth)
                }
              }}
              className="input-retro text-xs h-8 px-2 w-16 bg-gray-800 border-gray-700"
            />
            <label className="text-xs text-gray-400">Height:</label>
            <input
              type="number"
              min="2"
              max={isUI ? 256 : 32}
              value={height}
              onChange={(e) => {
                const newHeight = Math.max(2, Math.min(isUI ? 256 : 32, Number(e.target.value)))
                if (isUI && newHeight % 2 !== 0) {
                  onHeightChange(newHeight - (newHeight % 2))
                } else {
                  onHeightChange(newHeight)
                }
              }}
              className="input-retro text-xs h-8 px-2 w-16 bg-gray-800 border-gray-700"
            />
          </div>
          <div className="h-6 w-px bg-gray-700" />
          <select
            className="input-retro text-xs h-8 px-2 bg-gray-800 border-gray-700"
            value={spriteType}
            onChange={(e) => onSpriteTypeChange(e.target.value as SpriteType)}
          >
            <option value="static">Static</option>
            <option value="frames">Frames</option>
            <option value="animation">Animation</option>
          </select>
          <div className="h-6 w-px bg-gray-700" />
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isUI}
              onChange={(e) => {
                const newIsUI = e.target.checked
                onIsUIChange(newIsUI)
                // Validate/adjust dimensions when switching
                if (newIsUI) {
                  if (width % 2 !== 0) onWidthChange(width - (width % 2))
                  if (height % 2 !== 0) onHeightChange(height - (height % 2))
                  if (width > 256) onWidthChange(256)
                  if (height > 256) onHeightChange(256)
                } else {
                  if (width > 32) onWidthChange(32)
                  if (height > 32) onHeightChange(32)
                }
              }}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-retro-500"
            />
            <span>UI Sprite</span>
          </label>
          {validateSpriteSize(width, height, isUI) && (
            <div className="text-xs text-red-400 ml-2">
              {validateSpriteSize(width, height, isUI)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

