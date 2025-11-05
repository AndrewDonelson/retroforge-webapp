# PWA Icons Required

The RetroForge webapp requires PWA icons for installability. Please generate the following icon files:

## Required Icons

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels

## How to Generate

You can use the existing `logo.png` or `logo.svg` as a base and generate icons using:

1. **Online tools:**
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://www.appicon.co/

2. **Command line (ImageMagick):**
   ```bash
   # From logo.png
   convert logo.png -resize 192x192 icon-192.png
   convert logo.png -resize 512x512 icon-512.png
   ```

3. **Manual creation:**
   - Use any image editor (GIMP, Photoshop, etc.)
   - Create square icons (192x192 and 512x512)
   - Use RetroForge branding colors (#8b5cf6 theme color)
   - Ensure icons look good on both light and dark backgrounds

## Icon Guidelines

- **Format:** PNG
- **Sizes:** 192x192 and 512x512 pixels (square)
- **Purpose:** Both should be "any maskable" (work as app icons)
- **Background:** Can be transparent or solid color
- **Content:** Should represent RetroForge (use logo or retro game aesthetic)

## Placement

Icons should be placed in `/public/` directory:
- `/public/icon-192.png`
- `/public/icon-512.png`

Once these files are created, the PWA will be fully functional!

