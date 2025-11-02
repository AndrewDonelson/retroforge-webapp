"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from 'convex/react';
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

import { initWASM, initAudio, setupInput, initEngine, loadCart, runFrame, getPixels, isReady } from '@/lib/wasmInterface';

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
  
  // Mutation to increment games_played when cart starts
  const incrementGamesPlayed = useMutation(api.stats.incrementGamesPlayed);
  
  // Like and favorite functionality
  const toggleLike = useMutation(api.interactions.toggleLike);
  const toggleFavorite = useMutation(api.interactions.toggleFavorite);
  const likeStatus = useQuery(
    api.interactions.hasLiked,
    isAuthenticated && user && isConvexId && dbCart
      ? { cartId: dbCart._id, userId: user.userId }
      : 'skip'
  );
  const favoriteStatus = useQuery(
    api.interactions.hasFavorited,
    isAuthenticated && user && isConvexId && dbCart
      ? { cartId: dbCart._id, userId: user.userId }
      : 'skip'
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
  const runningRef = useRef<boolean>(false); // Ref to track running state for loop closure
  const audioRef = useRef<AudioContext | null>(null);

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
              // Handle new manifest structure
              const hasMultiplayer = manifestData.hasMultiplayer === true || manifestData.enabled === true || !!manifestData.multiplayer;
              // console.log('[Multiplayer] Loaded manifest from cartData, has multiplayer:', hasMultiplayer, manifestData);
            } else {
              // console.warn('[Multiplayer] cartData exists but manifest.json not found in ZIP');
            }
          } catch (err) {
            // console.error('[Multiplayer] Failed to extract manifest from cartData:', err);
          }
        } else {
          // console.warn('[Multiplayer] dbCart.cartData is missing, will try cartFiles fallback');
        }
        
        // Fallback to manifestFile if cartData extraction failed
        if (!manifestData && manifestFile?.content) {
          try {
            manifestData = JSON.parse(manifestFile.content);
            // Handle new manifest structure
            const hasMultiplayer = manifestData.hasMultiplayer === true || manifestData.enabled === true || !!manifestData.multiplayer;
            // console.log('[Multiplayer] Loaded manifest from cartFiles, has multiplayer:', hasMultiplayer);
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
    initWASM(
      () => {
        if (!cancelled) setReady(true);
      },
      (error) => {
        console.error('Failed to initialize WASM:', error);
      }
    );
    return () => { cancelled = true; };
  }, []);

  // Disabled auto-start - user must click Start button

  function ensureAudio() {
    if (!audioRef.current) {
      audioRef.current = initAudio();
    }
  }

  useEffect(() => {
    if (!ready) return; // Wait for WASM to load
    
    const cleanup = setupInput();
    return cleanup || undefined;
  }, [ready]);

  // Compute derived values after all hooks
  // Use isMultiplayer from schema for button visibility (fast, no parsing needed)
  // Default to false if not set (for backward compatibility with existing carts)
  const isMultiplayerEnabled = dbCart?.isMultiplayer ?? false;
  
  // Handle new manifest structure: extract from top-level or fullManifest
  const maxPlayers = cartManifest?.maxPlayers ?? cartManifest?.multiplayer?.maxPlayers ?? 6;
  const minPlayers = cartManifest?.minPlayers ?? cartManifest?.multiplayer?.minPlayers ?? 2;
  const supportsSolo = cartManifest?.supportsSolo ?? cartManifest?.multiplayer?.supportsSolo ?? false;
  const hasMultiplayer = cartManifest?.hasMultiplayer === true || cartManifest?.enabled === true || !!cartManifest?.multiplayer;
  
  // Debug: Log manifest state (commented out to reduce console spam)
  // useEffect(() => {
  //   if (cartManifest) {
  //     console.log('[Multiplayer] Manifest loaded:', {
  //       enabled: isMultiplayerEnabled,
  //       minPlayers,
  //       maxPlayers,
  //       supportsSolo,
  //       hasMultiplayer: hasMultiplayer,
  //       manifestStructure: cartManifest.fullManifest ? 'new' : 'old'
  //     });
  //   } else {
  //     console.log('[Multiplayer] Manifest not loaded yet, dbCart:', dbCart?._id);
  //   }
  // }, [cartManifest, isMultiplayerEnabled, minPlayers, maxPlayers, supportsSolo, hasMultiplayer, dbCart]);

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
    if (!ready || running || !cart) return;
    if (!isReady()) return;
    
    // Set running flag early to prevent double-clicks
    setRunning(true);
    runningRef.current = true; // Also update ref for loop closure
    
    ensureAudio();
    if (audioRef.current && audioRef.current.state === "suspended") {
      try { await audioRef.current.resume(); } catch {}
    }
    
    // Increment games_played counter when cart starts (for both Convex and non-Convex carts)
    // For non-Convex carts, cartId will be undefined and only global stats will increment
    try {
      const cartId = isConvexId && dbCart ? dbCart._id : undefined;
      await incrementGamesPlayed({ cartId });
    } catch (err) {
      console.error('Failed to increment games played:', err);
      // Don't block game start if stats update fails
    }
    
    initEngine(60);
    
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
      setRunning(false);
      runningRef.current = false;
      return;
    }
    
    // Load cart and check for errors
    const loadError = loadCart(buf);
    if (loadError) {
      console.error('Failed to load cart:', loadError);
      setRunning(false);
      runningRef.current = false;
      return;
    }
    
    const cvs = canvasRef.current!; const ctx = cvs.getContext("2d")!;
    const width = 480, height = 270; cvs.width = width; cvs.height = height;
    const s = Math.max(1, scale|0);
    cvs.style.width = `${width*s}px`; cvs.style.height = `${height*s}px`;
    // Pre-allocate ImageData once and reuse it
    const img = ctx.createImageData(width, height);
    // Pre-allocate buffer for pixel transfer (reuse to avoid allocations)
    const pixelBuf = new Uint8Array(img.data.length);
    
    // Run first frame immediately to ensure renderer is initialized
    // This ensures the splash screen or initial state is drawn before starting the loop
    runFrame();
    getPixels(pixelBuf);
    img.data.set(pixelBuf);
    ctx.putImageData(img, 0, 0);
    
    // Focus the canvas so it can receive keyboard events
    const focusCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.focus();
        canvasRef.current.click();
      }
    };
    
    // Focus immediately and repeatedly to ensure it gets focus
    focusCanvas();
    setTimeout(focusCanvas, 50);
    setTimeout(focusCanvas, 200);
    setTimeout(focusCanvas, 500);
    
    let frameCount = 0;
    const loop = () => { 
      // Use ref instead of state to avoid closure issue
      if (!runningRef.current || !isReady()) {
        // If running flag was cleared (stop button clicked), exit loop
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        return;
      }
      frameCount++;
      // Debug logging removed to reduce console spam
      
      runFrame();
      
      // Get pixels directly into our buffer
      getPixels(pixelBuf);
      // Copy directly to ImageData (more efficient than creating new arrays)
      img.data.set(pixelBuf);
      ctx.putImageData(img, 0, 0); 
      rafRef.current = requestAnimationFrame(loop); 
    };
    rafRef.current = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setRunning(false);
    runningRef.current = false; // Also update ref
    if (audioRef.current && window.rf_audio_stopAll) {
      if (audioRef.current.state !== "closed") window.rf_audio_stopAll();
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{cart.name}</h1>
          <p className="text-gray-300 text-sm mt-1">{cart.desc}</p>
          {isConvexId && dbCart && (
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span>▶ {dbCart.plays?.toLocaleString() || 0} plays</span>
              {likeStatus && (
                <span className="flex items-center gap-1">
                  ❤️ {likeStatus.likeCount || 0}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Like and Favorite buttons - only show for authenticated users and Convex carts */}
          {isAuthenticated && user && isConvexId && dbCart && (
            <>
              <button
                onClick={async () => {
                  try {
                    await toggleLike({ cartId: dbCart._id, userId: user.userId });
                  } catch (err) {
                    console.error('Failed to toggle like:', err);
                  }
                }}
                className={`px-3 py-2 rounded transition-colors ${
                  likeStatus?.liked
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                title={likeStatus?.liked ? 'Unlike this cart' : 'Like this cart'}
              >
                ❤️ {likeStatus?.likeCount || 0}
              </button>
              <button
                onClick={async () => {
                  try {
                    await toggleFavorite({ cartId: dbCart._id, userId: user.userId });
                  } catch (err) {
                    console.error('Failed to toggle favorite:', err);
                  }
                }}
                className={`px-3 py-2 rounded transition-colors ${
                  favoriteStatus?.favorited
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                title={favoriteStatus?.favorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                🔖
              </button>
            </>
          )}
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
            <button onClick={start} disabled={!ready || running} className="px-4 py-2 rounded bg-retro-600 hover:bg-retro-500 disabled:opacity-50">{ready ? "Start" : "Loading engine..."}</button>
          )}
        </div>
      </div>
      <div className="rounded border border-gray-700 bg-black inline-block">
        <canvas 
          ref={canvasRef} 
          tabIndex={0}
          className="outline-none"
          style={{ outline: 'none' }}
          onFocus={(e) => {
            e.target.focus();
          }}
          onBlur={(e) => {
            // Re-focus if game is running
            if (runningRef.current) {
              setTimeout(() => e.target.focus(), 10);
            }
          }}
          onClick={(e) => {
            e.currentTarget.focus();
          }}
        />
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


