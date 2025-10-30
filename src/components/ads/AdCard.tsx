export default function AdCard() {
  return (
    <article className="card-retro overflow-hidden bg-gray-850 border-gray-700">
      <div className="relative w-full aspect-square bg-gray-900 flex items-center justify-center">
        <div className="w-3/4 h-3/4 bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400">
          Sponsored — Ad Card
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-white font-semibold leading-snug">Sponsored</h3>
          <span className="shrink-0 text-2xs px-2 py-0.5 bg-gray-700 border border-gray-600 uppercase tracking-wide">
            Ad
          </span>
        </div>
        <p className="text-sm text-gray-300 mt-2 line-clamp-3">
          This is a sponsored placement. Replace with your ad provider creative.
        </p>
      </div>
    </article>
  )
}


