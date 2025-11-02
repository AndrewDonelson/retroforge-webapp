# RetroForge Community Statistics

This directory contains the implementation for RetroForge community statistics tracking.

## Overview

The statistics system tracks:
- **games_created**: Total number of carts in the database
- **active_devs**: Number of authenticated users who have created at least 1 published cart
- **games_played**: Total number of times carts were started/played (updated incrementally)
- **total_lobbies**: Total number of multiplayer lobbies created
- **total_matches**: Total number of completed multiplayer matches

## Files

- **`stats.ts`**: Main statistics queries and mutations
  - `getStats`: Query to fetch current statistics
  - `updateStats`: Mutation to recalculate all statistics (except games_played)
  - `incrementGamesPlayed`: Mutation to increment games_played when a cart starts

- **`scheduled.ts`**: Scheduled function for daily updates
  - `updateDailyStats`: Internal action that runs daily at midnight UTC
  - `updateStatsInternal`: Internal mutation that recalculates statistics

## Setup

### 1. Schema

The `retroforge` table is defined in `schema.ts`:

```typescript
retroforge: defineTable({
  games_created: v.number(),
  active_devs: v.number(),
  games_played: v.number(),
  total_lobbies: v.optional(v.number()),
  total_matches: v.optional(v.number()),
  last_updated: v.number(),
}),
```

### 2. Scheduled Function

To set up the daily update schedule, configure the scheduled function in the Convex dashboard:

1. Go to your Convex project dashboard
2. Navigate to "Functions" → "Scheduled Functions"
3. Add a new scheduled function:
   - **Function**: `scheduled:updateDailyStats`
   - **Schedule**: `0 0 * * *` (daily at midnight UTC)
   - **Type**: Action

Alternatively, you can configure it programmatically by creating a `cronJobs.ts` file (if supported by your Convex version):

```typescript
// cronJobs.ts (if supported)
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "update daily stats",
  { hourUTC: 0, minuteUTC: 0 }, // Midnight UTC
  internal.scheduled.updateDailyStats
);

export default crons;
```

### 3. Initial Statistics

When the system starts, statistics are automatically initialized when:
- The homepage loads and queries stats
- A cart is played for the first time
- The daily scheduled function runs

To manually initialize or update statistics, call the `stats:updateStats` mutation from the Convex dashboard or your application.

## Usage

### Fetching Statistics

```typescript
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

const stats = useQuery(api.stats.getStats)
```

### Incrementing Games Played

When a cart starts, call:

```typescript
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

const incrementGamesPlayed = useMutation(api.stats.incrementGamesPlayed)

// When cart starts:
await incrementGamesPlayed({ cartId: cart._id })
```

### Manual Update

To manually recalculate all statistics:

```typescript
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

const updateStats = useMutation(api.stats.updateStats)

await updateStats({})
```

## Display

Statistics are displayed on the homepage (`src/app/page.tsx`) and update automatically when the data changes via Convex's reactive queries.

