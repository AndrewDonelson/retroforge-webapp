#!/bin/bash

# RetroForge WebApp - Setup Plan Script
# This script initializes the development plan for the RetroForge WebApp

set -e

echo "🌐 Setting up RetroForge WebApp development plan..."

# Check if we're in the right directory
if [ ! -f "memory/constitution.md" ]; then
    echo "❌ Error: Please run this script from the retroforge-webapp root directory"
    exit 1
fi

# Create initial plan if it doesn't exist
if [ ! -f "specs/001-core-webapp/plan.md" ]; then
    echo "📋 Creating initial development plan..."
    cat > "specs/001-core-webapp/plan.md" << 'EOF'
# RetroForge WebApp - Development Plan

**Plan ID:** 001-core-webapp  
**Version:** 1.0  
**Date:** October 30, 2025  
**Status:** Ready for Implementation

---

## 🎯 Implementation Overview

This plan outlines the implementation of the core RetroForge WebApp, including the Next.js application, editor interfaces, WASM integration, and local storage system.

## 📋 Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Establish Next.js project structure and basic functionality

**Tasks**:
- [ ] Initialize Next.js 16 project with TypeScript
- [ ] Set up TailwindCSS for styling
- [ ] Create basic routing structure
- [ ] Set up component library
- [ ] Implement responsive design

**Deliverables**:
- Working Next.js application
- Basic routing and navigation
- Responsive design system
- Component library foundation

### Phase 2: Core Pages (Weeks 3-4)
**Goal**: Implement main application pages

**Tasks**:
- [ ] Create landing page
- [ ] Implement cart browser
- [ ] Build arcade game player
- [ ] Create project manager
- [ ] Add search and filtering

**Deliverables**:
- Complete page structure
- Cart browser functionality
- Game player interface
- Project management

### Phase 3: Code Editor (Weeks 5-6)
**Goal**: Implement code editing capabilities

**Tasks**:
- [ ] Integrate react-ace editor
- [ ] Add Lua syntax highlighting
- [ ] Implement RetroForge API autocomplete
- [ ] Add error detection and linting
- [ ] Create code formatting

**Deliverables**:
- Full-featured code editor
- Lua syntax support
- API autocomplete
- Error detection

### Phase 4: Sprite Editor (Weeks 7-8)
**Goal**: Implement visual sprite editing

**Tasks**:
- [ ] Create canvas-based drawing tools
- [ ] Implement multi-size sprite support
- [ ] Add color palette integration
- [ ] Create animation timeline
- [ ] Add import/export functionality

**Deliverables**:
- Complete sprite editor
- Drawing tools
- Animation support
- Import/export

### Phase 5: Map Editor (Weeks 9-10)
**Goal**: Implement tilemap editing

**Tasks**:
- [ ] Create tilemap rendering system
- [ ] Implement 8-layer management
- [ ] Add visual tile placement
- [ ] Create camera controls
- [ ] Add parallax preview

**Deliverables**:
- Complete map editor
- Multi-layer support
- Visual editing tools
- Parallax preview

### Phase 6: Audio Editor (Weeks 11-12)
**Goal**: Implement audio composition

**Tasks**:
- [ ] Create piano-roll interface
- [ ] Implement waveform synthesis
- [ ] Add ADSR envelope controls
- [ ] Create real-time preview
- [ ] Add pattern sequencing

**Deliverables**:
- Complete audio editor
- Piano-roll interface
- Audio synthesis
- Real-time preview

### Phase 7: WASM Integration (Weeks 13-14)
**Goal**: Integrate RetroForge Engine

**Tasks**:
- [ ] Load RetroForge Engine WASM
- [ ] Implement cart format support
- [ ] Create real-time preview
- [ ] Add performance optimization
- [ ] Test cross-browser compatibility

**Deliverables**:
- WASM integration
- Real-time preview
- Cross-browser support
- Performance optimization

### Phase 8: Polish & Launch (Weeks 15-16)
**Goal**: Final polish and production deployment

