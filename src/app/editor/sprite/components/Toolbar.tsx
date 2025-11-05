import React from 'react'
import type { Tool, SimpleShape } from '../types'

interface ToolbarProps {
  tool: Tool
  brushSize: number
  shapeFilled: boolean
  shapeSize: number
  selectedShape: SimpleShape
  isShapeTool: boolean
  isDrawingTool: boolean
  selection: { x0: number; y0: number; x1: number; y1: number } | null
  clipboard: { data: number[][]; width: number; height: number } | null
  width: number
  height: number
  historyIndex: number
  historyLength: number
  onSetTool: (tool: Tool) => void
  onSetBrushSize: (size: number) => void
  onSetShapeFilled: (filled: boolean) => void
  onSetShapeSize: (size: number) => void
  onShowShapeModal: () => void
  onCopy: () => void
  onPaste: (x: number, y: number) => void
  onUndo: () => void
  onRedo: () => void
  onFlipHorizontal: () => void
  onFlipVertical: () => void
  onRotateCW: () => void
  onRotateCCW: () => void
  onClear: () => void
}

export function Toolbar({
  tool,
  brushSize,
  shapeFilled,
  shapeSize,
  selectedShape,
  isShapeTool,
  isDrawingTool,
  selection,
  clipboard,
  width,
  height,
  historyIndex,
  historyLength,
  onSetTool,
  onSetBrushSize,
  onSetShapeFilled,
  onSetShapeSize,
  onShowShapeModal,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onFlipHorizontal,
  onFlipVertical,
  onRotateCW,
  onRotateCCW,
  onClear,
}: ToolbarProps) {
  return (
    <div className="editor-toolbar flex items-center gap-2 p-2 border-b border-gray-800 flex-wrap">
      <div className="flex items-center gap-1">
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            tool === 'pencil' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          onClick={() => onSetTool('pencil')}
          title="Pencil"
        >
          ✎
        </button>
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            tool === 'erase' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          onClick={() => onSetTool('erase')}
          title="Eraser"
        >
          🧹
        </button>
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            tool === 'fill' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          onClick={() => onSetTool('fill')}
          title="Fill"
        >
          🎨
        </button>
      </div>
      <div className="h-6 w-px bg-gray-700" />
      <div className="flex items-center gap-1">
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            tool === 'select' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          onClick={() => onSetTool('select')}
          title="Select"
        >
          ☐
        </button>
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            tool === 'eyedropper' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          onClick={() => onSetTool('eyedropper')}
          title="Eyedropper (Pick Color)"
        >
          🎨
        </button>
      </div>
      {tool === 'select' && selection && (
        <>
          <div className="h-6 w-px bg-gray-700" />
          <button
            className="btn-retro text-xs h-8 px-3 disabled:opacity-50"
            onClick={onCopy}
            disabled={!selection}
            title="Copy (Ctrl+C)"
          >
            Copy
          </button>
        </>
      )}
      {clipboard && (
        <>
          <div className="h-6 w-px bg-gray-700" />
          <button
            className="btn-retro text-xs h-8 px-3"
            onClick={() => {
              if (selection) {
                onPaste(selection.x0, selection.y0)
              } else {
                const centerX = Math.floor(width / 2)
                const centerY = Math.floor(height / 2)
                onPaste(centerX - Math.floor(clipboard.width / 2), centerY - Math.floor(clipboard.height / 2))
              }
            }}
            title="Paste (Ctrl+V or Shift+Click on canvas)"
          >
            Paste
          </button>
        </>
      )}
      <div className="h-6 w-px bg-gray-700" />
      <div className="flex items-center gap-1">
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            tool === 'line' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          onClick={() => onSetTool('line')}
          title="Line"
        >
          ╱
        </button>
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            tool === 'rectangle' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          onClick={() => onSetTool('rectangle')}
          title="Rectangle"
        >
          ▭
        </button>
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            tool === 'circle' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          onClick={() => onSetTool('circle')}
          title="Circle"
        >
          ○
        </button>
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            tool === 'shape' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          onClick={onShowShapeModal}
          title="Shapes"
        >
          ◆
        </button>
      </div>
      {(isShapeTool || isDrawingTool) && (
        <>
          <div className="h-6 w-px bg-gray-700" />
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={shapeFilled} onChange={(e) => onSetShapeFilled(e.target.checked)} className="w-4 h-4" />
            <span>Fill</span>
          </label>
        </>
      )}
      {isShapeTool && (
        <>
          <div className="h-6 w-px bg-gray-700" />
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Size:</span>
            <input
              type="number"
              min="1"
              max={Math.max(width, height)}
              value={shapeSize}
              onChange={(e) => onSetShapeSize(Math.max(1, Math.min(Math.max(width, height), Number(e.target.value))))}
              className="w-16 h-8 px-2 text-xs bg-gray-800 border border-gray-700 rounded text-gray-300"
            />
          </div>
        </>
      )}
      <div className="h-6 w-px bg-gray-700" />
      <select
        className="input-retro text-xs h-8 px-2 w-16 bg-gray-800 border-gray-700"
        value={brushSize}
        onChange={(e) => onSetBrushSize(Number(e.target.value))}
        title="Brush Size"
      >
        <option value={1}>1px</option>
        <option value={2}>2px</option>
        <option value={3}>3px</option>
        <option value={4}>4px</option>
      </select>
      <div className="h-6 w-px bg-gray-700" />
      <div className="flex items-center gap-1">
        <button
          className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 transition-colors"
          onClick={onUndo}
          disabled={historyIndex === 0}
          title="Undo"
        >
          ↶
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 transition-colors"
          onClick={onRedo}
          disabled={historyIndex === historyLength - 1}
          title="Redo"
        >
          ↷
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          onClick={onFlipHorizontal}
          title="Flip Horizontal"
        >
          ↔
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          onClick={onFlipVertical}
          title="Flip Vertical"
        >
          ↕
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          onClick={onRotateCW}
          title="Rotate CW"
        >
          ⟳
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          onClick={onRotateCCW}
          title="Rotate CCW"
        >
          ⟲
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded bg-red-800 hover:bg-red-700 text-gray-300 transition-colors"
          onClick={onClear}
          title="Clear"
        >
          ⊠
        </button>
      </div>
    </div>
  )
}

