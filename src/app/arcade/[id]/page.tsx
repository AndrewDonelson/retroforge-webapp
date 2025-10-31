"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/contexts/AuthContext';
import { ForkButton } from '@/components/carts/ForkButton';
import { LobbyBrowserModal } from '@/components/multiplayer/LobbyBrowserModal';
import { CreateLobbyModal } from '@/components/multiplayer/CreateLobbyModal';
import { GameLobbyModal } from '@/components/multiplayer/GameLobbyModal';
import { LeaderboardModal } from '@/components/multiplayer/LeaderboardModal';
import { ProfileModal } from '@/components/multiplayer/ProfileModal';

type CartDef = { id: string; name: string; file: string | undefined; desc: string };

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
  }
}

export default function ArcadeDetailPage() {
  const params = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  
  // Get cart from database (all cart IDs should be Convex IDs)
  const cartIdParam = params.id as string;
  const isConvexId = cartIdParam?.startsWith('j'); // Convex IDs start with 'j'
  
  const dbCart = useQuery(
    api.cartActions.getById,
    isConvexId ? { cartId: cartIdParam as Id<'carts'> } : 'skip'
  );
  
  // Check if user has already forked this cart
  const existingFork = useQuery(
    api.cartActions.getExistingFork,
    isAuthenticated && user && isConvexId && dbCart
      ? { originalCartId: cartIdParam as Id<'carts'>, ownerId: user.userId }
      : 'skip'
  );
  
  // Only use database cart - no fallback to hardcoded carts
  const cart = dbCart 
    ? { id: dbCart._id, name: dbCart.title, file: dbCart.cartData ? undefined : `/carts/${params.id}.rf`, desc: dbCart.description }
    : null;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [scale, setScale] = useState(1);
  const rafRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const thrustOscRef = useRef<OscillatorNode | null>(null);
  const musicRef = useRef<{ notes: string[]; bpm: number; gain: number; startTime: number; noteIndex: number } | null>(null);
  const musicTimeoutRef = useRef<number | null>(null);

  // Multiplayer state
  const [showLobbyBrowser, setShowLobbyBrowser] = useState(false);
  const [showCreateLobby, setShowCreateLobby] = useState(false);
  const [currentLobbyId, setCurrentLobbyId] = useState<Id<'lobbies'> | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Parse cart manifest for multiplayer info
  const [cartManifest, setCartManifest] = useState<{
    multiplayer?: {
      enabled: boolean;
      minPlayers?: number;
      maxPlayers?: number;
      supportsSolo?: boolean;
    };
  } | null>(null);

  // Get manifest from cartFiles if available
  const manifestFile = useQuery(
    api.cartFiles.getCartFile,
    dbCart
      ? { cartId: dbCart._id, path: 'manifest.json', userId: user?.userId }
      : 'skip'
  );

  // Load manifest when cart is loaded
  useEffect(() => {
    if (!dbCart) return; // No cart to load manifest for
    
    async function loadManifest() {
      try {
        let manifestData: any = null;
        let loadedFromCart = false;
        
        // Always try to extract from cartData first (most reliable)
        if (dbCart?.cartData) {
          try {
            const binaryString = atob(dbCart.cartData);
            const buf = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              buf[i] = binaryString.charCodeAt(i);
            }
            
            // Parse as ZIP
            const JSZip = (await import('jszip')).default;
            const zip = await JSZip.loadAsync(buf);
            const manifestEntry = zip.file('manifest.json');
            if (manifestEntry) {
              const manifestText = await manifestEntry.async('text');
              manifestData = JSON.parse(manifestText);
              loadedFromCart = true;
              console.log('[Multiplayer] Loaded manifest from cartData, has multiplayer:', !!manifestData.multiplayer, manifestData);
            } else {
              console.warn('[Multiplayer] cartData exists but manifest.json not found in ZIP');
            }
          } catch (err) {
            console.error('[Multiplayer] Failed to extract manifest from cartData:', err);
          }
        } else {
          console.warn('[Multiplayer] dbCart.cartData is missing, will try cartFiles fallback');
        }
        
        // Fallback to manifestFile if cartData extraction failed
        if (!manifestData && manifestFile?.content) {
          try {
            manifestData = JSON.parse(manifestFile.content);
            console.log('[Multiplayer] Loaded manifest from cartFiles, has multiplayer:', !!manifestData.multiplayer);
          } catch (err) {
            console.error('Failed to parse manifest:', err);
          }
        }
        
        // Only update state if manifest data actually changed
        setCartManifest(prev => {
          if (JSON.stringify(prev) === JSON.stringify(manifestData)) {
            return prev; // No change, return previous value to avoid re-render
          }
          return manifestData;
        });
      } catch (err) {
        console.error('Failed to load manifest:', err);
      }
    }
    
    loadManifest();
  }, [manifestFile?.content, dbCart?._id, dbCart?.cartData]); // Include cartData in dependencies

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
      // Wait a moment for WASM exports to be set on window
      await new Promise(resolve => setTimeout(resolve, 50));
      if (!cancelled) setReady(true);
    }
    loadWasm();
    return () => { cancelled = true; };
  }, []);

  // Auto-start once ready (only if cart exists)
  useEffect(() => {
    if (ready && !running && cart) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, cart]);

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
      (window as any).rf_audio_thrust = (on: boolean) => {
        if (!ctx) return;
        if (thrustOscRef.current) {
          try { thrustOscRef.current.stop(); } catch {}
          thrustOscRef.current = null;
        }
        if (on) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.value = 110;
          g.gain.value = 0.2;
          osc.connect(g).connect(ctx.destination);
          osc.start(ctx.currentTime);
          thrustOscRef.current = osc;
        }
      };
      (window as any).rf_audio_playNotes = (tokens: string[], bpm: number, gain: number) => {
        if (!ctx) return;
        // Stop any existing music
        if (musicTimeoutRef.current) {
          clearTimeout(musicTimeoutRef.current);
          musicTimeoutRef.current = null;
        }
        const noteMap: Record<string, number> = {
          "C": 261.63, "C#": 277.18, "D": 293.66, "D#": 311.13,
          "E": 329.63, "F": 349.23, "F#": 369.99,
          "G": 392.00, "G#": 415.30, "A": 440.00, "A#": 466.16, "B": 493.88
        };
        let noteIndex = 0;
        const startTime = ctx.currentTime;
        const beatDuration = 60 / bpm;
        
        const playNext = () => {
          if (noteIndex >= tokens.length) return;
          const token = tokens[noteIndex];
          noteIndex++;
          
          if (token.startsWith("R")) {
            // Rest - just wait
            const restBeats = parseInt(token.substring(1)) || 1;
            musicTimeoutRef.current = window.setTimeout(playNext, restBeats * beatDuration * 1000);
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
            
            musicTimeoutRef.current = window.setTimeout(playNext, dur * beatDuration * 1000);
          }
        };
        
        playNext();
      };
      (window as any).rf_audio_stopAll = () => {
        if (thrustOscRef.current) {
          try { thrustOscRef.current.stop(); } catch {}
          thrustOscRef.current = null;
        }
        if (musicTimeoutRef.current) {
          clearTimeout(musicTimeoutRef.current);
          musicTimeoutRef.current = null;
        }
        // Don't close the audio context, just stop sounds
      };
      (window as any).rf_screenshot_callback = (pixels: Uint8Array, width: number, height: number) => {
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
        // Handle PRINT SCREEN key
        if (e.code === "PrintScreen" && down && window.rf_screenshot) {
          e.preventDefault();
          window.rf_screenshot();
          return;
        }
        const map: Record<string, number> = { ArrowLeft:0, ArrowRight:1, ArrowUp:2, ArrowDown:3, KeyZ:4, KeyX:5, Enter:5 };
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

  // Compute derived values after all hooks
  // Use isMultiplayer from schema for button visibility (fast, no parsing needed)
  // Default to false if not set (for backward compatibility with existing carts)
  const isMultiplayerEnabled = dbCart?.isMultiplayer ?? false;
  // Load detailed properties from manifest when needed (for lobby)
  const maxPlayers = cartManifest?.multiplayer?.maxPlayers ?? 6;
  const minPlayers = cartManifest?.multiplayer?.minPlayers ?? 2;
  const supportsSolo = cartManifest?.multiplayer?.supportsSolo ?? false;
  
  // Debug: Log manifest state (remove after testing)
  useEffect(() => {
    if (cartManifest) {
      console.log('[Multiplayer] Manifest loaded:', {
        enabled: isMultiplayerEnabled,
        minPlayers,
        maxPlayers,
        supportsSolo,
        hasMultiplayer: !!cartManifest.multiplayer,
        multiplayer: cartManifest.multiplayer,
        fullManifest: cartManifest,
        manifestKeys: Object.keys(cartManifest)
      });
      
      // Check if multiplayer exists but might be malformed
      if (!cartManifest.multiplayer && cartManifest.title === 'Multiplayer Platformer Demo') {
        console.warn('[Multiplayer] Expected multiplayer property missing from manifest!', cartManifest);
      }
    } else {
      console.log('[Multiplayer] Manifest not loaded yet, dbCart:', dbCart?._id);
    }
  }, [cartManifest, isMultiplayerEnabled, minPlayers, maxPlayers, supportsSolo, dbCart]);

  // Show loading state while checking for cart (after all hooks)
  if (dbCart === undefined && !isConvexId) {
    // Not a valid Convex ID
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
          <h1 className="text-2xl font-semibold mb-2 text-red-400">Invalid Cart ID</h1>
          <p className="text-gray-300">
            The cart ID "{params.id}" is not valid.
          </p>
          <a href="/browser" className="text-retro-400 hover:text-retro-300 mt-4 inline-block">
            ← Back to Browse Games
          </a>
        </div>
      </div>
    );
  }

  // Show error if cart not found (after query completes)
  if (dbCart === null && isConvexId) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
          <h1 className="text-2xl font-semibold mb-2 text-red-400">Cart Not Found</h1>
          <p className="text-gray-300">
            The cart with ID "{params.id}" was not found in the database.
          </p>
          <a href="/browser" className="text-retro-400 hover:text-retro-300 mt-4 inline-block">
            ← Back to Browse Games
          </a>
        </div>
      </div>
    );
  }

  // Show loading state while cart is being loaded
  if (!cart && dbCart === undefined) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <h1 className="text-2xl font-semibold mb-2">Loading Cart...</h1>
          <p className="text-gray-300">Please wait while we load the cart.</p>
        </div>
      </div>
    );
  }

  // Ensure cart exists before rendering
  if (!cart) {
    return null; // Should not reach here, but safety check
  }

  async function start() {
    if (!ready || running) return;
    if (!window.rf_init || !window.rf_load_cart) return;
    ensureAudio();
    if (audioRef.current && audioRef.current.state === "suspended") {
      try { await audioRef.current.resume(); } catch {}
    }
    window.rf_init!(60);
    
    // Load cart data - from database or file
    let buf: Uint8Array;
    if (dbCart?.cartData) {
      // Load from base64 cart data in database
      const binaryString = atob(dbCart.cartData);
      buf = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        buf[i] = binaryString.charCodeAt(i);
      }
    } else if (cart.file) {
      // Load from file URL (for carts stored in /public/carts/)
      const res = await fetch(cart.file);
      buf = new Uint8Array(await res.arrayBuffer());
    } else {
      console.error('No cart data available');
      return;
    }
    
    window.rf_load_cart!(buf);
    const cvs = canvasRef.current!; const ctx = cvs.getContext("2d")!;
    const width = 480, height = 270; cvs.width = width; cvs.height = height;
    const s = Math.max(1, scale|0);
    cvs.style.width = `${width*s}px`; cvs.style.height = `${height*s}px`;
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
        <div className="flex items-center gap-3 flex-wrap">
          {isAuthenticated && existingFork ? (
            <a
              href={`/editor?cartId=${existingFork._id}`}
              className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded"
            >
              Go to My Fork
            </a>
          ) : (
            isAuthenticated && (
              <ForkButton 
                cartId={dbCart?._id}
                originalCartName={cart.name}
                cartFile={cart.file}
              />
            )
          )}
          
          {/* Multiplayer button - single button that creates/joins lobby */}
          {isAuthenticated && dbCart && dbCart.isMultiplayer && (
            <button
              onClick={() => {
                // Automatically create a lobby when clicking "Play Multiplayer"
                setShowCreateLobby(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
              title="Start a multiplayer game"
            >
              Play Multiplayer
            </button>
          )}
          
          {/* Leaderboard and Profile buttons */}
          {isAuthenticated && dbCart && (
            <>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded"
              >
                Leaderboards
              </button>
              <button
                onClick={() => setShowProfile(true)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
              >
                Profile
              </button>
            </>
          )}
          
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

      {/* Multiplayer Modals */}
      {showLobbyBrowser && dbCart && (
        <LobbyBrowserModal
          cartId={dbCart._id}
          onJoinLobby={(lobbyId) => {
            setCurrentLobbyId(lobbyId);
            setShowLobbyBrowser(false);
          }}
          onCreateLobby={() => {
            setShowLobbyBrowser(false);
            setShowCreateLobby(true);
          }}
          onClose={() => setShowLobbyBrowser(false)}
        />
      )}

      {showCreateLobby && dbCart && (
        <CreateLobbyModal
          cartId={dbCart._id}
          maxPlayers={maxPlayers}
          onLobbyCreated={(lobbyId) => {
            setCurrentLobbyId(lobbyId);
            setShowCreateLobby(false);
          }}
          onCancel={() => setShowCreateLobby(false)}
        />
      )}

      {currentLobbyId && dbCart && (
        <GameLobbyModal
          lobbyId={currentLobbyId}
          cartId={dbCart._id}
          minPlayers={minPlayers}
          supportsSolo={supportsSolo}
          onStartGame={(isSolo) => {
            // TODO: Initialize multiplayer mode and start game
            setCurrentLobbyId(null);
            // If solo, start game immediately without multiplayer
            // Otherwise, initialize WebRTC connections
            if (isSolo) {
              // Start in solo mode (no multiplayer initialization)
              start();
            } else {
              // Start in multiplayer mode (TODO: initialize WebRTC)
              console.log('Starting multiplayer game...');
              start();
            }
          }}
          onLeave={() => {
            setCurrentLobbyId(null);
          }}
        />
      )}

      {showLeaderboard && dbCart && (
        <LeaderboardModal
          cartId={dbCart._id}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}


