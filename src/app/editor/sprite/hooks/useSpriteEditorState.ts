import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { PRESET_64, type Palette } from '@/data/palettes'
import { useEditor } from '@/contexts/EditorContext'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/contexts/AuthContext'
import type { SpriteMap, MountPoint, SpriteFrame, AnimationSequence } from '@/lib/cartUtils'
import type { SpriteType, SpriteData } from '../types'
import { createEmptySprite } from '../utils/spriteUtils'

export function useSpriteEditorState() {
  const { cart, cartId, updateSprites } = useEditor()
  const { user } = useAuth()
  const saveFile = useMutation(api.cartFiles.saveCartFile)
  
  // Track last saved state to detect unsaved changes
  const lastSavedSpritesRef = useRef<string>('')
  // Track if we're loading from cart to prevent save loops
  const isLoadingFromCartRef = useRef<boolean>(false)
  // Track last loaded cart sprites to prevent unnecessary updates
  const lastLoadedCartSpritesRef = useRef<string>('')

  const [sprites, setSprites] = useState<SpriteMap>({})
  const [selectedSpriteName, setSelectedSpriteName] = useState<string | null>(null)
  const [editingSpriteName, setEditingSpriteName] = useState<string | null>(null)
  const [newSpriteName, setNewSpriteName] = useState('')
  const [width, setWidth] = useState<number>(16)
  const [height, setHeight] = useState<number>(16)
  const [customSize, setCustomSize] = useState<boolean>(false)
  const [spriteType, setSpriteType] = useState<SpriteType>('static')
  const [isUI, setIsUI] = useState<boolean>(true)
  const [currentFrameName, setCurrentFrameName] = useState<string | null>(null)
  const [frames, setFrames] = useState<SpriteFrame[]>([])
  const [animations, setAnimations] = useState<AnimationSequence[]>([])
  const [sprite, setSprite] = useState<SpriteData>(() => createEmptySprite(16, 16))
  const [useCollision, setUseCollision] = useState(false)
  const [mountPoints, setMountPoints] = useState<MountPoint[]>([])
  const [animationPlaying, setAnimationPlaying] = useState(false)
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationSequence | null>(null)

  const currentPalette = useMemo(() => {
    if (!cart?.manifest?.palette) return PRESET_64[0] // Default to RetroForge 48
    // Check 64-color palettes (new system)
    const matched64 = PRESET_64.find(p => p.name.toLowerCase() === cart.manifest.palette?.toLowerCase())
    return matched64 || PRESET_64[0] // Default to RetroForge 48 if not found
  }, [cart])

  // Load sprites from cart - filter out .rpi files
  useEffect(() => {
    // Don't load if we're currently saving (prevents loop)
    if (isSavingRef.current) return
    
    if (!cart?.sprites) {
      if (Object.keys(sprites).length > 0) {
        setSprites({})
      }
      return
    }
    
    // Create filtered sprites
    const filteredSprites: SpriteMap = {}
    for (const [name, spriteData] of Object.entries(cart.sprites)) {
      if (name.toLowerCase().endsWith('.rpi')) {
        console.warn(`[SpriteEditor] Skipping .rpi file "${name}"`)
        continue
      }
      if (spriteData && typeof spriteData === 'object' && 'width' in spriteData && 'height' in spriteData) {
        if (spriteData.width === 480 && spriteData.height === 270) {
          console.warn(`[SpriteEditor] Skipping sprite "${name}" with size 480x270`)
          continue
        }
        filteredSprites[name] = spriteData
      }
    }
    
    // Only update if sprites actually changed (deep comparison)
    const filteredSpritesKey = JSON.stringify(filteredSprites)
    const currentSpritesKey = JSON.stringify(sprites)
    
    // Only update if cart sprites are different from what we currently have
    if (filteredSpritesKey !== currentSpritesKey && lastLoadedCartSpritesRef.current !== filteredSpritesKey) {
      lastLoadedCartSpritesRef.current = filteredSpritesKey
      isLoadingFromCartRef.current = true
      setSprites(filteredSprites)
      // Update last saved ref to match loaded state
      lastSavedSpritesRef.current = filteredSpritesKey
      // Reset flag after state update completes (use longer timeout to ensure all effects have run)
      setTimeout(() => {
        isLoadingFromCartRef.current = false
      }, 100)
    }
  }, [cart?.sprites, sprites])


  // Track last loaded sprite to prevent unnecessary reloads
  const lastLoadedSpriteRef = useRef<string>('')
  
  // Load selected sprite into editor
  useEffect(() => {
    // Don't load if we're loading from cart (prevents loops)
    if (isLoadingFromCartRef.current) return
    
    if (!selectedSpriteName || !sprites[selectedSpriteName]) return
    
    const spriteData = sprites[selectedSpriteName]
    const spriteKey = `${selectedSpriteName}:${JSON.stringify(spriteData)}`
    
    // Only reload if sprite actually changed
    if (lastLoadedSpriteRef.current === spriteKey) return
    lastLoadedSpriteRef.current = spriteKey
    
    // Set isLoadingFromCartRef to prevent saveCurrentSprite from running
    isLoadingFromCartRef.current = true
    
    setWidth(spriteData.width)
    setHeight(spriteData.height)
    setCustomSize(![2, 4, 8, 16, 24, 32, 64, 128, 256].includes(spriteData.width) || ![2, 4, 8, 16, 24, 32, 64, 128, 256].includes(spriteData.height))
    setSpriteType(spriteData.type || 'static')
    setIsUI(spriteData.isUI !== undefined ? spriteData.isUI : true)
    setUseCollision(spriteData.useCollision || false)
    setMountPoints(spriteData.mountPoints || [])
    
    if (spriteData.frames) {
      setFrames(spriteData.frames)
      if (spriteData.frames.length > 0) {
        setCurrentFrameName(spriteData.frames[0].name)
        setSprite(spriteData.frames[0].pixels)
      } else {
        setCurrentFrameName(null)
      }
    } else {
      setFrames([])
      setCurrentFrameName(null)
    }
    
    if (spriteData.animations) {
      setAnimations(spriteData.animations)
      if (spriteData.animations.length > 0 && !selectedAnimation) {
        setSelectedAnimation(spriteData.animations[0])
      }
    } else {
      setAnimations([])
      setSelectedAnimation(null)
    }
    
    if (spriteData.type === 'static' || !spriteData.type) {
      if (spriteData.pixels) {
        setSprite(spriteData.pixels)
      } else {
        setSprite(createEmptySprite(spriteData.width, spriteData.height))
      }
    } else if (spriteData.frames && spriteData.frames.length > 0) {
      setSprite(spriteData.frames[0].pixels)
      setCurrentFrameName(spriteData.frames[0].name)
    } else {
      setSprite(createEmptySprite(spriteData.width, spriteData.height))
    }
    
    // Reset flag after state updates complete
    setTimeout(() => {
      isLoadingFromCartRef.current = false
    }, 100)
  }, [selectedSpriteName, sprites, selectedAnimation])

  // Update sprite size and recreate if needed (only if explicitly changed, not during loading)
  useEffect(() => {
    // Don't resize if we're loading from cart (prevents clearing sprites)
    if (isLoadingFromCartRef.current) return
    // Only resize if sprite dimensions don't match AND we have a selected sprite
    if (selectedSpriteName && sprites[selectedSpriteName] && 
        (sprite.length !== height || (sprite[0] && sprite[0].length !== width))) {
      // Check if this is actually a mismatch or just initial loading
      const spriteData = sprites[selectedSpriteName]
      if (spriteData.width === width && spriteData.height === height) {
        // Dimensions match sprite data, so don't clear - this might be a frame/animation sprite
        return
      }
      // Only resize if dimensions were explicitly changed by user (not during sprite load)
      const newSprite = createEmptySprite(width, height)
      setSprite(newSprite)
    }
  }, [width, height, selectedSpriteName, sprite, sprites])

  // Update current frame when editing frames/animation sprites
  useEffect(() => {
    if (spriteType !== 'static' && currentFrameName) {
      const frame = frames.find((f) => f.name === currentFrameName)
      if (frame) {
        const timeoutId = setTimeout(() => {
          const newFrames = frames.map((f) => (f.name === currentFrameName ? { ...f, pixels: sprite } : f))
          setFrames(newFrames)
        }, 500)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [sprite, currentFrameName, spriteType, frames])

  const [history, setHistory] = useState<SpriteData[]>([createEmptySprite(16, 16)])
  const [historyIndex, setHistoryIndex] = useState(0)

  const saveCurrentSprite = useCallback(() => {
    if (!selectedSpriteName) return
    // Don't save if we're loading from cart (prevents infinite loop)
    if (isLoadingFromCartRef.current) return
    
    const spriteData: import('@/lib/cartUtils').SpriteData = {
      width,
      height,
      type: spriteType,
      useCollision,
      isUI,
      mountPoints: mountPoints.length > 0 ? mountPoints : undefined,
    }
    
    if (spriteType === 'static') {
      spriteData.pixels = sprite
    } else {
      if (frames.length > 0) {
        spriteData.frames = frames.map(f => ({ ...f }))
      }
      if (spriteType === 'animation' && animations.length > 0) {
        spriteData.animations = animations.map(a => ({ ...a }))
      }
    }
    
    // Use functional update to avoid including sprites in dependency array
    setSprites((prevSprites) => {
      // Check if sprite actually changed before updating
      const currentSprite = prevSprites[selectedSpriteName]
      const currentSpriteKey = currentSprite ? JSON.stringify(currentSprite) : ''
      const newSpriteKey = JSON.stringify(spriteData)
      
      if (currentSpriteKey === newSpriteKey) {
        // Sprite hasn't changed, don't update
        return prevSprites
      }
      
      // Sprite changed, update it
      return {
        ...prevSprites,
        [selectedSpriteName]: spriteData
      }
    })
    // Don't call updateSprites here - let the save effect handle it to prevent loops
  }, [selectedSpriteName, width, height, spriteType, sprite, frames, animations, useCollision, isUI, mountPoints])

  // Manual save function
  const saveSprites = useCallback(async () => {
    if (!cartId || !user) {
      console.warn('Cannot save: missing cart or user')
      return false
    }
    
    try {
      // Update cart context immediately for UI responsiveness
      updateSprites(sprites)
      // Save to database
      await saveFile({
        cartId,
        path: 'assets/sprites.json',
        content: JSON.stringify(sprites, null, 2),
        ownerId: user.userId,
      })
      // Mark as saved
      lastSavedSpritesRef.current = JSON.stringify(sprites)
      console.log('[SpriteEditor] Saved sprites successfully')
      return true
    } catch (error) {
      console.error('Failed to save sprites:', error)
      alert(`Failed to save sprites: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }, [sprites, cartId, user, saveFile, updateSprites])

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (Object.keys(sprites).length === 0) return false
    const currentKey = JSON.stringify(sprites)
    return lastSavedSpritesRef.current !== currentKey
  }, [sprites])

  return {
    // State
    sprites,
    selectedSpriteName,
    editingSpriteName,
    newSpriteName,
    width,
    height,
    customSize,
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
    // Setters
    setSprites,
    setSelectedSpriteName,
    setEditingSpriteName,
    setNewSpriteName,
    setWidth,
    setHeight,
    setCustomSize,
    setSpriteType,
    setIsUI,
    setCurrentFrameName,
    setFrames,
    setAnimations,
    setSprite,
    setUseCollision,
    setMountPoints,
    setAnimationPlaying,
    setSelectedAnimation,
    // Actions
    saveCurrentSprite,
    saveSprites,
    hasUnsavedChanges,
  }
}

