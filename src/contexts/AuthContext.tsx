"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import {
  getStoredKeys,
  storeKeys,
  clearKeys,
  generateKeypair,
  generateServerKey,
  hashString,
  signMessage,
} from '@/lib/auth'

interface AuthContextType {
  user: {
    userId: Id<'users'>
    username: string
    publicKey: string
    hasAcknowledgedRecoveryKey: boolean
  } | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, publicKey: string) => Promise<void>
  logout: () => void
  createAccount: (username: string) => Promise<string | undefined>
  checkUsernameAvailable: (username: string) => Promise<boolean>
  acknowledgeRecoveryKey: () => Promise<void>
  loginWithRecoveryKey: (username: string, recoveryKey: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null)
  const [isLoading, setIsLoading] = useState(true)

  const stored = getStoredKeys()
  // Force re-query when stored publicKey changes
  const [publicKeyForQuery, setPublicKeyForQuery] = useState<string | null>(stored.publicKey)
  
  useEffect(() => {
    const keys = getStoredKeys()
    if (keys.publicKey !== publicKeyForQuery) {
      setPublicKeyForQuery(keys.publicKey)
    }
  }, [publicKeyForQuery])
  
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    publicKeyForQuery ? { publicKey: publicKeyForQuery } : 'skip'
  )

  const checkUsernameMutation = useMutation(api.auth.checkUsername)
  const createUserMutation = useMutation(api.auth.createUser)
  const authenticateMutation = useMutation(api.auth.authenticate)
  const loginWithRecoveryKeyMutation = useMutation(api.auth.loginWithRecoveryKey)
  const acknowledgeRecoveryKeyMutation = useMutation(api.auth.acknowledgeRecoveryKey)
  const getChallengeQuery = useQuery(api.auth.getChallenge, {})

  // Initialize from localStorage
  useEffect(() => {
    if (stored.publicKey && stored.username && getChallengeQuery) {
      // Try to authenticate
      authenticateWithStoredKey(stored.publicKey)
    } else if (!stored.publicKey) {
      setIsLoading(false)
    }
  }, [getChallengeQuery])

  // Update user when query result changes
  useEffect(() => {
    const keys = getStoredKeys()
    if (currentUser && keys.publicKey) {
      setUser({
        userId: currentUser.userId,
        username: currentUser.username,
        publicKey: keys.publicKey,
        hasAcknowledgedRecoveryKey: currentUser.hasAcknowledgedRecoveryKey ?? false,
      })
      setIsLoading(false)
    } else if (currentUser === null && keys.publicKey) {
      // Key exists but user not found - might be a new keypair, wait a bit
      // This can happen after login with recovery key
      const timeout = setTimeout(() => {
        // If still no user after timeout, clear storage
        if (!user) {
          clearKeys()
          setUser(null)
          setIsLoading(false)
        }
      }, 2000)
      return () => clearTimeout(timeout)
    } else if (currentUser === undefined) {
      // Still loading
    } else {
      setIsLoading(false)
    }
  }, [currentUser, publicKeyForQuery])

  async function authenticateWithStoredKey(publicKey: string) {
    try {
      if (!getChallengeQuery) return

      const signature = await signMessage(getChallengeQuery.challenge)
      const result = await authenticateMutation({
        publicKey,
        challenge: getChallengeQuery.challenge,
        signature,
      })

      if (result) {
        setUser({
          userId: result.userId,
          username: result.username,
          publicKey,
          hasAcknowledgedRecoveryKey: result.hasAcknowledgedRecoveryKey ?? false,
        })
      }
    } catch (error) {
      console.error('Authentication failed:', error)
      clearKeys()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function checkUsernameAvailable(username: string): Promise<boolean> {
    const result = await checkUsernameMutation({ username })
    return result.available
  }

  async function createAccount(username: string): Promise<string | undefined> {
    // Generate keypair
    const { privateKey, publicKey } = await generateKeypair()
    
    // Generate server key (recovery key)
    const serverKey = generateServerKey()
    const serverKeyHash = await hashString(serverKey)

    // Create user
    await createUserMutation({
      username,
      publicKey,
      serverKeyHash,
    })

    // Store keys
    storeKeys(privateKey, publicKey, username, serverKey)

    // Authenticate
    await login(username, publicKey)

    // Return the recovery key so it can be displayed to the user
    return serverKey
  }

  async function login(username: string, publicKey: string) {
    try {
      if (!getChallengeQuery) {
        throw new Error('Challenge not available')
      }

      const signature = await signMessage(getChallengeQuery.challenge)
      const result = await authenticateMutation({
        publicKey,
        challenge: getChallengeQuery.challenge,
        signature,
      })

      if (result) {
        setUser({
          userId: result.userId,
          username: result.username,
          publicKey,
          hasAcknowledgedRecoveryKey: result.hasAcknowledgedRecoveryKey ?? false,
        })
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  function logout() {
    clearKeys()
    setUser(null)
  }

  async function acknowledgeRecoveryKey() {
    if (!user) {
      throw new Error('Not logged in')
    }
    await acknowledgeRecoveryKeyMutation({ userId: user.userId })
    // Update local user state
    setUser({
      ...user,
      hasAcknowledgedRecoveryKey: true,
    })
  }

  async function loginWithRecoveryKey(username: string, recoveryKey: string) {
    try {
      // Generate new keypair first (we need the public key)
      const { privateKey, publicKey } = await generateKeypair()

      // Verify recovery key with server and update public key
      const userInfo = await loginWithRecoveryKeyMutation({
        username,
        recoveryKey,
        newPublicKey: publicKey, // Update public key on server
      })

      // Store keys with username
      storeKeys(privateKey, publicKey, userInfo.username, recoveryKey)

      // Update the query key to trigger a refresh
      setPublicKeyForQuery(publicKey)

      // Set user state immediately (don't wait for query to update)
      setUser({
        userId: userInfo.userId,
        username: userInfo.username,
        publicKey,
        hasAcknowledgedRecoveryKey: userInfo.hasAcknowledgedRecoveryKey ?? false,
      })
    } catch (error) {
      console.error('Login with recovery key failed:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        createAccount,
        checkUsernameAvailable,
        acknowledgeRecoveryKey,
        loginWithRecoveryKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

