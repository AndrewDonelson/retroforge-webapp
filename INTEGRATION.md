# RetroForge WebApp - Integration Guide

## 🎯 **Your Next.js Template Integration**

Since you already have a running Next.js 16 template, here's how to integrate it with the spec-kit structure:

### **Option 1: Replace the src/ directory (Recommended)**

```bash
# Navigate to your webapp directory
cd /home/andrew/Development/Golang/RetroForge/retroforge-webapp

# Backup the current src/ directory
mv src src_spec_kit_backup

# Copy your Next.js template files to the src/ directory
cp -r /path/to/your/nextjs-template/* src/

# Or if your template is in a different location, adjust the path accordingly
```

### **Option 2: Merge with existing structure**

If you want to keep the spec-kit structure and merge your template:

```bash
# Copy your template files into the appropriate spec-kit structure
cp -r /path/to/your/nextjs-template/app src/
cp -r /path/to/your/nextjs-template/components src/
cp -r /path/to/your/nextjs-template/lib src/
# ... etc for other directories
```

## 📁 **Recommended File Structure**

Based on the spec-kit structure, here's where your Next.js files should go:

```
retroforge-webapp/
├── src/
│   ├── app/                    # Your Next.js 16 app directory
│   │   ├── page.tsx           # Landing page ✅ (created)
│   │   ├── layout.tsx         # Root layout ✅ (created)
│   │   ├── globals.css        # Global styles ✅ (created)
│   │   ├── browser/           # Cart browser ✅ (created)
│   │   ├── arcade/            # Game player
│   │   ├── editor/            # All editors ✅ (created)
│   │   └── projects/          # Project manager
│   ├── components/            # Your React components
│   │   ├── ui/               # Base UI components
│   │   ├── editor/           # Editor components
│   │   ├── arcade/           # Game player components
│   │   └── common/           # Shared components
│   ├── lib/                  # Your utility libraries
│   │   ├── wasm/            # WASM integration
│   │   ├── storage/         # Local storage
│   │   ├── cart/            # Cart format handling
│   │   └── utils/           # Utility functions
│   ├── hooks/               # Your React hooks
│   ├── types/               # Your TypeScript types
│   └── styles/              # Your global styles
├── public/                   # Your public assets
│   ├── wasm/                # Engine WASM files
│   ├── examples/            # Example carts
│   └── assets/              # Static assets
├── memory/                  # Spec-kit constitution ✅
├── specs/                   # Spec-kit specifications ✅
├── templates/               # Spec-kit templates ✅
├── scripts/                 # Spec-kit scripts ✅
├── package.json             # Next.js dependencies ✅ (created)
├── next.config.js           # Next.js config ✅ (created)
├── tsconfig.json            # TypeScript config ✅ (created)
└── tailwind.config.js       # Tailwind config ✅ (created)
```

## 🚀 **Quick Start**

1. **Copy your template files** to the `src/` directory
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start development server**:
   ```bash
   npm run dev
   ```
4. **Open in browser**: http://localhost:3000

## 🔧 **Configuration Files Created**

The following configuration files have been created for you:

- **`package.json`** - Next.js 16 with all required dependencies
- **`next.config.js`** - Configured for WASM support and static export
- **`tsconfig.json`** - TypeScript configuration with path aliases
- **`tailwind.config.js`** - TailwindCSS with RetroForge theme
- **`src/app/layout.tsx`** - Root layout with metadata
- **`src/app/page.tsx`** - Landing page
- **`src/app/globals.css`** - Global styles with retro theme

## 📚 **Spec-Kit Integration**

The spec-kit structure is preserved alongside your Next.js app:

- **`memory/constitution.md`** - Project principles and values
- **`specs/001-core-webapp/`** - Complete specification and implementation plan
- **`templates/`** - Reusable spec templates
- **`scripts/setup-plan.sh`** - Development plan initialization

## 🎨 **RetroForge Theme**

The TailwindCSS configuration includes a custom RetroForge theme:

- **Retro colors** - Blue-based color palette
- **Pixel fonts** - Press Start 2P for headings
- **Monospace fonts** - JetBrains Mono for code
- **Custom components** - `.btn-retro`, `.input-retro`, `.card-retro`
- **Animations** - Pixel bounce and glow effects

## 🔗 **GitHub Integration**

Based on your GitHub profile (@AndrewDonelson):

- **Engine Repository**: `retroforge-engine` (Public, Open Source)
- **WebApp Repository**: `retroforge-webapp` (Private)
- **Author**: Andrew Donelson
- **License**: MIT

## 📋 **Next Steps**

1. **Copy your template files** to the `src/` directory
2. **Review the specification** in `specs/001-core-webapp/spec.md`
3. **Follow the implementation plan** in `specs/001-core-webapp/plan.md`
4. **Execute tasks** from `specs/001-core-webapp/tasks.md`
5. **Start development** with Task 1.1: Next.js Setup

## 🆘 **Need Help?**

- **Spec-kit Documentation**: [GitHub Spec-Kit](https://github.com/github/spec-kit)
- **Next.js 16 Documentation**: [Next.js Docs](https://nextjs.org/docs)
- **TailwindCSS Documentation**: [TailwindCSS Docs](https://tailwindcss.com/docs)

---

*"Forge Your Retro Dreams in the Browser" - RetroForge WebApp Integration* 🌐✨
