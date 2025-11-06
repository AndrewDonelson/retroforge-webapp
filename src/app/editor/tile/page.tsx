"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import type { TilesetMap, TilesetData } from '@/lib/cartUtils'
import type { Tool, SpriteData } from '../sprite/types'
import { useHistory } from '../sprite/hooks/useHistory'
import { useCanvasInteractions } from '../sprite/hooks/useCanvasInteractions'
import { useSpriteTransformations } from '../sprite/hooks/useSpriteTransformations'
import { PalettePanel } from '../sprite/components/PalettePanel'
import { Toolbar } from '../sprite/components/Toolbar'
import { SpriteCanvas } from '../sprite/components/SpriteCanvas'
import { SpritePreview } from '../sprite/components/SpritePreview'
import { ShapeSelectorModal } from '../sprite/components/ShapeSelectorModal'
import { createEmptySprite } from '../sprite/utils/spriteUtils'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/contexts/AuthContext'
import { PRESET_64 } from '@/data/palettes'

export default function TileEditorPage() {
  const { cart, isLoading: cartLoading, updateAsset } = useEditor()
  const { user } = useAuth()
  const saveFile = useMutation(api.cartFiles.saveCartFile)

  const [tilesets, setTilesets] = useState<Record<string, TilesetData>>({})
  const [selectedTilesetName, setSelectedTilesetName] = useState<string | null>(null)
  const [selectedTileName, setSelectedTileName] = useState<string | null>(null)
  const [width, setWidth] = useState<number>(16)
  const [height, setHeight] = useState<number>(16)
  const [sprite, setSprite] = useState<SpriteData>(() => createEmptySprite(16, 16))
  const [selectedColor, setSelectedColor] = useState<number>(2)
  const [tool, setTool] = useState<Tool>('pencil')
  const [brushSize, setBrushSize] = useState(1)
  const [shapeFilled, setShapeFilled] = useState(false)
  const [shapeSize, setShapeSize] = useState(4)
  const [selectedShape, setSelectedShape] = useState<'triangle' | 'diamond' | 'square' | 'pentagon' | 'hexagon' | 'star'>('triangle')
  const [clipboard, setClipboard] = useState<{ data: SpriteData; width: number; height: number } | null>(null)
  const [mountPointMode, setMountPointMode] = useState(false)
  const [mountPoints, setMountPoints] = useState<Array<{ x: number; y: number; name?: string }>>([])
  const [useCollision, setUseCollision] = useState(false)
  const [showShapeModal, setShowShapeModal] = useState(false)
  const [editingTileName, setEditingTileName] = useState<string | null>(null)
  const [newTileName, setNewTileName] = useState<string>('')

  const currentPalette = useMemo(() => {
    if (!cart?.manifest?.palette) return PRESET_64[0]
    const matched = PRESET_64.find(p => p.name.toLowerCase() === cart.manifest.palette?.toLowerCase())
    return matched || PRESET_64[0]
  }, [cart])

  // Track last save time to prevent overwriting recent changes
  const lastSaveTimeRef = useRef<Record<string, number>>({})
  // Track if we're loading from cart to prevent save loops
  const isLoadingFromCartRef = useRef<boolean>(false)
  // Track last saved tile state to prevent duplicate saves
  const lastSavedTileRef = useRef<string>('')
  // Track last saved tileset state per tileset to prevent duplicate saves
  const lastSavedTilesetStateRef = useRef<Record<string, string>>({})
  
  // Load tilesets from cart
  useEffect(() => {
    if (!cart?.assets) return
    
    const loadedTilesets: Record<string, TilesetData> = {}
    for (const [path, content] of Object.entries(cart.assets)) {
      // Support both old _tiles.json and new _tileset.json formats
      if (path.endsWith('_tileset.json') || path.endsWith('_tiles.json')) {
        try {
          const tilesetData = JSON.parse(content as string) as TilesetData
          const tilesetName = path.replace('_tileset.json', '').replace('_tiles.json', '').replace('assets/', '')
          loadedTilesets[tilesetName] = tilesetData
        } catch (e) {
          console.error(`Failed to parse tileset ${path}:`, e)
        }
      }
    }
    
    // Only update if tilesets actually changed (deep comparison)
    const loadedTilesetsKey = JSON.stringify(loadedTilesets)
    
    // Use functional update to avoid including tilesets in dependency array
    setTilesets((prev) => {
      const currentTilesetsKey = JSON.stringify(prev)
      
      // Only update if actually different
      if (loadedTilesetsKey === currentTilesetsKey) {
        return prev // No change, return same reference
      }
      
      // Merge loaded tilesets with existing state to preserve newly created tilesets
      // Priority: preserve local state if it was recently saved (within last 5 seconds)
      const now = Date.now()
      const merged = { ...loadedTilesets }
      
      // Add any local tilesets that aren't in cart (preserve newly created)
      for (const [name, data] of Object.entries(prev)) {
        const lastSaveTime = lastSaveTimeRef.current[name] || 0
        const timeSinceSave = now - lastSaveTime
        
        if (!merged[name]) {
          // Tileset doesn't exist in cart, preserve local version
          // This is important - newly created tilesets might not be in cart yet
          console.log(`Preserving local tileset ${name} (not in cart)`)
          merged[name] = data
        } else if (timeSinceSave < 5000) {
          // Recently saved (within 5 seconds) - preserve local version to prevent race condition
          console.log(`Preserving local state for ${name} (saved ${timeSinceSave}ms ago)`)
          merged[name] = data
        } else {
          // Check if local tileset has more tiles than loaded (might have unsaved tiles)
          const localTileCount = Object.keys(data.tiles || {}).length
          const loadedTileCount = Object.keys(loadedTilesets[name]?.tiles || {}).length
          if (localTileCount > loadedTileCount) {
            // Local has more tiles - preserve local version
            console.log(`Preserving local tileset ${name} (has ${localTileCount} tiles vs ${loadedTileCount} in cart)`)
            merged[name] = data
          } else {
            // Tileset exists in both and not recently saved - merge tiles: cart tiles override, but local-only tiles are preserved
            const mergedTiles = { ...data.tiles, ...loadedTilesets[name].tiles }
            merged[name] = {
              ...loadedTilesets[name],
              tiles: mergedTiles,
            }
          }
        }
      }
      
      // Update last saved state for all loaded tilesets
      for (const [name, data] of Object.entries(merged)) {
        lastSavedTilesetStateRef.current[name] = JSON.stringify(data)
      }
      
      // Set loading flag before returning
      isLoadingFromCartRef.current = true
      setTimeout(() => {
        isLoadingFromCartRef.current = false
      }, 100)
      
      return merged
    })
    
    if (Object.keys(loadedTilesets).length > 0 && !selectedTilesetName) {
      const firstTileset = Object.keys(loadedTilesets)[0]
      setSelectedTilesetName(firstTileset)
      const firstTile = Object.keys(loadedTilesets[firstTileset].tiles)[0]
      if (firstTile) {
        setSelectedTileName(firstTile)
      }
    }
  }, [cart?.assets, selectedTilesetName])

  // Track last loaded tile to prevent unnecessary reloads
  const lastLoadedTileRef = useRef<string>('')
  
  // Load selected tile
  useEffect(() => {
    // Don't load if we're loading from cart (prevents loops)
    if (isLoadingFromCartRef.current) return
    
    if (!selectedTilesetName || !selectedTileName || !tilesets[selectedTilesetName]) return
    
    const tile = tilesets[selectedTilesetName].tiles[selectedTileName]
    if (!tile) return
    
    // Create a key to track if we've already loaded this tile
    const tileKey = `${selectedTilesetName}:${selectedTileName}:${JSON.stringify(tile)}`
    if (lastLoadedTileRef.current === tileKey) {
      // Already loaded this tile, skip
      return
    }
    
    // Mark as loading to prevent save loops
    isLoadingFromCartRef.current = true
    
    // Only update if values actually changed
    setWidth((prev) => prev !== tile.width ? tile.width : prev)
    setHeight((prev) => prev !== tile.height ? tile.height : prev)
    setUseCollision((prev) => {
      const newValue = tile.useCollision || false
      return prev !== newValue ? newValue : prev
    })
    setMountPoints((prev) => {
      const newValue = tile.mountPoints || []
      // Deep compare to avoid unnecessary updates
      if (JSON.stringify(prev) === JSON.stringify(newValue)) return prev
      return newValue
    })
    
    if (tile.pixels) {
      // Deep compare sprite pixels to avoid unnecessary updates
      setSprite((prev) => {
        const prevKey = JSON.stringify(prev)
        const newKey = JSON.stringify(tile.pixels)
        if (prevKey === newKey) return prev
        return tile.pixels.map(row => [...row])
      })
    } else {
      setSprite((prev) => {
        // Only create new sprite if dimensions changed
        if (prev.length === tile.height && prev[0]?.length === tile.width) {
          return prev
        }
        return createEmptySprite(tile.width, tile.height)
      })
    }
    
    // Mark as loaded
    lastLoadedTileRef.current = tileKey
    
    // Reset loading flag after state updates
    setTimeout(() => {
      isLoadingFromCartRef.current = false
    }, 100)
  }, [selectedTilesetName, selectedTileName, tilesets])

  const historyHook = useHistory()
  const { undo, redo, saveToHistory, resetHistory, historyIndex, history } = historyHook

  const canvasInteractions = useCanvasInteractions({
    sprite,
    width,
    height,
    tool,
    selectedColor,
    brushSize,
    shapeFilled,
    shapeSize,
    selectedShape,
    mountPoints: mountPoints.map(mp => ({ x: mp.x, y: mp.y, name: mp.name })),
    mountPointMode,
    clipboard,
    onSpriteChange: setSprite,
    onMountPointsChange: (mps) => setMountPoints(mps.map(mp => ({ x: mp.x, y: mp.y, name: mp.name }))),
    onSelectedColorChange: setSelectedColor,
    onHistorySave: saveToHistory,
  })

  const {
    canvasRef,
    selection,
    displaySprite,
    pastePreview,
    clipboard: clipboardFromCanvas,
    isMovingSelection,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleCopy: handleCopyFromCanvas,
    handleCut: handleCutFromCanvas,
    handleMove: handleMoveFromCanvas,
    handleDeselect: handleDeselectFromCanvas,
    handlePaste,
  } = canvasInteractions

  const transformations = useSpriteTransformations({
    sprite,
    width,
    height,
    onSpriteChange: setSprite,
    onWidthChange: setWidth,
    onHeightChange: setHeight,
    onHistorySave: saveToHistory,
  })

  const handleCopy = useCallback(() => {
    const clipboardData = handleCopyFromCanvas()
    if (clipboardData) {
      setClipboard(clipboardData)
    }
  }, [handleCopyFromCanvas])

  const handleCut = useCallback(() => {
    const clipboardData = handleCutFromCanvas()
    if (clipboardData) {
      setClipboard(clipboardData)
      // Set paste preview at center after cut
      const centerX = Math.floor(width / 2)
      const centerY = Math.floor(height / 2)
      handlePaste(centerX - Math.floor(clipboardData.width / 2), centerY - Math.floor(clipboardData.height / 2), false)
    }
  }, [handleCutFromCanvas, width, height, handlePaste])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selection) {
        e.preventDefault()
        handleCopy()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selection) {
        e.preventDefault()
        handleCut()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault()
        if (!pastePreview) {
          const centerX = Math.floor(width / 2)
          const centerY = Math.floor(height / 2)
          handlePaste(centerX - Math.floor(clipboard.width / 2), centerY - Math.floor(clipboard.height / 2), false)
        }
      } else if (e.key === 'Escape' && pastePreview) {
        setClipboard(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selection, clipboard, pastePreview, width, height, handleCopy, handleCut, handlePaste])

  const pixelSize = useMemo(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768
      const availableWidth = isMobile ? window.innerWidth - 300 : 600
      const maxDimension = Math.max(width, height)
      return Math.max(12, Math.min(32, Math.floor(availableWidth / maxDimension)))
    }
    return 20
  }, [width, height])

  const isShapeTool = tool === 'shape'
  const isDrawingTool = ['line', 'circle', 'rectangle'].includes(tool)

  const saveTileset = useCallback(async (tilesetName: string, tilesetData: TilesetData) => {
    if (!cart?.cartId || !user) {
      console.warn('Cannot save tileset: missing cart or user')
      return
    }
    try {
      const content = JSON.stringify(tilesetData, null, 2)
      const path = `assets/${tilesetName}_tileset.json`
      await saveFile({
        cartId: cart.cartId,
        path,
        content,
        ownerId: user?.userId,
      })
      // Update cart context immediately so changes are reflected
      updateAsset(path, content)
      // Track save time to prevent race conditions
      lastSaveTimeRef.current[tilesetName] = Date.now()
      // Update last saved state for this tileset
      lastSavedTilesetStateRef.current[tilesetName] = JSON.stringify(tilesetData)
      console.log(`[TileEditor] Successfully saved tileset: ${path} at ${new Date().toISOString()}`)
    } catch (error) {
      console.error('Failed to save tileset:', error)
      alert(`Failed to save tileset: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [cart?.cartId, cart, user, saveFile, updateAsset])

  const handleUndo = useCallback(async () => {
    undo(sprite, async (newSprite) => {
      setSprite(newSprite)
      // Immediately save after undo
      if (selectedTilesetName && selectedTileName) {
        const newTilesets = { ...tilesets }
        if (!newTilesets[selectedTilesetName]) {
          newTilesets[selectedTilesetName] = { tiles: {}, isISO: false }
        }
        newTilesets[selectedTilesetName].tiles[selectedTileName] = {
          width,
          height,
          type: 'static',
          pixels: newSprite.map(row => [...row]),
          useCollision,
          mountPoints: mountPoints.map(mp => ({ x: mp.x, y: mp.y, name: mp.name })),
        }
        setTilesets(newTilesets)
        await saveTileset(selectedTilesetName, newTilesets[selectedTilesetName])
      }
    })
  }, [undo, sprite, selectedTilesetName, selectedTileName, tilesets, width, height, useCollision, mountPoints, saveTileset])

  const handleRedo = useCallback(async () => {
    redo(async (newSprite) => {
      setSprite(newSprite)
      // Immediately save after redo
      if (selectedTilesetName && selectedTileName) {
        const newTilesets = { ...tilesets }
        if (!newTilesets[selectedTilesetName]) {
          newTilesets[selectedTilesetName] = { tiles: {}, isISO: false }
        }
        newTilesets[selectedTilesetName].tiles[selectedTileName] = {
          width,
          height,
          type: 'static',
          pixels: newSprite.map(row => [...row]),
          useCollision,
          mountPoints: mountPoints.map(mp => ({ x: mp.x, y: mp.y, name: mp.name })),
        }
        setTilesets(newTilesets)
        await saveTileset(selectedTilesetName, newTilesets[selectedTilesetName])
      }
    })
  }, [redo, selectedTilesetName, selectedTileName, tilesets, width, height, useCollision, mountPoints, saveTileset])

  const handleAddTileset = useCallback(async () => {
    const name = prompt('Enter tileset name:')
    if (!name || !name.trim()) return
    const tilesetName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    if (tilesets[tilesetName]) {
      alert(`A tileset named "${tilesetName}" already exists.`)
      return
    }
    const newTilesets = { ...tilesets }
    const newTilesetData: TilesetData = { tiles: {}, isISO: false }
    newTilesets[tilesetName] = newTilesetData
    setTilesets(newTilesets)
    setSelectedTilesetName(tilesetName)
    // Immediately save new tileset - don't wait for auto-save effect
    // Mark save time to prevent it from being overwritten
    lastSaveTimeRef.current[tilesetName] = Date.now()
    // Update last saved ref to prevent duplicate save
    lastSavedTilesetStateRef.current[tilesetName] = JSON.stringify(newTilesetData)
    await saveTileset(tilesetName, newTilesetData)
    console.log(`Created and saved new tileset: ${tilesetName}`)
  }, [tilesets, saveTileset])

  const handleAddTile = useCallback(async () => {
    if (!selectedTilesetName) {
      // Create a new tileset if none selected
      await handleAddTileset()
      return
    }
    const tileName = `tile_${Date.now()}`
    const newTilesets = { ...tilesets }
    if (!newTilesets[selectedTilesetName]) {
      newTilesets[selectedTilesetName] = { tiles: {}, isISO: false }
    }
    newTilesets[selectedTilesetName].tiles[tileName] = {
      width: 16,
      height: 16,
      type: 'static',
      pixels: createEmptySprite(16, 16),
      useCollision: false,
      mountPoints: [],
    }
    setTilesets(newTilesets)
    setSelectedTileName(tileName)
    setWidth(16)
    setHeight(16)
    setSprite(createEmptySprite(16, 16))
    resetHistory(createEmptySprite(16, 16))
    // Mark save time and update ref
    lastSaveTimeRef.current[selectedTilesetName] = Date.now()
    lastSavedTilesetStateRef.current[selectedTilesetName] = JSON.stringify(newTilesets[selectedTilesetName])
    await saveTileset(selectedTilesetName, newTilesets[selectedTilesetName])
    console.log(`Added and saved new tile: ${tileName} to tileset: ${selectedTilesetName}`)
  }, [selectedTilesetName, tilesets, handleAddTileset, resetHistory, saveTileset])

  const handleDuplicateTile = useCallback(() => {
    if (!selectedTilesetName || !selectedTileName) return
    const tile = tilesets[selectedTilesetName]?.tiles[selectedTileName]
    if (!tile) return
    const newName = `${selectedTileName}_copy_${Date.now()}`
    const newTilesets = { ...tilesets }
    newTilesets[selectedTilesetName].tiles[newName] = {
      ...tile,
      pixels: tile.pixels ? tile.pixels.map(row => [...row]) : undefined,
      frames: tile.frames ? tile.frames.map(f => ({ ...f, pixels: f.pixels.map(row => [...row]) })) : undefined,
      animations: tile.animations ? tile.animations.map(a => ({ ...a })) : undefined,
      mountPoints: tile.mountPoints ? [...tile.mountPoints] : [],
    }
    setTilesets(newTilesets)
    setSelectedTileName(newName)
    saveTileset(selectedTilesetName, newTilesets[selectedTilesetName])
  }, [selectedTilesetName, selectedTileName, tilesets, saveTileset])

  const handleDeleteTile = useCallback(() => {
    if (!selectedTilesetName || !selectedTileName) return
    if (!confirm(`Delete tile "${selectedTileName}"?`)) return
    const newTilesets = { ...tilesets }
    delete newTilesets[selectedTilesetName].tiles[selectedTileName]
    setTilesets(newTilesets)
    setSelectedTileName(null)
    saveTileset(selectedTilesetName, newTilesets[selectedTilesetName])
  }, [selectedTilesetName, selectedTileName, tilesets, saveTileset])

  const handleRenameTile = useCallback((oldName: string) => {
    if (!selectedTilesetName || !tilesets[selectedTilesetName]) return
    setEditingTileName(oldName)
    setNewTileName(oldName)
  }, [selectedTilesetName, tilesets])

  const handleSaveRename = useCallback((oldName: string) => {
    if (!selectedTilesetName || !tilesets[selectedTilesetName]) return
    const trimmedName = newTileName.trim()
    if (!trimmedName || trimmedName === oldName) {
      setEditingTileName(null)
      setNewTileName('')
      return
    }
    // Check if new name already exists
    if (tilesets[selectedTilesetName].tiles[trimmedName]) {
      alert(`A tile named "${trimmedName}" already exists.`)
      setEditingTileName(null)
      setNewTileName('')
      return
    }
    const newTilesets = { ...tilesets }
    const tile = newTilesets[selectedTilesetName].tiles[oldName]
    if (tile) {
      // Rename the tile
      delete newTilesets[selectedTilesetName].tiles[oldName]
      newTilesets[selectedTilesetName].tiles[trimmedName] = tile
      setTilesets(newTilesets)
      setSelectedTileName(trimmedName)
      saveTileset(selectedTilesetName, newTilesets[selectedTilesetName])
    }
    setEditingTileName(null)
    setNewTileName('')
  }, [selectedTilesetName, tilesets, newTileName, saveTileset])

  const saveCurrentTile = useCallback(async () => {
    if (!selectedTilesetName || !selectedTileName) return
    // Don't save if we're loading from cart (prevents infinite loop)
    if (isLoadingFromCartRef.current) return
    
    const newTilesets = { ...tilesets }
    if (!newTilesets[selectedTilesetName]) {
      newTilesets[selectedTilesetName] = { tiles: {}, isISO: false }
    }
    newTilesets[selectedTilesetName].tiles[selectedTileName] = {
      width,
      height,
      type: 'static',
      pixels: sprite.map(row => [...row]),
      useCollision,
      mountPoints: mountPoints.map(mp => ({ x: mp.x, y: mp.y, name: mp.name })),
    }
    
    // Check if tile actually changed
    const tileKey = JSON.stringify(newTilesets[selectedTilesetName].tiles[selectedTileName])
    const currentTileKey = `${selectedTilesetName}:${selectedTileName}:${tileKey}`
    if (lastSavedTileRef.current === currentTileKey) {
      // Tile hasn't changed, don't update
      return
    }
    
    lastSavedTileRef.current = currentTileKey
    setTilesets(newTilesets)
    // Don't await - let the tileset save effect handle it
  }, [selectedTilesetName, selectedTileName, tilesets, width, height, sprite, useCollision, mountPoints])

  // Manual save function - saves all tilesets
  const saveAllTilesets = useCallback(async () => {
    if (!cart?.cartId || !user) {
      console.warn('Cannot save: missing cart or user')
      return false
    }
    
    try {
      // Save all tilesets
      for (const tilesetName of Object.keys(tilesets)) {
        const tilesetData = tilesets[tilesetName]
        if (tilesetData) {
          await saveTileset(tilesetName, tilesetData)
          // Update last saved state
          lastSavedTilesetStateRef.current[tilesetName] = JSON.stringify(tilesetData)
        }
      }
      console.log('[TileEditor] Saved all tilesets successfully')
      return true
    } catch (error) {
      console.error('Failed to save tilesets:', error)
      alert(`Failed to save tilesets: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }, [tilesets, cart?.cartId, user, saveTileset])

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    for (const tilesetName of Object.keys(tilesets)) {
      const tilesetData = tilesets[tilesetName]
      if (!tilesetData) continue
      const tilesetKey = JSON.stringify(tilesetData)
      const lastSaved = lastSavedTilesetStateRef.current[tilesetName]
      if (lastSaved !== tilesetKey) {
        return true
      }
    }
    return false
  }, [tilesets])

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

  const currentTileset = selectedTilesetName ? tilesets[selectedTilesetName] : null
  const tileNames = currentTileset ? Object.keys(currentTileset.tiles) : []

  return (
    <div className="h-full flex flex-col bg-gray-950">
      <div className="editor-toolbar text-retro-400 flex items-center gap-4 p-2 border-b border-gray-800">
        <span>Tile Editor</span>
        <select
          className="input-retro text-xs h-8 px-2"
          value={selectedTilesetName || ''}
          onChange={(e) => {
            setSelectedTilesetName(e.target.value || null)
            const tileset = e.target.value ? tilesets[e.target.value] : null
            if (tileset) {
              const firstTile = Object.keys(tileset.tiles)[0]
              setSelectedTileName(firstTile || null)
            }
          }}
        >
          <option value="">Select Tileset</option>
          {Object.keys(tilesets).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <button className="btn-retro text-xs h-8 px-3" onClick={handleAddTileset}>
          New Tileset
        </button>
        <button className="btn-retro text-xs h-8 px-3" onClick={handleAddTile} disabled={!selectedTilesetName}>
          Add Tile
        </button>
        <div className="h-6 w-px bg-gray-700" />
        <button
          className="btn-retro text-xs h-8 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={saveAllTilesets}
          disabled={!hasUnsavedChanges}
          title={hasUnsavedChanges ? "Save changes" : "No unsaved changes"}
        >
          💾 Save
        </button>
        {hasUnsavedChanges && (
          <span className="text-xs text-yellow-400">*</span>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left sidebar - Tile list */}
        <div className="w-64 border-r border-gray-800 bg-gray-900 overflow-y-auto">
          <div className="p-3">
            <div className="text-sm font-semibold text-gray-200 mb-3">Tiles</div>
            {tileNames.length === 0 ? (
              <div className="text-xs text-gray-500">No tiles. Click "Add Tile" to create one.</div>
            ) : (
              <div className="space-y-2">
                {tileNames.map(name => {
                  const tile = currentTileset!.tiles[name]
                  return (
                    <div
                      key={name}
                      className={`p-2 rounded border cursor-pointer transition-colors ${
                        selectedTileName === name
                          ? 'border-retro-500 bg-retro-500/20'
                          : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                      }`}
                      onClick={() => setSelectedTileName(name)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        {editingTileName === name ? (
                          <input
                            type="text"
                            className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-1 text-gray-200"
                            value={newTileName}
                            onChange={(e) => setNewTileName(e.target.value)}
                            onBlur={() => handleSaveRename(name)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveRename(name)
                              } else if (e.key === 'Escape') {
                                setEditingTileName(null)
                                setNewTileName('')
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
                                handleRenameTile(name)
                              }}
                              title="Double-click to rename"
                            >
                              {name}
                            </div>
                            <div className="flex gap-1">
                              <button
                                className="text-xs px-1 py-0.5 bg-blue-600 hover:bg-blue-500 rounded"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDuplicateTile()
                                }}
                                title="Duplicate tile"
                              >
                                ⧉
                              </button>
                              <button
                                className="text-xs px-1 py-0.5 bg-red-600 hover:bg-red-500 rounded"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteTile()
                                }}
                                title="Delete tile"
                              >
                                ×
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{tile.width}×{tile.height}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Tile editor */}
        <div className="flex-1 overflow-auto">
          {selectedTileName ? (
            <div className="h-full flex flex-col">
              <Toolbar
                tool={tool}
                brushSize={brushSize}
                shapeFilled={shapeFilled}
                shapeSize={shapeSize}
                selectedShape={selectedShape}
                isShapeTool={isShapeTool}
                isDrawingTool={isDrawingTool}
                selection={selection}
                clipboard={clipboard}
                isMovingSelection={isMovingSelection}
                width={width}
                height={height}
                historyIndex={historyIndex}
                historyLength={history.length}
                onSetTool={setTool}
                onSetBrushSize={setBrushSize}
                onSetShapeFilled={setShapeFilled}
                onSetShapeSize={setShapeSize}
                onShowShapeModal={() => setShowShapeModal(true)}
                onCopy={handleCopy}
                onCut={handleCut}
                onMove={handleMoveFromCanvas}
                onDeselect={handleDeselectFromCanvas}
                onPaste={handlePaste}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onFlipHorizontal={transformations.flipHorizontal}
                onFlipVertical={transformations.flipVertical}
                onRotateCW={transformations.rotateCW}
                onRotateCCW={transformations.rotateCCW}
                onClear={transformations.clearSprite}
              />

              <div className="flex-1 overflow-auto p-3">
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr_280px] gap-4">
                  <div className="lg:col-span-1">
                    <PalettePanel
                      palette={currentPalette}
                      selectedColor={selectedColor}
                      onSelectColor={setSelectedColor}
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <div className="card-retro p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-gray-200">Canvas</div>
                        <div className="text-xs text-gray-500">{width}×{height}px</div>
                      </div>
                      <div className="flex justify-center items-start gap-6 flex-wrap">
                        <SpriteCanvas
                          sprite={displaySprite}
                          width={width}
                          height={height}
                          pixelSize={pixelSize}
                          tool={tool}
                          currentPalette={currentPalette}
                          selection={selection}
                          mountPoints={mountPoints.map(mp => ({ x: mp.x, y: mp.y, name: mp.name }))}
                          pastePreview={pastePreview}
                          clipboard={clipboard}
                          canvasRef={canvasRef}
                          onMouseDown={handleCanvasMouseDown}
                          onMouseMove={handleCanvasMouseMove}
                          onMouseUp={handleCanvasMouseUp}
                        />
                        <SpritePreview
                          sprite={displaySprite}
                          width={width}
                          height={height}
                          currentPalette={currentPalette}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-400">Select a tile to edit</div>
            </div>
          )}
        </div>
      </div>

      {showShapeModal && (
        <ShapeSelectorModal
          onSelectShape={(shape) => {
            setSelectedShape(shape)
            setShowShapeModal(false)
            setTool('shape')
          }}
          onClose={() => setShowShapeModal(false)}
        />
      )}
    </div>
  )
}
