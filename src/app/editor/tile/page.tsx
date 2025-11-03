export default function TileEditorPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="editor-toolbar text-retro-400">Tile Editor (placeholder)</div>
      <div className="editor-content p-3 grid md:grid-cols-[1fr_280px] gap-3">
        <div className="pixel-container w-full h-80 bg-gray-900 flex items-center justify-center">
          <span className="text-gray-400">Tile canvas</span>
        </div>
        <div className="card-retro p-3">
          <div className="text-sm text-gray-300 mb-2">Palette</div>
          <div className="grid grid-cols-8 gap-1">
            {new Array(32).fill(0).map((_, i) => (
              <div key={i} className="w-6 h-6 bg-gray-700" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


