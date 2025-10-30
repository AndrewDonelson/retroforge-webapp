export default function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="140"
      height="28"
      viewBox="0 0 280 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="RetroForge"
      role="img"
    >
      {/* Retro pixel grid backdrop */}
      <defs>
        <linearGradient id="rfGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Pixel frame */}
      <rect x="2" y="2" width="52" height="52" rx="2" fill="#0f172a" stroke="#0369a1" strokeWidth="3" />
      {/* Pixel R */}
      <rect x="8" y="8" width="8" height="8" fill="url(#rfGrad)" />
      <rect x="16" y="8" width="16" height="8" fill="url(#rfGrad)" />
      <rect x="8" y="16" width="8" height="8" fill="url(#rfGrad)" />
      <rect x="24" y="16" width="8" height="8" fill="url(#rfGrad)" />
      <rect x="8" y="24" width="8" height="8" fill="url(#rfGrad)" />
      <rect x="16" y="24" width="16" height="8" fill="url(#rfGrad)" />
      {/* leg for R */}
      <rect x="24" y="32" width="8" height="8" fill="url(#rfGrad)" />
      <rect x="8" y="32" width="8" height="16" fill="url(#rfGrad)" />

      {/* Modern forge anvil mark */}
      <g filter="url(#glow)">
        <path d="M86 30c20 0 24-10 36-10h28c-4 6-10 10-18 12l-18 4v6h-28v-12z" fill="#0ea5e9" />
        <rect x="168" y="12" width="36" height="6" rx="3" fill="#38bdf8" />
      </g>

      {/* Wordmark */}
      <text x="86" y="44" fontFamily="'JetBrains Mono', monospace" fontSize="20" fontWeight="700" fill="#e5f2ff">
        RetroForge
      </text>
    </svg>
  )
}


