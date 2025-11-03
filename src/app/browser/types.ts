export type Genre =
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

export type SortKey = 'popular' | 'latest' | 'updated' | 'favorited' | 'liked'

export type ViewMode = 'grid' | 'list'

export type Cart = {
  id: string
  title: string
  author: string
  description: string
  genre: Genre
  imageUrl: string
  plays: number
  favorites: number
  likes: number
  createdAt: string
  updatedAt: string
  slug?: string
}

