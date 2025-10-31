"use client"

import { createContext, useContext, useState, useEffect, ReactNode, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { unpackCart, packCart, type UnpackedCart, type CartManifest, type CartAssets } from '@/lib/cartUtils'
import { useAuth } from '@/contexts/AuthContext'
import { CreateCartModal } from '@/components/carts/CreateCartModal'

interface EditorContextType {
  cartId: Id<'carts'> | null
  cart: UnpackedCart | null
  isLoading: boolean
  error: string | null
  updateManifest: (manifest: Partial<CartManifest>) => void
  updateAsset: (path: string, content: string) => void
  updateSFX: (sfx: import('@/lib/cartUtils').SFXMap) => void
  updateMusic: (music: import('@/lib/cartUtils').MusicMap) => void
  updateSprites: (sprites: import('@/lib/cartUtils').SpriteMap) => void
  saveCart: () => Promise<void>
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

function EditorProviderInner({ children }: { children: ReactNode }) {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [cartId, setCartId] = useState<Id<'carts'> | null>(null)
  const [cart, setCart] = useState<UnpackedCart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unpackedCartId, setUnpackedCartId] = useState<Id<'carts'> | null>(null) // Track which cartId we've unpacked
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const createCartMutation = useMutation(api.cartActions.createCart)

  // Get cartId from URL params or search params
  useEffect(() => {
    const id = searchParams?.get('cartId') || (params?.cartId as string)
    console.log('[EditorContext] cartId from URL:', id, 'searchParams:', searchParams?.get('cartId'), 'params:', params?.cartId)
    if (id && typeof id === 'string' && id.startsWith('j')) {
      const newCartId = id as Id<'carts'>
      setCartId(newCartId)
      // If cartId changed, reset cart state and unpack flag
      if (newCartId !== unpackedCartId) {
        setCart(null)
        setUnpackedCartId(null)
        setIsLoading(true)
      }
    } else {
      setCartId(null)
      setCart(null)
      setUnpackedCartId(null)
      setIsLoading(false)
    }
  }, [params, searchParams, unpackedCartId])

  // Load cart from database
  const dbCart = useQuery(
    api.cartActions.getById,
    cartId ? { cartId } : 'skip'
  )
  
  // Load cart files from cartFiles table
  const cartFiles = useQuery(
    api.cartFiles.getCartFiles,
    cartId && user ? { cartId, userId: user.userId } : cartId ? { cartId } : 'skip'
  )

  // Show create modal if no cartId and user is authenticated
  useEffect(() => {
    // Show modal if:
    // 1. User is authenticated
    // 2. No cartId in URL
    // 3. Not currently loading a cart
    // 4. Modal not already shown
    if (isAuthenticated && user && !cartId && unpackedCartId === null && dbCart === undefined && !showCreateModal) {
      // Small delay to avoid flashing
      const timer = setTimeout(() => {
        setShowCreateModal(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user, cartId, unpackedCartId, dbCart, showCreateModal])

  // Handle cart creation from modal
  const handleCreateCart = async (fullName: string) => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // Extract cart name from fullName (username/cartname)
      const parts = fullName.split('/')
      const cartName = parts[1] || fullName

      // Create a default cart with empty manifest
      const defaultManifest: CartManifest = {
        title: cartName,
        author: user.username,
        description: '',
        genre: 'Arcade',
        tags: [],
        entry: 'main.lua',
      }
      
      // Create default main.lua
      const defaultAssets: CartAssets = {
        'main.lua': `-- RetroForge Cart
-- Your game code goes here

function _INIT()
  -- Initialize game state
end

function _UPDATE(dt)
  -- Update game logic (dt is delta time in seconds)
end

function _DRAW()
  -- Draw graphics
  rf.clear_i(0) -- Clear screen with color index 0
end
`,
      }
      
      // Pack cart to base64
      const cartData = await packCart(defaultManifest, defaultAssets)
      
      // Create cart in database
      const result = await createCartMutation({
        ownerId: user.userId,
        title: defaultManifest.title,
        description: defaultManifest.description,
        genre: defaultManifest.genre,
        cartData,
        isPublic: false,
      })
      
      // Close modal
      setShowCreateModal(false)
      
      // Redirect to editor with new cartId
      router.replace(`/editor?cartId=${result.cartId}`)
    } catch (err: any) {
      console.error('Failed to create cart:', err)
      setError(err.message || 'Failed to create cart')
      setIsLoading(false)
      throw err // Re-throw so modal can handle it
    }
  }

  // Unpack cart when data is available - only once per cartId
  useEffect(() => {
    // Skip if we've already unpacked this cart
    if (!cartId || !dbCart || cartId === unpackedCartId) {
      if (cartId && dbCart === null) {
        // Query returned null - cart not found
        console.log('[EditorContext] Cart not found for cartId:', cartId)
        setError('Cart not found')
        setIsLoading(false)
      } else if (!cartId) {
        console.log('[EditorContext] No cartId provided')
        setIsLoading(false)
      } else if (cartId && dbCart === undefined) {
        // Still loading
        console.log('[EditorContext] Waiting for cart data...')
      } else if (cartId === unpackedCartId && cart) {
        // Already unpacked, not loading
        setIsLoading(false)
      }
      return
    }

    let cancelled = false

    async function loadCart() {
      let cartDataToUse = dbCart?.cartData

      console.log('[EditorContext] Loading cart - isExample:', dbCart?.isExample, 'has cartData:', !!dbCart?.cartData, 'title:', dbCart?.title)

      // For example carts (or carts with example titles), prefer loading from URL to get latest version
      // This handles both actual example carts and forks that might have stale data
      // Normalize title: lowercase, trim, replace hyphens with spaces for consistent matching
      const normalizedTitle = dbCart?.title ? dbCart.title.toLowerCase().trim().replace(/-/g, ' ').replace(/\s+/g, ' ') : ''
      
      // Map normalized titles to their .rf filenames
      const titleToFile: Record<string, string> = {
        'hello world': 'helloworld.rf',
        'moon lander': 'moon-lander.rf',
        'tron light cycles': 'tron-lightcycles.rf',
      }
      
      const cartFileName = normalizedTitle ? titleToFile[normalizedTitle] : null
      
      // Load from URL if it's an example cart or if the title matches an example cart name
      if (dbCart?.isExample || cartFileName) {
        const fileName = cartFileName || (normalizedTitle ? normalizedTitle.replace(/\s+/g, '-') + '.rf' : null)
        
        if (fileName) {
          try {
            console.log('[EditorContext] Attempting to load cart from URL (example or matching title):', fileName)
            const response = await fetch(`/carts/${fileName}`)
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer()
              const bytes = new Uint8Array(arrayBuffer)
              // Convert to base64
              let binaryString = ''
              for (let i = 0; i < bytes.length; i++) {
                binaryString += String.fromCharCode(bytes[i])
              }
              cartDataToUse = btoa(binaryString)
              console.log('[EditorContext] Successfully loaded cart from URL:', fileName, 'size:', bytes.length)
            } else {
              console.warn('[EditorContext] Failed to fetch cart from URL:', fileName, 'status:', response.status, '- will use database cartData')
            }
          } catch (e) {
            console.warn('[EditorContext] Exception loading cart from URL:', fileName, '- error:', e, '- will use database cartData')
          }
        }
      }

      if (!cartDataToUse) {
        if (dbCart) {
          setError('Cart has no data')
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const unpacked = await unpackCart(cartDataToUse)
        
        // Debug: Log what was unpacked
        console.log('[EditorContext] Unpacked sfx keys:', Object.keys(unpacked.sfx || {}))
        console.log('[EditorContext] Unpacked music keys:', Object.keys(unpacked.music || {}))
        console.log('[EditorContext] Unpacked sprite keys:', Object.keys(unpacked.sprites || {}))
        
        // Ensure sfx, music, and sprites are objects, not undefined
        if (!unpacked.sfx) unpacked.sfx = {}
        if (!unpacked.music) unpacked.music = {}
        if (!unpacked.sprites) unpacked.sprites = {}
        
        // If cartFiles exist, merge them into the unpacked cart (cartFiles take precedence)
        if (!cancelled && cartFiles && Array.isArray(cartFiles) && cartFiles.length > 0) {
          const filesMap = new Map(cartFiles.map(f => [f.path, f.content]))
          
          // Update manifest from cartFiles if manifest.json exists
          if (filesMap.has('manifest.json')) {
            try {
              const manifestContent = filesMap.get('manifest.json')!
              const parsedManifest = JSON.parse(manifestContent)
              unpacked.manifest = { ...unpacked.manifest, ...parsedManifest }
            } catch (e) {
              console.error('Failed to parse manifest.json from cartFiles:', e)
            }
          }

          // Update sfx from cartFiles if assets/sfx.json exists (but don't override with empty objects)
          if (filesMap.has('assets/sfx.json')) {
            try {
              const sfxContent = filesMap.get('assets/sfx.json')!
              const parsed = JSON.parse(sfxContent)
              // Only override if parsed result has content (not empty object)
              if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                unpacked.sfx = parsed
                console.log('[EditorContext] Updated sfx from cartFiles with keys:', Object.keys(parsed))
              } else {
                console.log('[EditorContext] cartFiles has empty sfx.json, keeping unpacked sfx')
              }
            } catch (e) {
              console.error('Failed to parse assets/sfx.json from cartFiles:', e)
            }
          }

          // Update music from cartFiles if assets/music.json exists (but don't override with empty objects)
          if (filesMap.has('assets/music.json')) {
            try {
              const musicContent = filesMap.get('assets/music.json')!
              const parsed = JSON.parse(musicContent)
              // Only override if parsed result has content (not empty object)
              if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                unpacked.music = parsed
                console.log('[EditorContext] Updated music from cartFiles with keys:', Object.keys(parsed))
              } else {
                console.log('[EditorContext] cartFiles has empty music.json, keeping unpacked music')
              }
            } catch (e) {
              console.error('Failed to parse assets/music.json from cartFiles:', e)
            }
          }

          // Update sprites from cartFiles if assets/sprites.json exists (but don't override with empty objects)
          if (filesMap.has('assets/sprites.json')) {
            try {
              const spritesContent = filesMap.get('assets/sprites.json')!
              const parsed = JSON.parse(spritesContent)
              // Only override if parsed result has content (not empty object)
              if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                unpacked.sprites = parsed
                console.log('[EditorContext] Updated sprites from cartFiles with keys:', Object.keys(parsed))
              } else {
                console.log('[EditorContext] cartFiles has empty sprites.json, keeping unpacked sprites')
              }
            } catch (e) {
              console.error('Failed to parse assets/sprites.json from cartFiles:', e)
            }
          }
          
          // Update assets from cartFiles (only text files, not manifest/sfx/music/sprites)
          for (const [path, content] of Array.from(filesMap.entries())) {
            if (path !== 'manifest.json' && path !== 'assets/sfx.json' && path !== 'assets/music.json' && path !== 'assets/sprites.json' && path.match(/\.(lua|json|txt|md|glsl)$/i)) {
              unpacked.assets[path] = content
            }
          }
        }
        
        if (!cancelled) {
          setCart(unpacked)
          setUnpackedCartId(cartId) // Mark this cartId as unpacked
          setIsLoading(false)
        }
      } catch (err: any) {
        console.error('Failed to unpack cart:', err)
        if (!cancelled) {
          setError(err.message || 'Failed to load cart')
          setIsLoading(false)
        }
      }
    }

    loadCart()

    return () => {
      cancelled = true
    }
  }, [dbCart, cartId, unpackedCartId, cart, cartFiles])

  const updateManifest = (updates: Partial<CartManifest>) => {
    if (cart) {
      setCart({
        ...cart,
        manifest: { ...cart.manifest, ...updates },
      })
    }
  }

  const updateAsset = (path: string, content: string) => {
    if (cart) {
      setCart({
        ...cart,
        assets: { ...cart.assets, [path]: content },
      })
    }
  }

  const updateSFX = (sfx: import('@/lib/cartUtils').SFXMap) => {
    if (cart) {
      setCart({
        ...cart,
        sfx,
      })
    }
  }

  const updateMusic = (music: import('@/lib/cartUtils').MusicMap) => {
    if (cart) {
      setCart({
        ...cart,
        music,
      })
    }
  }

  const updateSprites = (sprites: import('@/lib/cartUtils').SpriteMap) => {
    if (cart) {
      setCart({
        ...cart,
        sprites,
      })
    }
  }

  const saveCart = async () => {
    // TODO: Implement save to database
    console.log('Save cart not yet implemented')
  }

  return (
    <EditorContext.Provider
      value={{
        cartId,
        cart,
        isLoading,
        error,
        updateManifest,
        updateAsset,
        updateSFX,
        updateMusic,
        updateSprites,
        saveCart,
      }}
    >
      {children}
      {showCreateModal && (
        <CreateCartModal
          onCreate={handleCreateCart}
          onCancel={() => {
            setShowCreateModal(false)
            // Redirect back to home if user cancels
            router.push('/')
          }}
        />
      )}
    </EditorContext.Provider>
  )
}

export function EditorProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="p-4 text-gray-400">Loading editor...</div>}>
      <EditorProviderInner>{children}</EditorProviderInner>
    </Suspense>
  )
}

export function useEditor() {
  const context = useContext(EditorContext)
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return context
}

