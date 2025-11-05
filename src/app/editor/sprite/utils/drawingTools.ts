export type SpriteData = number[][]

export function drawLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: number,
  target: SpriteData,
  width: number,
  height: number
): SpriteData {
  const newSprite = target.map((row) => [...row])
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let x = x0
  let y = y0
  while (true) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      newSprite[y][x] = color
    }
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
  return newSprite
}

export function drawCircle(
  cx: number,
  cy: number,
  radius: number,
  color: number,
  filled: boolean,
  target: SpriteData,
  width: number,
  height: number
): SpriteData {
  const newSprite = target.map((row) => [...row])
  const setPixel = (x: number, y: number) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      newSprite[y][x] = color
    }
  }
  if (filled) {
    for (let y = Math.max(0, cy - radius); y <= Math.min(height - 1, cy + radius); y++) {
      for (let x = Math.max(0, cx - radius); x <= Math.min(width - 1, cx + radius); x++) {
        const dx = x - cx
        const dy = y - cy
        if (dx * dx + dy * dy <= radius * radius) {
          setPixel(x, y)
        }
      }
    }
  } else {
    let x = radius
    let y = 0
    let err = 0
    while (x >= y) {
      setPixel(cx + x, cy + y)
      setPixel(cx - x, cy + y)
      setPixel(cx + x, cy - y)
      setPixel(cx - x, cy - y)
      setPixel(cx + y, cy + x)
      setPixel(cx - y, cy + x)
      setPixel(cx + y, cy - x)
      setPixel(cx - y, cy - x)
      if (err <= 0) {
        y += 1
        err += 2 * y + 1
      }
      if (err > 0) {
        x -= 1
        err -= 2 * x + 1
      }
    }
  }
  return newSprite
}

export function drawRectangle(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: number,
  filled: boolean,
  target: SpriteData,
  width: number,
  height: number
): SpriteData {
  const newSprite = target.map((row) => [...row])
  const minX = Math.min(x0, x1)
  const maxX = Math.max(x0, x1)
  const minY = Math.min(y0, y1)
  const maxY = Math.max(y0, y1)
  if (filled) {
    for (let y = minY; y <= maxY && y < height; y++) {
      for (let x = minX; x <= maxX && x < width; x++) {
        if (x >= 0 && y >= 0) {
          newSprite[y][x] = color
        }
      }
    }
  } else {
    for (let x = minX; x <= maxX && x < width; x++) {
      if (x >= 0) {
        if (minY >= 0) newSprite[minY][x] = color
        if (maxY >= 0 && maxY < height) newSprite[maxY][x] = color
      }
    }
    for (let y = minY; y <= maxY && y < height; y++) {
      if (y >= 0) {
        if (minX >= 0) newSprite[y][minX] = color
        if (maxX >= 0 && maxX < width) newSprite[y][maxX] = color
      }
    }
  }
  return newSprite
}

export function drawTriangle(
  cx: number,
  cy: number,
  radius: number,
  color: number,
  filled: boolean,
  target: SpriteData,
  width: number,
  height: number
): SpriteData {
  const newSprite = target.map((row) => [...row])
  const x0 = cx
  const y0 = cy - radius
  const x1 = cx - radius * 0.866
  const y1 = cy + radius * 0.5
  const x2 = cx + radius * 0.866
  const y2 = cy + radius * 0.5
  if (filled) {
    const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)))
    const maxY = Math.min(height - 1, Math.ceil(Math.max(y0, y1, y2)))
    for (let y = minY; y <= maxY; y++) {
      const intersects: number[] = []
      const edges = [
        [x0, y0, x1, y1],
        [x1, y1, x2, y2],
        [x2, y2, x0, y0],
      ]
      for (const edge of edges) {
        const [px0, py0, px1, py1] = edge
        if (py0 === py1) {
          if (py0 === y && px0 !== undefined && px1 !== undefined) {
            intersects.push(Math.round(px0), Math.round(px1))
          }
          continue
        }
        if ((py0 < y && py1 >= y) || (py1 < y && py0 >= y)) {
          const denom = py1 - py0
          if (Math.abs(denom) > 0.0001) {
            const x = px0 + ((y - py0) / denom) * (px1 - px0)
            intersects.push(Math.round(x))
          }
        }
      }
      if (intersects.length >= 2) {
        intersects.sort((a, b) => a - b)
        const minX = Math.max(0, Math.min(intersects[0], intersects[intersects.length - 1]))
        const maxX = Math.min(width - 1, Math.max(intersects[0], intersects[intersects.length - 1]))
        for (let x = minX; x <= maxX; x++) {
          newSprite[y][x] = color
        }
      }
    }
  } else {
    return drawLine(x0, y0, x1, y1, color, drawLine(x1, y1, x2, y2, color, drawLine(x2, y2, x0, y0, color, target, width, height), width, height), width, height)
  }
  return newSprite
}

