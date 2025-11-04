import { useState, useCallback, useEffect, useMemo } from 'react'
import { PRESET_50, type Palette } from '@/data/palettes'
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
    if (!cart?.manifest?.palette) return PRESET_50[0]
    const matched = PRESET_50.find(p => p.name.toLowerCase() === cart.manifest.palette?.toLowerCase())
    return matched || PRESET_50[0]
  }, [cart])

  // Load sprites from cart - filter out .rpi files
  useEffect(() => {
    if (cart?.sprites && Object.keys(cart.sprites).length > 0) {
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
      setSprites(filteredSprites)
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
    }
  }, [selectedSpriteName, sprites, selectedAnimation])

  // Update sprite size and recreate if needed
  useEffect(() => {
    if (selectedSpriteName && (sprite.length !== height || (sprite[0] && sprite[0].length !== width))) {
      const newSprite = createEmptySprite(width, height)
      setSprite(newSprite)
    }
  }, [width, height, selectedSpriteName, sprite])

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
    
    const newSprites: SpriteMap = {
      ...sprites,
      [selectedSpriteName]: spriteData
    }
    setSprites(newSprites)
    updateSprites(newSprites)
  }, [selectedSpriteName, sprites, width, height, spriteType, sprite, frames, animations, useCollision, isUI, mountPoints, updateSprites])

  // Auto-save current sprite when it changes (debounced)
  useEffect(() => {
    if (!selectedSpriteName) return
    const timeoutId = setTimeout(() => {
      saveCurrentSprite()
    }, 1000)
    return () => clearTimeout(timeoutId)
  }, [sprite, width, height, spriteType, frames, animations, selectedSpriteName, useCollision, isUI, mountPoints, saveCurrentSprite])

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
  }
}

