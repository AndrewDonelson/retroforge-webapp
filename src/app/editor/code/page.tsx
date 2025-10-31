"use client"

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { useEditor } from '@/contexts/EditorContext'

const AceEditor = dynamic(async () => {
  const mod = await import('react-ace')
  await import('ace-builds/src-noconflict/theme-cobalt')
  await import('ace-builds/src-noconflict/mode-lua')
  await import('ace-builds/src-noconflict/mode-json')
  await import('ace-builds/src-noconflict/mode-text')
  return mod
}, { ssr: false })

type FileEntry = { name: string; path: string; language: 'lua' | 'json' | 'text'; content: string }

function getLanguageFromPath(path: string): 'lua' | 'json' | 'text' {
  if (path.endsWith('.lua')) return 'lua'
  if (path.endsWith('.json')) return 'json'
  return 'text'
}

export default function CodeEditorPage() {
  const { cart, isLoading, updateAsset } = useEditor()
  
  // Convert cart assets to file entries
  const files = useMemo<FileEntry[]>(() => {
    if (!cart?.assets) return []
    
    return Object.entries(cart.assets)
      .filter(([path]) => {
        // Only show text files in code editor
        return path.match(/\.(lua|json|txt|md|glsl)$/i)
      })
      .map(([path, content]) => ({
        name: path.split('/').pop() || path,
        path: `/project/${path}`,
        language: getLanguageFromPath(path),
        content: typeof content === 'string' && !content.startsWith('data:') ? content : '',
      }))
      .sort((a, b) => {
        // Put main.lua first
        if (a.name === 'main.lua') return -1
        if (b.name === 'main.lua') return 1
        return a.name.localeCompare(b.name)
      })
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
      setValue(active.content)
    }
  }, [active])

  const handleChange = (newValue: string) => {
    setValue(newValue)
    if (active) {
      const assetPath = active.path.replace('/project/', '')
      updateAsset(assetPath, newValue)
    }
  }


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
