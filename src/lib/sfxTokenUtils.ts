/**
 * Utilities for converting between SFX token format (S440D04G3) and sfx.json format
 */

export interface SFXDefinition {
  type: 'sine' | 'square' | 'triangle' | 'sawtooth' | 'noise' | 'thrust' | 'stopall' | 'sequence'
  freq: number  // Hz (0-12700)
  duration: number  // seconds (0 for loops)
  gain: number  // 0.0-1.0
  tokens?: string[]  // For sequence type
}

// Waveform type codes
const WAVEFORM_CODES: Record<string, string> = {
  'sine': 'S',
  'square': 'Q',
  'triangle': 'T',
  'sawtooth': 'W',
  'noise': 'N',
  'loop': 'L',
  'rest': 'R',
}

// Reverse lookup
const CODE_TO_WAVEFORM: Record<string, string> = {
  'S': 'sine',
  'Q': 'square',
  'T': 'triangle',
  'W': 'sawtooth',
  'N': 'noise',
  'L': 'loop',
  'R': 'rest',
}

/**
 * Convert SFX JSON definition to token(s)
 * Returns array of tokens (single token for simple SFX, multiple for sequences)
 */
export function sfxToTokens(sfx: SFXDefinition): string[] {
  // If already a sequence with tokens, return them
  if (sfx.type === 'sequence' && sfx.tokens) {
    return sfx.tokens
  }

  // Handle special types
  if (sfx.type === 'stopall') {
    return ['STOPALL']
  }

  if (sfx.type === 'thrust') {
    // Thrust is a loop, so we use L (loop) code
    const freq = Math.round((sfx.freq || 0) / 100).toString().padStart(3, '0')
    const dur = Math.max(1, Math.round((sfx.duration || 0.1) * 16)).toString().padStart(2, '0')
    const gain = Math.max(1, Math.round((sfx.gain || 0.3) * 8)).toString()
    return [`L${freq}D${dur}G${gain}`]
  }

  // Convert to token format
  const code = WAVEFORM_CODES[sfx.type] || 'S'
  const freq = Math.round((sfx.freq || 440) / 100).toString().padStart(3, '0')
  const dur = Math.max(1, Math.round((sfx.duration || 0.1) * 16)).toString().padStart(2, '0')
  const gain = Math.max(1, Math.round((sfx.gain || 0.3) * 8)).toString()
  
  return [`${code}${freq}D${dur}G${gain}`]
}

/**
 * Convert token(s) to SFX JSON definition
 * If multiple tokens, creates a sequence type
 */
export function tokensToSFX(tokens: string[]): SFXDefinition {
  if (tokens.length === 0) {
    throw new Error('Cannot convert empty token array to SFX')
  }

  // Single token: convert to simple SFX
  if (tokens.length === 1) {
    return tokenToSFX(tokens[0])
  }

  // Multiple tokens: create sequence
  return {
    type: 'sequence',
    freq: 0,
    duration: 0,
    gain: 0,
    tokens: tokens,
  }
}

/**
 * Convert single token to SFX JSON definition
 */
export function tokenToSFX(token: string): SFXDefinition {
  // Handle special cases
  if (token === 'STOPALL') {
    return {
      type: 'stopall',
      freq: 0,
      duration: 0,
      gain: 0,
    }
  }

  // Parse token format: S440D04G3 or R02
  const restMatch = token.match(/^R(\d+)$/)
  if (restMatch) {
    const dur = parseInt(restMatch[1]) / 16
    return {
      type: 'sine', // Rest is just silence, use sine as placeholder
      freq: 0,
      duration: dur,
      gain: 0,
    }
  }

  // Parse waveform token: [SQTWNL](\d{3})D(\d+)G(\d)
  const match = token.match(/^([SQTWNL])(\d{3})D(\d+)G(\d)$/)
  if (!match) {
    throw new Error(`Invalid token format: ${token}`)
  }

  const [, code, freqStr, durStr, gainStr] = match
  const waveformType = CODE_TO_WAVEFORM[code] || 'sine'
  
  // Convert to actual values
  const freq = parseInt(freqStr) * 100  // Convert back to Hz
  const duration = parseInt(durStr) / 16  // Convert back to seconds
  const gain = parseInt(gainStr) / 8  // Convert back to 0.0-1.0

  // Map to engine-compatible types
  let engineType: SFXDefinition['type'] = 'sine'
  if (waveformType === 'noise') {
    engineType = 'noise'
  } else if (code === 'L') {
    // Loop maps to thrust (looped sound)
    engineType = 'thrust'
  } else {
    // For now, map all other waveforms to sine
    // The engine will need to be updated to support square/triangle/sawtooth
    engineType = 'sine'
  }

  return {
    type: engineType,
    freq,
    duration,
    gain,
  }
}

/**
 * Calculate total duration of a token sequence in seconds
 */
export function calculateSequenceDuration(tokens: string[]): number {
  let total = 0
  for (const token of tokens) {
    const restMatch = token.match(/^R(\d+)$/)
    if (restMatch) {
      total += parseInt(restMatch[1]) / 16
      continue
    }
    
    const match = token.match(/^[SQTWNL](\d{3})D(\d+)G(\d)$/)
    if (match) {
      const dur = parseInt(match[2]) / 16
      total += dur
    }
  }
  return total
}

/**
 * Validate token format
 */
export function validateToken(token: string): boolean {
  if (token === 'STOPALL') return true
  if (/^R\d+$/.test(token)) return true
  return /^[SQTWNL]\d{3}D\d+G\d$/.test(token)
}

