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

export interface UnpackedCart {
  manifest: CartManifest
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

  const assets: CartAssets = {}
  
  // Extract all files from assets/
  for (const [path, file] of Object.entries(zip.files)) {
    if (path.startsWith('assets/') && !file.dir) {
      const assetPath = path.replace('assets/', '')
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

  return { manifest, assets }
}

/**
 * Pack a cart into base64 string
 */
export async function packCart(manifest: CartManifest, assets: CartAssets): Promise<string> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  // Add manifest.json
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))

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

