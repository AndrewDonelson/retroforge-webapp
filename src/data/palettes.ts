export type Palette = { name: string; colors: string[] }

function clamp(n: number) { return Math.max(0, Math.min(255, n)) }

function hexToRgb(hex: string) {
  const h = hex.replace('#','')
  const bigint = parseInt(h, 16)
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r,g,b].map(v => clamp(v).toString(16).padStart(2,'0')).join('')
}

function shade(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r + amount, g + amount, b + amount)
}

export function generate50Palette(name: string, baseHues16: string[]): Palette {
  const colors: string[] = ['#000000', '#ffffff']
  for (let i = 0; i < 16; i++) {
    const base = baseHues16[i % baseHues16.length]
    colors.push(shade(base, 60))   // highlight
    colors.push(base)              // base
    colors.push(shade(base, -60))  // shadow
  }
  return { name, colors }
}

// Base hue sets (16 each) curated from common retro palettes
export const HUES_RETROFORGE: string[] = ['#ff4d4d','#ff914d','#ffd84d','#b6ff4d','#4dd487','#36d8c7','#4dd5ff','#66bfff','#6f88ff','#8a75ff','#b478ff','#ff6fb1','#ff7fa0','#a8795a','#a0b15a','#38bdf8']
export const HUES_PICO8: string[] = ['#ff004d','#ffa300','#ffec27','#00e436','#29adff','#83769c','#ff77a8','#ffccaa','#1d2b53','#7e2553','#008751','#ab5236','#5f574f','#c2c3c7','#fff1e8','#000000']
export const HUES_NEON: string[] = ['#ff006e','#ff5400','#ffbd00','#a7ff00','#00f5d4','#00bbf9','#4361ee','#7209b7','#b5179e','#f72585','#3eff99','#f8961e','#ffd166','#06d6a0','#118ab2','#ef476f']
export const HUES_PASTEL: string[] = ['#f4a3a3','#f7c59f','#f7e8a3','#cde7b0','#a3e0dc','#a3c4f3','#c9b6e4','#f7aef8','#ffd6e0','#cdb4db','#ffc8dd','#ffafcc','#bde0fe','#a2d2ff','#d0f4de','#f1faee']
export const HUES_EARTH: string[] = ['#b5651d','#cb997e','#ddbea9','#ffe8d6','#6b705c','#a5a58d','#b7b7a4','#3d405b','#81b29a','#f2cc8f','#e07a5f','#8d5524','#c68642','#5d4037','#7d5a50','#a47148']

// Franchise-inspired hue sets (approximations crafted for distinct mood coverage)
export const HUES_WARCRAFT: string[] = ['#7a2e1b','#c79347','#d7b26d','#e4d39b','#356b2b','#5a8e3b','#88a84a','#2e4057','#4a6fa1','#7aa2d6','#9765a8','#5a3668','#a33e3e','#6b2b2b','#a38a6b','#3f2f1b']
export const HUES_STARCRAFT: string[] = ['#2b3a67','#3b82f6','#60a5fa','#93c5fd','#22c55e','#16a34a','#0d9488','#06b6d4','#14b8a6','#a855f7','#7c3aed','#f97316','#ea580c','#f59e0b','#eab308','#64748b']
export const HUES_SUPER_MARIO: string[] = ['#e52521','#ff7f27','#ffbd3a','#ffe761','#3cb44b','#0f7f12','#00a2e8','#3f48cc','#1d2bd7','#a349a4','#c51162','#ff66a1','#9b7653','#8b4513','#ffd1dc','#ffb347']
export const HUES_GRAYSCALE: string[] = ['#0a0a0a','#1a1a1a','#2a2a2a','#3a3a3a','#4a4a4a','#5a5a5a','#6a6a6a','#7a7a7a','#8a8a8a','#9a9a9a','#aaaaaa','#bababa','#cacaca','#dadada','#eaeaea','#f5f5f5']

