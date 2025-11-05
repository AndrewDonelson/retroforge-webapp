export type SpriteSize = 2 | 4 | 8 | 16 | 24 | 32 | 64 | 128 | 256 | 'custom'
export type Tool = 'pencil' | 'erase' | 'fill' | 'line' | 'circle' | 'rectangle' | 'shape' | 'select' | 'eyedropper'
export type SimpleShape = 'triangle' | 'diamond' | 'square' | 'pentagon' | 'hexagon' | 'star'
export type SpriteType = 'static' | 'frames' | 'animation'
export type SpriteData = number[][] // Pixel data for a single frame

export interface ShapeStart {
  x: number
  y: number
}

export interface Selection {
  x0: number
  y0: number
  x1: number
  y1: number
}

