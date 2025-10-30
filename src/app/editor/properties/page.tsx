export default function PropertiesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-pixel text-white">Project Properties</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card-retro p-3">
          <div className="text-sm text-gray-300 mb-2">Basics</div>
          <div className="space-y-2">
            <input className="input-retro w-full" placeholder="Title" />
            <input className="input-retro w-full" placeholder="Author" />
            <select className="input-retro w-full">
              <option>Genre</option>
              <option>Action</option>
              <option>Adventure</option>
              <option>Puzzle</option>
              <option>Platformer</option>
              <option>RPG</option>
              <option>Shooter</option>
              <option>Strategy</option>
              <option>Simulation</option>
              <option>Sports</option>
              <option>Racing</option>
              <option>Arcade</option>
              <option>Other</option>
            </select>
            <textarea className="input-retro w-full h-24" placeholder="Description" />
          </div>
        </div>
        <div className="card-retro p-3">
          <div className="text-sm text-gray-300 mb-2">Display</div>
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Resolution: 480×270 (fixed)</div>
            <div className="text-xs text-gray-400">Target FPS: 60</div>
          </div>
        </div>
        <div className="card-retro p-3 md:col-span-2">
          <div className="text-sm text-gray-300 mb-2">Tags (up to 5)</div>
          <div className="flex flex-wrap gap-2">
            {['retro','pixel-art','platformer','demo','wip'].map((t) => (
              <span key={t} className="text-xs px-2 py-1 bg-gray-700 border border-gray-600">{t}</span>
            ))}
            <input className="input-retro" placeholder="Add tag" />
          </div>
        </div>
      </div>
    </div>
  )
}


