# RetroForge WebApp

**RetroForge Fantasy Console - Next.js Web Application**

A modern web application for the RetroForge fantasy console, providing a complete development environment in the browser.

## 🎯 Project Overview

RetroForge WebApp is the web-based development environment that provides:

- **Landing page**: Project showcase and information
- **Cart browser**: Discover and play community carts
- **Arcade**: Play distributed carts in the browser
- **Code editor**: Full-featured Lua editor with syntax highlighting
- **Sprite editor**: Visual sprite creation and animation tools
- **Map editor**: 8-layer tilemap editor with parallax support
- **Audio editor**: Piano-roll interface for chip-tune creation
- **Local storage**: All projects saved locally, no authentication required

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              Next.js Web Application            │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │   Code   │ │  Sprite  │ │  Map Editor    │  │
│  │  Editor  │ │  Editor  │ │                │  │
│  └──────────┘ └──────────┘ └────────────────┘  │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Sound   │ │  Music   │ │ Cart Manager   │  │
│  │  Editor  │ │  Tracker │ │                │  │
│  └──────────┘ └──────────┘ └────────────────┘  │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │         Live Preview / Testing          │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                       │
                       │ WASM Bridge
                       ▼
┌─────────────────────────────────────────────────┐
│            RetroForge Engine (WASM)             │
└─────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/retroforge/retroforge-webapp.git
cd retroforge-webapp
npm install
npm run dev
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🎨 Features

### Code Editor
- **Syntax highlighting** for Lua
- **Autocomplete** for RetroForge API
- **Error detection** and linting
- **Code formatting** and organization

### Sprite Editor
- **Multi-size support**: 4×4, 8×8, 16×16, 32×32 pixels
- **Animation timeline** with onion skinning
- **Palette integration** with 50-color system
- **Import/export** from external tools

### Map Editor
- **8-layer system** with parallax scrolling
- **Tile flags** for collision and properties
- **Visual editing** with drag-and-drop
- **Real-time preview** with camera controls

### Audio Editor
- **Piano-roll interface** for intuitive composition
- **5 waveforms**: Square, Triangle, Sawtooth, Sine, Noise
- **ADSR envelope** controls
- **Real-time preview** with Web Audio API

### Universal Input System
- **11-button system**: SELECT, START, UP, DOWN, LEFT, RIGHT, A, B, X, Y, TURBO
- **Mobile support**: Automatic on-screen virtual controller in portrait mode
- **Cross-platform**: Works on desktop (keyboard), mobile (touch), and tablet
- **Controller component**: Touch-optimized virtual controller for mobile devices

### State Management
- **State Machine API** - Flexible state management with lifecycle callbacks
- **Module-Based States** - Convention-based state modules via `rf.import()`
- **State Stacking** - Push/pop states for overlays (pause menus, etc.)
- **Shared Context** - Pass data between states

### Cart Management
- **Local storage** - no cloud required
- **Import/export** .rfs and .rfe files
- **Version control** integration
- **Project templates** and examples

## 🎮 Browser Arcade

Play RetroForge carts directly in the browser:

- **No downloads** required
- **WASM engine** for native performance
- **Full compatibility** with desktop engine
- **Mobile support** with touch controls
- **WASM Interface Module** (`src/lib/wasmInterface.ts`) - Centralized interface for WASM engine interaction, input handling, and frame rendering

## 📱 Responsive Design

- **Desktop**: Full-featured development environment
- **Tablet**: Touch-optimized editors
- **Mobile**: Simplified interface for playing carts

## 🛠️ Development

This project uses [Spec-Driven Development](https://github.com/github/spec-kit) with the following structure:

```
├── specs/                    # Feature specifications
├── memory/                   # Project constitution
├── scripts/                  # Development scripts
├── templates/                # Code templates
└── src/                      # Source code
```

### Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Code Editor**: react-ace
- **Canvas**: HTML5 Canvas API
- **Audio**: Web Audio API
- **Engine**: RetroForge Engine (WASM)

### Available Commands

- `./scripts/setup-plan.sh` - Initialize development plan
- `./scripts/create-new-feature.sh` - Create new feature spec
- `./scripts/check-prerequisites.sh` - Verify development environment

## 📚 Documentation

- [Design Document](../design/RETROFORGE_DESIGN.md) - Complete technical specification
- [Web App Architecture](../design/RETROFORGE_WEBAPP_ARCHITECTURE.md) - Web app details
- [Editor Specifications](../design/RETROFORGE_EDITORS.md) - Editor feature specs

## 💰 Monetization

- **Ad revenue**: Non-intrusive ads in cart browser
- **No paywall**: All features free to use
- **No authentication**: Privacy-focused local storage
- **Community driven**: Open source with optional donations

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

*"Forge Your Retro Dreams in the Browser" - RetroForge WebApp* 🌐✨