export function drawDiamond(
  cx: number,
  cy: number,
  radius: number,
  color: number,
  filled: boolean,
  target: SpriteData,
  width: number,
  height: number
): SpriteData {
  const newSprite = target.map((row) => [...row])
  if (filled) {
    const minY = Math.max(0, cy - radius)
    const maxY = Math.min(height - 1, cy + radius)
    for (let y = minY; y <= maxY; y++) {
      const dy = Math.abs(y - cy)
      const diamondWidth = radius - dy
      if (diamondWidth >= 0) {
        const minX = Math.max(0, cx - diamondWidth)
        const maxX = Math.min(width - 1, cx + diamondWidth)
        for (let x = minX; x <= maxX; x++) {
          newSprite[y][x] = color
        }
      }
    }
  } else {
    const points = [
      [cx, cy - radius],
      [cx + radius, cy],
      [cx, cy + radius],
      [cx - radius, cy],
    ]
    return drawLine(
      points[0][0],
      points[0][1],
      points[1][0],
      points[1][1],
      color,
      drawLine(
        points[1][0],
        points[1][1],
        points[2][0],
        points[2][1],
        color,
        drawLine(
          points[2][0],
          points[2][1],
          points[3][0],
          points[3][1],
          color,
          drawLine(points[3][0], points[3][1], points[0][0], points[0][1], color, target, width, height),
          width,
          height
        ),
        width,
        height
      ),
      width,
      height
    )
  }
  return newSprite
}

export function drawSquare(
  cx: number,
  cy: number,
  radius: number,
  color: number,
  filled: boolean,
  target: SpriteData,
  width: number,
  height: number
): SpriteData {
  const halfSize = radius
  const x0 = Math.max(0, cx - halfSize)
  const y0 = Math.max(0, cy - halfSize)
  const x1 = Math.min(width - 1, cx + halfSize)
  const y1 = Math.min(height - 1, cy + halfSize)
  return drawRectangle(x0, y0, x1, y1, color, filled, target, width, height)
}

export function drawPentagon(
  cx: number,
  cy: number,
  radius: number,
  color: number,
  filled: boolean,
  target: SpriteData,
  width: number,
  height: number
): SpriteData {
  const newSprite = target.map((row) => [...row])
  const points: Array<[number, number]> = []
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
    points.push([Math.round(cx + radius * Math.cos(angle)), Math.round(cy + radius * Math.sin(angle))])
  }
  if (filled) {
    const minY = Math.max(0, Math.min(...points.map((p) => p[1])))
    const maxY = Math.min(height - 1, Math.max(...points.map((p) => p[1])))
    for (let y = minY; y <= maxY; y++) {
      const intersects: number[] = []
      const edges = [
        [points[0], points[1]],
        [points[1], points[2]],
        [points[2], points[3]],
        [points[3], points[4]],
        [points[4], points[0]],
      ]
      for (const edge of edges) {
        const [[px0, py0], [px1, py1]] = edge
        if (py0 === py1) {
          if (py0 === y) intersects.push(Math.round(px0), Math.round(px1))
          continue
        }
        if ((py0 < y && py1 >= y) || (py1 < y && py0 >= y)) {
          const denom = py1 - py0
          if (Math.abs(denom) > 0.0001) {
            const x = px0 + ((y - py0) / denom) * (px1 - px0)
            intersects.push(Math.round(x))
          }
        }
      }
      if (intersects.length >= 2) {
        intersects.sort((a, b) => a - b)
        const minX = Math.max(0, intersects[0])
        const maxX = Math.min(width - 1, intersects[intersects.length - 1])
        for (let x = minX; x <= maxX; x++) {
          newSprite[y][x] = color
        }
      }
    }
  } else {
    let result = target.map((row) => [...row])
    for (let i = 0; i < points.length; i++) {
      const next = (i + 1) % points.length
      result = drawLine(points[i][0], points[i][1], points[next][0], points[next][1], color, result, width, height)
    }
    return result
  }
  return newSprite
}

