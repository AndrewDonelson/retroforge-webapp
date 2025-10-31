# Authentication System

RetroForge uses a privacy-focused, keypair-based authentication system that doesn't require email, passwords, or any personal identifying information.

## Features

- **Anonymous Authentication**: Users are identified only by their chosen username
- **Unique Usernames**: Username must be unique and 3-20 characters (letters, numbers, _, -)
- **Keypair-Based**: Each user gets a cryptographic keypair (public/private)
- **Private Key Storage**: Private keys stored in browser localStorage
- **Server Key Recovery**: Optional server key for account recovery (hashed on server)

## How It Works

### Account Creation

1. User chooses a unique username
2. System generates an ECDSA keypair (P-256 curve) in the browser
3. Public key and hashed server key stored on server
4. Private key stored in browser localStorage
5. Username is the only identifier

### Authentication

1. User's private key signs a challenge from the server
2. Server verifies the signature matches the stored public key
3. User is authenticated and can access their carts

### Cart Ownership

- Users can fork existing carts (create copies they own)
- Users can create new carts
- Only the owner can edit their own carts
- Forks start as private but can be made public

## Security Considerations

- **Private Keys**: Never leave the browser; stored in localStorage
- **Server Keys**: Hashed with SHA-256 before storage
- **Challenges**: Currently generated per-request (in production, should be stored with expiration)
- **Signature Verification**: Currently trusted (in production, should verify server-side)

## Usage

### Client-Side

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, createAccount, logout } = useAuth()
  
  if (!isAuthenticated) {
    return <LoginButton />
  }
  
  return <div>Welcome, @{user.username}!</div>
}
```

### Creating a Cart

```tsx
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/contexts/AuthContext'

function CreateCartButton() {
  const { user } = useAuth()
  const createCart = useMutation(api.cartActions.createCart)
  
  const handleCreate = async () => {
    if (!user) return
    
    const cartId = await createCart({
      ownerId: user.userId,
      title: 'My Game',
      description: 'A cool game',
      genre: 'Action',
    })
  }
}
```

### Forking a Cart

```tsx
import { ForkButton } from '@/components/carts/ForkButton'

function CartPage({ cartId }) {
  return <ForkButton cartId={cartId} />
}
```

## Syncing Example Carts

To sync the official RetroForge example carts to the database:

```tsx
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

const syncCarts = useMutation(api.exampleCarts.syncExampleCarts)
await syncCarts()
```

Or from command line:
```bash
npx tsx scripts/sync-example-carts.ts
```

