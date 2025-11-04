import React, { useState, useRef } from 'react'
import type { Palette } from '@/data/palettes'
import type { SpriteFrame } from '@/lib/cartUtils'

interface SpriteSheetImportProps {
  spriteWidth: number
  spriteHeight: number
  currentPalette: Palette
  onImportFrames: (frames: SpriteFrame[]) => void
  onClose: () => void
}

export function SpriteSheetImport({
  spriteWidth,
  spriteHeight,
  currentPalette,
  onImportFrames,
  onClose,
}: SpriteSheetImportProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [gridWidth, setGridWidth] = useState(1)
  const [gridHeight, setGridHeight] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [spacingX, setSpacingX] = useState(0)
  const [spacingY, setSpacingY] = useState(0)
  const [namingPattern, setNamingPattern] = useState('frame_{index}')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Convert RGB color to palette index
  const findPaletteIndex = (r: number, g: number, b: number): number => {
    // Find closest color in palette
    let closestIndex = 0
    let minDistance = Infinity

    for (let i = 0; i < currentPalette.colors.length; i++) {
      const paletteColor = currentPalette.colors[i]
      // Parse hex color
      const hex = paletteColor.replace('#', '')
      const pr = parseInt(hex.substring(0, 2), 16)
      const pg = parseInt(hex.substring(2, 4), 16)
      const pb = parseInt(hex.substring(4, 6), 16)

      const distance = Math.sqrt((r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2)
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = i
      }
    }

    return closestIndex
  }

  const handleImport = async () => {
    if (!imageFile || !imagePreview) return

    setIsProcessing(true)

    try {
      const img = new Image()
      img.src = imagePreview

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const frames: SpriteFrame[] = []

      // Calculate sprite positions in the sheet
      const spriteWidthWithSpacing = spriteWidth + spacingX
      const spriteHeightWithSpacing = spriteHeight + spacingY

      for (let gridY = 0; gridY < gridHeight; gridY++) {
        for (let gridX = 0; gridX < gridWidth; gridX++) {
          const startX = offsetX + gridX * spriteWidthWithSpacing
          const startY = offsetY + gridY * spriteHeightWithSpacing

          // Check bounds
          if (startX + spriteWidth > canvas.width || startY + spriteHeight > canvas.height) {
            continue
          }

          // Extract sprite pixels
          const pixels: number[][] = []
          for (let y = 0; y < spriteHeight; y++) {
            const row: number[] = []
            for (let x = 0; x < spriteWidth; x++) {
              const pixelX = startX + x
              const pixelY = startY + y
              const index = (pixelY * canvas.width + pixelX) * 4

              const r = imageData.data[index]
              const g = imageData.data[index + 1]
              const b = imageData.data[index + 2]
              const a = imageData.data[index + 3]

              // Check for transparency (alpha < 128)
              if (a < 128) {
                row.push(-1) // Transparent
              } else {
                // Find closest palette color
                const paletteIndex = findPaletteIndex(r, g, b)
                row.push(paletteIndex)
              }
            }
            pixels.push(row)
          }

          // Generate frame name
          const frameIndex = gridY * gridWidth + gridX
          const frameName = namingPattern.replace('{index}', String(frameIndex)).replace('{x}', String(gridX)).replace('{y}', String(gridY))

          frames.push({
            name: frameName,
            pixels,
          })
        }
      }

      onImportFrames(frames)
      onClose()
    } catch (error) {
      console.error('Error importing sprite sheet:', error)
      alert('Failed to import sprite sheet. Please check the image format and try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card-retro p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Import Sprite Sheet</h3>
          <button className="text-gray-400 hover:text-gray-300 text-2xl" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">PNG Image File:</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileSelect}
              className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200"
            />
          </div>

          {imagePreview && (
            <>
              {/* Image Preview */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Preview:</label>
                <div className="border-2 border-gray-600 rounded p-2 bg-gray-900">
                  <img src={imagePreview} alt="Sprite sheet preview" className="max-w-full h-auto" />
                </div>
              </div>

              {/* Grid Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Grid Width (sprites):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={gridWidth}
                    onChange={(e) => setGridWidth(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Grid Height (sprites):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={gridHeight}
                    onChange={(e) => setGridHeight(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                  />
                </div>
              </div>

              {/* Offset Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Offset X (pixels):</label>
                  <input
                    type="number"
                    min="0"
                    value={offsetX}
                    onChange={(e) => setOffsetX(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Offset Y (pixels):</label>
                  <input
                    type="number"
                    min="0"
                    value={offsetY}
                    onChange={(e) => setOffsetY(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                  />
                </div>
              </div>

              {/* Spacing Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Spacing X (pixels):</label>
                  <input
                    type="number"
                    min="0"
                    value={spacingX}
                    onChange={(e) => setSpacingX(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Spacing Y (pixels):</label>
                  <input
                    type="number"
                    min="0"
                    value={spacingY}
                    onChange={(e) => setSpacingY(Math.max(0, Number(e.target.value)))}
                    className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                  />
                </div>
              </div>

              {/* Naming Pattern */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Frame Naming Pattern:</label>
                <input
                  type="text"
                  value={namingPattern}
                  onChange={(e) => setNamingPattern(e.target.value)}
                  className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                  placeholder="frame_{index}"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Use {'{index}'} for frame number, {'{x}'} for grid X, {'{y}'} for grid Y
                </div>
              </div>

              {/* Import Button */}
              <div className="flex gap-2 pt-2">
                <button
                  className="btn-retro flex-1"
                  onClick={handleImport}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Import ${gridWidth * gridHeight} Frame(s)`}
                </button>
                <button
                  className="btn-retro-secondary flex-1"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

