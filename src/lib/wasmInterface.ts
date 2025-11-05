/**
 * WASM Interface for RetroForge Engine
 * 
 * This module provides a clean interface for interacting with the RetroForge WASM engine.
 * It handles WASM loading, initialization, input handling, and frame rendering.
 */

// Type definitions for WASM functions on window
declare global {
  interface Window {
    Go: any;
    rf_init?: (fps?: number) => unknown;
    rf_load_cart?: (data: Uint8Array) => unknown;
    rf_run_frame?: () => unknown;
    rf_get_pixels?: (dst: Uint8Array) => unknown;
    rf_set_btn?: (idx: number, down: boolean) => unknown;
    rf_set_button?: (name: string, down: boolean) => unknown;
    rf_set_shift?: (down: boolean) => unknown;
    rf_screenshot?: () => unknown;
    rf_screenshot_callback?: (pixels: Uint8Array, width: number, height: number) => void;
    rf_audio_playSine?: (freq: number, dur: number, gain: number) => void;
    rf_audio_playNoise?: (dur: number, gain: number) => void;
    rf_audio_thrust?: (on: boolean) => void;
    rf_audio_playThrust?: (on: boolean, freq: number, gain: number) => void;
    rf_audio_playNotes?: (tokens: string[], bpm: number, gain: number) => void;
    rf_audio_stopAll?: () => void;
  }
}

/**
 * Initialize the WASM engine
 * @param onReady Callback when WASM is loaded and ready
 * @param onError Callback if initialization fails
 */
export async function initWASM(
  onReady: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    // Load wasm_exec.js first
    if (!window.Go) {
      const script = document.createElement("script");
      script.src = "/engine/wasm_exec.js";
      script.async = true;
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load wasm_exec.js"));
        document.head.appendChild(script);
      });
    }

    // Load and instantiate WASM
    const wasmResponse = await fetch("/engine/retroforge.wasm");
    const wasmBytes = await wasmResponse.arrayBuffer();
    const go = new window.Go();
    const result = await WebAssembly.instantiate(wasmBytes, go.importObject);
    
    // Run the Go program
    go.run(result.instance);
    
    // Wait a bit to ensure WASM functions are exported
    let attempts = 0;
    const checkReady = () => {
      // Check for all required functions, including rf_set_btn for input
      if (window.rf_init && 
          window.rf_load_cart && 
          window.rf_run_frame && 
          window.rf_get_pixels &&
          window.rf_set_btn) {
        console.log('[wasmInterface] All WASM functions available, including rf_set_btn');
        onReady();
      } else if (attempts < 50) {
        attempts++;
        // Log which functions are missing on first few attempts
        if (attempts <= 3) {
          console.log('[wasmInterface] Waiting for WASM functions...', {
            rf_init: !!window.rf_init,
            rf_load_cart: !!window.rf_load_cart,
            rf_run_frame: !!window.rf_run_frame,
            rf_get_pixels: !!window.rf_get_pixels,
            rf_set_btn: !!window.rf_set_btn,
            all_rf_keys: Object.keys(window).filter(k => k.startsWith('rf_'))
          });
        }
        setTimeout(checkReady, 100);
      } else {
        console.error('[wasmInterface] WASM functions not available after initialization', {
          rf_init: !!window.rf_init,
          rf_load_cart: !!window.rf_load_cart,
          rf_run_frame: !!window.rf_run_frame,
          rf_get_pixels: !!window.rf_get_pixels,
          rf_set_btn: !!window.rf_set_btn,
          all_rf_keys: Object.keys(window).filter(k => k.startsWith('rf_'))
        });
        onError?.(new Error("WASM functions not available after initialization"));
      }
    };
    checkReady();
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Initialize audio context and set up audio callbacks for WASM
 * @returns AudioContext or null if not available
 */
