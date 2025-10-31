# RetroForge Engine API Reference

**All colors must use palette indices (0-49, -1 for transparent). RGB functions are not available.**

## Graphics

### Screen Clearing
- `rf.clear_i(index)` - Clear screen using palette color index (0-49, -1 for transparent)

### Text
- `rf.print(text, [x, y, index])` - Print text. If x/y/index omitted, uses cursor/color state. Returns cursor after text.
- `rf.print_anchored(text, anchor, index)` - Print text using anchor position and palette color index
  - Anchors: `"topleft"`, `"topcenter"`, `"topright"`, `"middleleft"`, `"middlecenter"`, `"middleright"`, `"bottomleft"`, `"bottomcenter"`, `"bottomright"`
- `rf.print_xy(x, y, text, [index])` - Print text at exact (x, y) position. If index omitted, uses color state.
- `rf.cursor([x, y])` - Set text cursor position. Call with no arguments to reset cursor.
- `rf.color([index])` - Set text color index. Call with no arguments to reset color.

### Primitives
- `rf.pset(x, y, index)` - Set pixel using palette color index
- `rf.line(x0, y0, x1, y1, index)` - Draw line using palette color index
- `rf.rect(x0, y0, x1, y1, index)` - Draw rectangle outline using palette color index
- `rf.rectfill(x0, y0, x1, y1, index)` - Draw filled rectangle using palette color index
- `rf.circ(x, y, radius, index)` - Draw circle outline using palette color index
- `rf.circfill(x, y, radius, index)` - Draw filled circle using palette color index

### Shape Primitives
- `rf.triangle(x, y, radius, [filled], index)` - Draw triangle (pointing up). `filled` is optional (default: false)
- `rf.diamond(x, y, radius, [filled], index)` - Draw diamond shape. `filled` is optional (default: false)
- `rf.square(x, y, radius, [filled], index)` - Draw square centered at (x, y). `filled` is optional (default: false)
- `rf.pentagon(x, y, radius, [filled], index)` - Draw pentagon. `filled` is optional (default: false)
- `rf.hexagon(x, y, radius, [filled], index)` - Draw hexagon. `filled` is optional (default: false)
- `rf.star(x, y, radius, [filled], index)` - Draw 10-point star. `filled` is optional (default: false)

### Ellipse Drawing
- `rf.elli(x, y, rx, ry, index)` - Draw ellipse outline with radii rx, ry
- `rf.ellifill(x, y, rx, ry, index)` - Draw filled ellipse with radii rx, ry

### Pixel Reading
- `rf.pget(x, y)` - Get pixel color at (x, y). Returns table with `{r, g, b, a}` values (0-255)

### Clipping
- `rf.clip([x, y, w, h])` - Set clipping rectangle. Call with no arguments to disable clipping
- Clipping restricts all drawing operations to the specified rectangle

### Camera
- `rf.camera([x, y])` - Set camera offset. All drawing operations are offset by (x, y). Call with no arguments to reset (0, 0)

### Sprite Drawing
- `rf.spr(name, x, y, [flip_x, flip_y])` - Draw sprite by name at position (x, y). Optional horizontal/vertical flipping
- `rf.sspr(name, sx, sy, sw, sh, dx, dy, [dw, dh, flip_x, flip_y])` - Draw sprite region. Scales from source (sx, sy, sw, sh) to destination (dx, dy, dw, dh)

### Tilemap
- `rf.mget(x, y)` - Get tile value at map coordinate (x, y). Returns tile index (0 = empty)
- `rf.mset(x, y, v)` - Set tile at map coordinate (x, y) to value v
- `rf.map(cel_x, cel_y, sx, sy, cel_w, cel_h)` - Draw tilemap region. cel_x/cel_y = tile coordinates, sx/sy = screen position, cel_w/cel_h = tiles to draw

### Color Remapping
- `rf.pal([c0, c1, p])` - Remap color index. `pal(c0, c1)` maps color c0 to c1. `pal()` with no args resets all remapping
- `p` parameter (optional, default true) enables/disables the remap
- Color remapping affects all drawing operations that use palette indices

### Memory API
- `rf.poke(addr, val)` - Write byte value to memory address
- `rf.peek(addr)` - Read byte value from memory address. Returns 0 if out of bounds
- `rf.poke2(addr, val)` - Write 16-bit value (little-endian)
- `rf.peek2(addr)` - Read 16-bit value (little-endian)
- `rf.poke4(addr, val)` - Write 32-bit value (little-endian)
- `rf.peek4(addr)` - Read 32-bit value (little-endian)
- Memory size: 2MB (like PICO-8)

