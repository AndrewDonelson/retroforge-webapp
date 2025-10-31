"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'

interface RecoveryKeyModalProps {
  recoveryKey: string
  username: string
  onDismiss: () => void
}

export function RecoveryKeyModal({ recoveryKey, username, onDismiss }: RecoveryKeyModalProps) {
  const { acknowledgeRecoveryKey } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isAcknowledging, setIsAcknowledging] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDismiss = async () => {
    setIsAcknowledging(true)
    try {
      await acknowledgeRecoveryKey()
      onDismiss()
    } catch (err) {
      console.error('Failed to acknowledge recovery key:', err)
      // Still dismiss even if acknowledgment fails
      onDismiss()
    } finally {
      setIsAcknowledging(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob(
      [
        `RetroForge Recovery Key\n` +
        `======================\n\n` +
        `Username: ${username}\n` +
        `Recovery Key: ${recoveryKey}\n\n` +
        `IMPORTANT: Save this key in a secure location.\n` +
        `If you lose access to your browser data, this key is your only way to recover your account.\n` +
        `DO NOT share this key with anyone.\n\n` +
        `Generated: ${new Date().toISOString()}\n`
      ],
      { type: 'text/plain' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `retroforge-recovery-key-${username}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          // Prevent accidental dismissal - require explicit button click
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-yellow-500"
        style={{ zIndex: 10001 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">⚠️</div>
          <h2 className="text-2xl font-bold text-yellow-400">Save Your Recovery Key</h2>
        </div>
        
        <p className="text-gray-300 mb-4">
          Your recovery key is the <strong className="text-yellow-400">only way</strong> to recover your account 
          if you lose access to your browser data. <strong>Save it now!</strong>
        </p>

        <div className="bg-gray-900 border-2 border-gray-600 rounded p-4 mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Recovery Key:
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-sm text-white break-all bg-transparent">
              {recoveryKey}
            </code>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm whitespace-nowrap"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={handleDownload}
            className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded"
          >
            📥 Download Recovery Key File
          </button>
          <button
            onClick={handleCopy}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            {copied ? '✓ Copied to Clipboard' : '📋 Copy to Clipboard'}
          </button>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-600 rounded p-3 mb-4">
          <p className="text-sm text-yellow-300">
            <strong>Warning:</strong> If you close this dialog without saving your key, you may lose access 
            to your account if your browser data is cleared. Make sure to save it somewhere safe!
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleDismiss}
            disabled={isAcknowledging}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
          >
            {isAcknowledging ? 'Saving...' : "I've Saved My Key"}
          </button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  
  return createPortal(modalContent, document.body)
}

