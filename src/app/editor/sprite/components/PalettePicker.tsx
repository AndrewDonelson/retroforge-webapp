import React, { useState } from 'react';

interface ColorInfo {
  i: number;
  name: string;
  hex: string;
  rgb: string;
}

interface PalettePickerProps {
  selectedColor: number;
  onColorSelect: (colorIndex: number) => void;
}

// Built-in colors (0-15) - always available
const BUILTIN_COLORS: ColorInfo[] = [
  { i: 0, name: "Black", hex: "#000000", rgb: "0,0,0" },
  { i: 1, name: "Charcoal", hex: "#202020", rgb: "32,32,32" },
  { i: 2, name: "Slate", hex: "#464646", rgb: "70,70,70" },
  { i: 3, name: "Steel", hex: "#6D6D6D", rgb: "109,109,109" },
  { i: 4, name: "Silver", hex: "#939393", rgb: "147,147,147" },
  { i: 5, name: "Ash", hex: "#BABABA", rgb: "186,186,186" },
  { i: 6, name: "Smoke", hex: "#E0E0E0", rgb: "224,224,224" },
  { i: 7, name: "White", hex: "#FFFFFF", rgb: "255,255,255" },
  { i: 8, name: "Red", hex: "#FF0000", rgb: "255,0,0" },
  { i: 9, name: "Green", hex: "#00FF00", rgb: "0,255,0" },
  { i: 10, name: "Blue", hex: "#0000FF", rgb: "0,0,255" },
  { i: 11, name: "Yellow", hex: "#FFFF00", rgb: "255,255,0" },
  { i: 12, name: "Cyan", hex: "#00FFFF", rgb: "0,255,255" },
  { i: 13, name: "Magenta", hex: "#FF00FF", rgb: "255,0,255" },
  { i: 14, name: "Orange", hex: "#FFA500", rgb: "255,165,0" },
  { i: 15, name: "Purple", hex: "#800080", rgb: "128,0,128" },
];

// Generate RetroForge 48 game palette colors (indices 16-63)
function generateRetroForge48Colors(): ColorInfo[] {
  const baseHues = [
    "#ff4d4d", "#ff914d", "#ffd84d", "#b6ff4d",
    "#4dd487", "#36d8c7", "#4dd5ff", "#66bfff",
    "#6f88ff", "#8a75ff", "#b478ff", "#ff6fb1",
    "#ff7fa0", "#a8795a", "#a0b15a", "#38bdf8",
  ];

  function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace('#', '');
    const bigint = parseInt(h, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  }

  function rgbToHex(r: number, g: number, b: number): string {
    const clamp = (n: number) => Math.max(0, Math.min(255, n));
    return `#${[r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('')}`;
  }

  function shade(hex: string, amount: number): string {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHex(r + amount, g + amount, b + amount);
  }

  function rgbToString(r: number, g: number, b: number): string {
    return `${r},${g},${b}`;
  }

  const colors: ColorInfo[] = [];
  let idx = 16; // Start at index 16 (game palette)

  for (let i = 0; i < 16 && idx < 64; i++) {
    const base = baseHues[i];
    const { r: r1, g: g1, b: b1 } = hexToRgb(shade(base, 60)); // highlight
    colors.push({
      i: idx++,
      name: `RetroForge ${idx - 17} (Highlight)`,
      hex: shade(base, 60),
      rgb: rgbToString(r1, g1, b1),
    });

    if (idx >= 64) break;
    const { r: r2, g: g2, b: b2 } = hexToRgb(base); // base
    colors.push({
      i: idx++,
      name: `RetroForge ${idx - 17} (Base)`,
      hex: base,
      rgb: rgbToString(r2, g2, b2),
    });

    if (idx >= 64) break;
    const { r: r3, g: g3, b: b3 } = hexToRgb(shade(base, -60)); // shadow
    colors.push({
      i: idx++,
      name: `RetroForge ${idx - 17} (Shadow)`,
      hex: shade(base, -60),
      rgb: rgbToString(r3, g3, b3),
    });
  }

  // Fill remaining with grayscale if needed
  while (idx < 64) {
    const v = (idx * 5) & 255;
    colors.push({
      i: idx++,
      name: `RetroForge ${idx - 17} (Grayscale)`,
      hex: rgbToHex(v, v, v),
      rgb: rgbToString(v, v, v),
    });
  }

  return colors;
}

const GAME_PALETTE_COLORS = generateRetroForge48Colors();

// Combine all 64 colors
const ALL_COLORS: ColorInfo[] = [...BUILTIN_COLORS, ...GAME_PALETTE_COLORS];

export function PalettePicker({ selectedColor, onColorSelect }: PalettePickerProps) {
  const [hoveredColor, setHoveredColor] = useState<ColorInfo | null>(null);

  const handleColorClick = (colorIndex: number) => {
    onColorSelect(colorIndex);
  };

  return (
    <div className="relative bg-gray-900 p-4 rounded-lg">
      {/* Title */}
      <h3 className="text-white text-sm font-mono mb-3 text-center">
        RetroForge 64 Palette
      </h3>
      
      {/* Palette Grid - 8x8 square */}
      <div className="grid grid-cols-8 gap-0.5">
        {ALL_COLORS.map((color) => (
          <div
            key={color.i}
            className="relative group"
            onMouseEnter={() => setHoveredColor(color)}
            onMouseLeave={() => setHoveredColor(null)}
            onClick={() => handleColorClick(color.i)}
          >
            {/* Color Square */}
            <div
              className={`w-4 h-4 cursor-pointer border transition-all ${
                selectedColor === color.i
                  ? 'border-retro-500 ring-1 ring-retro-500/50 scale-110'
                  : 'border-gray-700 hover:border-white'
              }`}
              style={{ backgroundColor: color.hex }}
            />
            
            {/* Tooltip */}
            {hoveredColor?.i === color.i && (
              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
                <div className="bg-gray-800 text-white text-xs rounded px-2 py-1.5 shadow-lg border border-gray-600 whitespace-nowrap font-mono">
                  <div className="font-bold mb-0.5">[{color.i}] {color.name}</div>
                  <div className="text-gray-300">{color.hex}</div>
                  <div className="text-gray-400">RGB({color.rgb})</div>
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                    <div className="border-4 border-transparent border-t-gray-800" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="text-gray-500 text-xs text-center mt-3 font-mono">
        8×8 Grid | 0-15: Builtin | 16-63: Game Palette
      </div>
    </div>
  );
}

