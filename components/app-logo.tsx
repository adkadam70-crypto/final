export function AppLogo({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="logoDiamondTop" x1="90" y1="30" x2="90" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a7f3ec" />
          <stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
        <linearGradient id="logoDiamondMid" x1="90" y1="70" x2="90" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="logoDiamondBottom" x1="90" y1="90" x2="90" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#115e59" />
          <stop offset="1" stopColor="#0a3f3a" />
        </linearGradient>
        <radialGradient id="logoShadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000000" stopOpacity="0.45" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="180" height="180" rx="40" fill="#1a1b1f" />

      <ellipse cx="90" cy="132" rx="44" ry="7" fill="url(#logoShadow)" />

      <path d="M90 100 L136 114.5 L90 129 L44 114.5 Z" fill="url(#logoDiamondBottom)" opacity="0.9" />
      <path d="M90 85 L136 99.5 L90 114 L44 99.5 Z" fill="url(#logoDiamondMid)" opacity="0.95" />

      <path
        d="M90 44 L138 60 C140.5 60.8 140.5 64.2 138 65 L94 79.6 C91.4 80.5 88.6 80.5 86 79.6 L42 65 C39.5 64.2 39.5 60.8 42 60 L86 45.4 C87.9 44.8 90 44.8 90 44Z"
        fill="url(#logoDiamondTop)"
      />

      <path d="M90 52 L95.2 65.8 L109 71 L95.2 76.2 L90 90 L84.8 76.2 L71 71 L84.8 65.8 Z" fill="#1a1b1f" />

      <path d="M129 34 L132.6 43.4 L142 47 L132.6 50.6 L129 60 L125.4 50.6 L116 47 L125.4 43.4 Z" fill="#2dd4bf" />
      <path d="M144 55 L146 60.2 L151.2 62.2 L146 64.2 L144 69.4 L142 64.2 L136.8 62.2 L142 60.2 Z" fill="#5eead4" />
    </svg>
  )
}
