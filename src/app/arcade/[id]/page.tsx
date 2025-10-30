"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

type CartDef = { id: string; name: string; file: string; desc: string };
const CARTS: CartDef[] = [
  { id: "helloworld", name: "Hello World", file: "/carts/helloworld.rf", desc: "Minimal example cart that prints centered text." },
  { id: "moon-lander", name: "Moon Lander", file: "/carts/moon-lander.rf", desc: "Lunar landing demo with levels, HUD, and simple SFX/music." },
];

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

export default function ArcadeDetailPage() {
  const params = useParams<{ id: string }>();
  const cart = useMemo(() => CARTS.find(c => c.id === params.id) || CARTS[0], [params.id]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [scale, setScale] = useState(1);
  const rafRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadWasm() {
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
      if (!cancelled) setReady(true);
    }
    loadWasm();
    return () => { cancelled = true; };
  }, []);

  // Auto-start once ready
  useEffect(() => {
    if (ready && !running) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

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
        try { if (ctx.state !== "closed") ctx.close(); } catch {}
        audioRef.current = null;
      };
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent, down: boolean) {
      if (!window.rf_set_btn) return;
      const map: Record<string, number> = { ArrowLeft:0, ArrowRight:1, ArrowUp:2, ArrowDown:3, KeyZ:4, KeyX:5, Enter:5 };
      const idx = map[e.code];
      if (idx !== undefined) { e.preventDefault(); window.rf_set_btn!(idx, down); }
    }
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  async function start() {
    if (!ready || running) return;
    if (!window.rf_init || !window.rf_load_cart) return;
    ensureAudio();
    if (audioRef.current && audioRef.current.state === "suspended") {
      try { await audioRef.current.resume(); } catch {}
    }
    window.rf_init!(60);
    const res = await fetch(cart.file);
    const buf = new Uint8Array(await res.arrayBuffer());
    window.rf_load_cart!(buf);
    const cvs = canvasRef.current!; const ctx = cvs.getContext("2d")!;
    const width = 480, height = 270; cvs.width = width; cvs.height = height;
    const s = Math.max(1, scale|0);
    cvs.style.width = `${width*s}px`; cvs.style.height = `${height*s}px`;
    const img = ctx.createImageData(width, height);
    const loop = () => { if (!window.rf_run_frame || !window.rf_get_pixels) return; window.rf_run_frame!(); window.rf_get_pixels!(img.data); ctx.putImageData(img, 0, 0); rafRef.current = requestAnimationFrame(loop); };
    setRunning(true); rafRef.current = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setRunning(false);
    if (audioRef.current && (window as any).rf_audio_stopAll) {
      if (audioRef.current.state !== "closed") (window as any).rf_audio_stopAll();
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">{cart.name}</h1>
          <p className="text-gray-300 text-sm mt-1">{cart.desc}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={scale}
            onChange={(e)=>setScale(parseInt(e.target.value)||1)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
          >
            {[1,2,3,4].map(s => <option key={s} value={s}>Scale {s}x</option>)}
          </select>
          {running ? (
            <button onClick={stop} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500">Stop</button>
          ) : (
            <button onClick={start} disabled={!ready} className="px-4 py-2 rounded bg-retro-600 hover:bg-retro-500 disabled:opacity-50">{ready ? "Start" : "Loading engine..."}</button>
          )}
        </div>
      </div>
      <div className="rounded border border-gray-700 bg-black inline-block">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}


