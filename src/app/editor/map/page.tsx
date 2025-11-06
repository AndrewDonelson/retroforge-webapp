"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import type { TileMap, TilesetData } from '@/lib/cartUtils'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/contexts/AuthContext'

export default function MapEditorPage() {
  const { cart, isLoading: cartLoading, updateAsset } = useEditor()
  const { user } = useAuth()
  const saveFile = useMutation(api.cartFiles.saveCartFile)

  const [tilemaps, setTilemaps] = useState<Record<string, TileMap>>({})
  const [tilesets, setTilesets] = useState<Record<string, TilesetData>>({})
  const [selectedTilemapName, setSelectedTilemapName] = useState<string | null>(null)
  const [selectedTileName, setSelectedTileName] = useState<string | null>(null)
  const [mapWidth, setMapWidth] = useState(20)
  const [mapHeight, setMapHeight] = useState(15)
  const [tileSize, setTileSize] = useState(16)
  const [clipboard, setClipboard] = useState<{ tiles: string[][]; width: number; height: number } | null>(null)
  const [pastePreview, setPastePreview] = useState<{ x: number; y: number } | null>(null)
  const [isDraggingPaste, setIsDraggingPaste] = useState(false)
  const [selection, setSelection] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  // Track last saved state to detect unsaved changes
  const lastSavedTilemapsRef = useRef<Record<string, string>>({})

  // Load tilemaps and tilesets from cart
  useEffect(() => {
    if (cart?.assets) {
      const loadedTilemaps: Record<string, TileMap> = {}
      const loadedTilesets: Record<string, TilesetData> = {}
      
      for (const [path, content] of Object.entries(cart.assets)) {
        if (path.endsWith('_map.json')) {
          try {
            const tilemapData = JSON.parse(content) as TileMap
            const tilemapName = path.replace('_map.json', '').replace('assets/', '')
            loadedTilemaps[tilemapName] = tilemapData
          } catch (e) {
            console.error(`Failed to parse tilemap ${path}:`, e)
          }
        } else if (path.endsWith('_tileset.json') || path.endsWith('_tiles.json')) {
          try {
            const tilesetData = JSON.parse(content) as TilesetData
            const tilesetName = path.replace('_tileset.json', '').replace('_tiles.json', '').replace('assets/', '')
            loadedTilesets[tilesetName] = tilesetData
          } catch (e) {
            console.error(`Failed to parse tileset ${path}:`, e)
          }
        }
      }
      
      setTilemaps(loadedTilemaps)
      setTilesets(loadedTilesets)
      
      // Update last saved state for all loaded tilemaps
      for (const [name, data] of Object.entries(loadedTilemaps)) {
        lastSavedTilemapsRef.current[name] = JSON.stringify(data)
      }
      
      if (Object.keys(loadedTilemaps).length > 0 && !selectedTilemapName) {
        const firstTilemap = Object.keys(loadedTilemaps)[0]
        setSelectedTilemapName(firstTilemap)
        const tilemap = loadedTilemaps[firstTilemap]
        setMapWidth(tilemap.width)
        setMapHeight(tilemap.height)
        if (tilemap.tilesetName && loadedTilesets[tilemap.tilesetName]) {
          const tileset = loadedTilesets[tilemap.tilesetName]
          const firstTile = Object.keys(tileset.tiles)[0]
          setSelectedTileName(firstTile || null)
        }
      }
    }
  }, [cart?.assets, selectedTilemapName])

  const currentTilemap = selectedTilemapName ? tilemaps[selectedTilemapName] : null
  const currentTileset = currentTilemap ? tilesets[currentTilemap.tilesetName] : null
  const tileNames = currentTileset ? Object.keys(currentTileset.tiles) : []

  const getGridCoords = useCallback((e: React.MouseEvent<HTMLDivElement>, container: HTMLDivElement): [number, number] | null => {
    const rect = container.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / tileSize)
    const y = Math.floor((e.clientY - rect.top) / tileSize)
    if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
      return [x, y]
    }
    return null
  }, [tileSize, mapWidth, mapHeight])

  const saveTilemap = useCallback(async (tilemapName: string, tilemapData: TileMap) => {
    if (!cart?.cartId || !user) {
      console.warn('Cannot save tilemap: missing cart or user')
      return
    }
    try {
      const content = JSON.stringify(tilemapData, null, 2)
      const path = `assets/${tilemapName}_map.json`
      await saveFile({
        cartId: cart.cartId,
        path,
        content,
        ownerId: user?.userId,
      })
      // Update cart context immediately so changes are reflected
      updateAsset(path, content)
      console.log(`Saved tilemap: ${path}`)
    } catch (error) {
      console.error('Failed to save tilemap:', error)
      alert(`Failed to save tilemap: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [cart?.cartId, cart, user, saveFile, updateAsset])

  const commitPaste = useCallback((x: number, y: number) => {
    if (!clipboard || !currentTilemap) return
    const newTiles = currentTilemap.tiles.map(row => [...row])
    for (let sy = 0; sy < clipboard.height; sy++) {
      for (let sx = 0; sx < clipboard.width; sx++) {
        const px = x + sx
        const py = y + sy
        if (px >= 0 && px < mapWidth && py >= 0 && py < mapHeight) {
          newTiles[py][px] = clipboard.tiles[sy][sx]
        }
      }
    }
    const newTilemaps = { ...tilemaps }
    newTilemaps[selectedTilemapName!] = { ...currentTilemap, tiles: newTiles }
    setTilemaps(newTilemaps)
    setPastePreview(null)
  }, [clipboard, currentTilemap, tilemaps, selectedTilemapName, mapWidth, mapHeight])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const coords = getGridCoords(e, container)
    if (!coords) return
    const [x, y] = coords

    // Handle paste preview drag or commit
    if (pastePreview && clipboard) {
      const previewX = pastePreview.x
      const previewY = pastePreview.y
      if (x >= previewX && x < previewX + clipboard.width && 
          y >= previewY && y < previewY + clipboard.height) {
        setIsDraggingPaste(true)
        return
      } else {
        commitPaste(pastePreview.x, pastePreview.y)
        return
      }
    }

    // Selection mode (Ctrl+Click or tool mode)
    if (e.ctrlKey || e.metaKey) {
      setIsSelecting(true)
      setSelection({ x0: x, y0: y, x1: x, y1: y })
      return
    }

    if (selectedTileName && currentTilemap) {
      const newTiles = currentTilemap.tiles.map(row => [...row])
      newTiles[y][x] = selectedTileName
      const newTilemaps = { ...tilemaps }
      newTilemaps[selectedTilemapName!] = { ...currentTilemap, tiles: newTiles }
      setTilemaps(newTilemaps)
    }
  }, [selectedTileName, currentTilemap, tilemaps, selectedTilemapName, pastePreview, clipboard, getGridCoords, commitPaste])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const coords = getGridCoords(e, container)
    if (!coords) return

    // Handle paste preview dragging
    if (isDraggingPaste && clipboard && pastePreview) {
      const [x, y] = coords
      setPastePreview({ x: Math.max(0, Math.min(mapWidth - clipboard.width, x - Math.floor(clipboard.width / 2))), 
                       y: Math.max(0, Math.min(mapHeight - clipboard.height, y - Math.floor(clipboard.height / 2))) })
      return
    }

    // Handle selection
    if (isSelecting && selection) {
      const [x, y] = coords
      setSelection({ ...selection, x1: x, y1: y })
      return
    }

    if (e.buttons === 1 && selectedTileName && currentTilemap && !isSelecting) {
      const [x, y] = coords
      const newTiles = currentTilemap.tiles.map(row => [...row])
      newTiles[y][x] = selectedTileName
      const newTilemaps = { ...tilemaps }
      newTilemaps[selectedTilemapName!] = { ...currentTilemap, tiles: newTiles }
      setTilemaps(newTilemaps)
    }
  }, [isDraggingPaste, clipboard, pastePreview, selectedTileName, currentTilemap, tilemaps, selectedTilemapName, getGridCoords, mapWidth, mapHeight, isSelecting, selection])

  const handleCanvasMouseUp = useCallback(() => {
    if (isDraggingPaste && pastePreview && clipboard) {
      commitPaste(pastePreview.x, pastePreview.y)
      setIsDraggingPaste(false)
    }
    if (isSelecting && selection) {
      setIsSelecting(false)
      const { x0, y0, x1, y1 } = selection
      const minX = Math.max(0, Math.min(x0, x1))
      const maxX = Math.min(mapWidth - 1, Math.max(x0, x1))
      const minY = Math.max(0, Math.min(y0, y1))
      const maxY = Math.min(mapHeight - 1, Math.max(y0, y1))
      setSelection({ x0: minX, y0: minY, x1: maxX, y1: maxY })
    }
  }, [isDraggingPaste, pastePreview, clipboard, isSelecting, selection, mapWidth, mapHeight, commitPaste])

  const handleCopy = useCallback(() => {
    if (!currentTilemap) return
    if (selection) {
      // Copy selected area
      const { x0, y0, x1, y1 } = selection
      const minX = Math.min(x0, x1)
      const maxX = Math.max(x0, x1)
      const minY = Math.min(y0, y1)
      const maxY = Math.max(y0, y1)
      const width = maxX - minX + 1
      const height = maxY - minY + 1
      const copied: string[][] = []
      for (let y = minY; y <= maxY; y++) {
        const row: string[] = []
        for (let x = minX; x <= maxX; x++) {
          row.push(currentTilemap.tiles[y]?.[x] || '')
        }
        copied.push(row)
      }
      setClipboard({ tiles: copied, width, height })
      setPastePreview({ x: 0, y: 0 })
    } else {
      // Copy a default area (top-left 10x10)
      const width = Math.min(10, mapWidth)
      const height = Math.min(10, mapHeight)
      const copied: string[][] = []
      for (let y = 0; y < height; y++) {
        const row: string[] = []
        for (let x = 0; x < width; x++) {
          row.push(currentTilemap.tiles[y]?.[x] || '')
        }
        copied.push(row)
      }
      setClipboard({ tiles: copied, width, height })
      setPastePreview({ x: 0, y: 0 })
    }
  }, [currentTilemap, mapWidth, mapHeight, selection])

  const handleCut = useCallback(() => {
    if (!currentTilemap) return
    const clipboardData = handleCopy()
    if (clipboardData) {
      // Clear the selected area
      const newTiles = currentTilemap.tiles.map(row => [...row])
      if (selection) {
        const { x0, y0, x1, y1 } = selection
        const minX = Math.min(x0, x1)
        const maxX = Math.max(x0, x1)
        const minY = Math.min(y0, y1)
        const maxY = Math.max(y0, y1)
        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            if (y < mapHeight && x < mapWidth) {
              newTiles[y][x] = ''
            }
          }
        }
      } else {
        // Clear default area
        for (let y = 0; y < Math.min(clipboardData.height, mapHeight); y++) {
          for (let x = 0; x < Math.min(clipboardData.width, mapWidth); x++) {
            newTiles[y][x] = ''
          }
        }
      }
      const newTilemaps = { ...tilemaps }
      newTilemaps[selectedTilemapName!] = { ...currentTilemap, tiles: newTiles }
      setTilemaps(newTilemaps)
      setSelection(null)
    }
  }, [currentTilemap, tilemaps, selectedTilemapName, mapWidth, mapHeight, handleCopy, selection])

  const handleAddTilemap = useCallback(() => {
    const tilemapName = `tilemap_${Date.now()}`
    const tilesetName = Object.keys(tilesets)[0] || 'default'
    const newTilemap: TileMap = {
      tilesetName,
      width: 20,
      height: 15,
      tiles: Array(15).fill(null).map(() => Array(20).fill('')),
    }
    const newTilemaps = { ...tilemaps }
    newTilemaps[tilemapName] = newTilemap
    setTilemaps(newTilemaps)
    setSelectedTilemapName(tilemapName)
    setMapWidth(20)
    setMapHeight(15)
    saveTilemap(tilemapName, newTilemap)
  }, [tilesets, tilemaps, saveTilemap])

  const handleDuplicateTilemap = useCallback(() => {
    if (!selectedTilemapName) return
    const tilemap = tilemaps[selectedTilemapName]
    if (!tilemap) return
    const newName = `${selectedTilemapName}_copy_${Date.now()}`
    const newTilemaps = { ...tilemaps }
    newTilemaps[newName] = {
      ...tilemap,
      tiles: tilemap.tiles.map(row => [...row]),
    }
    setTilemaps(newTilemaps)
    setSelectedTilemapName(newName)
    saveTilemap(newName, newTilemaps[newName])
  }, [selectedTilemapName, tilemaps, saveTilemap])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && currentTilemap) {
        e.preventDefault()
        handleCopy()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'x' && currentTilemap) {
        e.preventDefault()
        handleCut()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault()
        if (!pastePreview) {
          setPastePreview({ x: 0, y: 0 })
          setIsDraggingPaste(true)
        }
      } else if (e.key === 'Escape' && pastePreview) {
        setClipboard(null)
        setPastePreview(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTilemap, clipboard, pastePreview, handleCopy, handleCut])

  // Manual save function - saves all tilemaps
  const saveAllTilemaps = useCallback(async () => {
    if (!cart?.cartId || !user) {
      console.warn('Cannot save: missing cart or user')
      return false
    }
    
    try {
      // Save all tilemaps
      for (const tilemapName of Object.keys(tilemaps)) {
        const tilemapData = tilemaps[tilemapName]
        if (tilemapData) {
          await saveTilemap(tilemapName, tilemapData)
          // Update last saved state
          lastSavedTilemapsRef.current[tilemapName] = JSON.stringify(tilemapData)
        }
      }
      console.log('[MapEditor] Saved all tilemaps successfully')
      return true
    } catch (error) {
      console.error('Failed to save tilemaps:', error)
      alert(`Failed to save tilemaps: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }, [tilemaps, cart?.cartId, user, saveTilemap])

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    for (const tilemapName of Object.keys(tilemaps)) {
      const tilemapData = tilemaps[tilemapName]
      if (!tilemapData) continue
      const tilemapKey = JSON.stringify(tilemapData)
      const lastSaved = lastSavedTilemapsRef.current[tilemapName]
      if (lastSaved !== tilemapKey) {
        return true
      }
    }
    return false
  }, [tilemaps])

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  if (cartLoading || !cart) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      <div className="editor-toolbar text-retro-400 flex items-center gap-4 p-2 border-b border-gray-800">
        <span>Map Editor</span>
        <select
          className="input-retro text-xs h-8 px-2"
          value={selectedTilemapName || ''}
          onChange={(e) => {
            setSelectedTilemapName(e.target.value || null)
            const tilemap = e.target.value ? tilemaps[e.target.value] : null
            if (tilemap) {
              setMapWidth(tilemap.width)
              setMapHeight(tilemap.height)
            }
          }}
        >
          <option value="">Select Tilemap</option>
          {Object.keys(tilemaps).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <button className="btn-retro text-xs h-8 px-3" onClick={handleAddTilemap}>
          New Tilemap
        </button>
        {selectedTilemapName && (
          <button className="btn-retro text-xs h-8 px-3" onClick={handleDuplicateTilemap}>
            Duplicate
          </button>
        )}
        <div className="h-6 w-px bg-gray-700" />
        <button
          className="btn-retro text-xs h-8 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={saveAllTilemaps}
          disabled={!hasUnsavedChanges}
          title={hasUnsavedChanges ? "Save changes" : "No unsaved changes"}
        >
          💾 Save
        </button>
        {hasUnsavedChanges && (
          <span className="text-xs text-yellow-400">*</span>
        )}
        {(selection || clipboard) && (
          <>
            <div className="h-6 w-px bg-gray-700" />
            <button 
              className="btn-retro text-xs h-8 px-3 disabled:opacity-50" 
              onClick={handleCopy}
              disabled={!selection && !currentTilemap}
              title="Copy (Ctrl+C)"
            >
              Copy
            </button>
            <button 
              className="btn-retro text-xs h-8 px-3 disabled:opacity-50" 
              onClick={handleCut}
              disabled={!selection && !currentTilemap}
              title="Cut (Ctrl+X)"
            >
              Cut
            </button>
            {clipboard && (
              <button 
                className="btn-retro text-xs h-8 px-3" 
                onClick={() => {
                  if (!pastePreview) {
                    setPastePreview({ x: 0, y: 0 })
                  }
                }}
                title="Paste (Ctrl+V)"
              >
                Paste
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left sidebar - Tile palette */}
        <div className="w-64 border-r border-gray-800 bg-gray-900 overflow-y-auto">
          <div className="p-3">
            <div className="text-sm font-semibold text-gray-200 mb-3">Tiles</div>
            {tileNames.length === 0 ? (
              <div className="text-xs text-gray-500">No tiles available. Create tiles in the Tile Editor first.</div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {tileNames.map(name => {
                  const tile = currentTileset!.tiles[name]
                  return (
                    <div
                      key={name}
                      className={`aspect-square border-2 cursor-pointer transition-all ${
                        selectedTileName === name
                          ? 'border-retro-500 bg-retro-500/20'
                          : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                      }`}
                      onClick={() => setSelectedTileName(name)}
                      title={name}
                    >
                      {/* Tile preview would go here - simplified for now */}
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        {tile.width}×{tile.height}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Center - Map canvas */}
        <div className="flex-1 overflow-auto p-4">
          {currentTilemap ? (
            <div className="card-retro p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-200">Tilemap</div>
                <div className="text-xs text-gray-500">{mapWidth}×{mapHeight} tiles</div>
              </div>
              <div className="inline-block border-2 border-gray-600 bg-gray-900 relative">
                <div
                  className="grid select-none cursor-crosshair"
                  style={{
                    gridTemplateColumns: `repeat(${mapWidth}, ${tileSize}px)`,
                    gridTemplateRows: `repeat(${mapHeight}, ${tileSize}px)`,
                    width: `${mapWidth * tileSize}px`,
                    height: `${mapHeight * tileSize}px`,
                  }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                >
                  {currentTilemap.tiles.map((row, y) =>
                    row.map((tileName, x) => {
                      const tile = tileName ? currentTileset?.tiles[tileName] : null
                      return (
                        <div
                          key={`${x}-${y}`}
                          className="border border-gray-800"
                          style={{
                            width: `${tileSize}px`,
                            height: `${tileSize}px`,
                            backgroundColor: tile ? '#333' : '#111',
                          }}
                          title={`${x},${y}: ${tileName || 'empty'}`}
                        >
                          {tile && (
                            <div
                              className="w-full h-full"
                              style={{
                                backgroundColor: tile.pixels?.[0]?.[0] !== undefined ? '#666' : 'transparent',
                              }}
                            />
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
                {/* Selection overlay */}
                {selection && (
                  <div
                    className="absolute border-2 border-retro-500 pointer-events-none bg-retro-500/10"
                    style={{
                      left: `${Math.min(selection.x0, selection.x1) * tileSize}px`,
                      top: `${Math.min(selection.y0, selection.y1) * tileSize}px`,
                      width: `${(Math.abs(selection.x1 - selection.x0) + 1) * tileSize}px`,
                      height: `${(Math.abs(selection.y1 - selection.y0) + 1) * tileSize}px`,
                      zIndex: 12,
                    }}
                  />
                )}
                {/* Paste preview overlay */}
                {pastePreview && clipboard && (
                  <div
                    className="absolute border-2 border-blue-500 pointer-events-auto bg-blue-500/20 cursor-move"
                    style={{
                      left: `${pastePreview.x * tileSize}px`,
                      top: `${pastePreview.y * tileSize}px`,
                      width: `${clipboard.width * tileSize}px`,
                      height: `${clipboard.height * tileSize}px`,
                      zIndex: 15,
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-400">Select or create a tilemap to edit</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
