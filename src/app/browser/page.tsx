"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'

import AdCard from '@/components/ads/AdCard'


type Genre =
  | 'Action'
  | 'Adventure'
  | 'Puzzle'
  | 'Platformer'
  | 'RPG'
  | 'Shooter'
  | 'Strategy'
  | 'Simulation'
  | 'Sports'
  | 'Racing'
  | 'Arcade'
  | 'Other'

type SortKey = 'popular' | 'latest' | 'updated'

type Cart = {
  id: string
  title: string
  author: string
  description: string
  genre: Genre
  imageUrl: string
  plays: number
  createdAt: string
  updatedAt: string
  slug?: string
}

const GENRES: Genre[] = [
  'Action',
  'Adventure',
  'Puzzle',
  'Platformer',
  'RPG',
  'Shooter',
  'Strategy',
  'Simulation',
  'Sports',
  'Racing',
  'Arcade',
  'Other',
]

const SAMPLE_CARTS: Cart[] = [
  // Built-in engine demo carts
  {
    id: 'hello',
    slug: 'helloworld',
    title: 'Hello World',
    author: 'RetroForge',
    description: 'Minimal example cart that prints centered text.',
    genre: 'Arcade',
    imageUrl: '/assets/placeholders/cart01.png',
    plays: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'moon',
    slug: 'moon-lander',
    title: 'Moon Lander',
    author: 'RetroForge',
    description: 'Lunar landing demo with levels, HUD, and simple SFX/music.',
    genre: 'Arcade',
    imageUrl: '/assets/placeholders/cart02.png',
    plays: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '1',
    title: 'Pixel Quest',
    author: 'dev_anna',
    description: 'A retro platformer with tight controls and vibrant pixel art.',
    genre: 'Platformer',
    imageUrl: '/assets/placeholders/cart01.png',
    plays: 12450,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: '2',
    title: 'Dungeon Delver',
    author: 'bit_mage',
    description: 'Turn-based roguelike with procedural dungeons and permadeath.',
    genre: 'RPG',
    imageUrl: '/assets/placeholders/cart02.png',
    plays: 8421,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: '3',
    title: 'Astro Blaster',
    author: 'retro_joe',
    description: 'Arcade shooter inspired by classic space blasters.',
    genre: 'Shooter',
    imageUrl: '/assets/placeholders/cart03.png',
    plays: 15321,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: '4',
    title: 'Race Rush',
    author: 'lap_time',
    description: 'Top-down racing with drift mechanics and time trials.',
    genre: 'Racing',
    imageUrl: '/assets/placeholders/cart04.png',
    plays: 6123,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: '5',
    title: 'Block Builder',
    author: 'vox_artist',
    description: 'Sandbox simulation with block-based building challenges.',
    genre: 'Simulation',
    imageUrl: '/assets/placeholders/cart05.png',
    plays: 4312,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
]

export default function BrowserPage() {
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('popular')

  const filtered = useMemo(() => {
    let list = [...SAMPLE_CARTS]

    if (selectedGenres.length > 0) {
      const set = new Set(selectedGenres)
      list = list.filter((c) => set.has(c.genre))
    }

    if (search.trim().length > 0) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.author.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      )
    }

    if (sort === 'popular') {
      list.sort((a, b) => b.plays - a.plays)
    } else if (sort === 'latest') {
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } else if (sort === 'updated') {
      list.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    }

    return list
  }, [selectedGenres, search, sort])

  function toggleGenre(g: Genre) {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    )
  }

  // Build list with a single sponsored card injected
  const withSponsored = useMemo(() => {
    if (filtered.length === 0) return filtered
    const copy = [...filtered]
    const insertAt = Math.min(4, copy.length) // after a few real items
    // use a sentinel id to avoid clashes
    const sentinel = `__ad__${insertAt}`
    ;(copy as any).splice(insertAt, 0, { id: sentinel } as any)
    return copy
  }, [filtered])

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-pixel text-white">Browse Games</h1>
        </div>

        {/* Filters */}
        <div className="card-retro p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <input
              type="text"
              className="input-retro flex-1"
              placeholder="Search by title, author, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex gap-2 flex-wrap">
              {(['popular', 'latest', 'updated'] as SortKey[]).map((key) => (
                <button
                  key={key}
                  className={`btn-retro ${
                    sort === key ? 'bg-retro-500 border-retro-300' : ''
                  }`}
                  onClick={() => setSort(key)}
                  aria-pressed={sort === key}
                >
                  {key === 'popular' && 'Most Popular'}
                  {key === 'latest' && 'Latest'}
                  {key === 'updated' && 'Recently Updated'}
                </button>
              ))}
            </div>
          </div>

          {/* Genre filter */}
          <div className="mt-4">
            <div className="text-sm text-gray-300 mb-2">Filter by genre</div>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  className={`btn-retro ${
                    selectedGenres.includes(g)
                      ? 'bg-retro-500 border-retro-300'
                      : 'btn-retro-secondary'
                  }`}
                  onClick={() => toggleGenre(g)}
                  aria-pressed={selectedGenres.includes(g)}
                >
                  {g}
                </button>
              ))}
              {selectedGenres.length > 0 && (
                <button
                  className="btn-retro-secondary"
                  onClick={() => setSelectedGenres([])}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="text-gray-400 text-sm mb-3">
          Showing {filtered.length} result{filtered.length === 1 ? '' : 's'}
        </div>

        {/* Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {withSponsored.map((cart) => (
            // Render sponsored card when sentinel is hit
            ('id' in cart && (cart as any).id?.toString().startsWith('__ad__')) ? (
              <AdCard key={(cart as any).id} />
            ) : (
            <Link href={`/arcade/${cart.slug ?? cart.id}`} className="block" key={cart.id}>
            <article
              className="card-retro overflow-hidden bg-gray-850 hover:border-retro-500 transition-colors"
            >
              <div className="relative w-full aspect-square bg-gray-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cart.imageUrl}
                  alt={cart.title}
                  className="absolute inset-0 w-full h-full object-cover pixel-container"
                  width={256}
                  height={256}
                />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-white font-semibold leading-snug truncate">
                    {cart.title}
                  </h3>
                  <span className="shrink-0 text-2xs px-2 py-0.5 bg-gray-700 border border-gray-600 uppercase tracking-wide">
                    {cart.genre}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1 truncate">by {cart.author}</div>
                <p className="text-sm text-gray-300 mt-2 line-clamp-3 min-h-[3.6rem]">
                  {cart.description}
                </p>
                <div className="mt-3 h-px bg-gray-700" />
                <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
                  <span className="flex items-center gap-1">
                    <span className="text-retro-400">▶</span>
                    {cart.plays.toLocaleString()} plays
                  </span>
                  <span className="whitespace-nowrap">
                    {sort === 'latest' ? 'Created ' : 'Updated '}
                    {new Date(sort === 'latest' ? cart.createdAt : cart.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </article>
            </Link>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
