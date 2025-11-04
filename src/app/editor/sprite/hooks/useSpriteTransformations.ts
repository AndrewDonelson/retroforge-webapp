import { useCallback } from 'react'
import type { SpriteData } from '../types'
import { createEmptySprite } from '../utils/spriteUtils'

interface UseSpriteTransformationsProps {
  sprite: SpriteData
  width: number
  height: number
  onSpriteChange: (sprite: SpriteData) => void
  onWidthChange: (width: number) => void
  onHeightChange: (height: number) => void
  onHistorySave: (sprite: SpriteData) => void
}

export function useSpriteTransformations({
  sprite,
  width,
  height,
  onSpriteChange,
  onWidthChange,
  onHeightChange,
  onHistorySave,
}: UseSpriteTransformationsProps) {
  const flipHorizontal = useCallback(() => {
    const newSprite = sprite.map(row => [...row].reverse())
    onSpriteChange(newSprite)
    onHistorySave(newSprite)
  }, [sprite, onSpriteChange, onHistorySave])

  const flipVertical = useCallback(() => {
    const newSprite = [...sprite].reverse()
    onSpriteChange(newSprite)
    onHistorySave(newSprite)
  }, [sprite, onSpriteChange, onHistorySave])

  const rotateCW = useCallback(() => {
    const newSprite: SpriteData = Array(height).fill(null).map(() => Array(width).fill(-1))
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        newSprite[x][height - 1 - y] = sprite[y][x]
      }
    }
    onWidthChange(height)
    onHeightChange(width)
    onSpriteChange(newSprite)
    onHistorySave(newSprite)
  }, [sprite, width, height, onSpriteChange, onWidthChange, onHeightChange, onHistorySave])

  const rotateCCW = useCallback(() => {
    const newSprite: SpriteData = Array(height).fill(null).map(() => Array(width).fill(-1))
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        newSprite[height - 1 - x][y] = sprite[y][x]
      }
    }
    onWidthChange(height)
    onHeightChange(width)
    onSpriteChange(newSprite)
    onHistorySave(newSprite)
  }, [sprite, width, height, onSpriteChange, onWidthChange, onHeightChange, onHistorySave])

  const clearSprite = useCallback(() => {
    const newSprite = createEmptySprite(width, height)
    onSpriteChange(newSprite)
    onHistorySave(newSprite)
  }, [width, height, onSpriteChange, onHistorySave])

  return {
    flipHorizontal,
    flipVertical,
    rotateCW,
    rotateCCW,
    clearSprite,
  }
}

