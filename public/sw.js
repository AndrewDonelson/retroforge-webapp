// Service Worker for RetroForge PWA
const CACHE_NAME = 'retroforge-v1'
const urlsToCache = [
  '/',
  '/arcade',
  '/editor/sprite',
  '/docs/guide',
  '/docs/api-reference',
  '/docs/comparison',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/engine/retroforge.wasm',
  '/engine/wasm_exec.js',
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error('[SW] Cache failed:', error)
      })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(() => {
        // If both fail, return offline page if available
        if (event.request.destination === 'document') {
          return caches.match('/')
        }
      })
  )
})