// Additional classic and thematic hue sets (16 each)
export const HUES_NES: string[] = ['#7c7c7c','#0000fc','#0000bc','#4428bc','#940084','#a80020','#a81000','#881400','#503000','#007800','#006800','#005800','#004058','#000000','#bcbcbc','#0078f8']
export const HUES_SNES: string[] = ['#e04048','#f0a000','#f8e060','#60d0a8','#40a0e0','#6060e0','#a860e0','#e060a8','#b03030','#c07030','#c0a040','#60a060','#4080b0','#6060a0','#9060a0','#a06080']
export const HUES_GENESIS: string[] = ['#e03a3a','#ff7f00','#ffd400','#a4de02','#00a884','#00a3ff','#0051ff','#6a00ff','#b100e8','#ff00a8','#ff4d6d','#ff9e00','#ffd166','#06d6a0','#118ab2','#073b4c']
export const HUES_AMIGA: string[] = ['#cc0000','#ff8c00','#ffd700','#9acd32','#2e8b57','#20b2aa','#1e90ff','#4169e1','#6a5acd','#9932cc','#c71585','#ff69b4','#cd853f','#8b4513','#708090','#2f4f4f']
export const HUES_GAMEBOY_COLOR: string[] = ['#0b380f','#306230','#8bac0f','#9bbc0f','#1b2b34','#343d46','#4f5b66','#65737e','#a7adba','#c0c5ce','#6699cc','#99c794','#5fb3b3','#fac863','#ec5f67','#ab7967']
export const HUES_CYBERPUNK: string[] = ['#ff006e','#f9c80e','#00f5d4','#00bbf9','#3a0ca3','#7209b7','#4361ee','#4cc9f0','#f72585','#b5179e','#4895ef','#560bad','#2b2d42','#8d99ae','#ef233c','#ffd166']
export const HUES_MONOKAI: string[] = ['#f92672','#fd971f','#e6db74','#a6e22e','#66d9ef','#ae81ff','#f8f8f2','#75715e','#272822','#1e1f29','#ff6188','#fc9867','#ffd866','#a9dc76','#78dce8','#ab9df2']

// Generate 64-color palette (16 built-in + 48 game palette)
export function generate64Palette(name: string, baseHues16: string[]): Palette {
  // Built-in colors (0-15)
  const builtinColors = [
    '#000000', '#202020', '#464646', '#6D6D6D',
    '#939393', '#BABABA', '#E0E0E0', '#FFFFFF',
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#00FFFF', '#FF00FF', '#FFA500', '#800080',
  ]
  
  // Generate 48 game palette colors (indices 16-63)
  const gameColors: string[] = []
  for (let i = 0; i < 16 && gameColors.length < 48; i++) {
    const base = baseHues16[i % baseHues16.length]
    gameColors.push(shade(base, 60))   // highlight
    if (gameColors.length < 48) gameColors.push(base)              // base
    if (gameColors.length < 48) gameColors.push(shade(base, -60))  // shadow
  }
  
  // Fill remaining with grayscale if needed
  while (gameColors.length < 48) {
    const v = (gameColors.length * 5) & 255
    gameColors.push(rgbToHex(v, v, v))
  }
  
  return { name, colors: [...builtinColors, ...gameColors] }
}

export const PRESET_50: Palette[] = [
  generate50Palette('RetroForge 50', HUES_RETROFORGE),
  generate50Palette('PICO-8+ 50', HUES_PICO8),
  generate50Palette('Neon 50', HUES_NEON),
  generate50Palette('Pastel 50', HUES_PASTEL),
  generate50Palette('Earth 50', HUES_EARTH),
  generate50Palette('Warcraft 50', HUES_WARCRAFT),
  generate50Palette('StarCraft 50', HUES_STARCRAFT),
  generate50Palette('Super Mario 50', HUES_SUPER_MARIO),
  generate50Palette('Grayscale 50', HUES_GRAYSCALE),
  generate50Palette('NES 50', HUES_NES),
  generate50Palette('SNES 50', HUES_SNES),
  generate50Palette('Genesis 50', HUES_GENESIS),
  generate50Palette('Amiga 50', HUES_AMIGA),
  generate50Palette('Game Boy Color 50', HUES_GAMEBOY_COLOR),
  generate50Palette('Cyberpunk 50', HUES_CYBERPUNK),
  generate50Palette('Monokai 50', HUES_MONOKAI),
]

// 64-color palettes (new system)
export const PRESET_64: Palette[] = [
  generate64Palette('RetroForge 48', HUES_RETROFORGE),
  generate64Palette('PICO-8+ 48', HUES_PICO8),
  generate64Palette('Neon 48', HUES_NEON),
  generate64Palette('Pastel 48', HUES_PASTEL),
  generate64Palette('Earth 48', HUES_EARTH),
  generate64Palette('Warcraft 48', HUES_WARCRAFT),
  generate64Palette('StarCraft 48', HUES_STARCRAFT),
  generate64Palette('Super Mario 48', HUES_SUPER_MARIO),
  generate64Palette('Grayscale 48', HUES_GRAYSCALE),
  generate64Palette('NES 48', HUES_NES),
  generate64Palette('SNES 48', HUES_SNES),
  generate64Palette('Genesis 48', HUES_GENESIS),
  generate64Palette('Amiga 48', HUES_AMIGA),
  generate64Palette('Game Boy Color 48', HUES_GAMEBOY_COLOR),
  generate64Palette('Cyberpunk 48', HUES_CYBERPUNK),
  generate64Palette('Monokai 48', HUES_MONOKAI),
]


