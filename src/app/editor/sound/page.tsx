"use client"

import { useEditor } from '@/contexts/EditorContext'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/contexts/AuthContext'
import type { SFXMap } from '@/lib/cartUtils'

function SoundEditorPageInner() {
  const { cart, isLoading, error, cartId, updateSFX } = useEditor()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const saveFile = useMutation(api.cartFiles.saveCartFile)
  
  const [sfx, setSFX] = useState<SFXMap>({})
  const [selectedSFX, setSelectedSFX] = useState<string | null>(null)
  const [editingSFX, setEditingSFX] = useState<{ name: string; type: string; freq: number; duration: number; gain: number } | null>(null)
  
  // Load SFX from cart
  useEffect(() => {
    if (cart?.sfx && Object.keys(cart.sfx).length > 0) {
      console.log('[SoundEditor] Loading sfx from cart:', Object.keys(cart.sfx))
      setSFX(cart.sfx)
    } else {
      console.log('[SoundEditor] No sfx in cart, using empty map')
      setSFX({})
    }
  }, [cart?.sfx])

  // Save SFX to cartFiles when it changes
  useEffect(() => {
    if (!cartId || !user || Object.keys(sfx).length === 0 && !cart?.sfx) return
    
    const timeoutId = setTimeout(async () => {
      try {
        await saveFile({
          cartId,
          path: 'assets/sfx.json',
          content: JSON.stringify(sfx, null, 2),
          ownerId: user?.userId,
        })
      } catch (error) {
        console.error('Failed to save sfx.json:', error)
      }
    }, 500) // Debounce 500ms
    
    return () => clearTimeout(timeoutId)
  }, [sfx, cartId, user, saveFile, cart?.sfx])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-pixel text-retro-400">Sound Effects</h1>
        <p className="text-gray-400">Loading cart...</p>
      </div>
    )
  }

  if (!cart) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-pixel text-retro-400">Sound Effects</h1>
        {error && (
          <div className="p-3 rounded bg-red-900/30 text-red-400">
            Error: {error}
          </div>
        )}
        <p className="text-gray-400">No cart loaded.</p>
      </div>
    )
  }

  const sfxNames = Object.keys(sfx)

  const handleAddSFX = () => {
    const name = `sfx_${Date.now()}`
    const newSFX: SFXMap = {
      ...sfx,
      [name]: {
        type: 'sine',
        freq: 440,
        duration: 0.1,
        gain: 0.3,
      }
    }
    setSFX(newSFX)
    updateSFX(newSFX)
    setEditingSFX({ name, type: 'sine', freq: 440, duration: 0.1, gain: 0.3 })
    setSelectedSFX(name)
  }

  const handleEditSFX = (name: string) => {
    const sfxDef = sfx[name]
    setEditingSFX({ 
      name, 
      type: sfxDef.type || 'sine',
      freq: sfxDef.freq ?? 440,
      duration: sfxDef.duration ?? 0.1,
      gain: sfxDef.gain ?? 0.3
    })
    setSelectedSFX(name)
  }

  const handleSaveSFX = () => {
    if (!editingSFX) return
    const { name, type, freq, duration, gain } = editingSFX
    const def = {
      type: type as 'sine' | 'noise' | 'thrust' | 'stopall',
      freq,
      duration,
      gain,
    }
    const updated = { ...sfx, [name]: def }
    setSFX(updated)
    updateSFX(updated)
    setEditingSFX(null)
  }

  const handleDeleteSFX = (name: string) => {
    const updated = { ...sfx }
    delete updated[name]
    setSFX(updated)
    updateSFX(updated)
    if (selectedSFX === name) {
      setSelectedSFX(null)
      setEditingSFX(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-pixel text-retro-400">Sound Effects</h1>
        <button
          onClick={handleAddSFX}
          className="btn-retro px-4 py-2 text-sm"
        >
          + Add SFX
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* SFX List */}
        <div className="card-retro p-3">
          <div className="text-sm text-gray-300 mb-2">SFX List</div>
          {sfxNames.length === 0 ? (
            <p className="text-gray-400 text-sm">No sound effects defined. Click "Add SFX" to create one.</p>
          ) : (
            <div className="space-y-2">
              {sfxNames.map((name) => (
                <div
                  key={name}
                  className={`p-2 rounded border cursor-pointer ${
                    selectedSFX === name ? 'border-retro-500 bg-gray-800' : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => handleEditSFX(name)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-mono text-sm">{name}</div>
                      <div className="text-gray-400 text-xs">{sfx[name].type}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSFX(name)
                      }}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SFX Editor */}
        {editingSFX && (
          <div className="card-retro p-3">
            <div className="text-sm text-gray-300 mb-2">Edit SFX</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  className="input-retro w-full"
                  value={editingSFX.name}
                  onChange={(e) => {
                    if (e.target.value !== editingSFX.name) {
                      // Rename if changed
                      const updated = { ...sfx }
                      delete updated[editingSFX.name]
                      updated[e.target.value] = {
                        type: editingSFX.type as any,
                        freq: editingSFX.freq,
                        duration: editingSFX.duration,
                        gain: editingSFX.gain,
                      }
                      setSFX(updated)
                      updateSFX(updated)
                      setEditingSFX({ ...editingSFX, name: e.target.value })
                      setSelectedSFX(e.target.value)
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Type</label>
                <select
                  className="input-retro w-full"
                  value={editingSFX.type}
                  onChange={(e) => setEditingSFX({ ...editingSFX, type: e.target.value })}
                >
                  <option value="sine">Sine Wave</option>
                  <option value="noise">Noise</option>
                  <option value="thrust">Thrust (Looped)</option>
                  <option value="stopall">Stop All</option>
                </select>
              </div>
              {editingSFX.type === 'sine' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Frequency (Hz)</label>
                    <input
                      type="number"
                      className="input-retro w-full"
                      value={editingSFX.freq}
                      onChange={(e) => setEditingSFX({ ...editingSFX, freq: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Duration (seconds)</label>
                    <input
                      type="number"
                      className="input-retro w-full"
                      value={editingSFX.duration}
                      onChange={(e) => setEditingSFX({ ...editingSFX, duration: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </>
              )}
              {editingSFX.type === 'noise' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Duration (seconds)</label>
                  <input
                    type="number"
                    className="input-retro w-full"
                    value={editingSFX.duration}
                    onChange={(e) => setEditingSFX({ ...editingSFX, duration: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Gain (0.0 - 1.0)</label>
                <input
                  type="number"
                  className="input-retro w-full"
                  value={editingSFX.gain}
                  onChange={(e) => setEditingSFX({ ...editingSFX, gain: parseFloat(e.target.value) || 0 })}
                  min="0"
                  max="1"
                  step="0.01"
                />
              </div>
              <button
                onClick={handleSaveSFX}
                className="btn-retro w-full"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card-retro p-3">
        <div className="text-sm text-gray-300 mb-2">Usage in Lua</div>
        <pre className="text-xs text-gray-400 font-mono">
{`-- Play a sound effect
rf.sfx("${sfxNames[0] || 'sfx_name'}")

-- For thrust type (on/off)
rf.sfx("thrust", "on")
rf.sfx("thrust", "off")

-- Stop all sounds
rf.sfx("stopall")`}
        </pre>
      </div>
    </div>
  )
}

export default function SoundEditorPage() {
  return (
    <Suspense fallback={<div className="p-4 text-gray-400">Loading...</div>}>
      <SoundEditorPageInner />
    </Suspense>
  )
}
