import { useCallback } from 'react'
import type { SpriteMap, SpriteFrame, AnimationSequence } from '@/lib/cartUtils'
import { createEmptySprite } from '../utils/spriteUtils'

interface UseSpriteActionsProps {
  sprites: SpriteMap
  setSprites: (sprites: SpriteMap) => void
  updateSprites: (sprites: SpriteMap) => void
  selectedSpriteName: string | null
  setSelectedSpriteName: (name: string | null) => void
  setEditingSpriteName: (name: string | null) => void
  setNewSpriteName: (name: string) => void
  setWidth: (width: number) => void
  setHeight: (height: number) => void
  setCustomSize: (custom: boolean) => void
  setSpriteType: (type: import('../types').SpriteType) => void
  setIsUI: (isUI: boolean) => void
  setFrames: (frames: SpriteFrame[]) => void
  setAnimations: (animations: AnimationSequence[]) => void
  setCurrentFrameName: (name: string | null) => void
  setSprite: (sprite: import('../types').SpriteData) => void
  setUseCollision: (use: boolean) => void
  setMountPoints: (points: import('@/lib/cartUtils').MountPoint[]) => void
  setSelectedAnimation: (anim: AnimationSequence | null) => void
  setAnimationPlaying: (playing: boolean) => void
  resetHistory: (sprite: import('../types').SpriteData) => void
  saveCurrentSprite?: () => void
}

export function useSpriteActions({
  sprites,
  setSprites,
  updateSprites,
  selectedSpriteName,
  setSelectedSpriteName,
  setEditingSpriteName,
  setNewSpriteName,
  setWidth,
  setHeight,
  setCustomSize,
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
}: UseSpriteActionsProps) {
  const handleAddSprite = useCallback(() => {
    const name = `sprite_${Date.now()}`
    const newSprites: SpriteMap = {
      ...sprites,
      [name]: {
        width: 16,
        height: 16,
        type: 'static',
        pixels: createEmptySprite(16, 16),
        useCollision: false,
        isUI: true,
        mountPoints: [],
      }
    }
    setSprites(newSprites)
    updateSprites(newSprites)
    setSelectedSpriteName(name)
    setWidth(16)
    setHeight(16)
    setCustomSize(false)
    setSpriteType('static')
    setIsUI(true)
    setFrames([])
    setAnimations([])
    setCurrentFrameName(null)
    setSprite(createEmptySprite(16, 16))
    resetHistory(createEmptySprite(16, 16))
    setUseCollision(false)
    setMountPoints([])
  }, [sprites, setSprites, updateSprites, setSelectedSpriteName, setWidth, setHeight, setCustomSize, setSpriteType, setIsUI, setFrames, setAnimations, setCurrentFrameName, setSprite, setUseCollision, setMountPoints, resetHistory])

  const handleDeleteSprite = useCallback((name: string) => {
    if (!confirm(`Delete sprite "${name}"?`)) return
    const newSprites = { ...sprites }
    delete newSprites[name]
    setSprites(newSprites)
    updateSprites(newSprites)
    if (selectedSpriteName === name) {
      setSelectedSpriteName(null)
      setSprite(createEmptySprite(16, 16))
      setFrames([])
      setAnimations([])
      setCurrentFrameName(null)
      setSelectedAnimation(null)
      setAnimationPlaying(false)
    }
  }, [sprites, setSprites, updateSprites, selectedSpriteName, setSelectedSpriteName, setSprite, setFrames, setAnimations, setCurrentFrameName, setSelectedAnimation, setAnimationPlaying])

  const handleDuplicateSprite = useCallback((name: string) => {
    const spriteData = sprites[name]
    const newName = `${name}_copy_${Date.now()}`
    const newSprites: SpriteMap = {
      ...sprites,
      [newName]: {
        width: spriteData.width,
        height: spriteData.height,
        type: spriteData.type || 'static',
        pixels: spriteData.pixels ? spriteData.pixels.map(row => [...row]) : undefined,
        frames: spriteData.frames ? spriteData.frames.map(f => ({
          ...f,
          pixels: f.pixels.map(row => [...row])
        })) : undefined,
        animations: spriteData.animations ? spriteData.animations.map(a => ({ ...a })) : undefined,
        useCollision: spriteData.useCollision || false,
        isUI: spriteData.isUI !== undefined ? spriteData.isUI : true,
        mountPoints: spriteData.mountPoints ? [...spriteData.mountPoints] : [],
      }
    }
    setSprites(newSprites)
    updateSprites(newSprites)
    setSelectedSpriteName(newName)
  }, [sprites, setSprites, updateSprites, setSelectedSpriteName])

  const handleSelectSprite = useCallback((name: string) => {
    if (selectedSpriteName && saveCurrentSprite) {
      saveCurrentSprite()
    }
    setSelectedSpriteName(name)
  }, [selectedSpriteName, saveCurrentSprite, setSelectedSpriteName])

  const handleRenameSprite = useCallback((oldName: string) => {
    setEditingSpriteName(oldName)
    setNewSpriteName(oldName)
  }, [setEditingSpriteName, setNewSpriteName])

  const handleSaveRename = useCallback((oldName: string, newSpriteName: string) => {
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
  }, [sprites, setSprites, updateSprites, selectedSpriteName, setSelectedSpriteName, setEditingSpriteName])

  return {
    handleAddSprite,
    handleDeleteSprite,
    handleDuplicateSprite,
    handleSelectSprite,
    handleRenameSprite,
    handleSaveRename,
  }
}

