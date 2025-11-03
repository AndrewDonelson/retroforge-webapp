"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/contexts/AuthContext';
import { ForkButton } from '@/components/carts/ForkButton';
import { LobbyBrowserModal } from '@/components/multiplayer/LobbyBrowserModal';
import { CreateLobbyModal } from '@/components/multiplayer/CreateLobbyModal';
import { GameLobbyModal } from '@/components/multiplayer/GameLobbyModal';
import { LeaderboardModal } from '@/components/multiplayer/LeaderboardModal';
import Controller from '@/components/Controller/Controller';
import KeyboardMappings from '@/components/Controller/KeyboardMappings';
import { useController, isMobilePortrait } from '@/lib/useController';
import { ShareButton } from '@/components/common/ShareButton';

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
  }, [running, showController]);
  
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

  // Multiplayer state
  const [showLobbyBrowser, setShowLobbyBrowser] = useState(false);
  const [showCreateLobby, setShowCreateLobby] = useState(false);
  const [currentLobbyId, setCurrentLobbyId] = useState<Id<'lobbies'> | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
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

  // Detect mobile/tablet portrait mode
  useEffect(() => {
    const checkMobile = () => {
      setShowController(isMobilePortrait());
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const maxPlayers = cartManifest?.multiplayer?.maxPlayers ?? 6;
  const minPlayers = cartManifest?.multiplayer?.minPlayers ?? 2;
  const supportsSolo = cartManifest?.multiplayer?.supportsSolo ?? false;
  const hasMultiplayer = cartManifest?.multiplayer?.enabled === true || !!cartManifest?.multiplayer;
  
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
      try {
        const binaryString = atob(dbCart.cartData);
        buf = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          buf[i] = binaryString.charCodeAt(i);
        }
        console.log('[Arcade] Loaded cart from database, size:', buf.length);
        
        // Unpack and inspect cart contents
        try {
          const JSZip = (await import('jszip')).default;
          const zip = await JSZip.loadAsync(buf);
          const manifestEntry = zip.file('manifest.json');
          if (manifestEntry) {
            const manifestText = await manifestEntry.async('text');
            const manifest = JSON.parse(manifestText);
            console.log('[Arcade] Cart manifest:', JSON.stringify(manifest, null, 2));
            
            // Handle new manifest structure: extract from fullManifest if present
            const actualManifest = manifest.fullManifest || manifest;
            const entryPoint = actualManifest.entry || actualManifest.main || manifest.entry || manifest.main || 'main.lua';
            
            console.log('[Arcade] Using manifest structure:', manifest.fullManifest ? 'new (fullManifest)' : 'old (flat)');
            console.log('[Arcade] Cart entry point:', entryPoint);
            console.log('[Arcade] Actual manifest fields:', {
              title: actualManifest.title,
              author: actualManifest.author,
              entry: actualManifest.entry,
            });
            
            // List all files in the cart
            const fileNames = Object.keys(zip.files).filter(name => !zip.files[name].dir);
            console.log('[Arcade] Cart files:', fileNames);
            
            // Check if entry point file exists
            const entryPath = `assets/${entryPoint}`;
            const entryFile = zip.file(entryPath);
            if (entryFile) {
              console.log('[Arcade] Entry point file found:', entryPath);
            } else {
              console.error('[Arcade] Entry point file NOT found:', entryPath);
              console.log('[Arcade] Available asset files:', fileNames.filter(f => f.startsWith('assets/')));
            }
          } else {
            console.error('[Arcade] manifest.json not found in cart ZIP');
          }
        } catch (unpackError) {
          console.error('[Arcade] Failed to unpack cart for inspection:', unpackError);
        }
      } catch (error) {
        console.error('[Arcade] Failed to decode cartData:', error);
        setRunning(false);
        runningRef.current = false;
        return;
      }
    } else if (cart.file) {
      // Load from file URL (for carts stored in /public/carts/)
      const res = await fetch(cart.file);
      buf = new Uint8Array(await res.arrayBuffer());
      console.log('[Arcade] Loaded cart from file, size:', buf.length);
    } else {
      console.error('No cart data available');
      setRunning(false);
      runningRef.current = false;
      return;
    }
    
    // Load cart and check for errors
    const loadError = loadCart(buf);
    if (loadError) {
      console.error('Failed to load cart:', loadError, 'Buffer size:', buf.length);
      setRunning(false);
      runningRef.current = false;
      return;
    }
    
    const cvs = canvasRef.current!; const ctx = cvs.getContext("2d")!;
    const width = 480, height = 270; cvs.width = width; cvs.height = height;
    // Don't set explicit canvas style dimensions - let CSS control the display size
    // The canvas internal resolution is 480x270, but CSS will scale it to fit the container
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
    <div className={`min-h-screen bg-gray-900 ${isFullscreen ? 'fixed inset-0 w-screen h-screen max-w-full max-h-full z-[9998] overflow-hidden flex flex-col' : ''}`}>
      {/* Fullscreen Mode: Only Gameboy */}
      {isFullscreen && (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div 
            className={`
              gameboy-container
              gameboy-fullscreen
              ${showController ? 'gameboy-container-mobile' : ''}
              flex-1
              max-w-4xl
            `}
          >
            {/* Game Display */}
            <div className="gameboy-screen-container">
              <div className="gameboy-screen-border">
                <div className="gameboy-screen">
                  <canvas 
                    ref={canvasRef} 
                    tabIndex={0}
                    className="gameboy-canvas outline-none"
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
              </div>
            </div>

            {/* Logo - under display */}
            <div className="gameboy-logo-container">
              <img src="/logo.svg" alt="RetroForge" className="gameboy-logo" />
            </div>

            {/* Controller - always mounted for keyboard input, but only visible on mobile */}
            <div className={`gameboy-controller-container ${showController ? '' : 'hidden'}`}>
              <Controller
                onButtonPress={handleButtonPress}
                onButtonRelease={handleButtonRelease}
                className="gameboy-controller"
                enabled={running}
              />
            </div>
            
            {/* Exit fullscreen button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="gameboy-exit-fullscreen"
              aria-label="Exit fullscreen"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Normal Mode: Info Panel + Gameboy */}
      {!isFullscreen && (
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          {/* Responsive Layout: Portrait = rows, Landscape = columns */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            
            {/* Left/Top Column: Game Information */}
            <div className="flex-1 lg:max-w-md space-y-6">
              {/* Game Header */}
              <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                <h1 className="text-3xl lg:text-4xl font-bold text-retro-400 mb-2">{cart.name}</h1>
                {cart.desc && (
                  <p className="text-gray-300 text-base lg:text-lg leading-relaxed">{cart.desc}</p>
                )}
                
                {/* Stats Row */}
                {isConvexId && dbCart && (
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-lg">▶</span>
                      <span className="text-sm font-medium">{dbCart.plays?.toLocaleString() || 0} plays</span>
                    </div>
                    {likeStatus && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-lg">❤️</span>
                        <span className="text-sm font-medium">{likeStatus.likeCount || 0}</span>
                      </div>
                    )}
                    {favoriteStatus && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-lg">🔖</span>
                        <span className="text-sm font-medium">Favorite</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-800 rounded-xl p-6 shadow-lg space-y-4">
                <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
                
                {/* Like, Favorite, and Share */}
                {isAuthenticated && user && isConvexId && dbCart && (
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        try {
                          await toggleLike({ cartId: dbCart._id, userId: user.userId });
                        } catch (err) {
                          console.error('Failed to toggle like:', err);
                        }
                      }}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        likeStatus?.liked
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-md'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                      title={likeStatus?.liked ? 'Unlike this cart' : 'Like this cart'}
                    >
                      <span className="mr-2">❤️</span>
                      {likeStatus?.likeCount || 0}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await toggleFavorite({ cartId: dbCart._id, userId: user.userId });
                        } catch (err) {
                          console.error('Failed to toggle favorite:', err);
                        }
                      }}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        favoriteStatus?.favorited
                          ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-md'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                      title={favoriteStatus?.favorited ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      🔖
                    </button>
                    <ShareButton
                      url={typeof window !== 'undefined' ? window.location.href : ''}
                      title={cart.name}
                      text={`Check out ${cart.name} by ${dbCart?.author || 'Unknown'} on RetroForge!`}
                      className="bg-cyan-600 hover:bg-cyan-500"
                    />
                  </div>
                )}

                {/* Fork & Start - Same Row */}
                <div className="flex gap-3">
                  {/* Fork/Edit */}
                  {isAuthenticated && (
                    existingFork ? (
                      <a
                        href={`/editor?cartId=${existingFork._id}`}
                        className="flex-1 px-4 py-3 bg-retro-600 hover:bg-retro-500 rounded-lg text-center font-medium text-white transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                          aria-hidden="true"
                        >
                          <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
                        </svg>
                        My Fork
                      </a>
                    ) : (
                      <div className="flex-1 [&_button]:w-full [&_button]:px-4 [&_button]:py-3 [&_button]:bg-retro-600 [&_button]:hover:bg-retro-500 [&_button]:rounded-lg [&_button]:text-center [&_button]:font-medium [&_button]:text-white [&_button]:transition-all [&_button]:shadow-md [&_button]:disabled:opacity-50 [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:gap-2">
                        <ForkButton 
                          cartId={dbCart?._id}
                          originalCartName={cart.name}
                          cartFile={cart.file}
                        />
                      </div>
                    )
                  )}
                  
                  {/* Start Button */}
                  {running ? (
                    <button 
                      onClick={stop} 
                      className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H8z" clipRule="evenodd" />
                      </svg>
                      Stop
                    </button>
                  ) : (
                    <button 
                      onClick={start} 
                      disabled={!ready || running} 
                      className="flex-1 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {ready ? (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9.555 7.168A1 1 0 0 0 8 8v4a1 1 0 0 0 1.555.832l3-2a1 1 0 0 0 0-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          Start
                        </>
                      ) : (
                        "Loading..."
                      )}
                    </button>
                  )}
                </div>

                {/* Leaderboards & Profile */}
                {isAuthenticated && dbCart && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowLeaderboard(true)}
                      className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-all shadow-md"
                    >
                      🏆 Leaders
                    </button>
                    <Link
                      href={`/user/${dbCart.author}`}
                      className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-center text-white font-medium transition-all shadow-md"
                    >
                      👤 Profile
                    </Link>
                  </div>
                )}
                
                {/* Multiplayer */}
                {isAuthenticated && dbCart && dbCart.isMultiplayer && (
                  <button
                    onClick={() => setShowCreateLobby(true)}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-all shadow-md"
                    title="Start a multiplayer game"
                  >
                    🎮 Play Multiplayer
                  </button>
                )}
              </div>

              {/* WASM Input Notice */}
              <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm">
                  <p className="text-yellow-400 font-medium mb-1">⚠️ WASM Input Notice</p>
                  <p className="text-yellow-300">
                    WASM ↔ Engine Input is not working correctly. You will have to play on Desktop(s). We are working on the issue.
                  </p>
                </div>
              </div>

              {/* Game Controls */}
              {/* Scale selector commented out - using auto-scaling */}
              {/* <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                <h2 className="text-lg font-semibold text-white mb-4">Controls</h2>
                <div className="flex gap-3">
                  <select
                    value={scale}
                    onChange={(e)=>setScale(parseInt(e.target.value)||1)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white font-medium focus:outline-none focus:ring-2 focus:ring-retro-500"
                  >
                    {[1,2,3,4].map(s => <option key={s} value={s}>Scale {s}x</option>)}
                  </select>
                </div>
              </div> */}
            </div>

            {/* Right/Bottom Column: Gameboy Display */}
            <div className="flex-1 lg:flex-shrink-0 lg:max-w-2xl">
              {/* Gameboy-style container */}
              <div 
                className={`
                  gameboy-container
                  ${showController ? 'gameboy-container-mobile' : ''}
                  w-full
                `}
              >
                {/* Game Display */}
                <div className="gameboy-screen-container">
                  <div className="gameboy-screen-border">
                    <div className="gameboy-screen">
                      <canvas 
                        ref={canvasRef} 
                        tabIndex={0}
                        className="gameboy-canvas outline-none"
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
                  </div>
                </div>

                {/* Logo - under display */}
                <div className="gameboy-logo-container">
                  <img src="/logo.svg" alt="RetroForge" className="gameboy-logo" />
                </div>

                {/* Controller - always mounted for keyboard input, but only visible on mobile */}
                <div className={`gameboy-controller-container ${showController ? '' : 'hidden'}`}>
                  <Controller
                    onButtonPress={handleButtonPress}
                    onButtonRelease={handleButtonRelease}
                    className="gameboy-controller"
                    enabled={running}
                  />
                </div>
              </div>

              {/* Keyboard Mappings */}
              <div className="mt-6">
                <KeyboardMappings compact />
              </div>
            </div>
          </div>
        </div>
      )}

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

        /* Mobile Portrait: Smaller padding and tighter spacing */
        @media (max-width: 768px) {
          .gameboy-container-mobile {
            padding: 0.75rem;
          }
          
          .gameboy-screen-border {
            padding: 0.75rem;
          }
        }

        /* Desktop Landscape: Optimized sizing */
        @media (min-width: 769px) {
          .gameboy-container:not(.gameboy-fullscreen) {
            max-width: 100%;
          }
          
          .gameboy-screen-container {
            max-width: 100%;
          }
        }
        
        /* Large screens: Better proportions */
        @media (min-width: 1024px) {
          .gameboy-container:not(.gameboy-fullscreen) {
            max-width: 100%;
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

    </div>
  );
}


