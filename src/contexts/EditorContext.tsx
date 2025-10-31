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
      if (!dbCart?.cartData) {
        if (dbCart) {
          setError('Cart has no data')
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const unpacked = await unpackCart(dbCart.cartData)
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
  }, [dbCart, cartId, unpackedCartId, cart])

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

