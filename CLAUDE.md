# CLAUDE.md - SIP Protocol Blog

> **Ecosystem Hub:** See [sip-protocol/CLAUDE.md](https://github.com/sip-protocol/sip-protocol/blob/main/CLAUDE.md) for full ecosystem context

**Repository:** https://github.com/sip-protocol/blog-sip
**Live URL:** https://blog.sip-protocol.org
**Purpose:** Technical deep-dives, ecosystem updates, and privacy thought leadership

---

## Quick Reference

```bash
npm run dev          # Dev server (localhost:4321)
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## Tech Stack

- **Framework:** Astro 5.x with TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **Content:** MDX with Content Collections
- **Deployment:** Docker + nginx (GHCR → VPS, port 5004)
- **Posts:** 25 published (M16 target: 12 — exceeded)

---

## Project Structure

```
blog-sip/
├── src/
│   ├── content/
│   │   ├── blog/           # Blog posts (MDX/MD)
│   │   └── authors/        # Author profiles
│   ├── components/         # Astro/React components
│   ├── layouts/            # Page layouts
│   ├── pages/              # Route pages
│   └── styles/             # Global CSS
├── public/                 # Static assets
├── astro.config.mjs        # Astro configuration
└── src/content.config.ts   # Content Collections schema
```

---

## Content Schema

### Blog Post Frontmatter

```yaml
---
title: 'Post Title'           # Required, max 60 chars
description: 'Description'    # Required, max 160 chars
pubDate: '2025-01-01'         # Required
updatedDate: '2025-01-02'     # Optional
heroImage: './image.jpg'      # Optional

# Taxonomy
category: 'technical'         # technical | ecosystem | thought-leadership | tutorials | announcements
tags: ['privacy', 'solana']   # Array of strings

# Author
author: 'SIP Protocol Team'   # Default
authorTwitter: '@sipprotocol' # Optional

# SEO
canonicalUrl: 'https://...'   # Optional
noIndex: false                # Default: false

# LLMO (LLM Optimization)
tldr: 'One-line summary'      # Max 280 chars
keyTakeaways:                 # Array of strings
  - 'Point 1'
  - 'Point 2'
targetAudience: 'Developers'  # Optional
prerequisites:                # Optional
  - 'Basic crypto knowledge'

# Content hints
readingTime: 5                # Minutes (optional)
draft: false                  # Default: false
featured: false               # Default: false
relatedPosts:                 # Slugs of related posts
  - 'another-post'
---
```

### Categories

| Category | Purpose |
|----------|---------|
| `technical` | Deep-dives, specs, architecture |
| `ecosystem` | Partnerships, integrations, updates |
| `thought-leadership` | Privacy philosophy, industry trends |
| `tutorials` | How-to guides, code examples |
| `announcements` | Releases, milestones, news |

---

## Writing Posts

**IMPORTANT:** Before writing any blog post, read `docs/BLOG_STYLE_GUIDE.md` for complete standards.

1. Read `docs/BLOG_STYLE_GUIDE.md` first
2. Create file in `src/content/blog/` (use `.mdx` for components)
3. Add ALL required frontmatter fields (see style guide)
4. Include `relatedPosts` (2-4 related articles)
5. Run `npm run dev` to preview
6. Use pre-publish checklist from style guide

### LLMO Best Practices

- **tldr**: Write a Twitter-length summary (280 chars max)
- **keyTakeaways**: 3-5 bullet points an AI can cite
- **targetAudience**: Help LLMs route content appropriately
- Use semantic HTML (proper headings, lists, code blocks)

---

## Development

### Adding Components

```astro
---
// src/components/MyComponent.astro
interface Props {
  title: string
}
const { title } = Astro.props
---

<div class="my-component">
  <h2>{title}</h2>
  <slot />
</div>
```

### Using in MDX

```mdx
import MyComponent from '../components/MyComponent.astro'

<MyComponent title="Hello">
  Content here
</MyComponent>
```

---

## Deployment

### Docker Build

```bash
docker build -t blog-sip .
docker run -p 5004:80 blog-sip
```

### VPS Details

- **Port:** 5004
- **Container:** `sip-blog`
- **Domain:** blog.sip-protocol.org
- **SSL:** Let's Encrypt (auto-renew)

---

## Related Repositories

| Repo | Purpose |
|------|---------|
| [sip-protocol](https://github.com/sip-protocol/sip-protocol) | Core SDK (reference this for technical content) |
| [sip-website](https://github.com/sip-protocol/sip-website) | Main website |
| [docs-sip](https://github.com/sip-protocol/docs-sip) | Documentation |

---

## AI Assistant Guidelines

**BEFORE WRITING ANY POST:**
- Read `docs/BLOG_STYLE_GUIDE.md` for complete formatting standards

**DO:**
- Follow the content schema strictly
- Include ALL required frontmatter fields
- Always add `relatedPosts` (2-4 articles)
- Include LLMO fields for discoverability
- Reference core repo for technical accuracy
- Run `npm run build` before committing
- Use pre-publish checklist from style guide

**DON'T:**
- Create posts without category/tags
- Skip tldr for technical posts
- Commit draft posts (use `draft: true`)
- Forget `relatedPosts` field

---

**Last Updated:** 2026-01-25
