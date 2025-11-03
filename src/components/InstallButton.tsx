'use client';

import { useState, useEffect } from 'react';

interface GitHubRelease {
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

// Detect platform and return best binary info
function detectPlatform(): { os: string; arch: string; description: string } {
  if (typeof window === 'undefined') {
    return { os: 'linux', arch: 'amd64', description: 'Linux (x64)' };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  let os = 'linux';
  let arch = 'amd64';
  let description = 'Linux (x64)';
  
  if (userAgent.includes('win') || platform.includes('win')) {
    os = 'windows';
    // Try to detect ARM Windows
    if (userAgent.includes('arm') || platform.includes('arm')) {
      arch = 'arm64';
      description = 'Windows (ARM64)';
    } else {
      arch = 'amd64';
      description = 'Windows (x64)';
    }
  } else if (userAgent.includes('mac') || platform.includes('mac')) {
    os = 'darwin';
    // Modern Macs are likely Apple Silicon, but check for Intel
    if (navigator.platform.includes('Intel')) {
      arch = 'amd64';
      description = 'macOS (Intel)';
    } else {
      arch = 'arm64';
      description = 'macOS (Apple Silicon)';
    }
  } else {
    os = 'linux';
    if (userAgent.includes('arm') || platform.includes('arm')) {
      arch = 'arm64';
      description = 'Linux (ARM64)';
    } else {
      arch = 'amd64';
      description = 'Linux (x64)';
    }
  }
  
  return { os, arch, description };
}

export default function InstallButton() {
  const [loading, setLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const [platformInfo, setPlatformInfo] = useState<{ os: string; arch: string; description: string } | null>(null);

  useEffect(() => {
    const platform = detectPlatform();
    setPlatformInfo(platform);

    // Fetch latest release
    fetch('https://api.github.com/repos/AndrewDonelson/retroforge-engine/releases/latest')
      .then(res => res.json())
      .then((release: GitHubRelease) => {
        if (release.tag_name) {
          setVersion(release.tag_name);
          
          // Find matching asset
          const asset = release.assets.find(a => {
            if (platform.os === 'windows') {
              if (platform.arch === 'arm64') {
                return a.name.includes('windows-arm64.exe');
              } else {
                return a.name.endsWith('.exe') && !a.name.includes('arm64');
              }
            } else if (platform.os === 'darwin') {
              if (platform.arch === 'arm64') {
                return a.name.includes('macos-arm64') && !a.name.endsWith('.wasm');
              } else {
                return a.name.includes('macos-amd64') && !a.name.endsWith('.wasm');
              }
            } else {
              // Linux
              if (platform.arch === 'arm64') {
                return a.name.includes('linux-arm64') && !a.name.endsWith('.wasm') && !a.name.endsWith('.exe');
              } else {
                return !a.name.includes('linux-arm64') && !a.name.includes('windows') && !a.name.includes('macos') && !a.name.endsWith('.wasm') && !a.name.endsWith('.exe');
              }
            }
          });

          if (asset) {
            setDownloadUrl(asset.browser_download_url);
            setFilename(asset.name);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleDownload = () => {
    if (downloadUrl && filename) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="px-6 py-3 bg-gray-700 rounded-lg text-white font-medium opacity-50 cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  if (!downloadUrl) {
    return (
      <a
        href="/downloads"
        className="px-6 py-3 bg-retro-600 hover:bg-retro-500 rounded-lg text-white font-medium transition-all shadow-md inline-flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        View Downloads
      </a>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium transition-all shadow-md inline-flex items-center gap-2"
      title={`Download for ${platformInfo?.description || 'your platform'}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Install ({platformInfo?.description})
    </button>
  );
}

