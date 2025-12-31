import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

/**
 * Blog post categories - main content pillars
 */
const categories = [
  'technical',      // Deep-dives, specs, architecture
  'ecosystem',      // Partnerships, integrations, updates
  'thought-leadership', // Privacy philosophy, industry trends
  'tutorials',      // How-to guides, code examples
  'announcements',  // Releases, milestones, news
] as const

/**
 * Blog Collection Schema
 * Supports SEO, LLMO, and rich content features
 */
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      // Core fields
      title: z.string().max(60),
      description: z.string().max(160),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),

      // Taxonomy
      category: z.enum(categories).default('technical'),
      tags: z.array(z.string()).default([]),

      // Author
      author: z.string().default('SIP Protocol Team'),
      authorImage: z.string().optional(),
      authorTwitter: z.string().optional(),

      // SEO
      canonicalUrl: z.string().url().optional(),
      noIndex: z.boolean().default(false),

      // LLMO (LLM Optimization)
      tldr: z.string().max(280).optional(),
      keyTakeaways: z.array(z.string()).optional(),
      targetAudience: z.string().optional(),
      prerequisites: z.array(z.string()).optional(),

      // Content hints
      readingTime: z.number().optional(), // minutes
      draft: z.boolean().default(false),
      featured: z.boolean().default(false),

      // Related content
      relatedPosts: z.array(z.string()).optional(),
    }),
})

/**
 * Authors Collection (optional, for multi-author support)
 */
const authors = defineCollection({
  loader: glob({ base: './src/content/authors', pattern: '**/*.{md,json}' }),
  schema: z.object({
    name: z.string(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    twitter: z.string().optional(),
    github: z.string().optional(),
  }),
})

export const collections = { blog, authors }
