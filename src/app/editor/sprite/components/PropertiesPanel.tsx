import React from 'react'
import type { MountPoint } from '@/lib/cartUtils'

interface PropertiesPanelProps {
  useCollision: boolean
  onUseCollisionChange: (value: boolean) => void
  mountPoints: MountPoint[]
  onMountPointsChange: (mountPoints: MountPoint[]) => void
  width: number
  height: number
  mountPointMode: boolean
  onMountPointModeChange: (value: boolean) => void
}

export function PropertiesPanel({
  useCollision,
  onUseCollisionChange,
  mountPoints,
  onMountPointsChange,
  width,
  height,
  mountPointMode,
  onMountPointModeChange,
}: PropertiesPanelProps) {
  return (
    <div className="card-retro p-4">
      <div className="text-sm font-semibold text-gray-200 mb-4">Properties</div>
      
      {/* Use Collision Toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={useCollision}
            onChange={(e) => onUseCollisionChange(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-retro-500 focus:ring-retro-500"
          />
          <span>Use Collision</span>
        </label>
        <div className="text-xs text-gray-500 mt-1 ml-7">
          Enable collision detection when non-transparent pixels touch other sprites with collision enabled
        </div>
      </div>

      {/* Mount Points */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-300">Mount Points</div>
          <button
            onClick={() => {
              const defaultName = `mount_${mountPoints.length + 1}`
              const newPoint: MountPoint = { 
                x: Math.floor(width / 2), 
                y: Math.floor(height / 2),
                name: defaultName
              }
              onMountPointsChange([...mountPoints, newPoint])
            }}
            className="text-xs btn-retro py-1 px-2"
            title="Add mount point"
          >
            + Add
          </button>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={mountPointMode}
              onChange={(e) => onMountPointModeChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-retro-500"
            />
            <span>Place Mode</span>
          </label>
          <span className="text-xs text-gray-600">or Ctrl+Shift+Click on canvas</span>
        </div>
        <div className="text-xs text-gray-500 mb-2">
          Click points on canvas to position (or edit below). Named points can be accessed in Lua by name or index (e.g., <code className="text-retro-400">mountPoints["thrust"]</code> or <code className="text-retro-400">mountPoints[1]</code>)
        </div>
        {mountPoints.length === 0 ? (
          <div className="text-xs text-gray-600 italic">No mount points defined</div>
        ) : (
          <div className="space-y-2">
            {mountPoints.map((mp, idx) => (
              <div key={idx} className="flex flex-col gap-2 p-2 bg-gray-800 rounded">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-400 flex-shrink-0">#{idx + 1}</div>
                  <input
                    type="text"
                    value={mp.name || ''}
                    onChange={(e) => {
                      const newMountPoints = [...mountPoints]
                      newMountPoints[idx] = { ...mp, name: e.target.value.trim() || undefined }
                      onMountPointsChange(newMountPoints)
                    }}
                    className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                    placeholder="Name (e.g., thrust, bullet)"
                  />
                  <button
                    onClick={() => {
                      onMountPointsChange(mountPoints.filter((_, i) => i !== idx))
                    }}
                    className="text-red-400 hover:text-red-300 text-sm"
                    title="Remove mount point"
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={width - 1}
                    value={mp.x}
                    onChange={(e) => {
                      const newMountPoints = [...mountPoints]
                      newMountPoints[idx] = { ...mp, x: Math.max(0, Math.min(width - 1, Number(e.target.value))) }
                      onMountPointsChange(newMountPoints)
                    }}
                    className="w-16 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                    placeholder="X"
                  />
                  <span className="text-xs text-gray-500">×</span>
                  <input
                    type="number"
                    min="0"
                    max={height - 1}
                    value={mp.y}
                    onChange={(e) => {
                      const newMountPoints = [...mountPoints]
                      newMountPoints[idx] = { ...mp, y: Math.max(0, Math.min(height - 1, Number(e.target.value))) }
                      onMountPointsChange(newMountPoints)
                    }}
                    className="w-16 text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                    placeholder="Y"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