export function initAudio(): AudioContext | null {
  if (!window.AudioContext && !(window as any).webkitAudioContext) {
    return null;
  }

  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  let thrustOsc: OscillatorNode | null = null;
  let musicTimeout: number | null = null;
  
  // Module-level flag to stop music (shared across all music instances)
  let musicShouldStop = false;

  // Track all active audio sources for proper cleanup
  const activeAudioSources = new Set<AudioScheduledSourceNode | GainNode>();

  window.rf_audio_playSine = (freq: number, dur: number, gain: number) => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g).connect(ctx.destination);
    const now = ctx.currentTime;
    
    // Track this source
    activeAudioSources.add(osc);
    activeAudioSources.add(g);
    
    // Remove from tracking when it naturally ends
    osc.onended = () => {
      activeAudioSources.delete(osc);
      activeAudioSources.delete(g);
    };
    
    osc.start(now);
    osc.stop(now + Math.max(0.01, dur));
  };

  window.rf_audio_playNoise = (dur: number, gain: number) => {
    if (!ctx) return;
    const len = Math.floor(Math.max(0.01, dur) * ctx.sampleRate);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = gain;
    src.buffer = buf;
    src.connect(g).connect(ctx.destination);
    
    // Track this source
    activeAudioSources.add(src);
    activeAudioSources.add(g);
    
    // Remove from tracking when it naturally ends
    src.onended = () => {
      activeAudioSources.delete(src);
      activeAudioSources.delete(g);
    };
    
    src.start();
  };

  // Track multiple thrust sounds by frequency:gain key
  const thrustOscs = new Map<string, OscillatorNode>();
  
  window.rf_audio_thrust = (on: boolean) => {
    // Legacy API - use default values
    window.rf_audio_playThrust?.(on, 110, 0.2);
  };

  window.rf_audio_playThrust = (on: boolean, freq: number, gain: number) => {
    if (!ctx) return;
    const key = `${Math.round(freq)}:${gain.toFixed(2)}`;
    
    if (on) {
      // Stop any existing thrust with this key
      if (thrustOscs.has(key)) {
        try {
          const existingOsc = thrustOscs.get(key);
          if (existingOsc) {
            existingOsc.stop();
            activeAudioSources.delete(existingOsc);
            // Find and remove associated gain node
            const gainNodes = Array.from(activeAudioSources).filter(
              (node) => node instanceof GainNode
            ) as GainNode[];
            gainNodes.forEach((g) => {
              // Check if this gain is connected to the stopped oscillator
              // (simplified: remove all gain nodes when stopping thrust)
              activeAudioSources.delete(g);
            });
          }
        } catch {}
        thrustOscs.delete(key);
      }
      
      // Start new thrust sound
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      g.gain.value = gain;
      osc.connect(g).connect(ctx.destination);
      
      // Track this source
      activeAudioSources.add(osc);
      activeAudioSources.add(g);
      
      osc.start(ctx.currentTime);
      thrustOscs.set(key, osc);
    } else {
      // Stop this specific thrust
      if (thrustOscs.has(key)) {
        try {
          const osc = thrustOscs.get(key);
          if (osc) {
            osc.stop();
            activeAudioSources.delete(osc);
            // Remove associated gain node
            const gainNodes = Array.from(activeAudioSources).filter(
              (node) => node instanceof GainNode
            ) as GainNode[];
            gainNodes.forEach((g) => activeAudioSources.delete(g));
          }
        } catch {}
        thrustOscs.delete(key);
      }
    }
  };

  window.rf_audio_playNotes = (tokens: string[], bpm: number, gain: number) => {
    if (!ctx) return;
    // Stop any existing music
    if (musicTimeout) {
      clearTimeout(musicTimeout);
      musicTimeout = null;
    }
    
    // Reset stop flag when starting new music
    musicShouldStop = false;
    
    const noteMap: Record<string, number> = {
      "C": 261.63, "C#": 277.18, "D": 293.66, "D#": 311.13,
      "E": 329.63, "F": 349.23, "F#": 369.99,
      "G": 392.00, "G#": 415.30, "A": 440.00, "A#": 466.16, "B": 493.88
    };
    let noteIndex = 0;
    const beatDuration = 60 / bpm;

    const playNext = () => {
      // Check if music was stopped
      if (musicShouldStop) {
        return;
      }
      
      if (noteIndex >= tokens.length) return;
      const token = tokens[noteIndex];
      noteIndex++;

      if (token.startsWith("R")) {
        // Rest - just wait
        const restBeats = parseInt(token.substring(1)) || 1;
        musicTimeout = window.setTimeout(() => {
          if (!musicShouldStop) playNext();
        }, restBeats * beatDuration * 1000);
      } else {
        // Parse note: format like "4C1" = octave 4, note C, duration 1 beat
        let octave = 4;
        let note = "";
        let dur = 1;
        let i = 0;
        if (token[i] >= '0' && token[i] <= '9') {
          octave = parseInt(token[i]);
          i++;
        }
        while (i < token.length && (token[i] === '#' || (token[i] >= 'A' && token[i] <= 'G'))) {
          note += token[i];
          i++;
        }
        if (i < token.length && token[i] >= '0' && token[i] <= '9') {
          dur = parseInt(token.substring(i));
        }

        const freq = noteMap[note] ? noteMap[note] * Math.pow(2, octave - 4) : 440;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.value = gain;
        osc.connect(g).connect(ctx.destination);
        
        // Track this source
        activeAudioSources.add(osc);
        activeAudioSources.add(g);
        
        // Remove from tracking when it naturally ends
        osc.onended = () => {
          activeAudioSources.delete(osc);
          activeAudioSources.delete(g);
        };
        
        const now = ctx.currentTime;
        osc.start(now);
        osc.stop(now + dur * beatDuration);

        musicTimeout = window.setTimeout(() => {
          if (!musicShouldStop) playNext();
        }, dur * beatDuration * 1000);
      }
    };

    playNext();
  };

  window.rf_audio_stopAll = () => {
    console.log('[audio] stopAll called, ctx state:', ctx.state);
    
    // Signal music to stop (must be done first to prevent new notes)
    musicShouldStop = true;
    
    // Stop music timeout
    if (musicTimeout) {
      clearTimeout(musicTimeout);
      musicTimeout = null;
    }
    
    // Stop all active audio sources (sine waves, noise, music notes) immediately
    const sourcesToStop: AudioScheduledSourceNode[] = [];
    const gainNodesToDisconnect: GainNode[] = [];
    
    activeAudioSources.forEach((source) => {
      if (source instanceof AudioScheduledSourceNode) {
        sourcesToStop.push(source);
      } else if (source instanceof GainNode) {
        gainNodesToDisconnect.push(source);
      }
    });
    
    // Stop all sources immediately (use currentTime to stop right now)
    sourcesToStop.forEach((source) => {
      try {
        // Check if source is already stopped
        if (source.playbackState !== undefined && (source as any).playbackState === 'finished') {
          return;
        }
        // Stop immediately at current time
        source.stop(ctx.currentTime);
      } catch (e) {
        // If stop() throws, try stop() without arguments
        try {
          source.stop();
        } catch (e2) {
          // If that also fails, try to disconnect
          try {
            source.disconnect();
          } catch (e3) {
            // Ignore - source may already be stopped/disconnected
          }
        }
      }
    });
    
    // Disconnect all gain nodes from destination
    gainNodesToDisconnect.forEach((gain) => {
      try {
        gain.disconnect();
      } catch (e) {
        // Ignore - may already be disconnected
      }
    });
    
    // Stop all thrust oscillators immediately
    Array.from(thrustOscs.values()).forEach(osc => {
      try {
        osc.stop(ctx.currentTime);
      } catch (e) {
        try {
          osc.stop();
        } catch (e2) {
          try {
            osc.disconnect();
          } catch {}
        }
      }
    });
    
    // Clear all tracking
    activeAudioSources.clear();
    thrustOscs.clear();
    
    // As a last resort, suspend the audio context temporarily to stop all audio
    // Then resume it after a brief moment (so it can be used again)
    if (ctx.state === 'running') {
      ctx.suspend().then(() => {
        console.log('[audio] Audio context suspended');
        // Resume after a brief moment to allow future audio
        setTimeout(() => {
          ctx.resume().then(() => {
            console.log('[audio] Audio context resumed');
          }).catch(() => {});
        }, 50);
      }).catch(() => {});
    }
    
    console.log('[audio] stopAll completed, stopped', sourcesToStop.length, 'sources, disconnected', gainNodesToDisconnect.length, 'gain nodes');
  };

  window.rf_screenshot_callback = (pixels: Uint8Array, width: number, height: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imgData = ctx.createImageData(width, height);
    for (let i = 0; i < pixels.length; i++) {
      imgData.data[i] = pixels[i];
    }
    ctx.putImageData(imgData, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `screenshot-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  return ctx;
}

/**
 * Set up keyboard input handlers for WASM engine
 * NOTE: Keyboard input is now handled by the Controller component.
 * This function only handles PRINT SCREEN for screenshots.
 * @param onReady Callback when input handlers are set up
 * @returns Cleanup function to remove event listeners
 */
export function setupInput(onReady?: () => void): (() => void) | null {
  function onKey(e: KeyboardEvent) {
    // Only handle PRINT SCREEN key here - everything else is handled by Controller
    if (e.code === "PrintScreen" && window.rf_screenshot) {
      e.preventDefault();
      window.rf_screenshot();
    }
  }

  const kd = (e: KeyboardEvent) => onKey(e);

  // Listen for PRINT SCREEN only
  window.addEventListener("keydown", kd, true);
  document.addEventListener("keydown", kd, true);

  onReady?.();

  return () => {
    window.removeEventListener("keydown", kd, true);
    document.removeEventListener("keydown", kd, true);
  };
}

/**
 * Initialize the WASM engine with given FPS
 */
export function initEngine(fps: number = 60): void {
  if (window.rf_init) {
    window.rf_init(fps);
  }
}

/**
 * Load a cart into the WASM engine
 * @param cartData Cart data as Uint8Array
 * @returns Error string if failed, null if success
 */
export function loadCart(cartData: Uint8Array): string | null {
  if (!window.rf_load_cart) {
    return "WASM engine not initialized";
  }
  const result = window.rf_load_cart(cartData);
  if (result && typeof result === "string") {
    return result;
  }
  return null;
}

/**
 * Run one frame of the game
 */
export function runFrame(): void {
  if (window.rf_run_frame) {
    window.rf_run_frame();
  }
}

/**
 * Get pixels from the WASM engine
 * @param dst Destination buffer for pixels
 */
export function getPixels(dst: Uint8Array): void {
  if (window.rf_get_pixels) {
    window.rf_get_pixels(dst);
  }
}

/**
 * Check if WASM engine is ready
 */
export function isReady(): boolean {
  return !!(
    window.rf_init &&
    window.rf_load_cart &&
    window.rf_run_frame &&
    window.rf_get_pixels &&
    window.rf_set_btn
  );
}

