import { useState, useCallback, useEffect, useRef } from 'react'
import type { Tool, SimpleShape, SpriteData, ShapeStart, Selection } from '../types'
import type { MountPoint } from '@/lib/cartUtils'
import { createEmptySprite } from '../utils/spriteUtils'
import { drawLine, drawCircle, drawRectangle, drawTriangle, drawDiamond, drawSquare, drawPentagon, drawHexagon, drawStar, floodFill } from '../utils/drawingTools'

interface UseCanvasInteractionsProps {
  sprite: SpriteData
  width: number
  height: number
  tool: Tool
  selectedColor: number
  brushSize: number
  shapeFilled: boolean
  shapeSize: number
  selectedShape: SimpleShape
  mountPoints: MountPoint[]
  mountPointMode: boolean
  clipboard: { data: SpriteData; width: number; height: number } | null
  onSpriteChange: (sprite: SpriteData) => void
  onMountPointsChange: (mountPoints: MountPoint[]) => void
  onSelectedColorChange: (color: number) => void
  onHistorySave: (sprite: SpriteData) => void
}

export function useCanvasInteractions({
  sprite,
  width,
  height,
  tool,
  selectedColor,
  brushSize,
  shapeFilled,
  shapeSize,
  selectedShape,
  mountPoints,
  mountPointMode,
  clipboard,
  onSpriteChange,
  onMountPointsChange,
  onSelectedColorChange,
  onHistorySave,
}: UseCanvasInteractionsProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [shapeStart, setShapeStart] = useState<ShapeStart | null>(null)
  const [previewSprite, setPreviewSprite] = useState<SpriteData | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Drawing callbacks
  const drawLineCB = useCallback(
    (x0: number, y0: number, x1: number, y1: number, color: number, target: SpriteData): SpriteData => {
      return drawLine(x0, y0, x1, y1, color, target, width, height)
    },
    [width, height]
  )

  const drawCircleCB = useCallback(
    (cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
      return drawCircle(cx, cy, radius, color, filled, target, width, height)
    },
    [width, height]
  )

  const drawRectangleCB = useCallback(
    (x0: number, y0: number, x1: number, y1: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
      return drawRectangle(x0, y0, x1, y1, color, filled, target, width, height)
    },
    [width, height]
  )

  const drawTriangleCB = useCallback(
    (cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
      return drawTriangle(cx, cy, radius, color, filled, target, width, height)
    },
    [width, height]
  )

  const drawDiamondCB = useCallback(
    (cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
      return drawDiamond(cx, cy, radius, color, filled, target, width, height)
    },
    [width, height]
  )

  const drawSquareCB = useCallback(
    (cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
      return drawSquare(cx, cy, radius, color, filled, target, width, height)
    },
    [width, height]
  )

  const drawPentagonCB = useCallback(
    (cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
      return drawPentagon(cx, cy, radius, color, filled, target, width, height)
    },
    [width, height]
  )

  const drawHexagonCB = useCallback(
    (cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
      return drawHexagon(cx, cy, radius, color, filled, target, width, height)
    },
    [width, height]
  )

  const drawStarCB = useCallback(
    (cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
      return drawStar(cx, cy, radius, color, filled, target, width, height)
    },
    [width, height]
  )

  const floodFillCB = useCallback((startX: number, startY: number, targetColor: number, fillColor: number) => {
    return floodFill(startX, startY, targetColor, fillColor, sprite, width, height)
  }, [sprite, width, height])

  const drawAt = useCallback((x: number, y: number, color: number) => {
    const newSprite = sprite.map(row => [...row])
    const halfSize = Math.floor(brushSize / 2)
    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const px = x + dx
        const py = y + dy
        if (px >= 0 && px < width && py >= 0 && py < height) {
          if (brushSize === 1 || (dx * dx + dy * dy) <= (halfSize * halfSize)) {
            newSprite[py][px] = color
          }
        }
      }
    }
    return newSprite
  }, [sprite, width, height, brushSize])

  const getCoords = useCallback((e: React.MouseEvent<HTMLDivElement>): [number, number] | null => {
    if (!canvasRef.current) return null
    const rect = canvasRef.current.getBoundingClientRect()
    const pixelSize = rect.width / width
    const x = Math.floor((e.clientX - rect.left) / pixelSize)
    const y = Math.floor((e.clientY - rect.top) / pixelSize)
    if (x >= 0 && x < width && y >= 0 && y < height) {
      return [x, y]
    }
    return null
  }, [width, height])

  const drawShape = useCallback((start: ShapeStart, end: [number, number], tool: Tool, color: number, filled: boolean): SpriteData => {
    const base = sprite.map(row => [...row])
    switch (tool) {
      case 'line':
        return drawLineCB(start.x, start.y, end[0], end[1], color, base)
      case 'rectangle':
        return drawRectangleCB(start.x, start.y, end[0], end[1], color, filled, base)
      case 'circle': {
        const radius = Math.round(Math.sqrt((end[0] - start.x) ** 2 + (end[1] - start.y) ** 2))
        return drawCircleCB(start.x, start.y, radius, color, filled, base)
      }
      case 'shape': {
        const radius = shapeSize
        switch (selectedShape) {
          case 'triangle':
            return drawTriangleCB(start.x, start.y, radius, color, filled, base)
          case 'diamond':
            return drawDiamondCB(start.x, start.y, radius, color, filled, base)
          case 'square':
            return drawSquareCB(start.x, start.y, radius, color, filled, base)
          case 'pentagon':
            return drawPentagonCB(start.x, start.y, radius, color, filled, base)
          case 'hexagon':
            return drawHexagonCB(start.x, start.y, radius, color, filled, base)
          case 'star':
            return drawStarCB(start.x, start.y, radius, color, filled, base)
          default:
            return base
        }
      }
      default:
        return base
    }
  }, [sprite, shapeSize, selectedShape, drawLineCB, drawCircleCB, drawRectangleCB, drawTriangleCB, drawDiamondCB, drawSquareCB, drawPentagonCB, drawHexagonCB, drawStarCB])

  const handlePaste = useCallback((x: number, y: number) => {
    if (!clipboard) return
    const newSprite = sprite.map(row => [...row])
    for (let sy = 0; sy < clipboard.height; sy++) {
      for (let sx = 0; sx < clipboard.width; sx++) {
        const px = x + sx
        const py = y + sy
        if (px >= 0 && px < width && py >= 0 && py < height) {
          newSprite[py][px] = clipboard.data[sy][sx]
        }
      }
    }
    onSpriteChange(newSprite)
    onHistorySave(newSprite)
    setSelection(null)
  }, [clipboard, sprite, width, height, onSpriteChange, onHistorySave])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const coords = getCoords(e)
    if (!coords) return
    const [x, y] = coords
    
    // Mount point placement mode
    if (mountPointMode || (e.shiftKey && e.ctrlKey)) {
      const newPoint: MountPoint = { x, y, name: undefined }
      const existingIndex = mountPoints.findIndex(mp => Math.abs(mp.x - x) < 1 && Math.abs(mp.y - y) < 1)
      if (existingIndex >= 0) {
        onMountPointsChange(mountPoints.filter((_, i) => i !== existingIndex))
      } else {
        const defaultName = `mount_${mountPoints.length + 1}`
        onMountPointsChange([...mountPoints, { ...newPoint, name: defaultName }])
      }
      return
    }
    
    // Handle paste on click
    if (clipboard && e.shiftKey && !e.ctrlKey) {
      handlePaste(x - Math.floor(clipboard.width / 2), y - Math.floor(clipboard.height / 2))
      return
    }
    
    if (tool === 'eyedropper') {
      const colorIndex = sprite[y][x]
      onSelectedColorChange(colorIndex)
      return
    }
    
    if (tool === 'select') {
      setIsSelecting(true)
      setSelection({ x0: x, y0: y, x1: x, y1: y })
      return
    }
    
    const color = tool === 'erase' ? -1 : selectedColor
    if (tool === 'fill') {
      const targetColor = sprite[y][x]
      const newSprite = floodFillCB(x, y, targetColor, color)
      onSpriteChange(newSprite)
      onHistorySave(newSprite)
    } else if (tool === 'pencil' || tool === 'erase') {
      setIsDrawing(true)
      const newSprite = drawAt(x, y, color)
      onSpriteChange(newSprite)
    } else if (['line', 'circle', 'rectangle', 'shape'].includes(tool)) {
      setIsDrawing(true)
      setShapeStart({ x, y })
      setPreviewSprite(sprite)
    }
  }, [tool, selectedColor, sprite, getCoords, drawAt, floodFillCB, onSpriteChange, onHistorySave, mountPointMode, mountPoints, onMountPointsChange, clipboard, handlePaste, onSelectedColorChange])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getCoords(e)
    if (!coords) return
    
    if (tool === 'select' && isSelecting && selection) {
      setSelection({ ...selection, x1: coords[0], y1: coords[1] })
      return
    }
    
    if (!isDrawing) return
    
    if (tool === 'pencil' || tool === 'erase') {
      const [x, y] = coords
      const color = tool === 'erase' ? -1 : selectedColor
      const newSprite = drawAt(x, y, color)
      onSpriteChange(newSprite)
    } else if (shapeStart && ['line', 'circle', 'rectangle', 'shape'].includes(tool)) {
      const color = selectedColor
      const newSprite = drawShape(shapeStart, coords, tool, color, shapeFilled)
      setPreviewSprite(newSprite)
    }
  }, [isDrawing, tool, selectedColor, shapeStart, shapeFilled, sprite, getCoords, drawAt, drawShape, isSelecting, selection])

  const handleCanvasMouseUp = useCallback(() => {
    if (tool === 'select' && isSelecting && selection) {
      setIsSelecting(false)
      const minX = Math.max(0, Math.min(selection.x0, selection.x1))
      const maxX = Math.min(width - 1, Math.max(selection.x0, selection.x1))
      const minY = Math.max(0, Math.min(selection.y0, selection.y1))
      const maxY = Math.min(height - 1, Math.max(selection.y0, selection.y1))
      setSelection({ x0: minX, y0: minY, x1: maxX, y1: maxY })
      return
    }
    
    if (isDrawing && shapeStart && ['line', 'circle', 'rectangle', 'shape'].includes(tool)) {
      if (previewSprite) {
        onSpriteChange(previewSprite)
        onHistorySave(previewSprite)
      }
      setPreviewSprite(null)
      setShapeStart(null)
    } else if (isDrawing && (tool === 'pencil' || tool === 'erase')) {
      onHistorySave(sprite)
    }
    setIsDrawing(false)
  }, [isDrawing, tool, shapeStart, previewSprite, sprite, onSpriteChange, onHistorySave, isSelecting, selection, width, height])

  const handleCopy = useCallback(() => {
    if (!selection) return
    const { x0, y0, x1, y1 } = selection
    const minX = Math.min(x0, x1)
    const maxX = Math.max(x0, x1)
    const minY = Math.min(y0, y1)
    const maxY = Math.max(y0, y1)
    const copiedWidth = maxX - minX + 1
    const copiedHeight = maxY - minY + 1
    const copied: SpriteData = []
    for (let y = minY; y <= maxY; y++) {
      const row: number[] = []
      for (let x = minX; x <= maxX; x++) {
        row.push(sprite[y][x])
      }
      copied.push(row)
    }
    return { data: copied, width: copiedWidth, height: copiedHeight }
  }, [selection, sprite])

  const displaySprite = previewSprite || sprite

  return {
    canvasRef,
    selection,
    displaySprite,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleCopy,
    handlePaste,
  }
}

