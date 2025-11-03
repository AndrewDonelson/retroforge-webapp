"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Controller from '@/components/Controller/Controller';
import { useController, isMobilePortrait } from '@/lib/useController';
import { setupInput } from '@/lib/wasmInterface';

export const dynamic = 'force-dynamic';

type Cart = { id: string; name: string; file: string };

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
  }
}

export default function ArcadePage() {
  // Get all carts from database
  const dbCarts = useQuery(api.carts.list, {});
  
  // Convert database carts to Cart type
  const CARTS = useMemo(() => {
    if (!dbCarts) return [];
    return dbCarts.map((c) => ({
      id: c._id,
      name: c.title,
      file: c.cartData ? undefined : `/carts/${c._id}.rf`, // Use cartData if available, otherwise file URL
    })) as Cart[];
  }, [dbCarts]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [scale, setScale] = useState(1);
  const rafRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [showController, setShowController] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Controller integration
  const { handleButtonPress, handleButtonRelease } = useController();
  
  // Toggle fullscreen when game starts
  useEffect(() => {
    if (running && !isFullscreen && showController) {
      setIsFullscreen(true);
    } else if (!running) {
      setIsFullscreen(false);
    }
  }, [running, showController, isFullscreen]);
  
  // Exit fullscreen on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Set first cart when carts are loaded
  useEffect(() => {
    if (CARTS.length > 0 && !cart) {
      setCart(CARTS[0]);
    }
  }, [CARTS, cart]);

  useEffect(() => {
    let cancelled = false;
    async function loadWasm() {
      // Load wasm_exec.js
      await new Promise<void>((resolve) => {
        const s = document.createElement("script");
        s.src = "/engine/wasm_exec.js";
        s.onload = () => resolve();
        document.body.appendChild(s);
      });
      const go = new (window as any).Go();
      const resp = await fetch("/engine/retroforge.wasm");
      const { instance } = await WebAssembly.instantiateStreaming(resp, go.importObject);
      go.run(instance);
      // Wait a moment for WASM exports to be set on window
      await new Promise(resolve => setTimeout(resolve, 50));
      if (!cancelled) setReady(true);
    }
    loadWasm();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-start once engine is ready
  useEffect(() => {
    if (ready && !running) {
      // fire and forget; audio may remain muted until resume
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Install simple WebAudio shims used by WASM audio bridge
  function ensureAudio() {
    if (!audioRef.current) {
      audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioRef.current;
      (window as any).rf_audio_playSine = (freq: number, dur: number, gain: number) => {
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
      (window as any).rf_audio_playNoise = (dur: number, gain: number) => {
        if (!ctx) return;
        const len = Math.floor(Math.max(0.01, dur) * ctx.sampleRate);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const ch = buf.getChannelData(0);
        for (let i=0;i<len;i++) ch[i] = Math.random()*2-1;
        const src = ctx.createBufferSource();
        const g = ctx.createGain();
        g.gain.value = gain;
        src.buffer = buf;
        src.connect(g).connect(ctx.destination);
        src.start();
      };
      (window as any).rf_audio_stopAll = () => {
        try {
          if (ctx.state !== "closed") ctx.close();
        } catch {}
        audioRef.current = null;
      };
    }
  }

  // Detect mobile/tablet portrait mode
  useEffect(() => {
    const checkMobile = () => {
      setShowController(isMobilePortrait());
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Setup keyboard input (uses new 11-button system)
  useEffect(() => {
    if (!ready) return;
    const cleanup = setupInput();
    return cleanup;
  }, [ready]);

  async function start() {
    if (!ready || running || !cart) return;
    if (!window.rf_init || !window.rf_load_cart) return;
    ensureAudio();
    if (audioRef.current && audioRef.current.state === "suspended") {
      try { await audioRef.current.resume(); } catch {}
    }
    window.rf_init!(60);
    
    // Load cart data
    let buf: Uint8Array;
    if (cart.file) {
      // Load from file URL
      const res = await fetch(cart.file);
      buf = new Uint8Array(await res.arrayBuffer());
    } else {
      // Load from database cartData (base64)
      const dbCart = dbCarts?.find(c => c._id === cart.id);
      if (!dbCart?.cartData) {
        console.error('No cart data available');
        return;
      }
      const binaryString = atob(dbCart.cartData);
      buf = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        buf[i] = binaryString.charCodeAt(i);
      }
    }
    window.rf_load_cart!(buf);

    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    const width = 480, height = 270;
    cvs.width = width; cvs.height = height;
    // Don't set explicit canvas style dimensions - let CSS control the display size
    // The canvas internal resolution is 480x270, but CSS will scale it to fit the container
    // Pre-allocate ImageData once and reuse it
    const img = ctx.createImageData(width, height);
    // Pre-allocate buffer for pixel transfer (reuse to avoid allocations)
    const pixelBuf = new Uint8Array(img.data.length);
    
    const loop = () => {
      if (!window.rf_run_frame || !window.rf_get_pixels) return;
      window.rf_run_frame!();
      
      // Get pixels directly into our buffer
      window.rf_get_pixels!(pixelBuf);
      // Copy directly to ImageData (more efficient than creating new arrays)
      img.data.set(pixelBuf);
      ctx.putImageData(img, 0, 0);
      rafRef.current = requestAnimationFrame(loop);
    };
    setRunning(true);
    rafRef.current = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setRunning(false);
    if (audioRef.current && (window as any).rf_audio_stopAll) {
      if (audioRef.current.state !== "closed") (window as any).rf_audio_stopAll();
    }
  }

  return (
    <div className={`max-w-6xl mx-auto p-4 ${showController ? 'flex flex-col' : ''} ${isFullscreen ? 'fixed inset-0 w-screen h-screen max-w-full max-h-full z-[9998] overflow-hidden bg-gray-900 flex flex-col' : ''}`}>
      {!showController && !isFullscreen && (
        <h1 className="text-2xl font-semibold mb-4">Arcade</h1>
      )}
      {!isFullscreen && (
        <div className={`flex gap-3 items-center mb-4 ${showController ? 'hidden' : ''}`}>
        <select
          value={scale}
          onChange={(e)=>setScale(parseInt(e.target.value)||1)
          }
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
        >
          {[1,2,3,4].map(s => <option key={s} value={s}>Scale {s}x</option>)}
        </select>
        {CARTS.length > 0 && (
          <select
            value={cart?.id || ''}
            onChange={(e) => {
              const selected = CARTS.find(c => c.id === e.target.value);
              if (selected) setCart(selected);
            }}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
          >
            {CARTS.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        {running ? (
          <button
            onClick={stop}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-500"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={start}
            disabled={!ready || !cart || CARTS.length === 0}
            className="px-4 py-2 rounded bg-retro-600 hover:bg-retro-500 disabled:opacity-50"
          >
            {!cart || CARTS.length === 0 ? "No carts available" : ready ? "Start" : "Loading engine..."}
          </button>
        )}
      </div>
      )}
      {/* Gameboy-style container */}
      <div 
        className={`
          gameboy-container
          ${showController ? 'gameboy-container-mobile' : ''}
          ${isFullscreen ? 'gameboy-fullscreen flex-1' : ''}
        `}
      >
        {/* Game Display */}
        <div className="gameboy-screen-container">
          <div className="gameboy-screen-border">
            <div className="gameboy-screen">
              <canvas 
                ref={canvasRef} 
                className="gameboy-canvas outline-none"
                style={{ outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Logo - under display */}
        <div className="gameboy-logo-container">
          <img src="/logo.svg" alt="RetroForge" className="gameboy-logo" />
        </div>

        {/* Controller - always mounted for keyboard input, but only visible on mobile */}
        <div className={`gameboy-controller-container ${showController ? '' : 'hidden'}`}>
          <Controller
            enabled={running}
            onButtonPress={handleButtonPress}
            onButtonRelease={handleButtonRelease}
            className="gameboy-controller"
          />
        </div>
        
        {/* Exit fullscreen button */}
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="gameboy-exit-fullscreen"
            aria-label="Exit fullscreen"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Gameboy Styles */}
      <style jsx global>{`
        .gameboy-container {
          position: relative;
          margin: 0 auto;
          max-width: 100%;
          background: #1f2937; /* bg-gray-800 to match card theme */
          border-radius: 0.75rem; /* rounded-xl to match cards */
          padding: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg to match cards */
        }

        .gameboy-container-mobile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .gameboy-fullscreen {
          /* Revert to normal container styling - fullscreen is handled by parent */
          position: relative;
          border-radius: 0.75rem; /* rounded-xl to match cards */
          margin: 0 auto;
          padding: 1.5rem;
          background: #1f2937; /* bg-gray-800 to match card theme */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg to match cards */
          width: 100%;
          max-width: 100%;
          height: 100%;
        }

        .gameboy-screen-container {
          width: 100%;
          display: flex;
          justify-content: center;
          order: 1;
          flex-shrink: 0;
          margin-top: 0.5rem;
          padding: 0;
        }
        
        .gameboy-fullscreen .gameboy-screen-container {
          flex: 0 0 auto;
          margin-top: 0.5rem;
          max-width: 100%;
          padding: 0;
        }

        .gameboy-screen-border {
          background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
          border-radius: 0.75rem;
          padding: 0.125rem;
          box-shadow: 
            inset 2px 2px 4px rgba(255, 255, 255, 0.15),
            inset -2px -2px 4px rgba(0, 0, 0, 0.7),
            inset 1px 1px 2px rgba(255, 255, 255, 0.1),
            inset -1px -1px 2px rgba(0, 0, 0, 0.5),
            0 2px 4px rgba(0, 0, 0, 0.3);
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          max-width: 100%;
          margin: 0 auto;
        }
        
        .gameboy-fullscreen .gameboy-screen-border {
          padding: 0.075rem;
          width: 100%;
          max-width: 100%;
          margin: 0.5rem auto 0 auto;
        }

        .gameboy-screen {
          background: #000;
          border-radius: 0.5rem;
          overflow: hidden;
          position: relative;
          /* Inner bezel: top/left darker (shadow), bottom/right lighter (highlight) */
          border-top: 1px solid rgba(0, 0, 0, 0.6);
          border-left: 1px solid rgba(0, 0, 0, 0.6);
          border-bottom: 1px solid rgba(150, 150, 150, 0.4);
          border-right: 1px solid rgba(150, 150, 150, 0.4);
          box-shadow: 
            inset 0 0 20px rgba(0, 0, 0, 0.8),
            inset 1px 1px 2px rgba(0, 0, 0, 0.8),
            inset -1px -1px 2px rgba(200, 200, 200, 0.3);
          aspect-ratio: 16 / 9;
          width: 100%;
          max-width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gameboy-canvas {
          display: block;
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }

        .gameboy-logo-container {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem 0;
          order: 2;
        }

        .gameboy-logo {
          height: 48px;
          width: auto;
          opacity: 0.8;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .gameboy-controller-container {
          width: 100%;
          order: 3;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          padding-top: 1.5rem;
          flex-shrink: 0;
        }

        .gameboy-controller {
          width: 100%;
          max-width: 100%;
          padding: 0;
        }
        
        .gameboy-controller .controller-container {
          padding: 1rem;
        }
        
        .gameboy-fullscreen .gameboy-controller-container {
          flex: 0 0 auto;
          justify-content: center;
          align-items: flex-end;
          margin-bottom: 0.5rem;
          padding-top: 0;
        }

        .gameboy-exit-fullscreen {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          transition: all 0.2s ease;
        }

        .gameboy-exit-fullscreen:hover {
          background: rgba(0, 0, 0, 0.8);
          border-color: rgba(255, 255, 255, 0.5);
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .gameboy-container-mobile {
            padding: 0.75rem;
          }
          
          .gameboy-screen-border {
            padding: 0.75rem;
          }
        }

        @media (min-width: 769px) {
          .gameboy-container:not(.gameboy-fullscreen) {
            max-width: 600px;
          }
          
          .gameboy-screen-container {
            max-width: 480px;
          }
        }
        
        @media (max-height: 900px) {
          .gameboy-fullscreen {
            height: 95vh;
            padding: 1rem;
          }
          
          .gameboy-fullscreen .gameboy-screen-border {
            padding: 0.8rem;
          }
        }
        
        @media (max-height: 700px) {
          .gameboy-fullscreen {
            padding: 0.75rem;
          }
          
          .gameboy-fullscreen .gameboy-screen-border {
            padding: 0.6rem;
          }
        }
      `}</style>
    </div>
  );
}


