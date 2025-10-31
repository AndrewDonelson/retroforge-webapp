"use client"

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/contexts/AuthContext'

const AceEditor = dynamic(async () => {
  const mod = await import('react-ace')
  await import('ace-builds/src-noconflict/theme-cobalt')
  await import('ace-builds/src-noconflict/mode-lua')
  await import('ace-builds/src-noconflict/mode-json')
  await import('ace-builds/src-noconflict/mode-text')
  return mod
}, { ssr: false })

type FileEntry = { name: string; path: string; language: 'lua' | 'json' | 'text'; content: string; isManifest: boolean; isSFX?: boolean; isMusic?: boolean; isSprites?: boolean }

function getLanguageFromPath(path: string): 'lua' | 'json' | 'text' {
  if (path.endsWith('.lua')) return 'lua'
  if (path.endsWith('.json')) return 'json'
  return 'text'
}

export default function CodeEditorPage() {
  const { cart, isLoading, updateAsset, updateManifest, updateSprites, cartId } = useEditor()
  const { user } = useAuth()
  const saveFile = useMutation(api.cartFiles.saveCartFile)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null)
  
  // Convert cart assets to file entries, including manifest.json
  const files = useMemo<FileEntry[]>(() => {
    const fileEntries: FileEntry[] = []
    
    // Add manifest.json first if cart exists
    if (cart?.manifest) {
      fileEntries.push({
        name: 'manifest.json',
        path: '/project/manifest.json',
        language: 'json',
        content: JSON.stringify(cart.manifest, null, 2),
        isManifest: true,
      })
    }

    // Add sfx.json from assets/ if cart exists and has sfx data
    if (cart?.sfx && Object.keys(cart.sfx).length > 0) {
      fileEntries.push({
        name: 'sfx.json',
        path: '/project/assets/sfx.json',
        language: 'json',
        content: JSON.stringify(cart.sfx, null, 2),
        isManifest: false,
        isSFX: true,
      })
    } else if (cart) {
      // Always show sfx.json in editor, even if empty, so users can add SFX
      fileEntries.push({
        name: 'sfx.json',
        path: '/project/assets/sfx.json',
        language: 'json',
        content: '{}',
        isManifest: false,
        isSFX: true,
      })
    }

    // Add music.json from assets/ if cart exists and has music data
    if (cart?.music && Object.keys(cart.music).length > 0) {
      fileEntries.push({
        name: 'music.json',
        path: '/project/assets/music.json',
        language: 'json',
        content: JSON.stringify(cart.music, null, 2),
        isManifest: false,
        isMusic: true,
      })
    } else if (cart) {
      // Always show music.json in editor, even if empty, so users can add music
      fileEntries.push({
        name: 'music.json',
        path: '/project/assets/music.json',
        language: 'json',
        content: '{}',
        isManifest: false,
        isMusic: true,
      })
    }

    // Add sprites.json from assets/ if cart exists and has sprites data
    if (cart?.sprites && Object.keys(cart.sprites).length > 0) {
      fileEntries.push({
        name: 'sprites.json',
        path: '/project/assets/sprites.json',
        language: 'json',
        content: JSON.stringify(cart.sprites, null, 2),
        isManifest: false,
        isSprites: true,
      })
    } else if (cart) {
      // Always show sprites.json in editor, even if empty, so users can add sprites
      fileEntries.push({
        name: 'sprites.json',
        path: '/project/assets/sprites.json',
        language: 'json',
        content: '{}',
        isManifest: false,
        isSprites: true,
      })
    }
    
    // Add all .lua files from assets
    if (cart?.assets) {
      const assetFiles = Object.entries(cart.assets)
        .filter(([path]) => {
          // Only show text files in code editor (lua, json, txt, md, glsl)
          return path.match(/\.(lua|json|txt|md|glsl)$/i)
        })
        .map(([path, content]) => ({
          name: path.split('/').pop() || path,
          path: `/project/${path}`,
          language: getLanguageFromPath(path) as 'lua' | 'json' | 'text',
          content: typeof content === 'string' && !content.startsWith('data:') ? content : '',
          isManifest: false,
        }))
        .sort((a, b) => {
          // Put main.lua first after manifest
          if (a.name === 'main.lua') return -1
          if (b.name === 'main.lua') return 1
          return a.name.localeCompare(b.name)
        })
      
      fileEntries.push(...assetFiles)
    }
    
    return fileEntries
  }, [cart])

  const [activePath, setActivePath] = useState<string>('')
  const active = useMemo(() => {
    if (!activePath && files.length > 0) {
      setActivePath(files[0].path)
    }
    return files.find((f) => f.path === activePath) || files[0]
  }, [files, activePath])
  
  const [value, setValue] = useState<string>(active?.content || '')

  useEffect(() => {
    if (active) {
      // If manifest.json, always get fresh content from cart
      if (active.isManifest && cart?.manifest) {
        setValue(JSON.stringify(cart.manifest, null, 2))
      } else if (active.isSFX && cart?.sfx) {
        setValue(JSON.stringify(cart.sfx, null, 2))
      } else if (active.isMusic && cart?.music) {
        setValue(JSON.stringify(cart.music, null, 2))
      } else if (active.isSprites && cart?.sprites) {
        setValue(JSON.stringify(cart.sprites, null, 2))
      } else {
        setValue(active.content)
      }
    }
  }, [active, cart?.manifest, cart?.sfx, cart?.music, cart?.sprites])

  const handleChange = (newValue: string) => {
    setValue(newValue)
    if (!active || !cartId || !user) return
    
    // Clear existing timer
    if (saveTimer) {
      clearTimeout(saveTimer)
    }
    
    // Update state immediately
    if (active.isManifest) {
      try {
        const parsed = JSON.parse(newValue)
        updateManifest(parsed)
      } catch (e) {
        // Invalid JSON - don't update manifest yet
        console.error('Invalid JSON in manifest:', e)
      }
    } else if (active.isSFX) {
      // SFX will be handled by save
    } else if (active.isMusic) {
      // Music will be handled by save
    } else if (active.isSprites) {
      // Update context immediately for sprites
      try {
        const parsed = JSON.parse(newValue)
        updateSprites(parsed)
      } catch (e) {
        // Invalid JSON - don't update yet
        console.error('Invalid JSON in sprites:', e)
      }
    } else {
      const assetPath = active.path.replace('/project/', '')
      updateAsset(assetPath, newValue)
    }
    
    // Debounce save to database
    const timer = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        if (active.isManifest) {
          // Save manifest.json
          await saveFile({
            cartId,
            path: 'manifest.json',
            content: newValue,
            ownerId: user?.userId,
          })
        } else if (active.isSFX) {
          // Save assets/sfx.json
          await saveFile({
            cartId,
            path: 'assets/sfx.json',
            content: newValue,
            ownerId: user?.userId,
          })
        } else if (active.isMusic) {
          // Save assets/music.json
          await saveFile({
            cartId,
            path: 'assets/music.json',
            content: newValue,
            ownerId: user?.userId,
          })
        } else if (active.isSprites) {
          // Save assets/sprites.json
          await saveFile({
            cartId,
            path: 'assets/sprites.json',
            content: newValue,
            ownerId: user?.userId,
          })
        } else {
          // Save asset file
          const assetPath = active.path.replace('/project/', '')
          await saveFile({
            cartId,
            path: assetPath,
            content: newValue,
            ownerId: user?.userId,
          })
        }
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        console.error('Failed to save file:', error)
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }
    }, 1000) // Debounce 1 second
    
    setSaveTimer(timer)
  }
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer) {
        clearTimeout(saveTimer)
      }
    }
  }, [saveTimer])


  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <p className="text-gray-400">Loading cart...</p>
      </div>
    )
  }

  if (!cart || files.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <p className="text-gray-400">No code files found in cart.</p>
      </div>
    )
  }

  const aceMode = active?.language === 'lua' ? 'lua' : active?.language === 'json' ? 'json' : 'text'

  return (
    <div className="h-full flex flex-col">
      <div className="editor-toolbar flex items-center gap-3">
        <div className="text-sm text-gray-300">Code Editor</div>
        <select
          className="input-retro"
          value={activePath}
          onChange={(e) => setActivePath(e.target.value)}
        >
          {files.map((f) => (
            <option value={f.path} key={f.path}>{f.name}</option>
          ))}
        </select>
        {saveStatus === 'saving' && (
          <span className="text-xs text-gray-400">Saving...</span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-xs text-green-400">✓ Saved</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-xs text-red-400">✗ Error</span>
        )}
      </div>
      <div className="editor-content p-0">
        <div className="w-full h-[70vh] md:h-[calc(100vh-300px)]">
          <AceEditor
            mode={aceMode}
            theme="cobalt"
            name="rf-ace"
            value={value}
            onChange={handleChange}
            width="100%"
            height="100%"
            setOptions={{
              useWorker: false,
              showPrintMargin: false,
              tabSize: 2,
              wrap: true,
            }}
            editorProps={{ $blockScrolling: true } as any}
          />
        </div>
      </div>
    </div>
  )
}
