/**
 * Client-side authentication utilities using Web Crypto API
 */

const STORAGE_KEYS = {
  PRIVATE_KEY: 'rf_private_key',
  PUBLIC_KEY: 'rf_public_key',
  USERNAME: 'rf_username',
  SERVER_KEY: 'rf_server_key',
} as const

/**
 * Generate a new keypair for the user
 */
export async function generateKeypair(): Promise<{ privateKey: string; publicKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['sign', 'verify']
  )

  // Export keys
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)

  // Convert to base64
  const privateKeyArray = new Uint8Array(privateKeyBuffer)
  let privateKeyStr = ''
  for (let i = 0; i < privateKeyArray.length; i++) {
    privateKeyStr += String.fromCharCode(privateKeyArray[i])
  }
  const privateKey = btoa(privateKeyStr)
  
  const publicKeyArray = new Uint8Array(publicKeyBuffer)
  let publicKeyStr = ''
  for (let i = 0; i < publicKeyArray.length; i++) {
    publicKeyStr += String.fromCharCode(publicKeyArray[i])
  }
  const publicKey = btoa(publicKeyStr)

  return { privateKey, publicKey }
}

/**
 * Store keys in localStorage
 */
export function storeKeys(privateKey: string, publicKey: string, username: string, serverKey?: string) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(STORAGE_KEYS.PRIVATE_KEY, privateKey)
  localStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, publicKey)
  localStorage.setItem(STORAGE_KEYS.USERNAME, username)
  if (serverKey) {
    localStorage.setItem(STORAGE_KEYS.SERVER_KEY, serverKey)
  }
}

/**
 * Get stored keys
 */
export function getStoredKeys(): {
  privateKey: string | null
  publicKey: string | null
  username: string | null
  serverKey: string | null
} {
  if (typeof window === 'undefined') {
    return { privateKey: null, publicKey: null, username: null, serverKey: null }
  }

  return {
    privateKey: localStorage.getItem(STORAGE_KEYS.PRIVATE_KEY),
    publicKey: localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY),
    username: localStorage.getItem(STORAGE_KEYS.USERNAME),
    serverKey: localStorage.getItem(STORAGE_KEYS.SERVER_KEY),
  }
}

/**
 * Clear stored keys (logout)
 */
export function clearKeys() {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(STORAGE_KEYS.PRIVATE_KEY)
  localStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY)
  localStorage.removeItem(STORAGE_KEYS.USERNAME)
  localStorage.removeItem(STORAGE_KEYS.SERVER_KEY)
}

/**
 * Sign a message with the stored private key
 */
export async function signMessage(message: string): Promise<string> {
  const { privateKey } = getStoredKeys()
  if (!privateKey) {
    throw new Error('No private key found')
  }

  // Import private key
  const keyBuffer = Uint8Array.from(atob(privateKey), c => c.charCodeAt(0))
  const importedKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false,
    ['sign']
  )

  // Sign message
  const messageBuffer = new TextEncoder().encode(message)
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    importedKey,
    messageBuffer
  )

  // Convert to base64
  const signatureArray = new Uint8Array(signature)
  let signatureStr = ''
  for (let i = 0; i < signatureArray.length; i++) {
    signatureStr += String.fromCharCode(signatureArray[i])
  }
  return btoa(signatureStr)
}

/**
 * Hash a string (for server key)
 */
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a random server key for recovery
 * Users should save this securely
 */
export function generateServerKey(): string {
  if (typeof window === 'undefined' || !crypto.getRandomValues) {
    // Fallback for Node.js or environments without crypto
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

