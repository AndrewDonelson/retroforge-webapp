"use client"

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'

const AceEditor = dynamic(async () => {
  const mod = await import('react-ace')
  await import('ace-builds/src-noconflict/theme-cobalt')
  await import('ace-builds/src-noconflict/mode-lua')
  await import('ace-builds/src-noconflict/mode-json')
  await import('ace-builds/src-noconflict/mode-text')
  return mod
}, { ssr: false })

type FileEntry = { name: string; path: string; language: 'lua' | 'json' | 'text'; content: string }

const SAMPLE_FILES: FileEntry[] = [
  { name: 'main.rfs', path: '/project/main.rfs', language: 'lua', content: `-- RetroForge main cartridge\nfunction _init()\n  print('Hello RetroForge!')\nend\n\nfunction _update()\n  -- game loop\nend\n` },
  { name: 'tiles.json', path: '/project/tiles.json', language: 'json', content: `{"tileSize":16,"tiles":[{"id":0,"name":"empty"}]}` },
  { name: 'map.json', path: '/project/map.json', language: 'json', content: `{"width":30,"height":17,"layers":[[0,0,0]]}` },
  { name: 'audio.json', path: '/project/audio.json', language: 'json', content: `{"sounds":[{"id":"jump","wave":"square"}]}` },
  { name: 'config.json', path: '/project/config.json', language: 'json', content: `{"name":"My Game","version":"0.1.0"}` },
]

export default function CodeEditorPage() {
  const [files] = useState<FileEntry[]>(SAMPLE_FILES)
  const [activePath, setActivePath] = useState<string>(files[0].path)
  const active = useMemo(() => files.find((f) => f.path === activePath)!, [files, activePath])
  const [value, setValue] = useState<string>(active.content)

  useEffect(() => {
    setValue(active.content)
  }, [active])

  const aceMode = active.language === 'lua' ? 'lua' : active.language === 'json' ? 'json' : 'text'

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
            onChange={setValue}
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
