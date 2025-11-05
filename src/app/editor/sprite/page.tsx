"use client"

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import type { SpriteFrame, AnimationSequence } from '@/lib/cartUtils'
import type { Tool, SimpleShape, SpriteType } from './types'
import { useSpriteEditorState } from './hooks/useSpriteEditorState'
import { useHistory } from './hooks/useHistory'
import { useCanvasInteractions } from './hooks/useCanvasInteractions'
import { useSpriteTransformations } from './hooks/useSpriteTransformations'
import { useSpriteActions } from './hooks/useSpriteActions'
import { useFrameAnimationHandlers } from './hooks/useFrameAnimationHandlers'
import { SpriteList } from './components/SpriteList'
import { PalettePanel } from './components/PalettePanel'
import { Toolbar } from './components/Toolbar'
import { FrameList } from './components/FrameList'
import { AnimationEditor } from './components/AnimationEditor'
import { AnimationPreview } from './components/AnimationPreview'
import { SpriteSheetImport } from './components/SpriteSheetImport'
import { SpriteCanvas } from './components/SpriteCanvas'
import { SpritePreview } from './components/SpritePreview'
import { PropertiesPanel } from './components/PropertiesPanel'
import { SpriteEditorHeader } from './components/SpriteEditorHeader'
import { ShapeSelectorModal } from './components/ShapeSelectorModal'

