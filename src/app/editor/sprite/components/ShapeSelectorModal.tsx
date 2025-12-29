import React from 'react'
import type { SimpleShape, Tool } from '../types'

interface ShapeSelectorModalProps {
  selectedShape?: SimpleShape
  currentTool?: Tool
  shapeSize: number
  shapeFilled: boolean
  maxSize: number
  onSelectShape: (shape: SimpleShape | 'line' | 'circle' | 'rectangle') => void
  onSizeChange?: (size: number) => void
  onFilledChange?: (filled: boolean) => void
  onClose: () => void
}

export function ShapeSelectorModal({
  selectedShape,
  currentTool,
  shapeSize,
  shapeFilled,
  maxSize,
  onSelectShape,
  onSizeChange,
  onFilledChange,
  onClose,
}: ShapeSelectorModalProps) {
  const basicShapes = [
    { id: 'line' as const, name: 'Line', icon: '╱' },
    { id: 'rectangle' as const, name: 'Rectangle', icon: '▭' },
    { id: 'circle' as const, name: 'Circle', icon: '○' },
  ]
  
  const advancedShapes = [
    { id: 'triangle' as SimpleShape, name: 'Triangle', icon: '△' },
    { id: 'diamond' as SimpleShape, name: 'Diamond', icon: '◇' },
    { id: 'square' as SimpleShape, name: 'Square', icon: '▣' },
    { id: 'pentagon' as SimpleShape, name: 'Pentagon', icon: '⬟' },
    { id: 'hexagon' as SimpleShape, name: 'Hexagon', icon: '⬡' },
    { id: 'star' as SimpleShape, name: 'Star', icon: '★' },
  ]

  const isSelected = (id: string) => {
    if (id === 'line' || id === 'circle' || id === 'rectangle') {
      return currentTool === id
    }
    return selectedShape === id && currentTool === 'shape'
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card-retro p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Select Shape</h3>
          <button
            className="text-gray-400 hover:text-gray-300 text-2xl"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Basic Shapes</div>
          <div className="grid grid-cols-3 gap-3">
            {basicShapes.map((shape) => (
              <button
                key={shape.id}
                className={`p-4 border-2 rounded transition-colors ${
                  isSelected(shape.id)
                    ? 'border-retro-500 bg-retro-500/20 text-retro-500'
                    : 'border-gray-700 hover:border-gray-600 text-gray-300'
                }`}
                onClick={() => {
                  onSelectShape(shape.id)
                  onClose()
                }}
              >
                <div className="text-2xl mb-1">{shape.icon}</div>
                <div className="text-xs">{shape.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs text-gray-400 mb-2">Advanced Shapes</div>
          <div className="grid grid-cols-3 gap-3">
            {advancedShapes.map((shape) => (
              <button
                key={shape.id}
                className={`p-4 border-2 rounded transition-colors ${
                  isSelected(shape.id)
                    ? 'border-retro-500 bg-retro-500/20 text-retro-500'
                    : 'border-gray-700 hover:border-gray-600 text-gray-300'
                }`}
                onClick={() => {
                  onSelectShape(shape.id)
                }}
              >
                <div className="text-2xl mb-1">{shape.icon}</div>
                <div className="text-xs capitalize">{shape.name}</div>
              </button>
            ))}
          </div>
        </div>

        {(['line', 'circle', 'rectangle', 'shape'].includes(currentTool || '')) && (
          <div className="space-y-4">
            {onSizeChange && (
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Size (1:1, max {maxSize})
                </label>
                <input
                  type="range"
                  min="1"
                  max={maxSize}
                  value={shapeSize}
                  onChange={(e) => onSizeChange(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span className="font-semibold text-retro-500">{shapeSize}</span>
                  <span>{maxSize}</span>
                </div>
              </div>
            )}
            {onFilledChange && (
              <label className="flex items-center gap-3 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={shapeFilled}
                  onChange={(e) => onFilledChange(e.target.checked)}
                  className="w-5 h-5"
                />
                <span>Filled</span>
              </label>
            )}
          </div>
        )}
        <button
          className="w-full mt-6 btn-retro"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  )
}

