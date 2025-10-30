import { defineSchema, defineTable } from 'convex/schema'

export default defineSchema({
  carts: defineTable({
    title: 'string',
    author: 'string',
    description: 'string',
    genre: 'string',
    imageUrl: 'string',
    plays: 'number',
    createdAt: 'number',
    updatedAt: 'number',
    popularityScore: 'number',
  })
    .index('by_genre', ['genre'])
    .index('by_created', ['createdAt'])
    .index('by_updated', ['updatedAt'])
    .index('by_popularity', ['popularityScore']),
})


