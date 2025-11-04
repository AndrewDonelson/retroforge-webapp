import React, { useState } from 'react'
import type { AnimationSequence, SpriteFrame } from '@/lib/cartUtils'

interface AnimationEditorProps {
  animations: AnimationSequence[]
  frames: SpriteFrame[]
  onAddAnimation: () => void
  onDeleteAnimation: (animName: string) => void
  onUpdateAnimation: (animName: string, updates: Partial<AnimationSequence>) => void
  onAddFrameToAnimation: (animName: string, frameName: string) => void
  onRemoveFrameFromAnimation: (animName: string, frameIndex: number) => void
  onReorderAnimationFrames: (animName: string, fromIndex: number, toIndex: number) => void
}

export function AnimationEditor({
  animations,
  frames,
  onAddAnimation,
  onDeleteAnimation,
  onUpdateAnimation,
  onAddFrameToAnimation,
  onRemoveFrameFromAnimation,
  onReorderAnimationFrames,
}: AnimationEditorProps) {
  const [editingAnimName, setEditingAnimName] = useState<string | null>(null)
  const [newAnimName, setNewAnimName] = useState('')
  const [expandedAnimations, setExpandedAnimations] = useState<Set<string>>(new Set())

  const frameNames = frames.map((f) => f.name)

  const handleStartRename = (animName: string) => {
    setEditingAnimName(animName)
    setNewAnimName(animName)
  }

  const handleSaveRename = (oldName: string) => {
    if (newAnimName.trim() && newAnimName !== oldName) {
      // Validate animation name: alphanumeric, underscore, hyphen; starts with letter/underscore
      const validName = /^[a-zA-Z_][a-zA-Z0-9_-]*$/
      if (validName.test(newAnimName.trim())) {
        // Update animation name (this would need to be handled by parent)
        onUpdateAnimation(oldName, { name: newAnimName.trim() } as Partial<AnimationSequence>)
      } else {
        alert('Invalid animation name. Must start with a letter or underscore and contain only alphanumeric characters, underscores, and hyphens.')
        setNewAnimName(oldName)
      }
    } else {
      setNewAnimName(oldName)
    }
    setEditingAnimName(null)
  }

  const toggleExpanded = (animName: string) => {
    const newExpanded = new Set(expandedAnimations)
    if (newExpanded.has(animName)) {
      newExpanded.delete(animName)
    } else {
      newExpanded.add(animName)
    }
    setExpandedAnimations(newExpanded)
  }

  // Auto-expand first animation by default
  React.useEffect(() => {
    if (animations.length > 0 && expandedAnimations.size === 0) {
      setExpandedAnimations(new Set([animations[0].name]))
    }
  }, [animations, expandedAnimations.size])

  return (
    <div className="card-retro p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-gray-200">Animations</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Create animation sequences from your frames
          </div>
        </div>
        <button
          className="btn-retro text-xs h-7 px-2"
          onClick={onAddAnimation}
          title="Add new animation"
        >
          + Add Animation
        </button>
      </div>
      {animations.length === 0 ? (
        <div className="text-xs text-gray-500 text-center py-4 space-y-2">
          <div>No animations defined. Click "Add Animation" to create one.</div>
          <div className="text-xs text-gray-600 italic">
            Animations are sequences of frames that play automatically. Set speed, loop, and frame order.
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {animations.map((anim) => {
            const isExpanded = expandedAnimations.has(anim.name)
            return (
              <div
                key={anim.name}
                className="border border-gray-700 rounded bg-gray-800"
              >
                <div className="p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      className="text-gray-400 hover:text-gray-300 text-xs"
                      onClick={() => toggleExpanded(anim.name)}
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    {editingAnimName === anim.name ? (
                      <input
                        type="text"
                        className="flex-1 text-xs bg-gray-700 border border-gray-600 rounded px-1 text-gray-200"
                        value={newAnimName}
                        onChange={(e) => setNewAnimName(e.target.value)}
                        onBlur={() => handleSaveRename(anim.name)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveRename(anim.name)
                          } else if (e.key === 'Escape') {
                            setEditingAnimName(null)
                            setNewAnimName(anim.name)
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <div
                        className="text-xs font-semibold text-gray-200 truncate flex-1 cursor-text"
                        onDoubleClick={() => handleStartRename(anim.name)}
                        title="Double-click to rename"
                      >
                        {anim.name}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="text-red-400 hover:text-red-300 text-base font-bold p-1 rounded hover:bg-gray-700 transition-colors"
                      onClick={() => {
                        if (confirm(`Delete animation "${anim.name}"?`)) {
                          onDeleteAnimation(anim.name)
                        }
                      }}
                      title="Delete animation"
                    >
                      ×
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="p-2 border-t border-gray-700 space-y-3">
                    {/* Help text */}
                    <div className="text-xs text-gray-500 italic bg-gray-900 p-2 rounded">
                      Select frames below to add them to this animation sequence. Use the controls to set playback speed and loop behavior.
                    </div>

                    {/* Speed */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">
                        Speed Multiplier: <span className="text-retro-400">{anim.speed ?? 1.0}x</span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={anim.speed ?? 1.0}
                        onChange={(e) => onUpdateAnimation(anim.name, { speed: Number(e.target.value) })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                        <span>0.1x (slow)</span>
                        <span>5x (fast)</span>
                      </div>
                    </div>

                    {/* Loop */}
                    <div>
                      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={anim.loop ?? true}
                          onChange={(e) => onUpdateAnimation(anim.name, { loop: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-retro-500"
                        />
                        <span>Loop Animation</span>
                      </label>
                      <div className="text-xs text-gray-600 ml-6 mt-0.5">
                        When checked, animation repeats continuously
                      </div>
                    </div>

                    {/* Loop Type */}
                    {(anim.loop !== false) && (
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Loop Type:</label>
                        <select
                          value={anim.loopType || 'forward'}
                          onChange={(e) => onUpdateAnimation(anim.name, { loopType: e.target.value as 'forward' | 'reverse' | 'pingpong' })}
                          className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                        >
                          <option value="forward">Forward (play frames in order, restart)</option>
                          <option value="pingpong">Ping-Pong (forward then backward)</option>
                        </select>
                      </div>
                    )}
                    {/* Frame Sequence */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">
                        Frame Sequence ({anim.frameRefs.length} frame{anim.frameRefs.length !== 1 ? 's' : ''}):
                      </label>
                      {anim.frameRefs.length === 0 && (
                        <div className="text-xs text-gray-600 italic mb-2 bg-gray-900 p-2 rounded">
                          No frames in sequence. Select frames from the dropdown below to add them.
                        </div>
                      )}
                      <div className="space-y-1">
                        {anim.frameRefs.map((frameRef, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-gray-900 p-2 rounded">
                            <div className="text-xs text-gray-300 flex-1">
                              {idx + 1}. {frameRef}
                            </div>
                            <div className="flex items-center gap-1">
                              {idx > 0 && (
                                <button
                                  className="text-blue-400 hover:text-blue-300 text-xs"
                                  onClick={() => onReorderAnimationFrames(anim.name, idx, idx - 1)}
                                  title="Move up"
                                >
                                  ↑
                                </button>
                              )}
                              {idx < anim.frameRefs.length - 1 && (
                                <button
                                  className="text-blue-400 hover:text-blue-300 text-xs"
                                  onClick={() => onReorderAnimationFrames(anim.name, idx, idx + 1)}
                                  title="Move down"
                                >
                                  ↓
                                </button>
                              )}
                              <button
                                className="text-red-400 hover:text-red-300 text-xs"
                                onClick={() => onRemoveFrameFromAnimation(anim.name, idx)}
                                title="Remove"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                        {/* Add frame dropdown */}
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              onAddFrameToAnimation(anim.name, e.target.value)
                              e.target.value = ''
                            }
                          }}
                          className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                        >
                          <option value="">Add frame...</option>
                          {frameNames
                            .filter((name) => !anim.frameRefs.includes(name))
                            .map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

