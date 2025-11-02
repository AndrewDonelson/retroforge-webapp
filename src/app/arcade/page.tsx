"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type Cart = { id: string; name: string; file: string };

declare global {
  interface Window {
    Go: any;
    rf_init?: (fps?: number) => unknown;
    rf_load_cart?: (data: Uint8Array) => unknown;
    rf_run_frame?: () => unknown;
    rf_get_pixels?: (dst: Uint8Array) => unknown;
    rf_set_btn?: (idx: number, down: boolean) => unknown;
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

  useEffect(() => {
    if (!ready) return; // Wait for WASM to load
    
    // Wait a bit to ensure WASM functions are actually on window
    const setupInput = () => {
      if (!window.rf_set_btn) {
        setTimeout(setupInput, 100);
        return;
      }
      
      function onKey(e: KeyboardEvent, down: boolean) {
        if (!window.rf_set_btn) return;
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
          window.rf_set_btn!(idx, down);
        }
      }
      const kd = (e: KeyboardEvent) => onKey(e, true);
      const ku = (e: KeyboardEvent) => onKey(e, false);
      window.addEventListener("keydown", kd, true);
      window.addEventListener("keyup", ku, true);
      
      return () => {
        window.removeEventListener("keydown", kd, true);
        window.removeEventListener("keyup", ku, true);
      };
    };
    
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
    const s = Math.max(1, scale|0);
    cvs.style.width = `${width*s}px`;
    cvs.style.height = `${height*s}px`;
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
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Arcade</h1>
      <div className="flex gap-3 items-center mb-4">
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
      <div className="rounded border border-gray-700 bg-black inline-block">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}


