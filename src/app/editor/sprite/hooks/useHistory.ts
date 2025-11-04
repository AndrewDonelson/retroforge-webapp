import { useState, useCallback } from 'react'
import type { SpriteData } from '../types'
import { createEmptySprite } from '../utils/spriteUtils'

export function useHistory() {
  const [history, setHistory] = useState<SpriteData[]>([createEmptySprite(16, 16)])
  const [historyIndex, setHistoryIndex] = useState(0)

  const undo = useCallback((currentSprite: SpriteData, onSpriteChange: (sprite: SpriteData) => void) => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      onSpriteChange(history[historyIndex - 1])
    }
  }, [history, historyIndex])

  const redo = useCallback((onSpriteChange: (sprite: SpriteData) => void) => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      onSpriteChange(history[historyIndex + 1])
    }
  }, [history, historyIndex])

  const saveToHistory = useCallback((newSprite: SpriteData) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(newSprite)))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    if (newHistory.length > 50) {
      setHistory(newHistory.slice(-50))
      setHistoryIndex(49)
    }
  }, [history, historyIndex])

  const resetHistory = useCallback((initialSprite: SpriteData) => {
    setHistory([initialSprite])
    setHistoryIndex(0)
  }, [])

  return {
    history,
    historyIndex,
    undo,
    redo,
    saveToHistory,
    resetHistory,
  }
}

