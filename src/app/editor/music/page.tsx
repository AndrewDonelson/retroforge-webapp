"use client"

import { useEditor } from '@/contexts/EditorContext'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/contexts/AuthContext'
import type { MusicMap } from '@/lib/cartUtils'

function MusicEditorPageInner() {
  const { cart, isLoading, error, cartId, updateMusic } = useEditor()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const saveFile = useMutation(api.cartFiles.saveCartFile)
  
  const [music, setMusic] = useState<MusicMap>({})
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const [editingTrack, setEditingTrack] = useState<{ name: string; tokens: string[]; bpm: number; gain: number } | null>(null)
  const [tokenInput, setTokenInput] = useState('')
  
  // Load Music from cart
  useEffect(() => {
    if (cart?.music && Object.keys(cart.music).length > 0) {
      console.log('[MusicEditor] Loading music from cart:', Object.keys(cart.music))
      setMusic(cart.music)
    } else {
      console.log('[MusicEditor] No music in cart, using empty map')
      setMusic({})
    }
  }, [cart?.music])

  // Save Music to cartFiles when it changes
  useEffect(() => {
    if (!cartId || !user || Object.keys(music).length === 0 && !cart?.music) return
    
    const timeoutId = setTimeout(async () => {
      try {
        await saveFile({
          cartId,
          path: 'assets/music.json',
          content: JSON.stringify(music, null, 2),
          ownerId: user?.userId,
        })
      } catch (error) {
        console.error('Failed to save music.json:', error)
      }
    }, 500) // Debounce 500ms
    
    return () => clearTimeout(timeoutId)
  }, [music, cartId, user, saveFile, cart?.music])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-pixel text-white">Music</h1>
        <p className="text-gray-400">Loading cart...</p>
      </div>
    )
  }

  if (!cart) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-pixel text-white">Music</h1>
        {error && (
          <div className="p-3 rounded bg-red-900/30 text-red-400">
            Error: {error}
          </div>
        )}
        <p className="text-gray-400">No cart loaded.</p>
      </div>
    )
  }

  const trackNames = Object.keys(music)

  const handleAddTrack = () => {
    const name = `track_${Date.now()}`
    const newTrack: MusicMap = {
      ...music,
      [name]: {
        tokens: ['4C1', '4E1', '4G1'],
        bpm: 120,
        gain: 0.3,
      }
    }
    setMusic(newTrack)
    updateMusic(newTrack)
    setEditingTrack({ name, tokens: ['4C1', '4E1', '4G1'], bpm: 120, gain: 0.3 })
    setSelectedTrack(name)
  }

  const handleEditTrack = (name: string) => {
    const track = music[name]
    setEditingTrack({ name, tokens: track.tokens || [], bpm: track.bpm || 120, gain: track.gain || 0.3 })
    setSelectedTrack(name)
    setTokenInput(track.tokens?.join(' ') || '')
  }

  const handleSaveTrack = () => {
    if (!editingTrack) return
    const { name, tokens, bpm, gain } = editingTrack
    const updated = { ...music, [name]: { tokens, bpm, gain } }
    setMusic(updated)
    updateMusic(updated)
    setEditingTrack(null)
  }

  const handleDeleteTrack = (name: string) => {
    const updated = { ...music }
    delete updated[name]
    setMusic(updated)
    updateMusic(updated)
    if (selectedTrack === name) {
      setSelectedTrack(null)
      setEditingTrack(null)
    }
  }

  const handleAddToken = () => {
    if (!editingTrack || !tokenInput.trim()) return
    const tokens = tokenInput.trim().split(/\s+/)
    setEditingTrack({ ...editingTrack, tokens: [...editingTrack.tokens, ...tokens] })
    setTokenInput('')
  }

  const handleRemoveToken = (index: number) => {
    if (!editingTrack) return
    const tokens = [...editingTrack.tokens]
    tokens.splice(index, 1)
    setEditingTrack({ ...editingTrack, tokens })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-pixel text-white">Music</h1>
        <button
          onClick={handleAddTrack}
          className="btn-retro px-4 py-2 text-sm"
        >
          + Add Track
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Track List */}
        <div className="card-retro p-3">
          <div className="text-sm text-gray-300 mb-2">Tracks</div>
          {trackNames.length === 0 ? (
            <p className="text-gray-400 text-sm">No tracks defined. Click "Add Track" to create one.</p>
          ) : (
            <div className="space-y-2">
              {trackNames.map((name) => (
                <div
                  key={name}
                  className={`p-2 rounded border cursor-pointer ${
                    selectedTrack === name ? 'border-retro-500 bg-gray-800' : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => handleEditTrack(name)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-mono text-sm">{name}</div>
                      <div className="text-gray-400 text-xs">
                        {music[name].tokens?.length || 0} tokens, BPM: {music[name].bpm || 120}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTrack(name)
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

        {/* Track Editor */}
        {editingTrack && (
          <div className="card-retro p-3">
            <div className="text-sm text-gray-300 mb-2">Edit Track</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Track Name</label>
                <input
                  type="text"
                  className="input-retro w-full"
                  value={editingTrack.name}
                  onChange={(e) => {
                    if (e.target.value !== editingTrack.name) {
                      // Rename if changed
                      const updated = { ...music }
                      delete updated[editingTrack.name]
                      updated[e.target.value] = {
                        tokens: editingTrack.tokens,
                        bpm: editingTrack.bpm,
                        gain: editingTrack.gain,
                      }
                      setMusic(updated)
                      updateMusic(updated)
                      setEditingTrack({ ...editingTrack, name: e.target.value })
                      setSelectedTrack(e.target.value)
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">BPM</label>
                <input
                  type="number"
                  className="input-retro w-full"
                  value={editingTrack.bpm}
                  onChange={(e) => setEditingTrack({ ...editingTrack, bpm: parseFloat(e.target.value) || 120 })}
                  min="1"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Gain (0.0 - 1.0)</label>
                <input
                  type="number"
                  className="input-retro w-full"
                  value={editingTrack.gain}
                  onChange={(e) => setEditingTrack({ ...editingTrack, gain: parseFloat(e.target.value) || 0.3 })}
                  min="0"
                  max="1"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Note Tokens</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="input-retro flex-1"
                    placeholder="e.g., 4C1 4E1 4G1"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddToken()
                      }
                    }}
                  />
                  <button
                    onClick={handleAddToken}
                    className="btn-retro px-3"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 bg-gray-900 rounded border border-gray-700">
                  {editingTrack.tokens.map((token, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-xs font-mono text-gray-300"
                    >
                      {token}
                      <button
                        onClick={() => handleRemoveToken(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSaveTrack}
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
{`-- Play a track by name
rf.music("${trackNames[0] || 'track_name'}")

-- Override BPM and gain
rf.music("${trackNames[0] || 'track_name'}", 140, 0.5)

-- Or use inline notes (backward compatible)
rf.music({"4C1", "4E1", "4G1"}, 120, 0.3)`}
        </pre>
        <div className="mt-2 text-xs text-gray-500">
          <div>Token format: <code className="bg-gray-800 px-1 rounded">durationNoteOctave</code></div>
          <div>Examples: <code className="bg-gray-800 px-1 rounded">4C1</code> (quarter note C, octave 1), <code className="bg-gray-800 px-1 rounded">R1</code> (rest)</div>
        </div>
      </div>
    </div>
  )
}

export default function MusicEditorPage() {
  return (
    <Suspense fallback={<div className="p-4 text-gray-400">Loading...</div>}>
      <MusicEditorPageInner />
    </Suspense>
  )
}
