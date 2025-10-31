/**
 * Utilities for unpacking and working with RetroForge cart files
 * Carts are ZIP archives containing manifest.json and assets/
 * 
 * Note: For ZIP handling, we'll use a lightweight approach with pako or manual parsing
 */

export interface CartManifest {
  title: string
  author: string
  description: string
  genre: string
  tags?: string[]
  entry: string // e.g., "main.lua"
  palette?: string // Optional palette name (e.g., "RetroForge 50")
  scale?: number // Optional default scale for cart display
}

export interface CartAssets {
  [path: string]: string // path -> content (as string for text files, base64 for binary)
}

export interface SFXMap {
  [name: string]: {
    type: 'sine' | 'noise' | 'thrust' | 'stopall'
    freq?: number
    duration?: number
    gain?: number
  }
}

export interface MusicMap {
  [name: string]: {
    tokens: string[]
    bpm?: number
    gain?: number
  }
}

export interface MountPoint {
  x: number // X coordinate within sprite bounds
  y: number // Y coordinate within sprite bounds
  name?: string // Optional name for accessing by name in Lua
}

export interface SpriteData {
  width: number
  height: number
  pixels: number[][] // 2D array of color indices (0-49, -1 for transparent)
  useCollision?: boolean // Enable collision detection with other sprites
  mountPoints?: MountPoint[] // Array of mount points (e.g., for bullets, thrusters)
}

export interface SpriteMap {
  [name: string]: SpriteData
}

export interface UnpackedCart {
  manifest: CartManifest
  sfx: SFXMap
  music: MusicMap
  sprites: SpriteMap
  assets: CartAssets
}

/**
 * Unpack a cart from base64 string
 */