export function drawHexagon(
  cx: number,
  cy: number,
  radius: number,
  color: number,
  filled: boolean,
  target: SpriteData,
  width: number,
  height: number
): SpriteData {
  const newSprite = target.map((row) => [...row])
  const points: Array<[number, number]> = []
  for (let i = 0; i < 6; i++) {
    const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2
    points.push([Math.round(cx + radius * Math.cos(angle)), Math.round(cy + radius * Math.sin(angle))])
  }
  if (filled) {
    const minY = Math.max(0, Math.min(...points.map((p) => p[1])))
    const maxY = Math.min(height - 1, Math.max(...points.map((p) => p[1])))
    for (let y = minY; y <= maxY; y++) {
      const intersects: number[] = []
      const edges = [
        [points[0], points[1]],
        [points[1], points[2]],
        [points[2], points[3]],
        [points[3], points[4]],
        [points[4], points[5]],
        [points[5], points[0]],
      ]
      for (const edge of edges) {
        const [[px0, py0], [px1, py1]] = edge
        if (py0 === py1) {
          if (py0 === y) intersects.push(Math.round(px0), Math.round(px1))
          continue
        }
        if ((py0 < y && py1 >= y) || (py1 < y && py0 >= y)) {
          const denom = py1 - py0
          if (Math.abs(denom) > 0.0001) {
            const x = px0 + ((y - py0) / denom) * (px1 - px0)
            intersects.push(Math.round(x))
          }
        }
      }
      if (intersects.length >= 2) {
        intersects.sort((a, b) => a - b)
        const minX = Math.max(0, intersects[0])
        const maxX = Math.min(width - 1, intersects[intersects.length - 1])
        for (let x = minX; x <= maxX; x++) {
          newSprite[y][x] = color
        }
      }
    }
  } else {
    let result = target.map((row) => [...row])
    for (let i = 0; i < points.length; i++) {
      const next = (i + 1) % points.length
      result = drawLine(points[i][0], points[i][1], points[next][0], points[next][1], color, result, width, height)
    }
    return result
  }
  return newSprite
}

export function drawStar(
  cx: number,
  cy: number,
  radius: number,
  color: number,
  filled: boolean,
  target: SpriteData,
  width: number,
  height: number
): SpriteData {
  const newSprite = target.map((row) => [...row])
  const outerRadius = radius
  const innerRadius = radius * 0.5
  const points: Array<[number, number]> = []
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2
    const r = i % 2 === 0 ? outerRadius : innerRadius
    points.push([Math.round(cx + r * Math.cos(angle)), Math.round(cy + r * Math.sin(angle))])
  }
  if (filled) {
    const minY = Math.max(0, Math.min(...points.map((p) => p[1])))
    const maxY = Math.min(height - 1, Math.max(...points.map((p) => p[1])))
    for (let y = minY; y <= maxY; y++) {
      const intersects: number[] = []
      for (let i = 0; i < points.length; i++) {
        const next = (i + 1) % points.length
        const [px0, py0] = points[i]
        const [px1, py1] = points[next]
        if (py0 === py1) {
          if (py0 === y) intersects.push(Math.round(px0), Math.round(px1))
          continue
        }
        if ((py0 < y && py1 >= y) || (py1 < y && py0 >= y)) {
          const denom = py1 - py0
          if (Math.abs(denom) > 0.0001) {
            const x = px0 + ((y - py0) / denom) * (px1 - px0)
            intersects.push(Math.round(x))
          }
        }
      }
      if (intersects.length >= 2) {
        intersects.sort((a, b) => a - b)
        const minX = Math.max(0, intersects[0])
        const maxX = Math.min(width - 1, intersects[intersects.length - 1])
        for (let x = minX; x <= maxX; x++) {
          newSprite[y][x] = color
        }
      }
    }
  } else {
    let result = target.map((row) => [...row])
    for (let i = 0; i < points.length; i++) {
      const next = (i + 1) % points.length
      result = drawLine(points[i][0], points[i][1], points[next][0], points[next][1], color, result, width, height)
    }
    return result
  }
  return newSprite
}

export function floodFill(
  startX: number,
  startY: number,
  targetColor: number,
  fillColor: number,
  sprite: SpriteData,
  width: number,
  height: number
): SpriteData {
  if (targetColor === fillColor) return sprite
  const newSprite = sprite.map((row) => [...row])
  const stack: Array<[number, number]> = [[startX, startY]]
  const visited = new Set<string>()
  while (stack.length > 0) {
    const [x, y] = stack.pop()!
    const key = `${x},${y}`
    if (visited.has(key)) continue
    if (x < 0 || x >= width || y < 0 || y >= height) continue
    if (newSprite[y][x] !== targetColor) continue
    visited.add(key)
    newSprite[y][x] = fillColor
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  return newSprite
}

