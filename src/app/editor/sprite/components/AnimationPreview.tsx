import React, { useState, useEffect, useRef } from 'react'
import type { AnimationSequence, SpriteFrame } from '@/lib/cartUtils'
import type { Palette } from '@/data/palettes'

interface AnimationPreviewProps {
  animation: AnimationSequence | null
  frames: SpriteFrame[]
  spriteWidth: number
  spriteHeight: number
  currentPalette: Palette
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSetSpeed: (speed: number) => void
  onSetFrame: (frameIndex: number) => void
}

export function AnimationPreview({
  animation,
  frames,
  spriteWidth,
  spriteHeight,
  currentPalette,
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onSetSpeed,
  onSetFrame,
}: AnimationPreviewProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>()

  // Calculate current frame based on animation state
  useEffect(() => {
    if (!animation || animation.frameRefs.length === 0) {
      setCurrentFrameIndex(0)
      return
    }

    if (!isPlaying) {
      return
    }

    const updateAnimation = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime
      }

      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime

      setElapsedTime((prev) => {
        const newElapsed = prev + deltaTime
        const speed = animation.speed || 1.0
        const frameDuration = 100 / speed // Default 100ms per frame, adjusted by speed
        const totalDuration = animation.frameRefs.length * frameDuration

        let newFrameIndex = 0
        if (animation.loop !== false) {
          // Loop animation
          const loopTime = newElapsed % totalDuration
          newFrameIndex = Math.floor(loopTime / frameDuration)
          if (animation.loopType === 'reverse') {
            newFrameIndex = animation.frameRefs.length - 1 - (newFrameIndex % animation.frameRefs.length)
          } else if (animation.loopType === 'pingpong') {
            const forward = Math.floor(newElapsed / totalDuration) % 2 === 0
            if (forward) {
              newFrameIndex = Math.floor(loopTime / frameDuration) % animation.frameRefs.length
            } else {
              newFrameIndex = animation.frameRefs.length - 1 - (Math.floor(loopTime / frameDuration) % animation.frameRefs.length)
            }
          } else {
            newFrameIndex = newFrameIndex % animation.frameRefs.length
          }
        } else {
          // Non-looping animation
          newFrameIndex = Math.floor(newElapsed / frameDuration)
          if (newFrameIndex >= animation.frameRefs.length) {
            newFrameIndex = animation.frameRefs.length - 1
            onPause()
          }
        }

        setCurrentFrameIndex(newFrameIndex)
        onSetFrame(newFrameIndex)
        return newElapsed
      })

      animationRef.current = requestAnimationFrame(updateAnimation)
    }

    animationRef.current = requestAnimationFrame(updateAnimation)
    lastTimeRef.current = undefined

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animation, isPlaying, onPause, onSetFrame])

  const handleStop = () => {
    setElapsedTime(0)
    setCurrentFrameIndex(0)
    onStop()
    onSetFrame(0)
  }

  const currentFrameName = animation?.frameRefs[currentFrameIndex]
  const currentFrame = frames.find((f) => f.name === currentFrameName)
  const currentPixels = currentFrame?.pixels || []

  if (!animation) {
    return (
      <div className="card-retro p-4">
        <div className="text-sm font-semibold text-gray-200 mb-2">Animation Preview</div>
        <div className="text-xs text-gray-500 text-center py-8">
          Select an animation to preview
        </div>
      </div>
    )
  }

  return (
    <div className="card-retro p-4">
      <div className="text-sm font-semibold text-gray-200 mb-3">Animation Preview</div>
      
      {/* Preview canvas */}
      <div className="flex justify-center mb-4">
        <div className="inline-block border-2 border-gray-600 shadow-lg bg-gray-900">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${spriteWidth}, 8px)`,
              gridTemplateRows: `repeat(${spriteHeight}, 8px)`,
              width: `${spriteWidth * 8}px`,
              height: `${spriteHeight * 8}px`,
            }}
          >
            {currentPixels.flatMap((row: number[], y: number) =>
              row.map((colorIndex: number, x: number) => (
                <div
                  key={`${x}-${y}`}
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: colorIndex === -1
                      ? 'transparent'
                      : currentPalette.colors[colorIndex] || '#000000',
                    backgroundImage: colorIndex === -1
                      ? 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)'
                      : 'none',
                    backgroundSize: colorIndex === -1 ? '4px 4px' : 'auto',
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            className="btn-retro text-xs h-7 px-3 flex-1"
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            className="btn-retro text-xs h-7 px-3 flex-1"
            onClick={handleStop}
          >
            ⏹ Stop
          </button>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Speed:</label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={animation.speed || 1.0}
            onChange={(e) => onSetSpeed(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center mt-1">
            {(animation.speed || 1.0).toFixed(1)}x
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Frame:</label>
          <div className="flex items-center gap-2">
            <button
              className="btn-retro text-xs h-7 px-2"
              onClick={() => {
                const prevIndex = Math.max(0, currentFrameIndex - 1)
                setCurrentFrameIndex(prevIndex)
                onSetFrame(prevIndex)
              }}
              disabled={currentFrameIndex === 0}
            >
              ← Prev
            </button>
            <div className="flex-1 text-xs text-gray-300 text-center">
              {currentFrameIndex + 1} / {animation.frameRefs.length}
            </div>
            <button
              className="btn-retro text-xs h-7 px-2"
              onClick={() => {
                const nextIndex = Math.min(animation.frameRefs.length - 1, currentFrameIndex + 1)
                setCurrentFrameIndex(nextIndex)
                onSetFrame(nextIndex)
              }}
              disabled={currentFrameIndex === animation.frameRefs.length - 1}
            >
              Next →
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 text-center">
          Frame: <span className="text-gray-300">{currentFrameName || 'N/A'}</span>
        </div>
      </div>
    </div>
  )
}