export async function unpackCart(base64: string): Promise<UnpackedCart> {
  // Decode base64 to binary
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Use JSZip to unpack
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(bytes)
  
  const manifest: CartManifest = JSON.parse(
    await zip.file('manifest.json')?.async('string') || '{}'
  )

  // Load sfx.json from assets/ - iterate through files to find it
  let sfx: SFXMap = {}
  console.log('[cartUtils] Searching for sfx.json in zip. All paths:', Object.keys(zip.files))
  for (const [path, file] of Object.entries(zip.files)) {
    // Normalize path (handle Windows backslashes)
    const normalizedPath = path.replace(/\\/g, '/').toLowerCase()
    // Check for 'assets/sfx.json' (case insensitive)
    if (normalizedPath === 'assets/sfx.json' && !file.dir) {
      try {
        const sfxContent = await file.async('string')
        console.log('[cartUtils] Found sfx.json at path:', path, 'content length:', sfxContent.length)
        const parsed = JSON.parse(sfxContent)
        if (parsed && typeof parsed === 'object') {
          sfx = parsed
          console.log('[cartUtils] Loaded sfx.json with keys:', Object.keys(sfx))
        } else {
          console.warn('[cartUtils] Parsed sfx.json is not an object:', typeof parsed)
        }
        break
      } catch (e) {
        console.error('[cartUtils] Failed to parse assets/sfx.json:', e, 'from path:', path)
      }
    }
  }
  if (Object.keys(sfx).length === 0) {
    const sfxPaths = Object.keys(zip.files).filter(p => p.toLowerCase().includes('sfx'))
    console.warn('[cartUtils] No sfx.json found in zip. Searched paths with "sfx":', sfxPaths)
    console.warn('[cartUtils] All zip paths:', Object.keys(zip.files))
  }

  // Load music.json from assets/ - iterate through files to find it
  let music: MusicMap = {}
  console.log('[cartUtils] Searching for music.json in zip.')
  for (const [path, file] of Object.entries(zip.files)) {
    // Normalize path (handle Windows backslashes)
    const normalizedPath = path.replace(/\\/g, '/').toLowerCase()
    // Check for 'assets/music.json' (case insensitive)
    if (normalizedPath === 'assets/music.json' && !file.dir) {
      try {
        const musicContent = await file.async('string')
        console.log('[cartUtils] Found music.json at path:', path, 'content length:', musicContent.length)
        const parsed = JSON.parse(musicContent)
        if (parsed && typeof parsed === 'object') {
          music = parsed
          console.log('[cartUtils] Loaded music.json with keys:', Object.keys(music))
        } else {
          console.warn('[cartUtils] Parsed music.json is not an object:', typeof parsed)
        }
        break
      } catch (e) {
        console.error('[cartUtils] Failed to parse assets/music.json:', e, 'from path:', path)
      }
    }
  }
  if (Object.keys(music).length === 0) {
    const musicPaths = Object.keys(zip.files).filter(p => p.toLowerCase().includes('music'))
    console.warn('[cartUtils] No music.json found in zip. Searched paths with "music":', musicPaths)
  }

  // Load sprites.json from assets/
  let sprites: SpriteMap = {}
  console.log('[cartUtils] Searching for sprites.json in zip.')
  for (const [path, file] of Object.entries(zip.files)) {
    const normalizedPath = path.replace(/\\/g, '/').toLowerCase()
    if (normalizedPath === 'assets/sprites.json' && !file.dir) {
      try {
        const spritesContent = await file.async('string')
        console.log('[cartUtils] Found sprites.json at path:', path, 'content length:', spritesContent.length)
        const parsed = JSON.parse(spritesContent)
        if (parsed && typeof parsed === 'object') {
          sprites = parsed
          console.log('[cartUtils] Loaded sprites.json with keys:', Object.keys(sprites))
        } else {
          console.warn('[cartUtils] Parsed sprites.json is not an object:', typeof parsed)
        }
        break
      } catch (e) {
        console.error('[cartUtils] Failed to parse assets/sprites.json:', e, 'from path:', path)
      }
    }
  }
  if (Object.keys(sprites).length === 0) {
    console.log('[cartUtils] No sprites.json found in zip (this is OK for new carts)')
  }

  const assets: CartAssets = {}
  
  // Extract all files from assets/ (excluding sfx.json and music.json which are handled separately)
  for (const [path, file] of Object.entries(zip.files)) {
    if (path.startsWith('assets/') && !file.dir) {
      const assetPath = path.replace('assets/', '')
      
      // Skip sfx.json, music.json, and sprites.json - they're handled separately
      if (assetPath === 'sfx.json' || assetPath === 'music.json' || assetPath === 'sprites.json') {
        continue
      }
      
      // Try to decode as text first (for .lua, .json, .txt, etc.)
      // For binary files, keep as base64
      if (assetPath.match(/\.(lua|json|txt|md|glsl)$/i)) {
        assets[assetPath] = await file.async('string')
      } else {
        // Binary file - store as base64
        const blob = await file.async('blob')
        const reader = new FileReader()
        assets[assetPath] = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      }
    }
  }

  // Ensure sfx, music, and sprites are always objects (never undefined)
  if (!sfx || typeof sfx !== 'object') sfx = {}
  if (!music || typeof music !== 'object') music = {}
  if (!sprites || typeof sprites !== 'object') sprites = {}
  
  console.log('[cartUtils] Final unpacked - sfx keys:', Object.keys(sfx), 'music keys:', Object.keys(music), 'sprite keys:', Object.keys(sprites))
  
  return { manifest, sfx, music, sprites, assets }
}

/**
 * Pack a cart into base64 string
 */
export async function packCart(manifest: CartManifest, assets: CartAssets, sfx?: SFXMap, music?: MusicMap, sprites?: SpriteMap): Promise<string> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  // Add manifest.json
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))

  // Add sfx.json to assets/ if provided
  if (sfx && Object.keys(sfx).length > 0) {
    zip.file('assets/sfx.json', JSON.stringify(sfx, null, 2))
  }

  // Add music.json to assets/ if provided
  if (music && Object.keys(music).length > 0) {
    zip.file('assets/music.json', JSON.stringify(music, null, 2))
  }

  // Add sprites.json to assets/ if provided
  if (sprites && Object.keys(sprites).length > 0) {
    zip.file('assets/sprites.json', JSON.stringify(sprites, null, 2))
  }

  // Add assets
  for (const [path, content] of Object.entries(assets)) {
    const fullPath = `assets/${path}`
    if (content.startsWith('data:')) {
      // Base64 data URL - extract base64 part
      const base64 = content.split(',')[1]
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      zip.file(fullPath, bytes)
    } else {
      // Text content
      zip.file(fullPath, content)
    }
  }

  const blob = await zip.generateAsync({ type: 'uint8array' })
  const binaryString = String.fromCharCode(...blob)
  return btoa(binaryString)
}