export default function SpriteEditorPage() {
  const { cart, isLoading: cartLoading, updateSprites } = useEditor()
  
  // State management
  const state = useSpriteEditorState()
  const {
    sprites,
    selectedSpriteName,
    editingSpriteName,
    newSpriteName,
    width,
    height,
    spriteType,
    isUI,
    currentFrameName,
    frames,
    animations,
    sprite,
    useCollision,
    mountPoints,
    animationPlaying,
    selectedAnimation,
    currentPalette,
    setSprites,
    setSelectedSpriteName,
    setEditingSpriteName,
    setNewSpriteName,
    setWidth,
    setHeight,
    setSpriteType,
    setIsUI,
    setCurrentFrameName,
    setFrames,
    setAnimations,
    setSprite,
    setUseCollision,
    setMountPoints,
    setSelectedAnimation,
    setAnimationPlaying,
    saveCurrentSprite,
  } = state

  // History management
  const historyHook = useHistory()
  const { undo, redo, saveToHistory, resetHistory, historyIndex, history } = historyHook

  // Drawing tools state
  const [selectedColor, setSelectedColor] = useState<number>(2)
  const [tool, setTool] = useState<Tool>('pencil')
  const [brushSize, setBrushSize] = useState(1)
  const [shapeFilled, setShapeFilled] = useState(false)
  const [shapeSize, setShapeSize] = useState(4)
  const [selectedShape, setSelectedShape] = useState<SimpleShape>('triangle')
  const [showShapeModal, setShowShapeModal] = useState(false)
  const [clipboard, setClipboard] = useState<{ data: import('./types').SpriteData; width: number; height: number } | null>(null)
  const [mountPointMode, setMountPointMode] = useState(false)
  const [showSpriteSheetImport, setShowSpriteSheetImport] = useState(false)

  // Canvas interactions
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
    mountPoints,
    mountPointMode,
    clipboard,
    onSpriteChange: setSprite,
    onMountPointsChange: setMountPoints,
    onSelectedColorChange: setSelectedColor,
    onHistorySave: saveToHistory,
  })

  const {
    canvasRef,
    selection,
    displaySprite,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleCopy: handleCopyFromCanvas,
    handlePaste,
  } = canvasInteractions

  // Sprite transformations
  const transformations = useSpriteTransformations({
    sprite,
    width,
    height,
    onSpriteChange: setSprite,
    onWidthChange: setWidth,
    onHeightChange: setHeight,
    onHistorySave: saveToHistory,
  })

  // Sprite actions
  const spriteActions = useSpriteActions({
    sprites,
    setSprites,
    updateSprites,
    selectedSpriteName,
    setSelectedSpriteName,
    setEditingSpriteName,
    setNewSpriteName,
    setWidth,
    setHeight,
    setCustomSize: () => {}, // Not used in refactored version
    setSpriteType,
    setIsUI,
    setFrames,
    setAnimations,
    setCurrentFrameName,
    setSprite,
    setUseCollision,
    setMountPoints,
    setSelectedAnimation,
    setAnimationPlaying,
    resetHistory,
    saveCurrentSprite,
  })

  // Frame and animation handlers
  const frameAnimationHandlers = useFrameAnimationHandlers({
    selectedSpriteName,
    width,
    height,
    frames,
    animations,
    currentFrameName,
    selectedAnimation,
    setFrames,
    setAnimations,
    setCurrentFrameName,
    setSprite,
    setSelectedAnimation,
    setAnimationPlaying,
    resetHistory,
  })

  // Handle copy
  const handleCopy = useCallback(() => {
    const clipboardData = handleCopyFromCanvas()
    if (clipboardData) {
      setClipboard(clipboardData)
    }
  }, [handleCopyFromCanvas])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selection) {
        e.preventDefault()
        handleCopy()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault()
        const centerX = Math.floor(width / 2)
        const centerY = Math.floor(height / 2)
        handlePaste(centerX - Math.floor(clipboard.width / 2), centerY - Math.floor(clipboard.height / 2))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selection, clipboard, width, height, handleCopy, handlePaste])

  // Calculate pixel size
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

  const handleUndo = useCallback(() => {
    undo(sprite, setSprite)
  }, [undo, sprite, setSprite])

  const handleRedo = useCallback(() => {
    redo(setSprite)
  }, [redo, setSprite])

  const handleShapeSelect = useCallback((shape: SimpleShape) => {
    setSelectedShape(shape)
    setShowShapeModal(false)
    setTool('shape')
  }, [setTool])

  // Handle sprite type change
  const handleSpriteTypeChange = useCallback((newType: SpriteType) => {
    setSpriteType(newType)
    if (newType === 'frames' || newType === 'animation') {
      if (frames.length === 0) {
        const frameName = `frame_${Date.now()}`
        const newFrame: SpriteFrame = {
          name: frameName,
          pixels: sprite.map((row) => [...row]),
        }
        setFrames([newFrame])
        setCurrentFrameName(frameName)
      }
    }
  }, [sprite, frames, setSpriteType, setFrames, setCurrentFrameName])

  if (cartLoading || !cart) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <SpriteEditorHeader
        onAddSprite={spriteActions.handleAddSprite}
        selectedSpriteName={selectedSpriteName}
        width={width}
        height={height}
        isUI={isUI}
        spriteType={spriteType}
        onWidthChange={setWidth}
        onHeightChange={setHeight}
        onIsUIChange={setIsUI}
        onSpriteTypeChange={handleSpriteTypeChange}
      />

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left sidebar - Sprite list */}
        <SpriteList
          sprites={sprites}
          selectedSpriteName={selectedSpriteName}
          editingSpriteName={editingSpriteName}
          newSpriteName={newSpriteName}
          currentPalette={currentPalette}
          onSelectSprite={spriteActions.handleSelectSprite}
          onRenameSprite={spriteActions.handleRenameSprite}
          onSaveRename={(oldName) => spriteActions.handleSaveRename(oldName, newSpriteName)}
          onSetNewSpriteName={setNewSpriteName}
          onSetEditingSpriteName={setEditingSpriteName}
          onDuplicateSprite={spriteActions.handleDuplicateSprite}
          onDeleteSprite={spriteActions.handleDeleteSprite}
        />

        {/* Right side - Sprite editor */}
        <div className="flex-1 overflow-auto">
          {selectedSpriteName ? (
            <div className="h-full flex flex-col">
              {/* Toolbar */}
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
                onPaste={handlePaste}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onFlipHorizontal={transformations.flipHorizontal}
                onFlipVertical={transformations.flipVertical}
                onRotateCW={transformations.rotateCW}
                onRotateCCW={transformations.rotateCCW}
                onClear={transformations.clearSprite}
              />

              {/* Canvas area */}
              <div className="flex-1 overflow-auto p-3">
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr_280px] gap-4">
                  {/* Left - Palette */}
                  <div className="lg:col-span-1">
                    <PalettePanel
                      palette={currentPalette}
                      selectedColor={selectedColor}
                      onSelectColor={setSelectedColor}
                    />
                  </div>

                  {/* Center - Canvas */}
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
                          mountPoints={mountPoints}
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

                  {/* Right side - Frames/Animations/Properties */}
                  <div className="lg:col-span-1 space-y-4">
                    {/* Frame List */}
                    {(spriteType === 'frames' || spriteType === 'animation') && (
                      <FrameList
                        frames={frames}
                        currentFrameName={currentFrameName}
                        spriteWidth={width}
                        spriteHeight={height}
                        currentPalette={currentPalette}
                        onSelectFrame={frameAnimationHandlers.handleSelectFrame}
                        onAddFrame={frameAnimationHandlers.handleAddFrame}
                        onDeleteFrame={frameAnimationHandlers.handleDeleteFrame}
                        onDuplicateFrame={frameAnimationHandlers.handleDuplicateFrame}
                        onRenameFrame={frameAnimationHandlers.handleRenameFrame}
                        onImportSpriteSheet={() => setShowSpriteSheetImport(true)}
                      />
                    )}

                    {/* Animation Editor */}
                    {spriteType === 'animation' && (
                      <>
                        <AnimationEditor
                          animations={animations}
                          frames={frames}
                          onAddAnimation={frameAnimationHandlers.handleAddAnimation}
                          onDeleteAnimation={frameAnimationHandlers.handleDeleteAnimation}
                          onUpdateAnimation={frameAnimationHandlers.handleUpdateAnimation}
                          onAddFrameToAnimation={frameAnimationHandlers.handleAddFrameToAnimation}
                          onRemoveFrameFromAnimation={frameAnimationHandlers.handleRemoveFrameFromAnimation}
                          onReorderAnimationFrames={frameAnimationHandlers.handleReorderAnimationFrames}
                        />
                        {animations.length > 0 && (
                          <div className="card-retro p-4">
                            <label className="block text-sm font-semibold text-gray-200 mb-2">
                              Preview Animation:
                            </label>
                            <select
                              value={selectedAnimation?.name || ''}
                              onChange={(e) => {
                                const anim = animations.find((a) => a.name === e.target.value)
                                setSelectedAnimation(anim || null)
                                setAnimationPlaying(false)
                              }}
                              className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                            >
                              <option value="">Select animation...</option>
                              {animations.map((anim) => (
                                <option key={anim.name} value={anim.name}>
                                  {anim.name} ({anim.frameRefs.length} frames)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    {/* Animation Preview */}
                    {spriteType === 'animation' && selectedAnimation && (
                      <AnimationPreview
                        animation={selectedAnimation}
                        frames={frames}
                        spriteWidth={width}
                        spriteHeight={height}
                        currentPalette={currentPalette}
                        isPlaying={animationPlaying}
                        onPlay={() => setAnimationPlaying(true)}
                        onPause={() => setAnimationPlaying(false)}
                        onStop={() => setAnimationPlaying(false)}
                        onSetSpeed={(speed) => frameAnimationHandlers.handleUpdateAnimation(selectedAnimation.name, { speed })}
                        onSetFrame={() => {}}
                      />
                    )}

                    {/* Properties Panel */}
                    <PropertiesPanel
                      useCollision={useCollision}
                      onUseCollisionChange={setUseCollision}
                      mountPoints={mountPoints}
                      onMountPointsChange={setMountPoints}
                      width={width}
                      height={height}
                      mountPointMode={mountPointMode}
                      onMountPointModeChange={setMountPointMode}
                    />
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

      {/* Modals */}
      {showSpriteSheetImport && (
        <SpriteSheetImport
          spriteWidth={width}
          spriteHeight={height}
          currentPalette={currentPalette}
          onImportFrames={frameAnimationHandlers.handleImportSpriteSheet}
          onClose={() => setShowSpriteSheetImport(false)}
        />
      )}

      {showShapeModal && (
        <ShapeSelectorModal
          selectedShape={selectedShape}
          shapeSize={shapeSize}
          shapeFilled={shapeFilled}
          maxSize={Math.max(width, height)}
          onSelectShape={handleShapeSelect}
          onSizeChange={setShapeSize}
          onFilledChange={setShapeFilled}
          onClose={() => setShowShapeModal(false)}
        />
      )}
    </div>
  )
}

