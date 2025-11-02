export default function Logo({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo.svg"
      alt="RetroForge"
      width={140}
      height={28}
      className={className}
    />
  )
}


