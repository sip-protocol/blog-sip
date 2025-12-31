# SIP Protocol Blog

Technical deep-dives, ecosystem updates, and privacy thought leadership for the Web3 privacy standard.

**Live:** https://blog.sip-protocol.org

## Tech Stack

- **Framework:** [Astro](https://astro.build) 5.x
- **Styling:** [Tailwind CSS](https://tailwindcss.com) v4
- **Content:** MDX with Content Collections
- **Deployment:** Docker + nginx

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |

## Project Structure

```
blog-sip/
├── src/
│   ├── content/
│   │   ├── blog/           # Blog posts (MDX/MD)
│   │   └── authors/        # Author profiles
│   ├── components/         # Astro components
│   ├── layouts/            # Page layouts
│   ├── pages/              # Routes
│   └── styles/             # Global CSS
├── public/                 # Static assets
├── astro.config.mjs        # Astro config
└── src/content.config.ts   # Content schema
```

## Writing Posts

### 1. Create a Post

Create a new `.md` or `.mdx` file in `src/content/blog/`:

```bash
touch src/content/blog/my-new-post.mdx
```

### 2. Add Frontmatter

```yaml
---
title: 'Your Post Title'
description: 'Brief description (max 160 chars)'
pubDate: '2025-01-01'
category: 'technical'
tags: ['privacy', 'solana']
tldr: 'One-line summary for AI discoverability'
---
```

### 3. Write Content

Use Markdown or MDX. For MDX, you can import components:

```mdx
import Callout from '../components/Callout.astro'

# My Post

Regular markdown content...

<Callout type="info">
  This is a custom component!
</Callout>
```

## Categories

| Category | Use For |
|----------|---------|
| `technical` | Deep-dives, specs, architecture |
| `ecosystem` | Partnerships, integrations |
| `thought-leadership` | Privacy philosophy, trends |
| `tutorials` | How-to guides, examples |
| `announcements` | Releases, milestones |

## Contributing

### Writing Guidelines

1. **Title**: Clear, descriptive, max 60 characters
2. **Description**: SEO-friendly summary, max 160 characters
3. **Category**: Choose one that best fits
4. **Tags**: 2-5 relevant keywords
5. **TLDR**: For technical posts, add a one-liner for AI discoverability

### Code Style

- Run `npm run lint` before committing
- Run `npm run format` to auto-format
- Follow existing patterns in the codebase

### Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to verify
5. Submit a PR with a clear description

## Related Projects

| Repository | Description |
|------------|-------------|
| [sip-protocol](https://github.com/sip-protocol/sip-protocol) | Core SDK |
| [sip-website](https://github.com/sip-protocol/sip-website) | Main website |
| [docs-sip](https://github.com/sip-protocol/docs-sip) | Documentation |

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**SIP Protocol** - The privacy standard for Web3
