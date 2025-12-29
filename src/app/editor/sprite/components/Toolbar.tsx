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
  isMovingSelection?: boolean
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
  onCut: () => void
  onMove: () => void
  onDeselect: () => void
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
  isMovingSelection = false,
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
  onCut,
  onMove,
  onDeselect,
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 4L12 14M2 14L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <rect x="3" y="3" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </button>
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            tool === 'fill' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          onClick={() => onSetTool('fill')}
          title="Fill"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 13L8 8L10 10L13 7V13H3Z" fill="currentColor"/>
            <path d="M3 13L8 8L10 10L13 7V13H3Z" stroke="currentColor" strokeWidth="1" fill="none"/>
            <path d="M8 8L6 6L11 1L13 3L8 8Z" fill="currentColor"/>
            <path d="M8 8L6 6L11 1L13 3L8 8Z" stroke="currentColor" strokeWidth="1" fill="none"/>
          </svg>
        </button>
      </div>
      <div className="h-6 w-px bg-gray-700" />
      <div className="flex items-center gap-1">
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            tool === 'eyedropper' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          onClick={() => onSetTool('eyedropper')}
          title="Eyedropper (Pick Color)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L8 8M12 4L14 2M12 4L10 6M8 8L6 6M8 8L10 10M6 6L2 10V14H6L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="2" cy="10" r="1" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <div className="h-6 w-px bg-gray-700" />
      <div className="flex items-center gap-1">
        {selection ? (
          <button
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              tool === 'select' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
            onClick={onDeselect}
            title="Deselect"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="2 2"/>
            </svg>
          </button>
        ) : (
          <button
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              tool === 'select' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
            onClick={() => onSetTool('select')}
            title="Select (Click and drag to select area)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="5" cy="5" r="1" fill="currentColor"/>
            </svg>
          </button>
        )}
        <button
          className="w-8 h-8 flex items-center justify-center rounded transition-colors bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onCopy}
          disabled={!selection}
          title="Copy (Ctrl+C)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="5" width="8" height="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M3 11V3C3 2.44772 3.44772 2 4 2H11" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded transition-colors bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onCut}
          disabled={!selection}
          title="Cut (Ctrl+X)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="5" width="8" height="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M3 11V3C3 2.44772 3.44772 2 4 2H11" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M3 3L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            isMovingSelection ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={onMove}
          disabled={!selection}
          title="Move (Click and drag selection to move)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2L6 4L8 6M8 2L10 4L8 6M8 6V10M8 10L6 12L8 14M8 10L10 12L8 14M2 8L4 6L6 8M2 8L4 10L6 8M14 8L12 6L10 8M14 8L12 10L10 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded transition-colors bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            if (selection) {
              onPaste(selection.x0, selection.y0)
            } else {
              const centerX = Math.floor(width / 2)
              const centerY = Math.floor(height / 2)
              if (clipboard) {
                onPaste(centerX - Math.floor(clipboard.width / 2), centerY - Math.floor(clipboard.height / 2))
              }
            }
          }}
          disabled={!clipboard || !selection}
          title="Paste (Ctrl+V) - Requires selection"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5H13C13.5523 5 14 5.44772 14 6V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V6C2 5.44772 2.44772 5 3 5Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M5 2H11V5H5V2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </button>
      </div>
      <div className="h-6 w-px bg-gray-700" />
      <div className="flex items-center gap-1">
        <button
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            ['line', 'circle', 'rectangle', 'shape'].includes(tool) ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
          onClick={onShowShapeModal}
          title="Shapes (Line, Circle, Rectangle, Triangle, etc.)"
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

