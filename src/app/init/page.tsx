'use client'

import { useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'

export default function InitPage() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [result, setResult] = useState<{
    created: number
    updated: number
    errors: string[]
  } | null>(null)

  const syncExampleCarts = useAction(api.syncExampleCarts.syncExampleCarts)

  const handleSync = async () => {
    setIsSyncing(true)
    setResult(null)

    try {
      // Fetch all cart files from the public directory
      const cartsToSync = [
        { id: 'helloworld', url: '/carts/helloworld.rf' },
        { id: 'moon-lander', url: '/carts/moon-lander.rf' },
        { id: 'tron-lightcycles', url: '/carts/tron-lightcycles.rf' },
        { id: 'multiplayer-platformer', url: '/carts/multiplayer-platformer.rf' },
      ]

      const cartsData = await Promise.all(
        cartsToSync.map(async (cart) => {
          try {
            const response = await fetch(cart.url)
            if (!response.ok) {
              throw new Error(`Failed to fetch ${cart.id}: ${response.status} ${response.statusText}`)
            }
            const arrayBuffer = await response.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer)
            
            // Convert to base64
            let binaryString = ''
            for (let i = 0; i < uint8Array.length; i++) {
              binaryString += String.fromCharCode(uint8Array[i])
            }
            const base64 = btoa(binaryString)
            
            return { id: cart.id, base64 }
          } catch (error: any) {
            throw new Error(`Failed to fetch ${cart.id}: ${error.message}`)
          }
        })
      )

      // Send all cart data to Convex action
      const res = await syncExampleCarts({ cartsData })
      setResult(res)
    } catch (error: any) {
      setResult({
        created: 0,
        updated: 0,
        errors: [error.message || 'Unknown error'],
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Initialize Example Carts</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <p className="text-gray-300 mb-4">
            This page syncs all example carts from the <code className="bg-gray-700 px-2 py-1 rounded">/public/carts/</code> directory 
            into the Convex database. It will:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
            <li>Fetch each <code className="bg-gray-700 px-1 py-0.5 rounded">.rf</code> cart file</li>
            <li>Unpack the cart to extract all files (manifest, assets, sfx, music, sprites)</li>
            <li>Create new cart records if they don't exist</li>
            <li>Update existing cart records if they do exist</li>
            <li>Store all unpacked files in the <code className="bg-gray-700 px-1 py-0.5 rounded">cartFiles</code> table</li>
            <li>Store the packed cart data as base64 in the <code className="bg-gray-700 px-1 py-0.5 rounded">cartData</code> field</li>
          </ul>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={`
            px-6 py-3 rounded font-semibold
            ${isSyncing 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-retro-600 hover:bg-retro-500'
            }
            transition-colors
          `}
        >
          {isSyncing ? 'Syncing...' : 'Sync Example Carts'}
        </button>

        {result && (
          <div className={`mt-6 p-6 rounded-lg ${
            result.errors.length > 0 ? 'bg-yellow-900/50' : 'bg-green-900/50'
          }`}>
            <h2 className="text-2xl font-semibold mb-4">Sync Results</h2>
            
            <div className="space-y-2 mb-4">
              <p className="text-green-400">
                ✅ Created: <strong>{result.created}</strong> carts
              </p>
              <p className="text-blue-400">
                🔄 Updated: <strong>{result.updated}</strong> carts
              </p>
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-red-400 font-semibold mb-2">Errors:</p>
                  <ul className="list-disc list-inside space-y-1 text-red-300 ml-4">
                    {result.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {result.errors.length === 0 && result.created + result.updated > 0 && (
              <p className="text-green-300">
                ✨ All example carts have been successfully synced!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

