import React, { useState, useEffect, useRef } from 'react'
import type { SpriteData } from '@/lib/cartUtils'
import type { Palette } from '@/data/palettes'

interface AnimatedSpritePreviewProps {
  spriteData: SpriteData
  width: number
  height: number
  currentPalette: Palette
  pixelSize?: number // Default 2px for list previews
}

/**
 * Animated sprite preview component that loops through frames for animation-type sprites
 */
export function AnimatedSpritePreview({
  spriteData,
  width,
  height,
  currentPalette,
  pixelSize = 2,
}: AnimatedSpritePreviewProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<DOMHighResTimeStamp | undefined>(undefined)

  // Get pixels based on sprite type
  const getCurrentPixels = (): number[][] => {
    if (!spriteData) return []
    
    if (spriteData.type === 'animation' && spriteData.animations && spriteData.animations.length > 0) {
      // Use first animation by default
      const anim = spriteData.animations[0]
      if (anim.frameRefs.length > 0) {
        const frameName = anim.frameRefs[currentFrameIndex % anim.frameRefs.length]
        const frame = spriteData.frames?.find((f) => f.name === frameName)
        return frame?.pixels || []
      }
    } else if (spriteData.type === 'frames' && spriteData.frames && spriteData.frames.length > 0) {
      // For frames type, cycle through all frames
      const frame = spriteData.frames[currentFrameIndex % spriteData.frames.length]
      return frame?.pixels || []
    } else if (spriteData.pixels) {
      // Static sprite
      return spriteData.pixels
    }
    return []
  }

  const pixels = getCurrentPixels()

  // Animate for animation and frames types
  useEffect(() => {
    if (!spriteData) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    const shouldAnimate =
      (spriteData.type === 'animation' && spriteData.animations && spriteData.animations.length > 0) ||
      (spriteData.type === 'frames' && spriteData.frames && spriteData.frames.length > 1)

    if (!shouldAnimate) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      setCurrentFrameIndex(0) // Reset to first frame for static sprites
      return
    }

    const defaultFrameDuration = 200 // 200ms per frame for preview
    let totalFrames = 0

    if (spriteData.type === 'animation' && spriteData.animations && spriteData.animations.length > 0) {
      const anim = spriteData.animations[0]
      totalFrames = anim.frameRefs.length
    } else if (spriteData.type === 'frames' && spriteData.frames) {
      totalFrames = spriteData.frames.length
    }

    if (totalFrames === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    const updateAnimation = (time: DOMHighResTimeStamp) => {
      if (lastTimeRef.current !== undefined) {
        const deltaTime = time - lastTimeRef.current
        if (deltaTime >= defaultFrameDuration) {
          setCurrentFrameIndex((prev) => (prev + 1) % totalFrames)
          lastTimeRef.current = time
        } else {
          lastTimeRef.current = lastTimeRef.current + deltaTime
        }
      } else {
        lastTimeRef.current = time
      }
      animationRef.current = requestAnimationFrame(updateAnimation)
    }

    animationRef.current = requestAnimationFrame(updateAnimation)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [spriteData?.type, spriteData?.animations?.length, spriteData?.frames?.length])

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${width}, ${pixelSize}px)`,
        gridTemplateRows: `repeat(${height}, ${pixelSize}px)`,
        width: `${width * pixelSize}px`,
        height: `${height * pixelSize}px`,
      }}
    >
      {pixels.flatMap((row: number[], y: number) =>
        row.map((colorIndex: number, x: number) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: `${pixelSize}px`,
              height: `${pixelSize}px`,
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
  )
}

