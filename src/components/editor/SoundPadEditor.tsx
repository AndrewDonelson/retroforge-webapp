"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

// Waveform types
type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth' | 'noise' | 'loop' | 'rest'

// Waveform type codes
const WAVEFORM_CODES: Record<WaveformType, string> = {
  sine: 'S',
  square: 'Q',
  triangle: 'T',
  sawtooth: 'W',
  noise: 'N',
  loop: 'L',
  rest: 'R',
}

// Reverse lookup
const CODE_TO_WAVEFORM: Record<string, WaveformType> = {
  S: 'sine',
  Q: 'square',
  T: 'triangle',
  W: 'sawtooth',
  N: 'noise',
  L: 'loop',
  R: 'rest',
}

interface PadSettings {
  type: WaveformType
  freq: number  // 0-127 (0-12700 Hz)
  duration: number  // 1-16 (1/16 second steps)
  gain: number  // 1-8 (0.125 to 1.0)
  loop: boolean
  locked: boolean
}

interface SequenceStep {
  padIndex: number | null
  token: string
}

interface SoundPadEditorProps {
  soundName: string
  initialTokens?: string[]
  onSave: (tokens: string[]) => void
  onCancel?: () => void
}

export function SoundPadEditor({ soundName, initialTokens = [], onSave, onCancel }: SoundPadEditorProps) {
  // Default pad settings (one per waveform initially)
  const [pads, setPads] = useState<PadSettings[]>([
    { type: 'sine', freq: 44, duration: 4, gain: 3, loop: false, locked: false },      // Pad 1
    { type: 'square', freq: 22, duration: 2, gain: 2, loop: false, locked: false },   // Pad 2
    { type: 'triangle', freq: 66, duration: 4, gain: 3, loop: false, locked: false }, // Pad 3
    { type: 'sawtooth', freq: 33, duration: 4, gain: 4, loop: false, locked: false }, // Pad 4
    { type: 'noise', freq: 0, duration: 2, gain: 5, loop: false, locked: false },      // Pad 5
    { type: 'rest', freq: 0, duration: 2, gain: 0, loop: false, locked: false },       // Pad 6 (Rest)
  ])

  const [selectedPad, setSelectedPad] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [sequence, setSequence] = useState<SequenceStep[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const [playbackTime, setPlaybackTime] = useState<number>(0)
  const [pressedPads, setPressedPads] = useState<Set<number>>(new Set())
  const audioContextRef = useRef<AudioContext | null>(null)
  const playingOscillatorsRef = useRef<OscillatorNode[]>([])
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const waveformAnimationRef = useRef<number | null>(null)
  const playbackIntervalRef = useRef<number | null>(null)
  const isPlayingRef = useRef<boolean>(false)

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return () => {
      playingOscillatorsRef.current.forEach(osc => {
        try { osc.stop() } catch {}
      })
      audioContextRef.current?.close()
      if (playbackIntervalRef.current) {
        clearTimeout(playbackIntervalRef.current)
      }
      if (waveformAnimationRef.current) {
        cancelAnimationFrame(waveformAnimationRef.current)
      }
    }
  }, [])

  // Load initial tokens if provided and populate pads with most common tokens
  useEffect(() => {
    if (initialTokens.length > 0) {
      // Parse tokens into sequence
      const parsed = initialTokens.map(token => ({
        padIndex: null,
        token,
      }))
      setSequence(parsed)

      // Count token frequencies to find most common ones
      const tokenCounts = new Map<string, number>()
      for (const token of initialTokens) {
        tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1)
      }

      // Sort tokens by frequency (most common first), then take unique tokens
      const sortedTokens = Array.from(tokenCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([token]) => token)
        .slice(0, 6) // Take top 6 unique tokens

      // Parse tokens and populate pads (all 6 pads from the tokens)
      setPads(() => {
        const newPads: PadSettings[] = []
        
        // Parse each of the top tokens into pad settings
        for (let i = 0; i < 6; i++) {
          let token: string | undefined
          
          // Use token from sorted list if available, otherwise use the last token
          if (i < sortedTokens.length) {
            token = sortedTokens[i]
          } else if (sortedTokens.length > 0) {
            // If we have fewer than 6 unique tokens, repeat the last one
            token = sortedTokens[sortedTokens.length - 1]
          } else {
            // Fallback to default sine pad
            token = undefined
          }
          
          if (!token) {
            // Ultimate fallback - default sine pad
            newPads[i] = {
              type: 'sine',
              freq: 44,
              duration: 4,
              gain: 3,
              loop: false,
              locked: false,
            }
          } else if (token.startsWith('R')) {
            // Rest token
            const durMatch = token.match(/R(\d+)/)
            const duration = durMatch ? parseInt(durMatch[1]) : 2
            newPads[i] = {
              type: 'rest',
              freq: 0,
              duration,
              gain: 0,
              loop: false,
              locked: false,
            }
          } else {
            // Waveform token: [SQTWNL](\d{3})D(\d+)G(\d)
            const match = token.match(/([SQTWNL])(\d{3})D(\d+)G(\d)/)
            if (match) {
              const [, typeCode, freqStr, durStr, gainStr] = match
              const type = CODE_TO_WAVEFORM[typeCode] || 'sine'
              const freq = parseInt(freqStr) // Already in 0-127 format
              const duration = parseInt(durStr)
              const gain = parseInt(gainStr)
              newPads[i] = {
                type: type as WaveformType,
                freq,
                duration,
                gain,
                loop: type === 'loop',
                locked: false,
              }
            } else {
              // Fallback if parsing fails
              newPads[i] = {
                type: 'sine',
                freq: 44,
                duration: 4,
                gain: 3,
                loop: false,
                locked: false,
              }
            }
          }
        }
        
        return newPads
      })
    }
  }, [initialTokens])

  // Generate token from pad settings
  const generateToken = useCallback((pad: PadSettings): string => {
    if (pad.type === 'rest') {
      return `R${pad.duration.toString().padStart(2, '0')}`
    }
    const code = WAVEFORM_CODES[pad.type]
    const freq = Math.round(pad.freq).toString().padStart(3, '0')
    const dur = pad.duration.toString().padStart(2, '0')
    const gain = pad.gain.toString()
    return `${code}${freq}D${dur}G${gain}`
  }, [])

  // Draw complete sequence waveform
  const drawSequenceWaveform = useCallback((playbackPosition: number | null = null) => {
    const canvas = waveformCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = '#1f2937' // bg-gray-800
    ctx.fillRect(0, 0, width, height)

    if (sequence.length === 0) {
      ctx.fillStyle = '#6b7280' // gray-500
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('No sequence. Record pads to create one.', width / 2, height / 2)
      return
    }

    const centerY = height / 2
    const textAreaHeight = 20
    const waveformHeight = height - textAreaHeight

    // Calculate total duration
    let totalDuration = 0
    const segments: Array<{ token: string; pad: PadSettings | null; duration: number; startTime: number; endTime: number }> = []
    
    for (const step of sequence) {
      const token = step.token
      let duration = 0
      let pad: PadSettings | null = null

      // Parse token to get duration and pad info
      if (token.startsWith('R')) {
        // Rest token
        const durMatch = token.match(/R(\d+)/)
        duration = durMatch ? parseInt(durMatch[1]) / 16 : 0.125
      } else {
        // Waveform token
        const match = token.match(/([SQTWNL])(\d{3})D(\d+)G(\d)/)
        if (match) {
          const [, typeCode, freqStr, durStr] = match
          duration = parseInt(durStr) / 16
          
          // Find matching pad or create temp pad
          const padIndex = step.padIndex
          if (padIndex !== null && pads[padIndex]) {
            pad = pads[padIndex]
          } else {
            // Create temp pad from token
            const freq = parseInt(freqStr) // Already in 0-127 format
            const type = CODE_TO_WAVEFORM[typeCode] || 'sine'
            pad = {
              type: type as WaveformType,
              freq,
              duration: parseInt(durStr),
              gain: parseInt(match[4]),
              loop: type === 'loop',
              locked: false,
            }
          }
        }
      }

      segments.push({
        token,
        pad,
        duration,
        startTime: totalDuration,
        endTime: totalDuration + duration,
      })
      totalDuration += duration
    }

    if (totalDuration === 0) return

    // Scale factor: width per second
    const scaleX = width / totalDuration

    // Draw each segment
    let currentX = 0
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      const segmentWidth = seg.duration * scaleX
      const segmentCenterX = currentX + segmentWidth / 2

      // Draw waveform for this segment
      if (seg.pad && seg.pad.type !== 'rest') {
        const freq = (seg.pad.freq * 100) || 440 // Convert 0-127 to Hz
        const gain = seg.pad.gain / 8
        const samples = Math.floor(segmentWidth)
        const startY = textAreaHeight

        // Get color based on waveform type
        const colors: Record<string, string> = {
          sine: '#3b82f6',      // blue-500
          square: '#ef4444',    // red-500
          triangle: '#10b981',  // green-500
          sawtooth: '#f59e0b',  // amber-500
          noise: '#a855f7',     // purple-500
          loop: '#f97316',      // orange-500
        }
        ctx.strokeStyle = colors[seg.pad.type] || '#3b82f6'
        ctx.lineWidth = 2
        ctx.beginPath()

        for (let x = 0; x < samples; x++) {
          const t = (x / samples) * seg.duration * 2 * Math.PI
          let y = 0

          if (seg.pad.type === 'noise') {
            // Use deterministic noise for preview
            const seed = i * 1000 + x
            y = ((Math.sin(seed) * 10000) % 1) * 2 - 1
            y *= gain
          } else {
            let value = 0
            switch (seg.pad.type) {
              case 'sine':
                value = Math.sin(freq * t)
                break
              case 'square':
                value = Math.sin(freq * t) > 0 ? 1 : -1
                break
              case 'triangle':
                value = (2 / Math.PI) * Math.asin(Math.sin(freq * t))
                break
              case 'sawtooth':
                value = (2 / Math.PI) * Math.atan(Math.tan((freq * t) / 2))
                break
              default:
                value = Math.sin(freq * t)
            }
            y = value * gain
          }

          const pixelY = startY + (waveformHeight / 2) - (y * (waveformHeight / 2) * 0.8)
          const pixelX = currentX + x

          if (x === 0) {
            ctx.moveTo(pixelX, pixelY)
          } else {
            ctx.lineTo(pixelX, pixelY)
          }
        }

        ctx.stroke()
      }

      // Draw token label above segment
      ctx.fillStyle = '#9ca3af' // gray-400
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(seg.token, segmentCenterX, 12)

      // Draw segment divider
      if (i < segments.length - 1) {
        ctx.strokeStyle = '#4b5563' // gray-600
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(currentX + segmentWidth, textAreaHeight)
        ctx.lineTo(currentX + segmentWidth, height)
        ctx.stroke()
      }

      currentX += segmentWidth
    }

    // Draw center line
    ctx.strokeStyle = '#4b5563' // gray-600
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, textAreaHeight + waveformHeight / 2)
    ctx.lineTo(width, textAreaHeight + waveformHeight / 2)
    ctx.stroke()

    // Draw playback marker
    if (playbackPosition !== null && playbackPosition >= 0 && playbackPosition <= totalDuration) {
      const markerX = playbackPosition * scaleX
      ctx.strokeStyle = '#ef4444' // red-500
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(markerX, textAreaHeight)
      ctx.lineTo(markerX, height)
      ctx.stroke()

      // Draw marker indicator
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.moveTo(markerX, textAreaHeight)
      ctx.lineTo(markerX - 5, textAreaHeight - 5)
      ctx.lineTo(markerX + 5, textAreaHeight - 5)
      ctx.closePath()
      ctx.fill()
    }
  }, [sequence, pads])

  // Redraw waveform when sequence or pads change
  useEffect(() => {
    if (!isPlaying) {
      drawSequenceWaveform(null)
    }
  }, [sequence, pads, isPlaying, drawSequenceWaveform])

  // Animate playback marker
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        drawSequenceWaveform(playbackTime)
        waveformAnimationRef.current = requestAnimationFrame(animate)
      }
      waveformAnimationRef.current = requestAnimationFrame(animate)
    } else {
      if (waveformAnimationRef.current) {
        cancelAnimationFrame(waveformAnimationRef.current)
        waveformAnimationRef.current = null
      }
      drawSequenceWaveform(null)
    }
    return () => {
      if (waveformAnimationRef.current) {
        cancelAnimationFrame(waveformAnimationRef.current)
      }
    }
  }, [isPlaying, playbackTime, drawSequenceWaveform])

  // Play a single pad sound
  const playPad = useCallback((padIndex: number) => {
    if (!audioContextRef.current) return

    const pad = pads[padIndex]
    if (pad.type === 'rest') return

    const ctx = audioContextRef.current
    const actualFreq = pad.freq * 100
    const actualDuration = pad.duration / 16
    const actualGain = pad.gain / 8

    // Create oscillator
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()

    // Set waveform type
    if (pad.type === 'noise') {
      // Noise: use buffer source
      const buffer = ctx.createBuffer(1, ctx.sampleRate * actualDuration, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(gainNode)
      gainNode.connect(ctx.destination)
      gainNode.gain.value = actualGain
      source.start()
      source.stop(ctx.currentTime + actualDuration)
      return
    }

    // Set oscillator type
    if (pad.type === 'sine') osc.type = 'sine'
    else if (pad.type === 'square') osc.type = 'square'
    else if (pad.type === 'triangle') osc.type = 'triangle'
    else if (pad.type === 'sawtooth') osc.type = 'sawtooth'
    else osc.type = 'sine' // Default for loop

    osc.frequency.value = actualFreq || 440
    gainNode.gain.value = actualGain

    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    const now = ctx.currentTime
    osc.start(now)
    
    if (pad.loop) {
      // Loop indefinitely
      playingOscillatorsRef.current.push(osc)
    } else {
      osc.stop(now + actualDuration)
    }

    // Clean up after duration
    setTimeout(() => {
      const index = playingOscillatorsRef.current.indexOf(osc)
      if (index > -1) {
        playingOscillatorsRef.current.splice(index, 1)
      }
    }, actualDuration * 1000)
  }, [pads])

  // Handle pad down (press)
  const handlePadDown = useCallback((padIndex: number) => {
    // Visual feedback: add to pressed set
    setPressedPads(prev => new Set(prev).add(padIndex))
    
    // Select pad for editing
    setSelectedPad(padIndex)
    
    // Play sound immediately
    playPad(padIndex)

    // If recording, add to sequence
    if (isRecording) {
      const pad = pads[padIndex]
      const token = generateToken(pad)
      setSequence(prev => [...prev, { padIndex, token }])
    }
  }, [pads, isRecording, playPad, generateToken])

  // Handle pad up (release)
  const handlePadUp = useCallback((padIndex: number) => {
    // Remove pressed state
    setPressedPads(prev => {
      const newSet = new Set(prev)
      newSet.delete(padIndex)
      return newSet
    })
  }, [])

  // Handle pad tap (for keyboard shortcuts)
  const handlePadTap = useCallback((padIndex: number) => {
    handlePadDown(padIndex)
    // Auto-release after animation
    setTimeout(() => {
      handlePadUp(padIndex)
    }, 150)
  }, [handlePadDown, handlePadUp])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return

      // ESC to close
      if (e.key === 'Escape') {
        onCancel?.()
        return
      }

      if (e.key >= '1' && e.key <= '6') {
        const padIndex = parseInt(e.key) - 1
        handlePadTap(padIndex)
      } else if (e.key === ' ' || e.key === '0') {
        // Space or 0 for rest
        handlePadTap(5)
      } else if (e.key === 'r' || e.key === 'R') {
        setIsRecording(prev => !prev)
      } else if (e.key === 'p' || e.key === 'P') {
        handlePlaySequence()
      } else if (e.key === 'c' || e.key === 'C') {
        setSequence([])
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handlePadTap, onCancel])

  // Play entire sequence
  const handlePlaySequence = useCallback(async () => {
    if (!audioContextRef.current || sequence.length === 0) return

    // Resume audio context if suspended
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }

    setIsPlaying(true)
    isPlayingRef.current = true
    setPlaybackTime(0)
    const ctx = audioContextRef.current
    const startTime = ctx.currentTime
    let currentTime = startTime

    // Calculate total duration
    let totalDuration = 0
    for (const step of sequence) {
      const token = step.token
      if (token.startsWith('R')) {
        const durMatch = token.match(/R(\d+)/)
        totalDuration += durMatch ? parseInt(durMatch[1]) / 16 : 0.125
      } else {
        const match = token.match(/([SQTWNL])(\d{3})D(\d+)G(\d)/)
        if (match) {
          totalDuration += parseInt(match[3]) / 16
        }
      }
    }

    // Update playback position continuously
    const updatePosition = () => {
      if (!isPlayingRef.current) return
      const elapsed = ctx.currentTime - startTime
      if (elapsed < totalDuration) {
        setPlaybackTime(Math.min(elapsed, totalDuration))
        playbackIntervalRef.current = window.setTimeout(updatePosition, 16) // ~60fps
      } else {
        setPlaybackTime(totalDuration)
      }
    }
    updatePosition()

    for (let i = 0; i < sequence.length; i++) {
      if (!isPlayingRef.current) break
      
      setCurrentStep(i)
      const step = sequence[i]
      
      // Parse token to get duration
      const token = step.token
      let duration = 0
      
      if (token.startsWith('R')) {
        // Rest: just wait
        const durMatch = token.match(/R(\d+)/)
        duration = durMatch ? parseInt(durMatch[1]) / 16 : 0.125
        currentTime += duration
      } else {
        // Play sound
        const match = token.match(/([SQTWNL])(\d{3})D(\d+)G(\d)/)
        if (match) {
          const [, typeCode, freqStr, durStr, gainStr] = match
          const freq = parseInt(freqStr) * 100
          duration = parseInt(durStr) / 16
          const gain = parseInt(gainStr) / 8
          const type = CODE_TO_WAVEFORM[typeCode] || 'sine'

          if (type === 'noise') {
            const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate)
            const data = buffer.getChannelData(0)
            for (let j = 0; j < data.length; j++) {
              data[j] = Math.random() * 2 - 1
            }
            const source = ctx.createBufferSource()
            const gainNode = ctx.createGain()
            source.buffer = buffer
            source.connect(gainNode)
            gainNode.connect(ctx.destination)
            gainNode.gain.value = gain
            source.start(currentTime)
            source.stop(currentTime + duration)
          } else {
            const osc = ctx.createOscillator()
            const gainNode = ctx.createGain()
            
            if (type === 'sine') osc.type = 'sine'
            else if (type === 'square') osc.type = 'square'
            else if (type === 'triangle') osc.type = 'triangle'
            else if (type === 'sawtooth') osc.type = 'sawtooth'
            else osc.type = 'sine'

            osc.frequency.value = freq || 440
            gainNode.gain.value = gain
            osc.connect(gainNode)
            gainNode.connect(ctx.destination)
            osc.start(currentTime)
            osc.stop(currentTime + duration)
          }

          currentTime += duration
        }
      }

      // Small delay between steps for visual feedback
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    // Wait for playback to finish
    await new Promise(resolve => setTimeout(resolve, totalDuration * 1000 + 100))

    if (playbackIntervalRef.current) {
      clearTimeout(playbackIntervalRef.current)
      playbackIntervalRef.current = null
    }

    setCurrentStep(null)
    setPlaybackTime(0)
    setIsPlaying(false)
    isPlayingRef.current = false
  }, [sequence])

  // Update pad settings
  const updatePad = useCallback((index: number, updates: Partial<PadSettings>) => {
    setPads(prev => prev.map((pad, i) => 
      i === index ? { ...pad, ...updates } : pad
    ))
  }, [])

  // Handle save
  const handleSave = () => {
    const tokens = sequence.map(step => step.token)
    onSave(tokens)
  }

  // Clear sequence
  const handleClear = () => {
    setSequence([])
  }

  // Add rest to sequence
  const handleAddRest = () => {
    if (isRecording) {
      const rest = pads[5]
      const token = generateToken(rest)
      setSequence(prev => [...prev, { padIndex: 5, token }])
    }
  }

  const waveformColors: Record<WaveformType, string> = {
    sine: 'bg-blue-500',
    square: 'bg-red-500',
    triangle: 'bg-green-500',
    sawtooth: 'bg-yellow-500',
    noise: 'bg-purple-500',
    loop: 'bg-orange-500',
    rest: 'bg-gray-500',
  }

  const waveformIcons: Record<WaveformType, string> = {
    sine: '🔵',
    square: '⬜',
    triangle: '🔺',
    sawtooth: '⚡',
    noise: '📻',
    loop: '🔄',
    rest: '⏸',
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-retro-400 mb-1">{soundName || 'New Sound'}</h2>
          <p className="text-xs sm:text-sm text-gray-400">Tap pads or press 1-6 to play • Press R to record • ESC to close</p>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-600 rounded-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium hidden sm:inline">Recording</span>
            </div>
          )}
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm ${
              isRecording
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <span className="hidden sm:inline">{isRecording ? '⏹ Stop' : '⏺ Record'}</span>
            <span className="sm:hidden">{isRecording ? '⏹' : '⏺'}</span>
          </button>
          <button
            onClick={handlePlaySequence}
            disabled={sequence.length === 0 || isPlaying}
            className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all text-sm"
          >
            <span className="hidden sm:inline">▶ Play</span>
            <span className="sm:hidden">▶</span>
          </button>
          {/* Close Button - Just X icon, all the way to the right */}
          <button
            onClick={onCancel}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-all text-xl sm:text-2xl"
            title="Close (ESC)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Pad Grid - 3x2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {pads.map((pad, index) => {
          const isPressed = pressedPads.has(index)
          return (
          <div
            key={index}
            className={`relative p-2 sm:p-3 rounded-lg border-2 transition-all cursor-pointer ${
              selectedPad === index
                ? 'border-retro-400 bg-gray-800'
                : 'border-gray-700 bg-gray-800/50'
            } ${pad.type === 'rest' ? 'opacity-60' : ''} ${
              isPressed ? 'scale-95 border-retro-500 shadow-inner' : ''
            }`}
            onPointerDown={() => handlePadDown(index)}
            onPointerUp={() => handlePadUp(index)}
            onPointerLeave={() => handlePadUp(index)}
          >
            {/* Pad Header - Full Width Button */}
            <button
              className={`w-full flex items-center justify-between mb-1.5 sm:mb-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all ${
                waveformColors[pad.type]
              } ${isPressed ? 'opacity-90 scale-95' : 'opacity-80 hover:opacity-100'}`}
              onPointerDown={(e) => {
                e.stopPropagation()
                handlePadDown(index)
              }}
              onPointerUp={(e) => {
                e.stopPropagation()
                handlePadUp(index)
              }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xl sm:text-2xl">{waveformIcons[pad.type]}</span>
                <span className="font-semibold text-white text-xs sm:text-sm">
                  Pad {index + 1}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white/80">
                  {generateToken(pad)}
                </span>
                {index === 5 && (
                  <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">Rest</span>
                )}
              </div>
            </button>

            {/* Type Dropdown */}
            <div className="mb-1.5 sm:mb-2" onClick={(e) => e.stopPropagation()}>
              <label className="block text-xs text-gray-400 mb-0.5">Type</label>
              <select
                value={pad.type}
                onChange={(e) => updatePad(index, { type: e.target.value as WaveformType })}
                className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={index === 5 || pad.locked} // Rest pad is always rest, or pad is locked
                onClick={(e) => e.stopPropagation()}
              >
                <option value="sine">Sine 🔵</option>
                <option value="square">Square ⬜</option>
                <option value="triangle">Triangle 🔺</option>
                <option value="sawtooth">Sawtooth ⚡</option>
                <option value="noise">Noise 📻</option>
                <option value="loop">Loop 🔄</option>
                {index === 5 && <option value="rest">Rest ⏸</option>}
              </select>
            </div>

            {/* Frequency Slider */}
            {pad.type !== 'noise' && pad.type !== 'rest' && (
              <div className="mb-1.5 sm:mb-2" onClick={(e) => e.stopPropagation()}>
                <label className="block text-xs text-gray-400 mb-0.5">
                  Freq: {pad.freq} ({pad.freq * 100}Hz)
                </label>
                <input
                  type="range"
                  min="0"
                  max="127"
                  value={pad.freq}
                  onChange={(e) => updatePad(index, { freq: parseInt(e.target.value) })}
                  disabled={pad.locked}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-retro-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Duration Slider */}
            <div className="mb-1.5 sm:mb-2" onClick={(e) => e.stopPropagation()}>
              <label className="block text-xs text-gray-400 mb-0.5">
                Dur: {pad.duration}/16
              </label>
              <input
                type="range"
                min="1"
                max="16"
                value={pad.duration}
                onChange={(e) => updatePad(index, { duration: parseInt(e.target.value) })}
                disabled={pad.locked}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-retro-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Gain Slider */}
            {pad.type !== 'rest' && (
              <div className="mb-1.5 sm:mb-2" onClick={(e) => e.stopPropagation()}>
                <label className="block text-xs text-gray-400 mb-0.5">
                  Vol: {pad.gain}/8
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={pad.gain}
                  onChange={(e) => updatePad(index, { gain: parseInt(e.target.value) })}
                  disabled={pad.locked}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-retro-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Loop and Lock Toggles */}
            <div className="mb-1 flex items-center justify-between">
              {/* Loop Toggle - Left */}
              {pad.type !== 'rest' && pad.type !== 'noise' && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!pad.locked) {
                      updatePad(index, { loop: !pad.loop })
                    }
                  }}
                  disabled={pad.locked}
                >
                  <input
                    type="checkbox"
                    checked={pad.loop}
                    onChange={(e) => updatePad(index, { loop: e.target.checked })}
                    disabled={pad.locked}
                    className="sr-only"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={`text-xs transition-all ${pad.loop ? 'text-retro-400' : 'text-gray-300'} ${pad.locked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    🔄 Loop
                  </span>
                </button>
              )}
              {/* Lock Toggle - Right */}
              <button
                type="button"
                className="flex items-center gap-1.5 cursor-pointer ml-auto bg-transparent border-none p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  updatePad(index, { locked: !pad.locked })
                }}
              >
                <input
                  type="checkbox"
                  checked={pad.locked}
                  onChange={(e) => updatePad(index, { locked: e.target.checked })}
                  className="sr-only"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className={`text-xs transition-all ${pad.locked ? 'text-red-400' : 'text-gray-300'}`}>
                  {pad.locked ? '🔒 Locked' : '🔓 Unlocked'}
                </span>
              </button>
            </div>
          </div>
        )})}
      </div>

      {/* Waveform Visualization */}
      <div className="bg-gray-900 rounded-lg p-2 sm:p-3 border border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 mb-2">Sequence Waveform</h3>
        <div className="h-20 sm:h-24 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
          {sequence.length > 0 ? (
            <canvas
              ref={waveformCanvasRef}
              width={800}
              height={96}
              className="w-full h-full"
            />
          ) : (
            <div className="text-gray-600 text-xs">
              Record pads to create a sequence
            </div>
          )}
        </div>
      </div>

      {/* Sequence Timeline */}
      <div className="bg-gray-900 rounded-lg p-2 sm:p-3 border border-gray-700 mb-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-400">
            Sequence ({sequence.length} steps)
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleAddRest}
              disabled={!isRecording}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-gray-300 transition-all"
            >
              + Rest
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 rounded text-white transition-all"
            >
              Clear
            </button>
          </div>
        </div>
        
        {sequence.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {isRecording
              ? 'Tap pads to record sequence...'
              : 'Click Record, then tap pads to create a sequence'}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sequence.map((step, idx) => {
              const match = step.token.match(/([SQTWNL])(\d{3})D(\d+)G(\d)|R(\d+)/)
              const typeCode = match?.[1] || 'R'
              const type = CODE_TO_WAVEFORM[typeCode] || 'rest'
              const isActive = currentStep === idx && isPlaying

              return (
                <button
                  key={idx}
                  onClick={() => {
                    // Play this step
                    const ctx = audioContextRef.current
                    if (!ctx) return
                    // Parse and play token
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-white ${
                    isActive
                      ? 'bg-retro-500 scale-110'
                      : waveformColors[type] + ' opacity-80 hover:opacity-100'
                  }`}
                  title={step.token}
                >
                  {idx + 1}: {step.token}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 sm:gap-3 justify-end pb-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-3 sm:px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-all text-xs sm:text-sm"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={sequence.length === 0}
          className="px-3 sm:px-4 py-1.5 bg-retro-600 hover:bg-retro-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all text-xs sm:text-sm"
        >
          Save Sound
        </button>
      </div>
    </div>
  )
}