**Tasks**:
- [ ] Implement accessibility compliance
- [ ] Optimize performance
- [ ] Complete documentation
- [ ] Create example projects
- [ ] Deploy to production

**Deliverables**:
- Production-ready application
- Complete documentation
- Example projects
- Live deployment

## 🎯 Success Criteria

### Technical Goals
- ✅ <3 seconds page load time
- ✅ 100% offline functionality
- ✅ A+ accessibility score
- ✅ Zero data breaches
- ✅ 95% user satisfaction

### User Experience Goals
- ✅ <30 seconds to first running cart
- ✅ Intuitive editor interfaces
- ✅ Smooth performance on all devices
- ✅ Clear error messages and help
- ✅ Fast editor switching

### Business Goals
- ✅ Ad revenue from cart browser
- ✅ High engagement with editors
- ✅ Community cart sharing
- ✅ Educational adoption
- ✅ Positive user feedback

## 🚀 Next Steps

1. **Review this plan** with the development team
2. **Set up development environment** with all dependencies
3. **Begin Phase 1** implementation
4. **Regular checkpoints** to ensure progress
5. **Continuous testing** throughout development

---

**This plan provides the roadmap for implementing the RetroForge WebApp. All development should follow this plan and the project constitution.**

---

*"Forge Your Retro Dreams in the Browser" - RetroForge WebApp Plan* 🌐✨
EOF
    echo "✅ Initial development plan created"
else
    echo "ℹ️  Development plan already exists"
fi

# Create tasks breakdown if it doesn't exist
if [ ! -f "specs/001-core-webapp/tasks.md" ]; then
    echo "📋 Creating task breakdown..."
    cat > "specs/001-core-webapp/tasks.md" << 'EOF'
# RetroForge WebApp - Task Breakdown

**Task ID:** 001-core-webapp  
**Version:** 1.0  
**Date:** October 30, 2025  
**Status:** Ready for Implementation

---

## 📋 Task Overview

This document breaks down the core webapp implementation into specific, actionable tasks that can be executed in the correct order.

## 🎯 User Story 1: Project Foundation

### Task 1.1: Next.js Setup
**Priority**: High  
**Estimated Time**: 4 hours  
**Dependencies**: None

**Description**: Initialize Next.js 16 project with TypeScript

**Tasks**:
- [ ] Create Next.js 16 project
- [ ] Configure TypeScript
- [ ] Set up ESLint and Prettier
- [ ] Configure TailwindCSS
- [ ] Set up project structure

**Files to Create**:
- `package.json`
- `next.config.js`
- `tsconfig.json`
- `tailwind.config.js`
- `src/app/layout.tsx`

**Acceptance Criteria**:
- [ ] Project builds successfully
- [ ] TypeScript compilation works
- [ ] TailwindCSS styling works
- [ ] Basic project structure in place

### Task 1.2: Component Library
**Priority**: High  
**Estimated Time**: 6 hours  
**Dependencies**: Task 1.1

**Description**: Set up base component library

**Tasks**:
- [ ] Create base UI components
- [ ] Set up design system
- [ ] Create layout components
- [ ] Add responsive utilities
- [ ] Create theme system

