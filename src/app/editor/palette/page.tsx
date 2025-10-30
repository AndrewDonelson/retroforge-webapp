"use client"

import { useMemo, useState } from 'react'
import { PRESET_50, type Palette } from '@/data/palettes'

// 50-color presets (from design doc and generative sets)
const PRESETS: Palette[] = PRESET_50

export default function PalettePage() {
  const [active, setActive] = useState<Palette>(PRESETS[0])
  const [custom, setCustom] = useState<string>('')
  const parsedCustom = useMemo(() =>
    custom
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => /^#?[0-9a-fA-F]{6}$/.test(s))
      .map((s) => (s.startsWith('#') ? s : `#${s}`)),
    [custom]
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-pixel text-white">Palette</h1>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-retro p-3">
          <div className="text-sm text-gray-300 mb-2">Predefined</div>
          <div className="flex items-center gap-2">
            <select
              className="input-retro"
              value={active.name}
              onChange={(e) => {
                const p = PRESETS.find((x) => x.name === e.target.value)
                if (p) setActive(p)
              }}
            >
              {PRESETS.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            <button className="btn-retro" onClick={() => setActive(PRESETS[0])}>Reset to RetroForge 50</button>
          </div>
          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-2">{active.colors.length} colors</div>
            <div className="grid grid-cols-10 gap-2">
              {active.colors.map((c, i) => (
                <div key={i} className="w-8 h-8 border border-gray-600" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>

        <div className="card-retro p-3">
          <div className="text-sm text-gray-300 mb-2">Custom</div>
          <p className="text-xs text-gray-400 mb-2">Enter hex colors separated by spaces or commas.</p>
          <textarea
            className="input-retro w-full h-24"
            placeholder="#000000 #ffffff #ff0000 ..."
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          {parsedCustom.length > 0 && (
            <div className="grid grid-cols-10 gap-2 mt-3">
              {parsedCustom.map((c, i) => (
                <div key={i} className="w-8 h-8 border border-gray-600" style={{ backgroundColor: c }} />
              ))}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-2">Tip: RetroForge expects exactly 50 colors (black, white, 16×3).</div>
        </div>
      </div>
    </div>
  )
}