### Cart Persistence
- `rf.cstore(dest_addr, src_addr, len)` - Copy `len` bytes from runtime memory (src_addr) to cart storage (dest_addr)
- `rf.reload(dest_addr, src_addr, len)` - Copy `len` bytes from cart storage (src_addr) to runtime memory (dest_addr)
- Cart storage size: 64KB (2x PICO-8's 32KB)
- Used for saving/loading game state that persists across cart reloads
- Addresses are validated and clamped to available bounds

### Physics (Box2D Integration)
- `rf.physics_create_body(type, x, y)` - Create physics body. `type` = `"static"`, `"dynamic"`, or `"kinematic"`. Returns body ID
- `rf.physics_body_add_box(body_id, width, height, [density])` - Add box fixture to body
- `rf.physics_body_add_circle(body_id, radius, [density])` - Add circle fixture to body
- `rf.physics_body_set_position(body_id, x, y)` - Set body position
- `rf.physics_body_get_position(body_id)` - Get body position. Returns x, y
- `rf.physics_body_set_velocity(body_id, vx, vy)` - Set body linear velocity
- `rf.physics_body_get_velocity(body_id)` - Get body velocity. Returns vx, vy
- `rf.physics_body_apply_force(body_id, fx, fy, px, py)` - Apply force at point (px, py)
- `rf.physics_body_destroy(body_id)` - Destroy body and remove from world
- Physics world has default gravity (0, 9.8) - downward like real physics

## Input

### `rf.btn(button)`
Check if button is pressed. Returns boolean.
- Button 0-15: Standard buttons
- Button 16+: Extended buttons

### `rf.btnp(button)`
Check if button was just pressed this frame (edge-triggered). Returns boolean.

### `rf.btnr(button)`
Check if button was just released this frame. Returns boolean.

## Audio

### `rf.sfx(name, ...)`
Play sound effect by name (from `sfx.json`). Fallback to inline parameters if not found.
- `rf.sfx("jump")` - Play named SFX
- `rf.sfx("sine", freq, duration, gain)` - Inline SFX definition
- Types: `"sine"`, `"noise"`, `"thrust"`, `"stopall"`

### `rf.music(name, ...)`
Play music track by name (from `music.json`). Fallback to inline parameters if not found.
- `rf.music("menu")` - Play named track
- `rf.music(tokens, bpm, gain)` - Inline music definition
- `tokens`: Array of note strings (e.g., `{"4C1", "4E1", "R1"}`)
- `bpm`: Beats per minute (optional)
- `gain`: Volume 0.0-1.0 (optional)

## Sprites

### `rf.sprite(name)`
Get sprite data by name (from `sprites.json`). Returns table:
```lua
{
  width = 16,
  height = 16,
  pixels = {{row1}, {row2}, ...},  -- 2D array of color indices
  useCollision = true,
  mountPoints = {
    [1] = {x = 8, y = 8, name = "thrust"},  -- Access by index
    ["thrust"] = {x = 8, y = 8, name = "thrust"}  -- Access by name
  }
}
```

## Palette

### `rf.palette_set(name)`
Set active palette by name (e.g., `"RetroForge 50"`, `"Grayscale 50"`).

## System

### `rf.quit()`
Request application quit.

## Helper Functions

PICO-8-style utility functions for common operations.

### `rf.flr(x)`
Floor function: Truncates `x` towards zero (same as `math.floor` in Lua).

### `rf.ceil(x)`
Ceiling function: Rounds `x` up to the nearest integer.

### `rf.rnd([x])`
Random number generator (PICO-8-compatible LCG).
- `rf.rnd()` - Returns a random float between 0.0 and 1.0 (exclusive of 1.0)
- `rf.rnd(x)` - Returns a random float between 0.0 and `x` (exclusive of `x`)
- `rf.rnd(-x)` - Returns a random float between `-x` and 0.0 (exclusive of `-x`)
- Uses deterministic seeded random number generator (same seed = same sequence)

### `rf.mid(x, y, z)`
Clamp function: Returns `x` clamped between `y` and `z`.
- If `y > z`, they are automatically swapped
- Returns `y` if `x < y`, `z` if `x > z`, otherwise `x`

### `rf.sgn(x)`
Sign function: Returns the sign of `x`.
- Returns `1` if `x > 0`
- Returns `0` if `x == 0`
- Returns `-1` if `x < 0`

### `rf.chr(n)`
Convert number to character: Returns a single-character string with byte value `n`.
- `n` is clamped to 0-255 range
- Returns the byte as a single-character string

### `rf.ord(c)`
Convert character to number: Returns the byte value of the first character in string `c`.
- Returns `0` for empty strings
- Returns the first byte value (0-255) of the string

## Bitwise Operations

PICO-8-compatible bitwise functions for low-level bit manipulation.

### `rf.shl(x, y)`
Bitwise shift left: `x << y`. Returns `x` shifted left by `y` bits.
- Negative `y` performs shift right
- Shifts beyond 63 bits result in 0

### `rf.shr(x, y)`
Bitwise shift right (arithmetic): `x >> y`. Returns `x` shifted right by `y` bits with sign extension.
- Negative `y` performs shift left
- Shifts beyond 63 bits: 0 for positive numbers, -1 for negative (sign-extended)

### `rf.band(x, y)`
Bitwise AND: `x & y`. Returns the bitwise AND of `x` and `y`.

### `rf.bor(x, y)`
Bitwise OR: `x | y`. Returns the bitwise OR of `x` and `y`.

### `rf.bxor(x, y)`
Bitwise XOR: `x ^ y`. Returns the bitwise XOR (exclusive OR) of `x` and `y`.

### `rf.bnot(x)`
Bitwise NOT: `~x`. Returns the bitwise complement (one's complement) of `x`.

**Note:** All bitwise operations work with 64-bit signed integers. Floating point numbers are converted to integers.

## Debug Functions (Development Mode Only)

These functions are **only available when running from a folder** (not in packed .rf files).

### `rf.printh(str)`
Print debug message to console. Only works in development mode.

### `rf.stat(n)`
Get system statistics. Only works in development mode.
- `rf.stat(0)` - Current FPS
- `rf.stat(1)` - Frame count
- `rf.stat(2)` - Lua memory usage (bytes)
- `rf.stat(3)` - Last load time (milliseconds)
- `rf.stat(4)` - Last reload time (Unix timestamp)
- `rf.stat(5)` - Total reload count

### `rf.time()`
Get current time in seconds (Unix timestamp). Only works in development mode.

**Usage:** Run the engine with `--folder <path>` flag to enable development mode:
```bash
retroforge --folder examples/helloworld --window
```
When running from a folder, files are automatically reloaded when modified.

