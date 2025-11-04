# Universal Input System

## Overview

RetroForge uses a **universal 11-button input system** designed for cross-platform compatibility. This system works consistently across desktop (keyboard), mobile (touch controller), and tablet devices.

## 11 Universal Buttons

| Index | Name    | Purpose                          | Default Keys            |
|-------|---------|----------------------------------|-------------------------|
| 0     | SELECT  | Menu navigation, secondary action | `Enter`                 |
| 1     | START   | Pause/menu, primary action        | `Space`                 |
| 2     | UP      | Directional input                 | `ArrowUp`               |
| 3     | DOWN    | Directional input                 | `ArrowDown`             |
| 4     | LEFT    | Directional input                 | `ArrowLeft`             |
| 5     | RIGHT   | Directional input                 | `ArrowRight`            |
| 6     | A       | Primary action button             | `A`                     |
| 7     | B       | Secondary action button           | `S`                     |
| 8     | X       | Tertiary action button            | `Z`                     |
| 9     | Y       | Quaternary action button          | `X`                     |
| 10    | TURBO   | Modifier button (boost, run)      | `Left Shift`, `Right Shift` |

## Platform Support

### Desktop (Keyboard)
- All buttons mapped to keyboard keys
- Standard WASD + arrow keys for movement
- Controller hidden (keyboard only)

### Mobile/Tablet (Touch)
- On-screen virtual controller automatically displayed in portrait mode
- Controller appears below canvas
- Touch events map directly to button presses
- Controller automatically hidden in landscape mode

### Detection
The system automatically detects mobile/tablet devices in portrait mode and shows the controller. This is handled by the `isMobilePortrait()` function in `useController.ts`.

## Integration

### For Developers

**Using the Controller Component:**
```typescript
import Controller from '@/Controller/Controller';
import { useController, isMobilePortrait } from '@/lib/useController';

const { handleButtonPress, handleButtonRelease } = useController();
const showController = isMobilePortrait();

// In your component:
{showController && (
  <Controller
    onButtonPress={handleButtonPress}
    onButtonRelease={handleButtonRelease}
  />
)}
```

**Button Events:**
The controller sends button press/release events that are automatically routed to the WASM engine via `rf_set_button(name, down)`.

### For Game Developers (Lua)

**Button Functions:**
```lua
rf.btn(button)   -- Check if button is held (0-10)
rf.btnp(button) -- Check if button was just pressed (0-10)
rf.shift()      -- Alias for rf.btn(10) - TURBO button
```

**Example:**
```lua
function _HANDLE_INPUT()
  -- Pause with START button
  if rf.btnp(1) then
    game.pushState("pause")
  end
  
  -- Movement
  if rf.btn(4) then  -- LEFT
    player.vx = -3
  elseif rf.btn(5) then  -- RIGHT
    player.vx = 3
  end
  
  -- Jump
  if rf.btnp(6) then  -- A button
    player.vy = -10
  end
  
  -- Boost with TURBO
  if rf.shift() then  -- TURBO button (button 10)
    speed = speed * 1.5
  end
end
```

## Benefits

1. **Cross-Platform**: Same button layout works on all devices
2. **No Conflicts**: Eliminates ESC/DOWN button conflicts
3. **Mobile-Ready**: Built-in touch controller support
4. **Clear Semantics**: Button names are self-explanatory
5. **Future-Proof**: Easy to extend or customize

## Architecture

- **Engine**: `internal/input/input.go` - Core 11-button state management
- **WASM**: `wasmInterface.ts` - Keyboard mapping and WASM exports
- **Controller**: `Controller/Controller.tsx` - Visual touch controller
- **Integration**: `useController.ts` - React hooks for controller integration

See `design/UNIVERSAL_INPUT_SYSTEM.md` in the engine for detailed architecture documentation.

