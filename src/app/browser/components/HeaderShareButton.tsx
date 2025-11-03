"use client"

interface HeaderShareButtonProps {
  shareUrl: string
}

export function HeaderShareButton({ shareUrl }: HeaderShareButtonProps) {
  return (
    <button
      onClick={async () => {
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'RetroForge Games',
              text: 'Check out these RetroForge games!',
              url: shareUrl,
            })
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              await navigator.clipboard.writeText(shareUrl)
            }
          }
        } else {
          await navigator.clipboard.writeText(shareUrl)
        }
      }}
      className="px-3 py-1.5 bg-retro-600 hover:bg-retro-500 rounded-lg text-white text-sm font-medium transition-all shadow-md flex items-center gap-1.5"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      Share
    </button>
  )
}

