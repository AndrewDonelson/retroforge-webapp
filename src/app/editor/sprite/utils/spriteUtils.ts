export type SpriteData = number[][] // Pixel data for a single frame

export function createEmptySprite(width: number, height: number): SpriteData {
  return Array(height).fill(null).map(() => Array(width).fill(-1))
}

// Validate sprite size based on new rules
export function validateSpriteSize(width: number, height: number, isUI: boolean): string | null {
  // Minimum size: 2x2
  if (width < 2 || height < 2) {
    return 'Sprite dimensions must be at least 2×2 pixels'
  }
  
  if (isUI) {
    // UI sprites: 2-256, both dimensions divisible by 2
    if (width > 256 || height > 256) {
      return 'UI sprite dimensions cannot exceed 256 pixels'
    }
    if (width % 2 !== 0 || height % 2 !== 0) {
      return 'UI sprite dimensions must be divisible by 2'
    }
  } else {
    // Gameplay sprites: 2-32
    if (width > 32 || height > 32) {
      return 'Gameplay sprite dimensions cannot exceed 32×32 pixels'
    }
  }
  return null
}