**Files to Create**:
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/modal.tsx`
- `src/components/layout/header.tsx`
- `src/components/layout/sidebar.tsx`

**Acceptance Criteria**:
- [ ] Component library works
- [ ] Design system consistent
- [ ] Responsive design works
- [ ] Theme system works

### Task 1.3: Routing Structure
**Priority**: High  
**Estimated Time**: 4 hours  
**Dependencies**: Task 1.2

**Description**: Set up application routing

**Tasks**:
- [ ] Create main page routes
- [ ] Set up dynamic routes
- [ ] Add navigation components
- [ ] Implement route guards
- [ ] Add error pages

**Files to Create**:
- `src/app/page.tsx`
- `src/app/browser/page.tsx`
- `src/app/arcade/[id]/page.tsx`
- `src/app/editor/code/page.tsx`
- `src/app/editor/sprite/page.tsx`

**Acceptance Criteria**:
- [ ] All routes work
- [ ] Navigation works
- [ ] Dynamic routes work
- [ ] Error handling works

## 🎯 User Story 2: Core Pages

### Task 2.1: Landing Page
**Priority**: High  
**Estimated Time**: 8 hours  
**Dependencies**: Task 1.3

**Description**: Create project landing page

**Tasks**:
- [ ] Design landing page layout
- [ ] Add hero section
- [ ] Create feature showcase
- [ ] Add community stats
- [ ] Implement call-to-action

**Files to Create**:
- `src/app/page.tsx`
- `src/components/landing/hero.tsx`
- `src/components/landing/features.tsx`
- `src/components/landing/stats.tsx`

**Acceptance Criteria**:
- [ ] Landing page looks good
- [ ] All sections work
- [ ] Responsive design works
- [ ] Call-to-action works

### Task 2.2: Cart Browser
**Priority**: High  
**Estimated Time**: 12 hours  
**Dependencies**: Task 2.1

**Description**: Implement cart browsing and discovery

**Tasks**:
- [ ] Create cart grid/list view
- [ ] Implement search functionality
- [ ] Add filtering and sorting
- [ ] Create cart cards
- [ ] Add pagination

**Files to Create**:
- `src/app/browser/page.tsx`
- `src/components/browser/cart-grid.tsx`
- `src/components/browser/cart-card.tsx`
- `src/components/browser/search.tsx`
- `src/components/browser/filters.tsx`

**Acceptance Criteria**:
- [ ] Cart browsing works
- [ ] Search works
- [ ] Filtering works
- [ ] Pagination works

### Task 2.3: Arcade Player
**Priority**: High  
**Estimated Time**: 10 hours  
**Dependencies**: Task 2.2

**Description**: Create game player interface

**Tasks**:
- [ ] Create game canvas
- [ ] Implement control system
- [ ] Add fullscreen mode
- [ ] Create game UI overlay
- [ ] Add save state management

**Files to Create**:
- `src/app/arcade/[id]/page.tsx`
- `src/components/arcade/game-canvas.tsx`
- `src/components/arcade/controls.tsx`
- `src/components/arcade/game-ui.tsx`

**Acceptance Criteria**:
- [ ] Game player works
- [ ] Controls work
- [ ] Fullscreen works
- [ ] UI overlay works

## 🎯 User Story 3: Code Editor

### Task 3.1: Editor Setup
**Priority**: High  
**Estimated Time**: 6 hours  
**Dependencies**: Task 2.3

**Description**: Set up code editor infrastructure

**Tasks**:
- [ ] Integrate react-ace
- [ ] Configure editor themes
- [ ] Set up editor options
- [ ] Add editor toolbar
- [ ] Implement file management

**Files to Create**:
- `src/app/editor/code/page.tsx`
- `src/components/editor/code-editor.tsx`
- `src/components/editor/editor-toolbar.tsx`
- `src/lib/editor/ace-config.ts`

**Acceptance Criteria**:
- [ ] Editor loads
- [ ] Themes work
- [ ] Toolbar works
- [ ] File management works

### Task 3.2: Lua Integration
**Priority**: High  
**Estimated Time**: 8 hours  
**Dependencies**: Task 3.1

**Description**: Add Lua-specific features

**Tasks**:
- [ ] Add Lua syntax highlighting
- [ ] Implement RetroForge API autocomplete
- [ ] Add error detection
- [ ] Create code formatting
- [ ] Add snippets

**Files to Create**:
- `src/lib/editor/lua-syntax.ts`
- `src/lib/editor/autocomplete.ts`
- `src/lib/editor/error-detection.ts`
- `src/lib/editor/snippets.ts`

**Acceptance Criteria**:
- [ ] Syntax highlighting works
- [ ] Autocomplete works
- [ ] Error detection works
- [ ] Formatting works

## 🎯 User Story 4: Sprite Editor

### Task 4.1: Canvas Setup
**Priority**: High  
**Estimated Time**: 8 hours  
**Dependencies**: Task 3.2

**Description**: Set up canvas-based drawing

**Tasks**:
- [ ] Create canvas component
- [ ] Implement drawing tools
- [ ] Add color palette
- [ ] Create tool selection
- [ ] Add zoom and pan

**Files to Create**:
- `src/app/editor/sprite/page.tsx`
- `src/components/editor/sprite-canvas.tsx`
- `src/components/editor/drawing-tools.tsx`
- `src/components/editor/color-palette.tsx`

**Acceptance Criteria**:
- [ ] Canvas works
- [ ] Drawing tools work
- [ ] Color palette works
- [ ] Zoom/pan works

### Task 4.2: Animation System
**Priority**: Medium  
**Estimated Time**: 10 hours  
**Dependencies**: Task 4.1

**Description**: Add animation capabilities

**Tasks**:
- [ ] Create animation timeline
- [ ] Implement frame management
- [ ] Add onion skinning
- [ ] Create animation preview
- [ ] Add export functionality

**Files to Create**:
- `src/components/editor/animation-timeline.tsx`
- `src/components/editor/frame-manager.tsx`
- `src/lib/editor/animation.ts`

**Acceptance Criteria**:
- [ ] Timeline works
- [ ] Frame management works
- [ ] Onion skinning works
- [ ] Preview works

## 🎯 User Story 5: Map Editor

### Task 5.1: Tilemap System
**Priority**: High  
**Estimated Time**: 12 hours  
**Dependencies**: Task 4.2

**Description**: Implement tilemap editing

**Tasks**:
- [ ] Create tilemap canvas
- [ ] Implement tile placement
- [ ] Add layer management
- [ ] Create tile selection
- [ ] Add camera controls

**Files to Create**:
- `src/app/editor/map/page.tsx`
- `src/components/editor/tilemap-canvas.tsx`
- `src/components/editor/layer-manager.tsx`
- `src/components/editor/tile-selector.tsx`

**Acceptance Criteria**:
- [ ] Tilemap works
- [ ] Tile placement works
- [ ] Layers work
- [ ] Camera works

### Task 5.2: Advanced Features
**Priority**: Medium  
**Estimated Time**: 8 hours  
**Dependencies**: Task 5.1

**Description**: Add advanced map features

**Tasks**:
- [ ] Implement parallax preview
- [ ] Add tile flags system
- [ ] Create copy/paste regions
- [ ] Add undo/redo
- [ ] Create export functionality

**Files to Create**:
- `src/components/editor/parallax-preview.tsx`
- `src/lib/editor/tile-flags.ts`
- `src/lib/editor/undo-redo.ts`

**Acceptance Criteria**:
- [ ] Parallax works
- [ ] Tile flags work
- [ ] Copy/paste works
- [ ] Undo/redo works

## 🎯 User Story 6: Audio Editor

### Task 6.1: Piano Roll Interface
**Priority**: High  
**Estimated Time**: 12 hours  
**Dependencies**: Task 5.2

**Description**: Create piano roll editor

**Tasks**:
- [ ] Create piano roll canvas
- [ ] Implement note placement
- [ ] Add note editing
- [ ] Create timeline
- [ ] Add playback controls

**Files to Create**:
- `src/app/editor/audio/page.tsx`
- `src/components/editor/piano-roll.tsx`
- `src/components/editor/note-editor.tsx`
- `src/components/editor/timeline.tsx`

**Acceptance Criteria**:
- [ ] Piano roll works
- [ ] Note placement works
- [ ] Note editing works
- [ ] Playback works

### Task 6.2: Audio Synthesis
**Priority**: High  
**Estimated Time**: 10 hours  
**Dependencies**: Task 6.1

**Description**: Implement audio synthesis

**Tasks**:
- [ ] Create waveform generators
- [ ] Implement ADSR envelope
- [ ] Add audio effects
- [ ] Create real-time preview
- [ ] Add export functionality

**Files to Create**:
- `src/lib/audio/synthesis.ts`
- `src/lib/audio/waveforms.ts`
- `src/lib/audio/envelope.ts`
- `src/components/editor/audio-preview.tsx`

**Acceptance Criteria**:
- [ ] Synthesis works
- [ ] Envelope works
- [ ] Effects work
- [ ] Preview works

## 🎯 User Story 7: WASM Integration

### Task 7.1: Engine Integration
**Priority**: High  
**Estimated Time**: 12 hours  
**Dependencies**: Task 6.2

**Description**: Integrate RetroForge Engine WASM

**Tasks**:
- [ ] Load WASM module
- [ ] Implement cart loading
- [ ] Create real-time preview
- [ ] Add performance monitoring
- [ ] Handle WASM errors

**Files to Create**:
- `src/lib/wasm/engine.ts`
- `src/lib/wasm/cart-loader.ts`
- `src/components/editor/preview.tsx`
- `src/lib/wasm/performance.ts`

**Acceptance Criteria**:
- [ ] WASM loads
- [ ] Carts load
- [ ] Preview works
- [ ] Performance is good

### Task 7.2: Cross-Browser Support
**Priority**: High  
**Estimated Time**: 8 hours  
**Dependencies**: Task 7.1

**Description**: Ensure cross-browser compatibility

**Tasks**:
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Fix compatibility issues

**Files to Create**:
- `tests/browser/chrome.test.ts`
- `tests/browser/firefox.test.ts`
- `tests/browser/safari.test.ts`

**Acceptance Criteria**:
- [ ] All browsers work
- [ ] No compatibility issues
- [ ] Performance consistent

## 🎯 User Story 8: Local Storage

### Task 8.1: Storage System
**Priority**: High  
**Estimated Time**: 8 hours  
**Dependencies**: Task 7.2

**Description**: Implement local storage system

**Tasks**:
- [ ] Create storage abstraction
- [ ] Implement project storage
- [ ] Add cart storage
- [ ] Create backup system
- [ ] Add import/export

**Files to Create**:
- `src/lib/storage/storage.ts`
- `src/lib/storage/project-storage.ts`
- `src/lib/storage/cart-storage.ts`
- `src/lib/storage/backup.ts`

**Acceptance Criteria**:
- [ ] Storage works
- [ ] Projects save/load
- [ ] Backup works
- [ ] Import/export works

### Task 8.2: Offline Support
**Priority**: High  
**Estimated Time**: 6 hours  
**Dependencies**: Task 8.1

**Description**: Add offline functionality

**Tasks**:
- [ ] Implement service worker
- [ ] Add offline detection
- [ ] Create offline UI
- [ ] Add sync when online
- [ ] Test offline scenarios

**Files to Create**:
- `public/sw.js`
- `src/lib/offline/service-worker.ts`
- `src/components/offline/offline-ui.tsx`

**Acceptance Criteria**:
- [ ] Offline works
- [ ] Service worker works
- [ ] Sync works
- [ ] UI handles offline

## 🎯 User Story 9: Testing and Polish

### Task 9.1: Unit Tests
**Priority**: High  
**Estimated Time**: 16 hours  
**Dependencies**: Task 8.2

**Description**: Create comprehensive test suite

**Tasks**:
- [ ] Test all components
- [ ] Test all hooks
- [ ] Test all utilities
- [ ] Test storage system
- [ ] Test WASM integration

**Files to Create**:
- `src/components/__tests__/`
- `src/hooks/__tests__/`
- `src/lib/__tests__/`
- `jest.config.js`

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Test coverage >90%
- [ ] Performance tests included

### Task 9.2: Accessibility
**Priority**: High  
**Estimated Time**: 12 hours  
**Dependencies**: Task 9.1

**Description**: Ensure accessibility compliance

**Tasks**:
- [ ] Add ARIA labels
- [ ] Implement keyboard navigation
- [ ] Add screen reader support
- [ ] Test with accessibility tools
- [ ] Fix accessibility issues

**Files to Create**:
- `src/lib/accessibility/aria.ts`
- `src/lib/accessibility/keyboard.ts`
- `tests/accessibility/a11y.test.ts`

**Acceptance Criteria**:
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation works
- [ ] Screen reader support
- [ ] Accessibility score A+

### Task 9.3: Performance Optimization
**Priority**: High  
**Estimated Time**: 10 hours  
**Dependencies**: Task 9.2

**Description**: Optimize application performance

**Tasks**:
- [ ] Optimize bundle size
- [ ] Implement code splitting
- [ ] Add lazy loading
- [ ] Optimize images
- [ ] Add performance monitoring

**Files to Create**:
- `src/lib/performance/bundle-analyzer.ts`
- `src/lib/performance/lazy-loading.ts`
- `src/lib/performance/monitoring.ts`

**Acceptance Criteria**:
- [ ] Bundle size <2MB
- [ ] Load time <3 seconds
- [ ] 60 FPS in editors
- [ ] Performance score >90

## 🚀 Implementation Order

### Week 1-2: Foundation
1. Task 1.1: Next.js Setup
2. Task 1.2: Component Library
3. Task 1.3: Routing Structure

### Week 3-4: Core Pages
4. Task 2.1: Landing Page
5. Task 2.2: Cart Browser
6. Task 2.3: Arcade Player

### Week 5-6: Code Editor
7. Task 3.1: Editor Setup
8. Task 3.2: Lua Integration

### Week 7-8: Sprite Editor
9. Task 4.1: Canvas Setup
10. Task 4.2: Animation System

### Week 9-10: Map Editor
11. Task 5.1: Tilemap System
12. Task 5.2: Advanced Features

### Week 11-12: Audio Editor
13. Task 6.1: Piano Roll Interface
14. Task 6.2: Audio Synthesis

### Week 13-14: WASM Integration
15. Task 7.1: Engine Integration
16. Task 7.2: Cross-Browser Support

### Week 15-16: Storage and Polish
17. Task 8.1: Storage System
18. Task 8.2: Offline Support
19. Task 9.1: Unit Tests
20. Task 9.2: Accessibility
21. Task 9.3: Performance Optimization

## 📊 Progress Tracking

### Checkpoints
- **Week 2**: Basic app running
- **Week 4**: Core pages working
- **Week 6**: Code editor working
- **Week 8**: Sprite editor working
- **Week 10**: Map editor working
- **Week 12**: Audio editor working
- **Week 14**: WASM integration working
- **Week 16**: Production ready

### Success Metrics
- [ ] All tasks completed on time
- [ ] All tests passing
- [ ] Performance targets met
- [ ] Accessibility compliant
- [ ] Production deployed

---

**This task breakdown provides the detailed roadmap for implementing the RetroForge WebApp. Each task should be completed in order, with regular checkpoints to ensure progress.**

---

*"Forge Your Retro Dreams in the Browser" - RetroForge WebApp Tasks* 🌐✨
EOF
    echo "✅ Task breakdown created"
else
    echo "ℹ️  Task breakdown already exists"
fi

echo ""
echo "🎉 RetroForge WebApp development plan setup complete!"
echo ""
echo "📁 Files created:"
echo "  - specs/001-core-webapp/plan.md"
echo "  - specs/001-core-webapp/tasks.md"
echo ""
echo "🚀 Next steps:"
echo "  1. Review the development plan"
echo "  2. Set up your development environment"
echo "  3. Begin implementing Task 1.1: Next.js Setup"
echo "  4. Follow the task breakdown for implementation order"
echo ""
echo "📚 Documentation:"
echo "  - Constitution: memory/constitution.md"
echo "  - Specification: specs/001-core-webapp/spec.md"
echo "  - Plan: specs/001-core-webapp/plan.md"
echo "  - Tasks: specs/001-core-webapp/tasks.md"
echo ""
echo "Happy coding! 🌐✨"
