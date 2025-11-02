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
    rf_screenshot?: () => unknown;
    rf_screenshot_callback?: (pixels: Uint8Array, width: number, height: number) => void;
    rf_audio_playSine?: (freq: number, dur: number, gain: number) => void;
    rf_audio_playNoise?: (dur: number, gain: number) => void;
    rf_audio_thrust?: (on: boolean) => void;
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
      if (window.rf_init && window.rf_load_cart && window.rf_run_frame && window.rf_get_pixels) {
        onReady();
      } else if (attempts < 50) {
        attempts++;
        setTimeout(checkReady, 100);
      } else {
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

  window.rf_audio_playSine = (freq: number, dur: number, gain: number) => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g).connect(ctx.destination);
    const now = ctx.currentTime;
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
    src.start();
  };

  window.rf_audio_thrust = (on: boolean) => {
    if (!ctx) return;
    if (thrustOsc) {
      try {
        thrustOsc.stop();
      } catch {}
      thrustOsc = null;
    }
    if (on) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 110;
      g.gain.value = 0.2;
      osc.connect(g).connect(ctx.destination);
      osc.start(ctx.currentTime);
      thrustOsc = osc;
    }
  };

  window.rf_audio_playNotes = (tokens: string[], bpm: number, gain: number) => {
    if (!ctx) return;
    // Stop any existing music
    if (musicTimeout) {
      clearTimeout(musicTimeout);
      musicTimeout = null;
    }
    const noteMap: Record<string, number> = {
      "C": 261.63, "C#": 277.18, "D": 293.66, "D#": 311.13,
      "E": 329.63, "F": 349.23, "F#": 369.99,
      "G": 392.00, "G#": 415.30, "A": 440.00, "A#": 466.16, "B": 493.88
    };
    let noteIndex = 0;
    const beatDuration = 60 / bpm;

    const playNext = () => {
      if (noteIndex >= tokens.length) return;
      const token = tokens[noteIndex];
      noteIndex++;

      if (token.startsWith("R")) {
        // Rest - just wait
        const restBeats = parseInt(token.substring(1)) || 1;
        musicTimeout = window.setTimeout(playNext, restBeats * beatDuration * 1000);
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
        const now = ctx.currentTime;
        osc.start(now);
        osc.stop(now + dur * beatDuration);

        musicTimeout = window.setTimeout(playNext, dur * beatDuration * 1000);
      }
    };

    playNext();
  };

  window.rf_audio_stopAll = () => {
    if (thrustOsc) {
      try {
        thrustOsc.stop();
      } catch {}
      thrustOsc = null;
    }
    if (musicTimeout) {
      clearTimeout(musicTimeout);
      musicTimeout = null;
    }
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
 * @param onReady Callback when input handlers are set up
 * @returns Cleanup function to remove event listeners
 */
export function setupInput(onReady?: () => void): (() => void) | null {
  if (!window.rf_set_btn) {
    // Retry after a delay
    setTimeout(() => setupInput(onReady), 100);
    return null;
  }

  function onKey(e: KeyboardEvent, down: boolean) {
    if (!window.rf_set_btn) return;
    
    // Handle PRINT SCREEN key
    if (e.code === "PrintScreen" && down && window.rf_screenshot) {
      e.preventDefault();
      window.rf_screenshot();
      return;
    }
    
    // Map key codes to button indices
    const map: Record<string, number> = {
      ArrowLeft: 0,
      ArrowRight: 1,
      ArrowUp: 2,
      ArrowDown: 3,
      KeyZ: 4,
      KeyX: 5,
      Enter: 5,
      Escape: 3, // ESC maps to button 3 (Down) for pause
    };
    
    const idx = map[e.code];
    if (idx !== undefined) {
      e.preventDefault();
      window.rf_set_btn(idx, down);
    }
  }

  const kd = (e: KeyboardEvent) => onKey(e, true);
  const ku = (e: KeyboardEvent) => onKey(e, false);

  // Listen on both window and document to catch all events
  window.addEventListener("keydown", kd, true);
  window.addEventListener("keyup", ku, true);
  document.addEventListener("keydown", kd, true);
  document.addEventListener("keyup", ku, true);

  onReady?.();

  return () => {
    window.removeEventListener("keydown", kd, true);
    window.removeEventListener("keyup", ku, true);
    document.removeEventListener("keydown", kd, true);
    document.removeEventListener("keyup", ku, true);
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
    window.rf_get_pixels
  );
}

