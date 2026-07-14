<!-- Satellite context file — extends the global hub (~/.claude/CLAUDE.md | ~/.pi/agent/AGENTS.md). Host-neutral; project-specific only. Do not duplicate hub standards here. -->

# SIP Protocol Blog

> Technical deep-dives, ecosystem updates, and privacy thought leadership. Live at https://blog.sip-protocol.org.

**Ecosystem hub:** See [sip-protocol/sip-protocol/AGENTS.md](https://github.com/sip-protocol/sip-protocol/blob/main/AGENTS.md) for full ecosystem context.

## Quick Reference

```bash
npm run dev        # Dev server (localhost:4321)
npm run build      # Build for production
npm run preview    # Preview production build
```

**Tech Stack:** Astro 6.x, TypeScript (strict), Tailwind CSS v4, MDX Content Collections. Vercel (Git auto-deploy; migrated off VPS 2026-05-31). 33 published posts (M16 target 12 — exceeded).

## Project Structure

```
blog-sip/
├── src/
│   ├── content/
│   │   ├── blog/          # Blog posts (MDX/MD)
│   │   └── authors/       # Author profiles
│   ├── components/        # Astro/React components
│   ├── layouts/          # Page layouts
│   ├── pages/            # Route pages
│   └── styles/           # Global CSS
├── public/               # Static assets
├── astro.config.mjs
└── src/content.config.ts # Content Collections schema
```

## Content Schema

### Blog Post Frontmatter

```yaml
title: 'Post Title'           # Required, max 60 chars
description: 'Description'    # Required, max 160 chars
pubDate: '2025-01-01'        # Required
updatedDate: '2025-01-02'    # Optional
heroImage: './image.jpg'     # Optional
category: 'technical'        # technical | ecosystem | thought-leadership | tutorials | announcements
tags: ['privacy', 'solana'] # Array of strings
author: 'SIP Protocol Team'  # Default
authorTwitter: '@sipprotocol' # Optional
canonicalUrl: 'https://...' # Optional
noIndex: false              # Default: false
# LLMO (LLM Optimization)
tldr: 'One-line summary'    # Max 280 chars
keyTakeaways:               # Array of strings
  - 'Point 1'
targetAudience: 'Developers' # Optional
prerequisites: [...]        # Optional
readingTime: 5              # Optional
draft: false                # Default: false
featured: false             # Default: false
relatedPosts: [slugs]       # 2-4 related articles
```

### Categories

| Category | Purpose |
|----------|---------|
| `technical` | Deep-dives, specs, architecture |
| `ecosystem` | Partnerships, integrations, updates |
| `thought-leadership` | Privacy philosophy, industry trends |
| `tutorials` | How-to guides, code examples |
| `announcements` | Releases, milestones, news |

## Writing Posts

**IMPORTANT:** Before writing any blog post, read `docs/BLOG_STYLE_GUIDE.md` for complete standards.

1. Read `docs/BLOG_STYLE_GUIDE.md` first
2. Create file in `src/content/blog/` (use `.mdx` for components)
3. Add ALL required frontmatter fields
4. Include `relatedPosts` (2-4 related articles)
5. Run `npm run dev` to preview
6. Use the pre-publish checklist from the style guide

### LLMO Best Practices

- **tldr:** Twitter-length summary (280 chars max)
- **keyTakeaways:** 3-5 bullet points an AI can cite
- **targetAudience:** help LLMs route content appropriately
- Use semantic HTML (proper headings, lists, code blocks)

## Deployment

Vercel via Git integration — push to `main` auto-deploys. Astro config selects the Vercel adapter when `VERCEL=1`, falling back to Node standalone (`@astrojs/node`) elsewhere.

- **Domain:** blog.sip-protocol.org · **Project:** `sip-blog` (Vercel scope `rectors-projects`)
- **Build:** `astro build && npx pagefind --site dist/client`

### Docker Fallback (rollback only)

A `Dockerfile` is retained for VPS rollback (Node standalone on port 80).

## Repo-Specific Guidelines

**DO:** follow the content schema strictly; include ALL required frontmatter; always add `relatedPosts`; include LLMO fields; reference core repo for technical accuracy; run `npm run build` before committing; use the pre-publish checklist.
**DON'T:** create posts without category/tags; skip `tldr` for technical posts; commit draft posts (use `draft: true`); forget `relatedPosts`.