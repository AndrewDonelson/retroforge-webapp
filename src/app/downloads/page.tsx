'use client';

import { useEffect, useState } from 'react';

interface PlatformBinary {
  platform: string;
  arch: string;
  filename: string;
  description: string;
  downloadUrl: string;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
  prerelease: boolean;
}

// Determine the best binary for the current platform
function detectPlatform(): { os: string; arch: string; extension: string } {
  if (typeof window === 'undefined') {
    return { os: 'linux', arch: 'amd64', extension: '' };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  // Detect OS
  let os = 'linux';
  let extension = '';
  
  if (userAgent.includes('win') || platform.includes('win')) {
    os = 'windows';
    extension = '.exe';
  } else if (userAgent.includes('mac') || platform.includes('mac')) {
    os = 'darwin';
    extension = '';
  } else {
    os = 'linux';
    extension = '';
  }
  
  // Detect architecture (best guess for browsers)
  let arch = 'amd64';
  // Check for Apple Silicon / ARM
  if (userAgent.includes('arm') || 
      platform.includes('arm') ||
      (navigator as any).userAgentData?.platform === 'macOS') {
    // Try to detect Apple Silicon more accurately
    if (os === 'darwin' && navigator.platform.includes('Intel')) {
      arch = 'amd64'; // Intel Mac
    } else if (os === 'darwin') {
      // Modern macOS, likely Apple Silicon
      arch = 'arm64';
    } else {
      arch = 'arm64';
    }
  }
  
  return { os, arch, extension };
}

export default function DownloadsPage() {
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<{ os: string; arch: string; extension: string } | null>(null);

  useEffect(() => {
    // Detect platform
    setDetectedPlatform(detectPlatform());

    // Fetch latest releases from GitHub
    fetch('https://api.github.com/repos/AndrewDonelson/retroforge-engine/releases?per_page=10')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReleases(data);
        } else {
          setError('Failed to fetch releases');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch releases: ' + err.message);
        setLoading(false);
      });
  }, []);

  const getBinaryForPlatform = (release: GitHubRelease): PlatformBinary | null => {
    if (!detectedPlatform) return null;

    const { os, arch, extension } = detectedPlatform;
    
    // Build expected filename pattern
    let filenamePattern = '';
    if (os === 'windows') {
      if (arch === 'arm64') {
        filenamePattern = `retroforge-*-windows-arm64.exe`;
      } else {
        filenamePattern = `retroforge-*.exe`;
      }
    } else if (os === 'darwin') {
      if (arch === 'arm64') {
        filenamePattern = `retroforge-*-macos-arm64`;
      } else {
        filenamePattern = `retroforge-*-macos-amd64`;
      }
    } else {
      // Linux
      if (arch === 'arm64') {
        filenamePattern = `retroforge-*-linux-arm64`;
      } else {
        filenamePattern = `retroforge-*`;
        // Linux amd64 has no suffix
      }
    }

    // Find matching asset
    const asset = release.assets.find(a => {
      if (os === 'windows') {
        if (arch === 'arm64') {
          return a.name.includes('windows-arm64.exe');
        } else {
          return a.name.endsWith('.exe') && !a.name.includes('arm64');
        }
      } else if (os === 'darwin') {
        if (arch === 'arm64') {
          return a.name.includes('macos-arm64') && !a.name.endsWith('.wasm');
        } else {
          return a.name.includes('macos-amd64') && !a.name.endsWith('.wasm');
        }
      } else {
        // Linux
        if (arch === 'arm64') {
          return a.name.includes('linux-arm64') && !a.name.endsWith('.wasm') && !a.name.endsWith('.exe');
        } else {
          return !a.name.includes('linux-arm64') && !a.name.includes('windows') && !a.name.includes('macos') && !a.name.endsWith('.wasm') && !a.name.endsWith('.exe');
        }
      }
    });

    if (!asset) return null;

    let description = '';
    if (os === 'windows') {
      description = arch === 'arm64' ? 'Windows (ARM64)' : 'Windows (x64)';
    } else if (os === 'darwin') {
      description = arch === 'arm64' ? 'macOS (Apple Silicon)' : 'macOS (Intel)';
    } else {
      description = arch === 'arm64' ? 'Linux (ARM64)' : 'Linux (x64)';
    }

    return {
      platform: os,
      arch,
      filename: asset.name,
      description,
      downloadUrl: asset.browser_download_url
    };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const downloadBinary = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-retro-400 mb-4">Downloads</h1>
          <p className="text-gray-300">Loading releases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-retro-400 mb-4">Downloads</h1>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const latestRelease = releases[0];
  const recommendedBinary = latestRelease ? getBinaryForPlatform(latestRelease) : null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-retro-400 mb-2">Downloads</h1>
        <p className="text-gray-300 mb-6">
          Download RetroForge Engine for your platform. The engine runs games built with RetroForge carts (.rf files).
        </p>

        {recommendedBinary && latestRelease && (
          <div className="bg-retro-900/30 border border-retro-700 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold text-retro-400 mb-2">Recommended for Your Platform</h2>
            <p className="text-gray-300 mb-3">
              We detected you're on <strong>{recommendedBinary.description}</strong>
            </p>
            <button
              onClick={() => downloadBinary(recommendedBinary.downloadUrl, recommendedBinary.filename)}
              className="px-6 py-3 bg-retro-600 hover:bg-retro-500 rounded-lg text-white font-medium transition-all shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download {latestRelease.tag_name}
            </button>
          </div>
        )}
      </div>

      {/* Latest Release */}
      {latestRelease && (
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-retro-400 mb-1">
                {latestRelease.name || latestRelease.tag_name}
              </h2>
              <p className="text-gray-400 text-sm">
                Released {new Date(latestRelease.published_at).toLocaleDateString()}
                {latestRelease.prerelease && (
                  <span className="ml-2 px-2 py-1 bg-yellow-600/30 text-yellow-400 rounded text-xs">
                    Pre-release
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-retro-400">All Platforms</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {latestRelease.assets
                .filter(asset => !asset.name.includes('VERSION.txt') && !asset.name.includes('wasm_exec.js'))
                .map(asset => {
                  let platformInfo = { name: 'Unknown', icon: '💻' };
                  
                  if (asset.name.includes('windows-arm64')) {
                    platformInfo = { name: 'Windows (ARM64)', icon: '🪟' };
                  } else if (asset.name.endsWith('.exe')) {
                    platformInfo = { name: 'Windows (x64)', icon: '🪟' };
                  } else if (asset.name.includes('macos-arm64')) {
                    platformInfo = { name: 'macOS (Apple Silicon)', icon: '🍎' };
                  } else if (asset.name.includes('macos-amd64')) {
                    platformInfo = { name: 'macOS (Intel)', icon: '🍎' };
                  } else if (asset.name.includes('linux-arm64')) {
                    platformInfo = { name: 'Linux (ARM64)', icon: '🐧' };
                  } else if (asset.name.endsWith('.wasm')) {
                    platformInfo = { name: 'WebAssembly (Web)', icon: '🌐' };
                  } else {
                    platformInfo = { name: 'Linux (x64)', icon: '🐧' };
                  }

                  return (
                    <div
                      key={asset.name}
                      className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{platformInfo.icon}</span>
                          <div>
                            <p className="font-medium text-white">{platformInfo.name}</p>
                            <p className="text-xs text-gray-400">{formatFileSize(asset.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadBinary(asset.browser_download_url, asset.name)}
                          className="px-4 py-2 bg-retro-600 hover:bg-retro-500 rounded-lg text-white text-sm font-medium transition-all"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Previous Releases */}
      {releases.length > 1 && (
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-retro-400 mb-4">Previous Releases</h2>
          <div className="space-y-3">
            {releases.slice(1, 6).map(release => (
              <div
                key={release.id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{release.name || release.tag_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(release.published_at).toLocaleDateString()}
                      {release.prerelease && (
                        <span className="ml-2 px-2 py-1 bg-yellow-600/30 text-yellow-400 rounded text-xs">
                          Pre-release
                        </span>
                      )}
                    </p>
                  </div>
                  <a
                    href={`https://github.com/AndrewDonelson/retroforge-engine/releases/tag/${release.tag_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white text-sm font-medium transition-all"
                  >
                    View Release
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Installation Instructions */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-retro-400 mb-4">Installation Instructions</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-retro-400 mb-2">Linux / macOS</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300">
              <p># Download the binary</p>
              <p>chmod +x retroforge-[version]-[platform]</p>
              <p>./retroforge-[version]-[platform] path/to/game.rf</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-retro-400 mb-2">Windows</h3>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300">
              <p># Download the .exe file</p>
              <p># Double-click to run, or use from command line:</p>
              <p>retroforge-[version].exe path\to\game.rf</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-retro-400 mb-2">WebAssembly</h3>
            <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300">
              <p>The WASM binary is used by the RetroForge web application. It's automatically loaded when you play games in your browser.</p>
            </div>
          </div>
        </div>
      </div>

      {/* What is RetroForge Engine */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-retro-400 mb-4">About RetroForge Engine</h2>
        <div className="prose prose-invert max-w-none text-gray-300">
          <p>
            RetroForge Engine is the runtime that executes RetroForge cart files (.rf). 
            It provides cross-platform support for running games built with the RetroForge fantasy console.
          </p>
          <p>
            The engine handles:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Lua script execution</li>
            <li>Graphics rendering (480x270 resolution)</li>
            <li>Audio synthesis and playback</li>
            <li>Input handling (11-button universal system)</li>
            <li>File system operations</li>
            <li>Game State Machine (GSM) with state lifecycle callbacks</li>
            <li>Multiplayer networking (WebRTC-based, supports up to 6 players)</li>
            <li>Physics engine (Box2D integration for realistic physics)</li>
            <li>Node system (Godot-style scene graph architecture)</li>
            <li>Event bus system for decoupled communication</li>
            <li>Scheduler and runner for frame-based game loops</li>
            <li>Sprite management and sprite pools</li>
            <li>Palette management (64-color palette system)</li>
            <li>Module system (Lua file imports and hot-reloading in dev mode)</li>
            <li>Cart loading and asset management (.rf file format)</li>
            <li>Soft rendering engine (CPU-based pixel rendering)</li>
            <li>Tilemap support for level design</li>
            <li>Audio synthesis (3-tier audio system with chip-tune synthesis)</li>
            <li>Cross-platform deployment (Windows, macOS, Linux, Web/WASM)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

