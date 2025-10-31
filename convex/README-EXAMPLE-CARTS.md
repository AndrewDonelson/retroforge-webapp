# Example Carts Utility

## Overview

The `syncExampleCarts` mutation syncs official RetroForge example carts to the Convex database. It:
- Creates carts if they don't exist
- Updates existing carts with new metadata
- Preserves play counts and creation dates
- Marks carts as examples (`isExample: true`)

## Usage

### From Client Code

```tsx
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

function SyncButton() {
  const syncCarts = useMutation(api.exampleCarts.syncExampleCarts)
  
  const handleSync = async () => {
    const result = await syncCarts()
    console.log(`Created: ${result.created}, Updated: ${result.updated}`)
  }
  
  return <button onClick={handleSync}>Sync Example Carts</button>
}
```

### From Command Line

```bash
npx tsx scripts/sync-example-carts.ts
```

## Example Carts

Currently synced carts:
- **Hello World** - Minimal example cart that prints centered text
- **Moon Lander** - Lunar landing demo with levels, HUD, and SFX/music

To add more example carts, edit `EXAMPLE_CARTS` array in `src/convex/exampleCarts.ts`.

## Notes

- Cart data (`.rf` files) is not stored in the database to save space
- Carts are loaded from `/carts/{id}.rf` URLs
- Example carts are always public and have `isExample: true`
- Example carts don't have owners (they're official RetroForge content)

