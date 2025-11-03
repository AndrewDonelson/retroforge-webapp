"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { PRESET_50, type Palette } from '@/data/palettes'
import { useEditor } from '@/contexts/EditorContext'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/contexts/AuthContext'
import type { SpriteMap, MountPoint } from '@/lib/cartUtils'

type SpriteSize = 8 | 16 | 24 | 32
type Tool = 'pencil' | 'erase' | 'fill' | 'line' | 'circle' | 'rectangle' | 'shape' | 'select' | 'eyedropper'
type SimpleShape = 'triangle' | 'diamond' | 'square' | 'pentagon' | 'hexagon' | 'star'
type SpriteData = number[][]

interface ShapeStart {
  x: number
  y: number
}

interface Selection {
  x0: number
  y0: number
  x1: number
  y1: number
}

export default function SpriteEditorPage() {
  const { cart, cartId, isLoading: cartLoading, updateSprites } = useEditor()
  const { user } = useAuth()
  const saveFile = useMutation(api.cartFiles.saveCartFile)
  
  const [sprites, setSprites] = useState<SpriteMap>({})
  const [selectedSpriteName, setSelectedSpriteName] = useState<string | null>(null)
  const [editingSpriteName, setEditingSpriteName] = useState<string | null>(null)
  const [newSpriteName, setNewSpriteName] = useState('')
  const [size, setSize] = useState<SpriteSize>(16)
  const [sprite, setSprite] = useState<SpriteData>(() => createEmptySprite(16))
  const [selectedColor, setSelectedColor] = useState<number>(2)
  const [tool, setTool] = useState<Tool>('pencil')
  const [brushSize, setBrushSize] = useState(1)
  const [shapeFilled, setShapeFilled] = useState(false)
  const [shapeSize, setShapeSize] = useState(4)
  const [selectedShape, setSelectedShape] = useState<SimpleShape>('triangle')
  const [showShapeModal, setShowShapeModal] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [shapeStart, setShapeStart] = useState<ShapeStart | null>(null)
  const [previewSprite, setPreviewSprite] = useState<SpriteData | null>(null)
  const [history, setHistory] = useState<SpriteData[]>([createEmptySprite(16)])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [clipboard, setClipboard] = useState<{ data: SpriteData; width: number; height: number } | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [useCollision, setUseCollision] = useState(false)
  const [mountPoints, setMountPoints] = useState<MountPoint[]>([])
  const [mountPointMode, setMountPointMode] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Load sprites from cart
  useEffect(() => {
    if (cart?.sprites && Object.keys(cart.sprites).length > 0) {
      setSprites(cart.sprites)
    } else {
      setSprites({})
    }
  }, [cart?.sprites])

  // Save sprites to cartFiles when they change
  useEffect(() => {
    if (!cartId || !user || (Object.keys(sprites).length === 0 && !cart?.sprites)) return
    
    const timeoutId = setTimeout(async () => {
      try {
        await saveFile({
          cartId,
          path: 'assets/sprites.json',
          content: JSON.stringify(sprites, null, 2),
          ownerId: user?.userId,
        })
      } catch (error) {
        console.error('Failed to save sprites.json:', error)
      }
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [sprites, cartId, user, saveFile, cart?.sprites])

  // Load selected sprite into editor
  useEffect(() => {
    if (selectedSpriteName && sprites[selectedSpriteName]) {
      const spriteData = sprites[selectedSpriteName]
      setSize(spriteData.width as SpriteSize)
      setSprite(spriteData.pixels)
      setHistory([spriteData.pixels])
      setHistoryIndex(0)
      setPreviewSprite(null)
      setUseCollision(spriteData.useCollision || false)
      setMountPoints(spriteData.mountPoints || [])
    }
  }, [selectedSpriteName, sprites])

  // Save current sprite to sprites map
  const saveCurrentSprite = useCallback(() => {
    if (!selectedSpriteName) return
    const newSprites: SpriteMap = {
      ...sprites,
      [selectedSpriteName]: {
        width: size,
        height: size,
        pixels: sprite,
        useCollision,
        mountPoints: mountPoints.length > 0 ? mountPoints : undefined,
      }
    }
    setSprites(newSprites)
    updateSprites(newSprites)
  }, [selectedSpriteName, sprites, size, sprite, useCollision, mountPoints, updateSprites])

  // Auto-save current sprite when it changes (debounced)
  useEffect(() => {
    if (!selectedSpriteName) return
    const timeoutId = setTimeout(() => {
      saveCurrentSprite()
    }, 1000)
    return () => clearTimeout(timeoutId)
  }, [sprite, size, selectedSpriteName, useCollision, mountPoints, saveCurrentSprite])

  const currentPalette = useMemo(() => {
    if (!cart?.manifest?.palette) return PRESET_50[0]
    const matched = PRESET_50.find(p => p.name.toLowerCase() === cart.manifest.palette?.toLowerCase())
    return matched || PRESET_50[0]
  }, [cart])

  const handleAddSprite = () => {
    const name = `sprite_${Date.now()}`
    const newSprites: SpriteMap = {
      ...sprites,
      [name]: {
        width: 16,
        height: 16,
        pixels: createEmptySprite(16),
        useCollision: false,
        mountPoints: [],
      }
    }
    setSprites(newSprites)
    updateSprites(newSprites)
    setSelectedSpriteName(name)
    setSize(16)
    setSprite(createEmptySprite(16))
    setHistory([createEmptySprite(16)])
    setHistoryIndex(0)
    setUseCollision(false)
    setMountPoints([])
  }

  const handleDeleteSprite = (name: string) => {
    if (!confirm(`Delete sprite "${name}"?`)) return
    const newSprites = { ...sprites }
    delete newSprites[name]
    setSprites(newSprites)
    updateSprites(newSprites)
    if (selectedSpriteName === name) {
      setSelectedSpriteName(null)
      setSprite(createEmptySprite(16))
    }
  }

  const handleDuplicateSprite = (name: string) => {
    const spriteData = sprites[name]
    const newName = `${name}_copy_${Date.now()}`
    const newSprites: SpriteMap = {
      ...sprites,
      [newName]: {
        width: spriteData.width,
        height: spriteData.height,
        pixels: spriteData.pixels.map(row => [...row]),
        useCollision: spriteData.useCollision || false,
        mountPoints: spriteData.mountPoints ? [...spriteData.mountPoints] : [],
      }
    }
    setSprites(newSprites)
    updateSprites(newSprites)
    setSelectedSpriteName(newName)
  }

  const handleSelectSprite = (name: string) => {
    if (selectedSpriteName) {
      saveCurrentSprite()
    }
    setSelectedSpriteName(name)
  }

  const handleRenameSprite = (oldName: string) => {
    setEditingSpriteName(oldName)
    setNewSpriteName(oldName)
  }

  const handleSaveRename = (oldName: string) => {
    const trimmed = newSpriteName.trim()
    if (!trimmed || trimmed === oldName) {
      setEditingSpriteName(null)
      return
    }
    if (sprites[trimmed]) {
      alert('A sprite with that name already exists')
      return
    }
    const newSprites = { ...sprites }
    newSprites[trimmed] = newSprites[oldName]
    delete newSprites[oldName]
    setSprites(newSprites)
    updateSprites(newSprites)
    if (selectedSpriteName === oldName) {
      setSelectedSpriteName(trimmed)
    }
    setEditingSpriteName(null)
  }

  // Update sprite size and recreate if needed
  useEffect(() => {
    if (selectedSpriteName && sprite.length !== size) {
      const newSprite = createEmptySprite(size)
      setSprite(newSprite)
      setPreviewSprite(null)
      setHistory([newSprite])
      setHistoryIndex(0)
    }
  }, [size, selectedSpriteName])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setSprite(history[historyIndex - 1])
      setPreviewSprite(null)
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setSprite(history[historyIndex + 1])
      setPreviewSprite(null)
    }
  }, [history, historyIndex])

  const saveToHistory = useCallback((newSprite: SpriteData) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(newSprite)))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    if (newHistory.length > 50) {
      setHistory(newHistory.slice(-50))
      setHistoryIndex(49)
    }
  }, [history, historyIndex])

  // Drawing algorithms
  const drawLine = useCallback((x0: number, y0: number, x1: number, y1: number, color: number, target: SpriteData): SpriteData => {
    const newSprite = target.map(row => [...row])
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    let x = x0
    let y = y0
    while (true) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        newSprite[y][x] = color
      }
      if (x === x1 && y === y1) break
      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        x += sx
      }
      if (e2 < dx) {
        err += dx
        y += sy
      }
    }
    return newSprite
  }, [size])

  const drawCircle = useCallback((cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
    const newSprite = target.map(row => [...row])
    const setPixel = (x: number, y: number) => {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        newSprite[y][x] = color
      }
    }
    if (filled) {
      for (let y = Math.max(0, cy - radius); y <= Math.min(size - 1, cy + radius); y++) {
        for (let x = Math.max(0, cx - radius); x <= Math.min(size - 1, cx + radius); x++) {
          const dx = x - cx
          const dy = y - cy
          if (dx * dx + dy * dy <= radius * radius) {
            setPixel(x, y)
          }
        }
      }
    } else {
      let x = radius
      let y = 0
      let err = 0
      while (x >= y) {
        setPixel(cx + x, cy + y)
        setPixel(cx - x, cy + y)
        setPixel(cx + x, cy - y)
        setPixel(cx - x, cy - y)
        setPixel(cx + y, cy + x)
        setPixel(cx - y, cy + x)
        setPixel(cx + y, cy - x)
        setPixel(cx - y, cy - x)
        if (err <= 0) {
          y += 1
          err += 2 * y + 1
        }
        if (err > 0) {
          x -= 1
          err -= 2 * x + 1
        }
      }
    }
    return newSprite
  }, [size])

  const drawRectangle = useCallback((x0: number, y0: number, x1: number, y1: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
    const newSprite = target.map(row => [...row])
    const minX = Math.min(x0, x1)
    const maxX = Math.max(x0, x1)
    const minY = Math.min(y0, y1)
    const maxY = Math.max(y0, y1)
    if (filled) {
      for (let y = minY; y <= maxY && y < size; y++) {
        for (let x = minX; x <= maxX && x < size; x++) {
          if (x >= 0 && y >= 0) {
            newSprite[y][x] = color
          }
        }
      }
    } else {
      for (let x = minX; x <= maxX && x < size; x++) {
        if (x >= 0) {
          if (minY >= 0) newSprite[minY][x] = color
          if (maxY >= 0 && maxY < size) newSprite[maxY][x] = color
        }
      }
      for (let y = minY; y <= maxY && y < size; y++) {
        if (y >= 0) {
          if (minX >= 0) newSprite[y][minX] = color
          if (maxX >= 0 && maxX < size) newSprite[y][maxX] = color
        }
      }
    }
    return newSprite
  }, [size])

  const drawTriangle = useCallback((cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
    const newSprite = target.map(row => [...row])
    const x0 = cx
    const y0 = cy - radius
    const x1 = cx - radius * 0.866
    const y1 = cy + radius * 0.5
    const x2 = cx + radius * 0.866
    const y2 = cy + radius * 0.5
    if (filled) {
      const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)))
      const maxY = Math.min(size - 1, Math.ceil(Math.max(y0, y1, y2)))
      for (let y = minY; y <= maxY; y++) {
        const intersects: number[] = []
        const edges = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]]
        for (const edge of edges) {
          const [px0, py0, px1, py1] = edge
          if (py0 === py1) {
            if (py0 === y && px0 !== undefined && px1 !== undefined) {
              intersects.push(Math.round(px0), Math.round(px1))
            }
            continue
          }
          if ((py0 < y && py1 >= y) || (py1 < y && py0 >= y)) {
            const denom = py1 - py0
            if (Math.abs(denom) > 0.0001) {
              const x = px0 + (y - py0) / denom * (px1 - px0)
              intersects.push(Math.round(x))
            }
          }
        }
        if (intersects.length >= 2) {
          intersects.sort((a, b) => a - b)
          const minX = Math.max(0, Math.min(intersects[0], intersects[intersects.length - 1]))
          const maxX = Math.min(size - 1, Math.max(intersects[0], intersects[intersects.length - 1]))
          for (let x = minX; x <= maxX; x++) {
            newSprite[y][x] = color
          }
        }
      }
    } else {
      return drawLine(x0, y0, x1, y1, color,
        drawLine(x1, y1, x2, y2, color,
        drawLine(x2, y2, x0, y0, color, target)))
    }
    return newSprite
  }, [size, drawLine])

  const drawDiamond = useCallback((cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
    const newSprite = target.map(row => [...row])
    if (filled) {
      const minY = Math.max(0, cy - radius)
      const maxY = Math.min(size - 1, cy + radius)
      for (let y = minY; y <= maxY; y++) {
        const dy = Math.abs(y - cy)
        const width = radius - dy
        if (width >= 0) {
          const minX = Math.max(0, cx - width)
          const maxX = Math.min(size - 1, cx + width)
          for (let x = minX; x <= maxX; x++) {
            newSprite[y][x] = color
          }
        }
      }
    } else {
      const points = [[cx, cy - radius], [cx + radius, cy], [cx, cy + radius], [cx - radius, cy]]
      return drawLine(points[0][0], points[0][1], points[1][0], points[1][1], color,
        drawLine(points[1][0], points[1][1], points[2][0], points[2][1], color,
        drawLine(points[2][0], points[2][1], points[3][0], points[3][1], color,
        drawLine(points[3][0], points[3][1], points[0][0], points[0][1], color, target))))
    }
    return newSprite
  }, [size, drawLine])

  const drawSquare = useCallback((cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
    const halfSize = radius
    const x0 = Math.max(0, cx - halfSize)
    const y0 = Math.max(0, cy - halfSize)
    const x1 = Math.min(size - 1, cx + halfSize)
    const y1 = Math.min(size - 1, cy + halfSize)
    return drawRectangle(x0, y0, x1, y1, color, filled, target)
  }, [size, drawRectangle])

  const drawPentagon = useCallback((cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
    const newSprite = target.map(row => [...row])
    const points: Array<[number, number]> = []
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI / 5) - Math.PI / 2
      points.push([Math.round(cx + radius * Math.cos(angle)), Math.round(cy + radius * Math.sin(angle))])
    }
    if (filled) {
      const minY = Math.max(0, Math.min(...points.map(p => p[1])))
      const maxY = Math.min(size - 1, Math.max(...points.map(p => p[1])))
      for (let y = minY; y <= maxY; y++) {
        const intersects: number[] = []
        const edges = [[points[0], points[1]], [points[1], points[2]], [points[2], points[3]], [points[3], points[4]], [points[4], points[0]]]
        for (const edge of edges) {
          const [[px0, py0], [px1, py1]] = edge
          if (py0 === py1) {
            if (py0 === y) intersects.push(Math.round(px0), Math.round(px1))
            continue
          }
          if ((py0 < y && py1 >= y) || (py1 < y && py0 >= y)) {
            const denom = py1 - py0
            if (Math.abs(denom) > 0.0001) {
              const x = px0 + (y - py0) / denom * (px1 - px0)
              intersects.push(Math.round(x))
            }
          }
        }
        if (intersects.length >= 2) {
          intersects.sort((a, b) => a - b)
          const minX = Math.max(0, intersects[0])
          const maxX = Math.min(size - 1, intersects[intersects.length - 1])
          for (let x = minX; x <= maxX; x++) {
            newSprite[y][x] = color
          }
        }
      }
    } else {
      let result = target.map(row => [...row])
      for (let i = 0; i < points.length; i++) {
        const next = (i + 1) % points.length
        result = drawLine(points[i][0], points[i][1], points[next][0], points[next][1], color, result)
      }
      return result
    }
    return newSprite
  }, [size, drawLine])

  const drawHexagon = useCallback((cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
    const newSprite = target.map(row => [...row])
    const points: Array<[number, number]> = []
    for (let i = 0; i < 6; i++) {
      const angle = (i * 2 * Math.PI / 6) - Math.PI / 2
      points.push([Math.round(cx + radius * Math.cos(angle)), Math.round(cy + radius * Math.sin(angle))])
    }
    if (filled) {
      const minY = Math.max(0, Math.min(...points.map(p => p[1])))
      const maxY = Math.min(size - 1, Math.max(...points.map(p => p[1])))
      for (let y = minY; y <= maxY; y++) {
        const intersects: number[] = []
        const edges = [[points[0], points[1]], [points[1], points[2]], [points[2], points[3]], [points[3], points[4]], [points[4], points[5]], [points[5], points[0]]]
        for (const edge of edges) {
          const [[px0, py0], [px1, py1]] = edge
          if (py0 === py1) {
            if (py0 === y) intersects.push(Math.round(px0), Math.round(px1))
            continue
          }
          if ((py0 < y && py1 >= y) || (py1 < y && py0 >= y)) {
            const denom = py1 - py0
            if (Math.abs(denom) > 0.0001) {
              const x = px0 + (y - py0) / denom * (px1 - px0)
              intersects.push(Math.round(x))
            }
          }
        }
        if (intersects.length >= 2) {
          intersects.sort((a, b) => a - b)
          const minX = Math.max(0, intersects[0])
          const maxX = Math.min(size - 1, intersects[intersects.length - 1])
          for (let x = minX; x <= maxX; x++) {
            newSprite[y][x] = color
          }
        }
      }
    } else {
      let result = target.map(row => [...row])
      for (let i = 0; i < points.length; i++) {
        const next = (i + 1) % points.length
        result = drawLine(points[i][0], points[i][1], points[next][0], points[next][1], color, result)
      }
      return result
    }
    return newSprite
  }, [size, drawLine])

  const drawStar = useCallback((cx: number, cy: number, radius: number, color: number, filled: boolean, target: SpriteData): SpriteData => {
    const newSprite = target.map(row => [...row])
    const outerRadius = radius
    const innerRadius = radius * 0.5
    const points: Array<[number, number]> = []
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI / 5) - Math.PI / 2
      const r = i % 2 === 0 ? outerRadius : innerRadius
      points.push([Math.round(cx + r * Math.cos(angle)), Math.round(cy + r * Math.sin(angle))])
    }
    if (filled) {
      const minY = Math.max(0, Math.min(...points.map(p => p[1])))
      const maxY = Math.min(size - 1, Math.max(...points.map(p => p[1])))
      for (let y = minY; y <= maxY; y++) {
        const intersects: number[] = []
        for (let i = 0; i < points.length; i++) {
          const next = (i + 1) % points.length
          const [px0, py0] = points[i]
          const [px1, py1] = points[next]
          if (py0 === py1) {
            if (py0 === y) intersects.push(Math.round(px0), Math.round(px1))
            continue
          }
          if ((py0 < y && py1 >= y) || (py1 < y && py0 >= y)) {
            const denom = py1 - py0
            if (Math.abs(denom) > 0.0001) {
              const x = px0 + (y - py0) / denom * (px1 - px0)
              intersects.push(Math.round(x))
            }
          }
        }
        if (intersects.length >= 2) {
          intersects.sort((a, b) => a - b)
          const minX = Math.max(0, intersects[0])
          const maxX = Math.min(size - 1, intersects[intersects.length - 1])
          for (let x = minX; x <= maxX; x++) {
            newSprite[y][x] = color
          }
        }
      }
    } else {
      let result = target.map(row => [...row])
      for (let i = 0; i < points.length; i++) {
        const next = (i + 1) % points.length
        result = drawLine(points[i][0], points[i][1], points[next][0], points[next][1], color, result)
      }
      return result
    }
    return newSprite
  }, [size, drawLine])

  const floodFill = useCallback((startX: number, startY: number, targetColor: number, fillColor: number) => {
    if (targetColor === fillColor) return sprite
    const newSprite = sprite.map(row => [...row])
    const stack: Array<[number, number]> = [[startX, startY]]
    const visited = new Set<string>()
    while (stack.length > 0) {
      const [x, y] = stack.pop()!
      const key = `${x},${y}`
      if (visited.has(key)) continue
      if (x < 0 || x >= size || y < 0 || y >= size) continue
      if (newSprite[y][x] !== targetColor) continue
      visited.add(key)
      newSprite[y][x] = fillColor
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }
    return newSprite
  }, [sprite, size])

  const drawAt = useCallback((x: number, y: number, color: number) => {
    const newSprite = sprite.map(row => [...row])
    const halfSize = Math.floor(brushSize / 2)
    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const px = x + dx
        const py = y + dy
        if (px >= 0 && px < size && py >= 0 && py < size) {
          if (brushSize === 1 || (dx * dx + dy * dy) <= (halfSize * halfSize)) {
            newSprite[py][px] = color
          }
        }
      }
    }
    return newSprite
  }, [sprite, size, brushSize])

  const getCoords = useCallback((e: React.MouseEvent<HTMLDivElement>): [number, number] | null => {
    if (!canvasRef.current) return null
    const rect = canvasRef.current.getBoundingClientRect()
    const pixelSize = rect.width / size
    const x = Math.floor((e.clientX - rect.left) / pixelSize)
    const y = Math.floor((e.clientY - rect.top) / pixelSize)
    if (x >= 0 && x < size && y >= 0 && y < size) {
      return [x, y]
    }
    return null
  }, [size])

  const drawShape = useCallback((start: ShapeStart, end: [number, number], tool: Tool, color: number, filled: boolean): SpriteData => {
    const base = sprite.map(row => [...row])
    switch (tool) {
      case 'line':
        return drawLine(start.x, start.y, end[0], end[1], color, base)
      case 'rectangle':
        return drawRectangle(start.x, start.y, end[0], end[1], color, filled, base)
      case 'circle': {
        const radius = Math.round(Math.sqrt((end[0] - start.x) ** 2 + (end[1] - start.y) ** 2))
        return drawCircle(start.x, start.y, radius, color, filled, base)
      }
      case 'shape': {
        const radius = shapeSize
        switch (selectedShape) {
          case 'triangle':
            return drawTriangle(start.x, start.y, radius, color, filled, base)
          case 'diamond':
            return drawDiamond(start.x, start.y, radius, color, filled, base)
          case 'square':
            return drawSquare(start.x, start.y, radius, color, filled, base)
          case 'pentagon':
            return drawPentagon(start.x, start.y, radius, color, filled, base)
          case 'hexagon':
            return drawHexagon(start.x, start.y, radius, color, filled, base)
          case 'star':
            return drawStar(start.x, start.y, radius, color, filled, base)
          default:
            return base
        }
      }
      default:
        return base
    }
  }, [sprite, shapeSize, selectedShape, drawLine, drawCircle, drawRectangle, drawTriangle, drawDiamond, drawSquare, drawPentagon, drawHexagon, drawStar])

  const handlePaste = useCallback((x: number, y: number) => {
    if (!clipboard) return
    const newSprite = sprite.map(row => [...row])
    for (let sy = 0; sy < clipboard.height; sy++) {
      for (let sx = 0; sx < clipboard.width; sx++) {
        const px = x + sx
        const py = y + sy
        if (px >= 0 && px < size && py >= 0 && py < size) {
          newSprite[py][px] = clipboard.data[sy][sx]
        }
      }
    }
    setSprite(newSprite)
    saveToHistory(newSprite)
    setSelection(null)
  }, [clipboard, sprite, size, saveToHistory])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const coords = getCoords(e)
    if (!coords) return
    const [x, y] = coords
    
    // Mount point placement mode (Ctrl+Shift+Click or when mountPointMode is enabled)
    if (mountPointMode || (e.shiftKey && e.ctrlKey)) {
      const newPoint: MountPoint = { x, y, name: undefined }
      // Check if point already exists at this location (within 1px tolerance)
      const existingIndex = mountPoints.findIndex(mp => Math.abs(mp.x - x) < 1 && Math.abs(mp.y - y) < 1)
      if (existingIndex >= 0) {
        // Remove if clicking on existing point
        setMountPoints(mountPoints.filter((_, i) => i !== existingIndex))
      } else {
        // Add new mount point with default name
        const defaultName = `mount_${mountPoints.length + 1}`
        setMountPoints([...mountPoints, { ...newPoint, name: defaultName }])
      }
      return
    }
    
    // Handle paste on click if clipboard exists (Shift+Click when not in mount point mode)
    if (clipboard && e.shiftKey && !e.ctrlKey) {
      handlePaste(x - Math.floor(clipboard.width / 2), y - Math.floor(clipboard.height / 2))
      return
    }
    
    if (tool === 'eyedropper') {
      const colorIndex = sprite[y][x]
      setSelectedColor(colorIndex)
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
      const newSprite = floodFill(x, y, targetColor, color)
      setSprite(newSprite)
      saveToHistory(newSprite)
    } else if (tool === 'pencil' || tool === 'erase') {
      setIsDrawing(true)
      const newSprite = drawAt(x, y, color)
      setSprite(newSprite)
    } else if (['line', 'circle', 'rectangle', 'shape'].includes(tool)) {
      setIsDrawing(true)
      setShapeStart({ x, y })
      setPreviewSprite(sprite)
    }
  }, [tool, selectedColor, sprite, getCoords, drawAt, floodFill, saveToHistory, mountPointMode, mountPoints, clipboard, handlePaste])

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
      setSprite(newSprite)
    } else if (shapeStart && ['line', 'circle', 'rectangle', 'shape'].includes(tool)) {
      const color = selectedColor
      const newSprite = drawShape(shapeStart, coords, tool, color, shapeFilled)
      setPreviewSprite(newSprite)
    }
  }, [isDrawing, tool, selectedColor, shapeStart, shapeFilled, sprite, getCoords, drawAt, drawShape, isSelecting, selection])

  const handleCanvasMouseUp = useCallback(() => {
    if (tool === 'select' && isSelecting && selection) {
      setIsSelecting(false)
      // Normalize selection
      const minX = Math.max(0, Math.min(selection.x0, selection.x1))
      const maxX = Math.min(size - 1, Math.max(selection.x0, selection.x1))
      const minY = Math.max(0, Math.min(selection.y0, selection.y1))
      const maxY = Math.min(size - 1, Math.max(selection.y0, selection.y1))
      setSelection({ x0: minX, y0: minY, x1: maxX, y1: maxY })
      return
    }
    
    if (isDrawing && shapeStart && ['line', 'circle', 'rectangle', 'shape'].includes(tool)) {
      if (previewSprite) {
        setSprite(previewSprite)
        saveToHistory(previewSprite)
      }
      setPreviewSprite(null)
      setShapeStart(null)
    } else if (isDrawing && (tool === 'pencil' || tool === 'erase')) {
      saveToHistory(sprite)
    }
    setIsDrawing(false)
  }, [isDrawing, tool, shapeStart, previewSprite, sprite, saveToHistory, isSelecting, selection, size])

  const handleCopy = useCallback(() => {
    if (!selection) return
    const { x0, y0, x1, y1 } = selection
    const minX = Math.min(x0, x1)
    const maxX = Math.max(x0, x1)
    const minY = Math.min(y0, y1)
    const maxY = Math.max(y0, y1)
    const width = maxX - minX + 1
    const height = maxY - minY + 1
    const copied: SpriteData = []
    for (let y = minY; y <= maxY; y++) {
      const row: number[] = []
      for (let x = minX; x <= maxX; x++) {
        row.push(sprite[y][x])
      }
      copied.push(row)
    }
    setClipboard({ data: copied, width, height })
  }, [selection, sprite])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selection && !isSelecting) {
        e.preventDefault()
        handleCopy()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault()
        const centerX = Math.floor(size / 2)
        const centerY = Math.floor(size / 2)
        handlePaste(centerX - Math.floor(clipboard.width / 2), centerY - Math.floor(clipboard.height / 2))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selection, clipboard, size, isSelecting, handleCopy, handlePaste])

  const flipHorizontal = useCallback(() => {
    const newSprite = sprite.map(row => [...row].reverse())
    setSprite(newSprite)
    saveToHistory(newSprite)
  }, [sprite, saveToHistory])

  const flipVertical = useCallback(() => {
    const newSprite = [...sprite].reverse()
    setSprite(newSprite)
    saveToHistory(newSprite)
  }, [sprite, saveToHistory])

  const rotateCW = useCallback(() => {
    const newSprite: SpriteData = Array(size).fill(null).map(() => Array(size).fill(-1))
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        newSprite[x][size - 1 - y] = sprite[y][x]
      }
    }
    setSprite(newSprite)
    saveToHistory(newSprite)
  }, [sprite, size, saveToHistory])

  const rotateCCW = useCallback(() => {
    const newSprite: SpriteData = Array(size).fill(null).map(() => Array(size).fill(-1))
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        newSprite[size - 1 - x][y] = sprite[y][x]
      }
    }
    setSprite(newSprite)
    saveToHistory(newSprite)
  }, [sprite, size, saveToHistory])

  const clearSprite = useCallback(() => {
    const newSprite = createEmptySprite(size)
    setSprite(newSprite)
    setPreviewSprite(null)
    saveToHistory(newSprite)
  }, [size, saveToHistory])

  const handleShapeToolClick = useCallback(() => {
    setShowShapeModal(true)
  }, [])

  const handleShapeSelect = useCallback((shape: SimpleShape) => {
    setSelectedShape(shape)
    setShowShapeModal(false)
    setTool('shape')
  }, [])

  const displaySprite = previewSprite || sprite
  const pixelSize = useMemo(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768
      const availableWidth = isMobile ? window.innerWidth - 300 : 600
      return Math.max(12, Math.min(32, Math.floor(availableWidth / size)))
    }
    return 20
  }, [size])

  const isShapeTool = tool === 'shape'
  const isDrawingTool = ['line', 'circle', 'rectangle'].includes(tool)

  if (cartLoading || !cart) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const spriteNames = Object.keys(sprites)

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Top toolbar */}
      <div className="editor-toolbar flex items-center gap-2 p-2 border-b border-gray-800">
        <span className="font-pixel text-sm mr-2 text-retro-400">Sprite Editor</span>
        
        <button
          className="btn-retro text-xs h-8 px-3"
          onClick={handleAddSprite}
        >
          + Add Sprite
        </button>

        {selectedSpriteName && (
          <>
            <div className="h-6 w-px bg-gray-700" />
            <select
              className="input-retro text-xs h-8 px-2 bg-gray-800 border-gray-700"
              value={size}
              onChange={(e) => setSize(Number(e.target.value) as SpriteSize)}
            >
              <option value={8}>8×8</option>
              <option value={16}>16×16</option>
              <option value={24}>24×24</option>
              <option value={32}>32×32</option>
            </select>
          </>
        )}
      </div>

      {/* Main content - split view */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left sidebar - Sprite list */}
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
                    onClick={() => handleSelectSprite(name)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      {editingSpriteName === name ? (
                        <input
                          type="text"
                          className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-1 text-gray-200"
                          value={newSpriteName}
                          onChange={(e) => setNewSpriteName(e.target.value)}
                          onBlur={() => handleSaveRename(name)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveRename(name)
                            } else if (e.key === 'Escape') {
                              setEditingSpriteName(null)
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
                              handleRenameSprite(name)
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
                                handleDuplicateSprite(name)
                              }}
                              title="Duplicate sprite"
                            >
                              ⧉
                            </button>
                            <button
                              className="text-red-400 hover:text-red-300 text-base font-bold p-1 rounded hover:bg-gray-700 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteSprite(name)
                              }}
                              title="Delete sprite"
                            >
                              ×
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {sprites[name].width}×{sprites[name].height}
                    </div>
                    {/* Tiny preview */}
                    <div className="mt-1 inline-block border border-gray-600">
                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: `repeat(${sprites[name].width}, 2px)`,
                          gridTemplateRows: `repeat(${sprites[name].height}, 2px)`,
                          width: `${sprites[name].width * 2}px`,
                          height: `${sprites[name].height * 2}px`,
                        }}
                      >
                        {sprites[name].pixels.flatMap((row, y) =>
                          row.map((colorIndex, x) => (
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
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Sprite editor */}
        <div className="flex-1 overflow-auto">
          {selectedSpriteName ? (
            <div className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="editor-toolbar flex items-center gap-2 p-2 border-b border-gray-800">
                <div className="flex items-center gap-1">
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      tool === 'pencil' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => setTool('pencil')}
                    title="Pencil"
                  >
                    ✎
                  </button>
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      tool === 'erase' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => setTool('erase')}
                    title="Eraser"
                  >
                    ⊗
                  </button>
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      tool === 'fill' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => setTool('fill')}
                    title="Fill"
                  >
                    ▦
                  </button>
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      tool === 'select' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => setTool('select')}
                    title="Select"
                  >
                    ☐
                  </button>
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      tool === 'eyedropper' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => setTool('eyedropper')}
                    title="Eyedropper (Pick Color)"
                  >
                    🎨
                  </button>
                </div>
                {(tool === 'select' && selection) && (
                  <>
                    <div className="h-6 w-px bg-gray-700" />
                    <button
                      className="btn-retro text-xs h-8 px-3 disabled:opacity-50"
                      onClick={handleCopy}
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
                                handlePaste(selection.x0, selection.y0)
                              } else {
                                const centerX = Math.floor(size / 2)
                                const centerY = Math.floor(size / 2)
                                handlePaste(centerX - Math.floor(clipboard.width / 2), centerY - Math.floor(clipboard.height / 2))
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
                    onClick={() => setTool('line')}
                    title="Line"
                  >
                    ╱
                  </button>
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      tool === 'rectangle' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => setTool('rectangle')}
                    title="Rectangle"
                  >
                    ▭
                  </button>
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      tool === 'circle' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => setTool('circle')}
                    title="Circle"
                  >
                    ○
                  </button>
                  <button
                    className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                      tool === 'shape' ? 'bg-retro-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={handleShapeToolClick}
                    title="Shapes"
                  >
                    ◆
                  </button>
                </div>
                {(isShapeTool || isDrawingTool) && (
                  <>
                    <div className="h-6 w-px bg-gray-700" />
                    <label className="flex items-center gap-2 text-xs text-gray-400">
                      <input
                        type="checkbox"
                        checked={shapeFilled}
                        onChange={(e) => setShapeFilled(e.target.checked)}
                        className="w-4 h-4"
                      />
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
                        max={size}
                        value={shapeSize}
                        onChange={(e) => setShapeSize(Math.max(1, Math.min(size, Number(e.target.value))))}
                        className="w-16 h-8 px-2 text-xs bg-gray-800 border border-gray-700 rounded text-gray-300"
                      />
                    </div>
                  </>
                )}
                <div className="h-6 w-px bg-gray-700" />
                <select
                  className="input-retro text-xs h-8 px-2 w-16 bg-gray-800 border-gray-700"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
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
                    onClick={undo}
                    disabled={historyIndex === 0}
                    title="Undo"
                  >
                    ↶
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 transition-colors"
                    onClick={redo}
                    disabled={historyIndex === history.length - 1}
                    title="Redo"
                  >
                    ↷
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    onClick={flipHorizontal}
                    title="Flip Horizontal"
                  >
                    ↔
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    onClick={flipVertical}
                    title="Flip Vertical"
                  >
                    ↕
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    onClick={rotateCW}
                    title="Rotate CW"
                  >
                    ⟳
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    onClick={rotateCCW}
                    title="Rotate CCW"
                  >
                    ⟲
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded bg-red-800 hover:bg-red-700 text-gray-300 transition-colors"
                    onClick={clearSprite}
                    title="Clear"
                  >
                    ⊠
                  </button>
                </div>
              </div>

              {/* Canvas area */}
              <div className="flex-1 overflow-auto p-3">
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr_280px] gap-4">
                  {/* Left - Palette */}
                  <div className="lg:col-span-1">
                    <div className="card-retro p-4 space-y-4 sticky top-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-200 mb-1">Palette</div>
                        <div className="text-xs text-gray-500">{currentPalette.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1.5">Transparent</div>
                        <div
                          className={`w-full h-10 border-2 cursor-pointer transition-all ${
                            selectedColor === -1 ? 'border-retro-500 ring-2 ring-retro-500/50' : 'border-gray-600 hover:border-gray-500'
                          }`}
                          style={{
                            backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                            backgroundSize: '8px 8px',
                          }}
                          onClick={() => setSelectedColor(-1)}
                        >
                          <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                            -1
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1.5">Colors (0-49)</div>
                        <div className="grid grid-cols-10 gap-0.5">
                          {currentPalette.colors.map((color, idx) => (
                            <div
                              key={idx}
                              className={`aspect-square border cursor-pointer hover:scale-110 transition-transform ${
                                selectedColor === idx ? 'border-retro-500 ring-1 ring-retro-500/50 scale-110' : 'border-gray-700 hover:border-gray-600'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setSelectedColor(idx)}
                              title={`Index ${idx}: ${color}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-700">
                        <div className="text-xs text-gray-400 mb-2">Selected: {selectedColor}</div>
                        <div
                          className="w-full h-16 border-2 border-gray-600"
                          style={{
                            backgroundColor: selectedColor === -1 ? 'transparent' : currentPalette.colors[selectedColor] || '#000000',
                            backgroundImage: selectedColor === -1
                              ? 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)'
                              : 'none',
                            backgroundSize: selectedColor === -1 ? '8px 8px' : 'auto',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Center - Canvas */}
                  <div className="lg:col-span-1">
                    <div className="card-retro p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-gray-200">Canvas</div>
                        <div className="text-xs text-gray-500">{size}×{size}px</div>
                      </div>
                      <div className="flex justify-center items-start gap-6 flex-wrap">
                        <div className="inline-block border-2 border-gray-600 shadow-lg bg-gray-900 relative">
                          <div
                            ref={canvasRef}
                            className={`grid select-none ${
                              tool === 'select' ? 'cursor-crosshair' :
                              tool === 'eyedropper' ? 'cursor-pointer' :
                              'cursor-crosshair'
                            }`}
                            style={{
                              gridTemplateColumns: `repeat(${size}, ${pixelSize}px)`,
                              gridTemplateRows: `repeat(${size}, ${pixelSize}px)`,
                              width: `${size * pixelSize}px`,
                              height: `${size * pixelSize}px`,
                            }}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                          >
                            {displaySprite.map((row, y) =>
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
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-xs text-gray-400 font-semibold">Preview (1:1)</div>
                          <div className="inline-block border-2 border-gray-600 shadow-lg bg-gray-900">
                            <div
                              className="grid"
                              style={{
                                gridTemplateColumns: `repeat(${size}, 1px)`,
                                gridTemplateRows: `repeat(${size}, 1px)`,
                                width: `${size}px`,
                                height: `${size}px`,
                              }}
                            >
                              {displaySprite.map((row, y) =>
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
                      </div>

                      {/* Properties Panel */}
                      <div className="card-retro p-4 mt-4">
                        <div className="text-sm font-semibold text-gray-200 mb-4">Properties</div>
                        
                        {/* Use Collision Toggle */}
                        <div className="mb-4">
                          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useCollision}
                              onChange={(e) => setUseCollision(e.target.checked)}
                              className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-retro-500 focus:ring-retro-500"
                            />
                            <span>Use Collision</span>
                          </label>
                          <div className="text-xs text-gray-500 mt-1 ml-7">
                            Enable collision detection when non-transparent pixels touch other sprites with collision enabled
                          </div>
                        </div>

                        {/* Mount Points */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-300">Mount Points</div>
                            <button
                              onClick={() => {
                                const defaultName = `mount_${mountPoints.length + 1}`
                                const newPoint: MountPoint = { 
                                  x: Math.floor(size / 2), 
                                  y: Math.floor(size / 2),
                                  name: defaultName
                                }
                                setMountPoints([...mountPoints, newPoint])
                              }}
                              className="text-xs btn-retro py-1 px-2"
                              title="Add mount point"
                            >
                              + Add
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={mountPointMode}
                                onChange={(e) => setMountPointMode(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-retro-500"
                              />
                              <span>Place Mode</span>
                            </label>
                            <span className="text-xs text-gray-600">or Ctrl+Shift+Click on canvas</span>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            Click points on canvas to position (or edit below). Named points can be accessed in Lua by name or index (e.g., <code className="text-retro-400">mountPoints["thrust"]</code> or <code className="text-retro-400">mountPoints[1]</code>)
                          </div>
                          {mountPoints.length === 0 ? (
                            <div className="text-xs text-gray-600 italic">No mount points defined</div>
                          ) : (
                            <div className="space-y-2">
                              {mountPoints.map((mp, idx) => (
                                <div key={idx} className="flex flex-col gap-2 p-2 bg-gray-800 rounded">
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs text-gray-400 flex-shrink-0">#{idx + 1}</div>
                                    <input
                                      type="text"
                                      value={mp.name || ''}
                                      onChange={(e) => {
                                        const newMountPoints = [...mountPoints]
                                        newMountPoints[idx] = { ...mp, name: e.target.value.trim() || undefined }
                                        setMountPoints(newMountPoints)
                                      }}
                                      className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                                      placeholder="Name (e.g., thrust, bullet)"
                                    />
                                    <button
                                      onClick={() => {
                                        setMountPoints(mountPoints.filter((_, i) => i !== idx))
                                      }}
                                      className="text-red-400 hover:text-red-300 text-sm"
                                      title="Remove mount point"
                                    >
                                      ×
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max={size - 1}
                                      value={mp.x}
                                      onChange={(e) => {
                                        const newMountPoints = [...mountPoints]
                                        newMountPoints[idx] = { ...mp, x: Math.max(0, Math.min(size - 1, Number(e.target.value))) }
                                        setMountPoints(newMountPoints)
                                      }}
                                      className="w-16 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                                      placeholder="X"
                                    />
                                    <span className="text-xs text-gray-500">×</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max={size - 1}
                                      value={mp.y}
                                      onChange={(e) => {
                                        const newMountPoints = [...mountPoints]
                                        newMountPoints[idx] = { ...mp, y: Math.max(0, Math.min(size - 1, Number(e.target.value))) }
                                        setMountPoints(newMountPoints)
                                      }}
                                      className="w-16 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                                      placeholder="Y"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-lg mb-2">No sprite selected</div>
                <div className="text-sm">Select a sprite from the list or create a new one</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shape selector modal */}
      {showShapeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowShapeModal(false)}>
          <div className="card-retro p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-200">Select Shape</h3>
              <button
                className="text-gray-400 hover:text-gray-300 text-2xl"
                onClick={() => setShowShapeModal(false)}
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {(['triangle', 'diamond', 'square', 'pentagon', 'hexagon', 'star'] as SimpleShape[]).map((shape) => (
                <button
                  key={shape}
                  className={`p-4 border-2 rounded transition-colors ${
                    selectedShape === shape
                      ? 'border-retro-500 bg-retro-500/20 text-retro-500'
                      : 'border-gray-700 hover:border-gray-600 text-gray-300'
                  }`}
                  onClick={() => handleShapeSelect(shape)}
                >
                  <div className="text-2xl mb-1">
                    {shape === 'triangle' && '△'}
                    {shape === 'diamond' && '◇'}
                    {shape === 'square' && '▣'}
                    {shape === 'pentagon' && '⬟'}
                    {shape === 'hexagon' && '⬡'}
                    {shape === 'star' && '★'}
                  </div>
                  <div className="text-xs capitalize">{shape}</div>
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Size (1:1, max {size})
                </label>
                <input
                  type="range"
                  min="1"
                  max={size}
                  value={shapeSize}
                  onChange={(e) => setShapeSize(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span className="font-semibold text-retro-500">{shapeSize}</span>
                  <span>{size}</span>
                </div>
              </div>
              <label className="flex items-center gap-3 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={shapeFilled}
                  onChange={(e) => setShapeFilled(e.target.checked)}
                  className="w-5 h-5"
                />
                <span>Filled</span>
              </label>
            </div>
            <button
              className="w-full mt-6 btn-retro"
              onClick={() => setShowShapeModal(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function createEmptySprite(size: SpriteSize): SpriteData {
  return Array(size).fill(null).map(() => Array(size).fill(-1))
}
