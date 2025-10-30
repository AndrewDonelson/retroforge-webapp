"use client"

import { useState } from 'react'

type Point = { x: number; y: number }

export default function SpriteEditorPage() {
  const [points, setPoints] = useState<Point[]>([])

  function addPoint(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 256)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 256)
    setPoints((prev) => [...prev, { x, y }])
  }

  function reset() {
    setPoints([])
  }

  return (
    <div className="h-full flex flex-col">
      <div className="editor-toolbar flex items-center gap-2">
        <span>Sprite Editor</span>
        <button className="btn-retro-secondary" onClick={reset}>Clear Collision</button>
      </div>
      <div className="editor-content p-3 grid md:grid-cols-[1fr_320px] gap-3">
        <div className="pixel-container w-full aspect-square bg-gray-900 relative" onClick={addPoint}>
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 select-none">Click to outline collision</div>
          {points.map((p, i) => (
            <div key={i} className="absolute w-2 h-2 bg-retro-500" style={{ left: `${(p.x/256)*100}%`, top: `${(p.y/256)*100}%`, transform: 'translate(-50%, -50%)' }} />
          ))}
          {points.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 256 256">
              <polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} fill="rgba(14,165,233,0.15)" stroke="#0ea5e9" strokeWidth="2" />
            </svg>
          )}
        </div>
        <div className="card-retro p-3 space-y-3">
          <div className="text-sm text-gray-300">Collision Outline</div>
          <div className="text-xs text-gray-400">Click on the canvas to add points. Click Clear to reset. This is a placeholder for a Construct-like polygon editor.</div>
          <div className="text-xs text-gray-300">Points ({points.length}/64)</div>
          <div className="max-h-64 overflow-auto text-xs text-gray-400 border border-gray-700 p-2">
            {points.map((p, i) => (
              <div key={i}>({p.x}, {p.y})</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


