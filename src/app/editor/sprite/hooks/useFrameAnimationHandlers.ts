import { useCallback } from 'react'
import type { SpriteFrame, AnimationSequence } from '@/lib/cartUtils'
import { createEmptySprite } from '../utils/spriteUtils'

interface UseFrameAnimationHandlersProps {
  selectedSpriteName: string | null
  width: number
  height: number
  frames: SpriteFrame[]
  animations: AnimationSequence[]
  currentFrameName: string | null
  selectedAnimation: AnimationSequence | null
  setFrames: (frames: SpriteFrame[]) => void
  setAnimations: (animations: AnimationSequence[]) => void
  setCurrentFrameName: (name: string | null) => void
  setSprite: (sprite: import('../types').SpriteData) => void
  setSelectedAnimation: (anim: AnimationSequence | null) => void
  setAnimationPlaying: (playing: boolean) => void
  resetHistory: (sprite: import('../types').SpriteData) => void
}

export function useFrameAnimationHandlers({
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
}: UseFrameAnimationHandlersProps) {
  const handleAddFrame = useCallback(() => {
    if (!selectedSpriteName) return
    const frameName = `frame_${Date.now()}`
    const newFrame: SpriteFrame = {
      name: frameName,
      pixels: createEmptySprite(width, height),
    }
    const newFrames = [...frames, newFrame]
    setFrames(newFrames)
    setCurrentFrameName(frameName)
    setSprite(newFrame.pixels)
    resetHistory(newFrame.pixels)
  }, [selectedSpriteName, frames, width, height, setFrames, setCurrentFrameName, setSprite, resetHistory])

  const handleDeleteFrame = useCallback((frameName: string) => {
    const newFrames = frames.filter((f) => f.name !== frameName)
    setFrames(newFrames)
    if (currentFrameName === frameName) {
      if (newFrames.length > 0) {
        setCurrentFrameName(newFrames[0].name)
        setSprite(newFrames[0].pixels)
      } else {
        setCurrentFrameName(null)
        setSprite(createEmptySprite(width, height))
      }
    }
  }, [frames, currentFrameName, width, height, setFrames, setCurrentFrameName, setSprite])

  const handleDuplicateFrame = useCallback((frameName: string) => {
    const frame = frames.find((f) => f.name === frameName)
    if (!frame) return
    const newFrameName = `${frameName}_copy_${Date.now()}`
    const newFrame: SpriteFrame = {
      name: newFrameName,
      pixels: frame.pixels.map((row) => [...row]),
      duration: frame.duration,
    }
    setFrames([...frames, newFrame])
  }, [frames, setFrames])

  const handleRenameFrame = useCallback((oldName: string, newName: string) => {
    const newFrames = frames.map((f) => (f.name === oldName ? { ...f, name: newName } : f))
    setFrames(newFrames)
    if (currentFrameName === oldName) {
      setCurrentFrameName(newName)
    }
    const newAnimations = animations.map((anim) => ({
      ...anim,
      frameRefs: anim.frameRefs.map((ref) => (ref === oldName ? newName : ref)),
    }))
    setAnimations(newAnimations)
  }, [frames, currentFrameName, animations, setFrames, setCurrentFrameName, setAnimations])

  const handleSelectFrame = useCallback((frameName: string) => {
    const frame = frames.find((f) => f.name === frameName)
    if (frame) {
      setCurrentFrameName(frameName)
      setSprite(frame.pixels)
      resetHistory(frame.pixels)
    }
  }, [frames, setCurrentFrameName, setSprite, resetHistory])

  const handleAddAnimation = useCallback(() => {
    const animName = `anim_${Date.now()}`
    const newAnim: AnimationSequence = {
      name: animName,
      frameRefs: [],
      speed: 1.0,
      loop: true,
      loopType: 'forward',
    }
    setAnimations([...animations, newAnim])
    setSelectedAnimation(newAnim)
  }, [animations, setAnimations, setSelectedAnimation])

  const handleDeleteAnimation = useCallback((animName: string) => {
    const newAnimations = animations.filter((a) => a.name !== animName)
    setAnimations(newAnimations)
    if (selectedAnimation?.name === animName) {
      setSelectedAnimation(null)
      setAnimationPlaying(false)
    }
  }, [animations, selectedAnimation, setAnimations, setSelectedAnimation, setAnimationPlaying])

  const handleUpdateAnimation = useCallback((animName: string, updates: Partial<AnimationSequence>) => {
    const newAnimations = animations.map((a) => (a.name === animName ? { ...a, ...updates } : a))
    setAnimations(newAnimations)
    if (selectedAnimation?.name === animName) {
      setSelectedAnimation({ ...selectedAnimation, ...updates } as AnimationSequence)
    }
  }, [animations, selectedAnimation, setAnimations, setSelectedAnimation])

  const handleAddFrameToAnimation = useCallback((animName: string, frameName: string) => {
    const newAnimations = animations.map((a) => {
      if (a.name === animName) {
        return { ...a, frameRefs: [...a.frameRefs, frameName] }
      }
      return a
    })
    setAnimations(newAnimations)
    if (selectedAnimation?.name === animName) {
      setSelectedAnimation({ ...selectedAnimation, frameRefs: [...selectedAnimation.frameRefs, frameName] } as AnimationSequence)
    }
  }, [animations, selectedAnimation, setAnimations, setSelectedAnimation])

  const handleRemoveFrameFromAnimation = useCallback((animName: string, frameIndex: number) => {
    const newAnimations = animations.map((a) => {
      if (a.name === animName) {
        const newFrameRefs = [...a.frameRefs]
        newFrameRefs.splice(frameIndex, 1)
        return { ...a, frameRefs: newFrameRefs }
      }
      return a
    })
    setAnimations(newAnimations)
    if (selectedAnimation?.name === animName) {
      const newFrameRefs = [...selectedAnimation.frameRefs]
      newFrameRefs.splice(frameIndex, 1)
      setSelectedAnimation({ ...selectedAnimation, frameRefs: newFrameRefs } as AnimationSequence)
    }
  }, [animations, selectedAnimation, setAnimations, setSelectedAnimation])

  const handleReorderAnimationFrames = useCallback((animName: string, fromIndex: number, toIndex: number) => {
    const newAnimations = animations.map((a) => {
      if (a.name === animName) {
        const newFrameRefs = [...a.frameRefs]
        const [removed] = newFrameRefs.splice(fromIndex, 1)
        newFrameRefs.splice(toIndex, 0, removed)
        return { ...a, frameRefs: newFrameRefs }
      }
      return a
    })
    setAnimations(newAnimations)
    if (selectedAnimation?.name === animName) {
      const newFrameRefs = [...selectedAnimation.frameRefs]
      const [removed] = newFrameRefs.splice(fromIndex, 1)
      newFrameRefs.splice(toIndex, 0, removed)
      setSelectedAnimation({ ...selectedAnimation, frameRefs: newFrameRefs } as AnimationSequence)
    }
  }, [animations, selectedAnimation, setAnimations, setSelectedAnimation])

  const handleImportSpriteSheet = useCallback((importedFrames: SpriteFrame[]) => {
    const newFrames = [...frames, ...importedFrames]
    setFrames(newFrames)
    if (importedFrames.length > 0) {
      setCurrentFrameName(importedFrames[0].name)
      setSprite(importedFrames[0].pixels)
      resetHistory(importedFrames[0].pixels)
    }
  }, [frames, setFrames, setCurrentFrameName, setSprite, resetHistory])

  return {
    handleAddFrame,
    handleDeleteFrame,
    handleDuplicateFrame,
    handleRenameFrame,
    handleSelectFrame,
    handleAddAnimation,
    handleDeleteAnimation,
    handleUpdateAnimation,
    handleAddFrameToAnimation,
    handleRemoveFrameFromAnimation,
    handleReorderAnimationFrames,
    handleImportSpriteSheet,
  }
}

