<div align="center">

<pre>
███████╗ ██╗ ██████╗     ██████╗ ██╗      ██████╗  ██████╗
██╔════╝ ██║ ██╔══██╗    ██╔══██╗██║     ██╔═══██╗██╔════╝
███████╗ ██║ ██████╔╝    ██████╔╝██║     ██║   ██║██║  ███╗
╚════██║ ██║ ██╔═══╝     ██╔══██╗██║     ██║   ██║██║   ██║
███████║ ██║ ██║         ██████╔╝███████╗╚██████╔╝╚██████╔╝
╚══════╝ ╚═╝ ╚═╝         ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝
</pre>

# SIP Protocol Blog

> **Privacy is not a feature. It's a right.**

**Technical deep-dives, ecosystem updates, and privacy thought leadership for Web3**

*Technical guides • Privacy education • Ecosystem news • Developer tutorials*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Astro](https://img.shields.io/badge/Astro-5.0-BC52EE?logo=astro&logoColor=white)](https://astro.build/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Posts](https://img.shields.io/badge/Posts-34-brightgreen)](src/content/blog/)
[![MDX](https://img.shields.io/badge/MDX-Content-yellow?logo=mdx&logoColor=white)](https://mdxjs.com/)

**🏆 Winner — [Zypherpunk Hackathon](https://zypherpunk.xyz) ($6,500) | Part of winning submission**

**Live:** [blog.sip-protocol.org](https://blog.sip-protocol.org)

</div>

---

## Table of Contents

- [What is SIP Blog?](#-what-is-sip-blog)
- [Content Strategy](#-content-strategy)
- [Featured Posts](#-featured-posts)
- [Quick Start](#-quick-start)
- [Writing Posts](#-writing-posts)
- [Architecture](#%EF%B8%8F-architecture)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Features](#-features)
- [Development](#-development)
- [Deployment](#-deployment)
- [Related Projects](#-related-projects)
- [License](#-license)

---

## 📝 What is SIP Blog?

SIP Blog is the **official technical blog** for SIP Protocol — the privacy standard for Web3. We publish deep-dives on privacy technology, ecosystem updates, and thought leadership content.

```
docs.sip-protocol.org → "How to use SIP" (reference documentation)
blog.sip-protocol.org → "Why privacy matters" (thought leadership + tutorials)
```

**34 posts published** — exceeding M16 target of 12 posts by 3x.

---

## 📊 Content Strategy

### Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Technical** | Deep-dives, specs, architecture | Noir ZK proofs, stealth addresses |
| **Ecosystem** | Partnerships, integrations, updates | Arcium, Jupiter, provider comparisons |
| **Thought Leadership** | Privacy philosophy, industry trends | Why privacy matters, a16z validation |
| **Tutorials** | How-to guides, code examples | SDK quickstart, wallet integration |
| **Announcements** | Releases, milestones, news | Grant approvals, hackathon wins |

### Target Audiences

| Audience | Content Focus |
|----------|---------------|
| **Developers** | SDK tutorials, integration guides, code examples |
| **Founders** | Privacy positioning, competitive analysis |
| **Institutions** | Compliance, viewing keys, audit trails |
| **General Crypto** | Privacy education, why it matters |

### LLMO (LLM Optimization)

Posts are optimized for AI discoverability:

- **tldr**: Twitter-length summary (280 chars)
- **keyTakeaways**: Bullet points LLMs can cite
- **targetAudience**: Routing hints for AI
- **Semantic HTML**: Proper headings, lists, code blocks

---

## ⭐ Featured Posts

### Privacy Education

| Post | Description |
|------|-------------|
| [Why Privacy Matters on Solana](https://blog.sip-protocol.org/why-privacy-matters-solana) | The case for privacy on the fastest blockchain |
| [Privacy for Humans](https://blog.sip-protocol.org/privacy-for-humans) | Non-technical privacy explainer |
| [Wallet Surveillance Exposed](https://blog.sip-protocol.org/wallet-surveillance-exposed) | How your wallet activity is tracked |

### Technical Deep-Dives

| Post | Description |
|------|-------------|
| [Noir ZK Proofs on Solana](https://blog.sip-protocol.org/noir-zk-proofs-solana) | Our Noir circuit implementation |
| [Stealth Addresses for Humans](https://blog.sip-protocol.org/stealth-addresses-for-humans) | DKSAP explained simply |
| [Viewing Keys TLDR](https://blog.sip-protocol.org/viewing-keys-tldr) | Selective disclosure for compliance |

### Competitive Analysis

| Post | Description |
|------|-------------|
| [SIP vs PrivacyCash](https://blog.sip-protocol.org/sip-vs-privacycash) | Cryptographic privacy vs pool mixing |
| [a16z Big Ideas 2026 Validates SIP](https://blog.sip-protocol.org/a16z-big-ideas-2026-validates-sip) | Industry validation of our thesis |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/sip-protocol/blog-sip.git
cd blog-sip

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:4321
```

---

## ✍️ Writing Posts

### 1. Create a Post

```bash
# Create new post file
touch src/content/blog/my-new-post.mdx
```

### 2. Add Frontmatter

```yaml
---
title: 'Your Post Title'
description: 'Brief description for SEO (max 160 chars)'
pubDate: '2026-02-01'
category: 'technical'
tags: ['privacy', 'solana', 'stealth-addresses']

# LLMO (AI discoverability)
tldr: 'One-line summary for AI (max 280 chars)'
keyTakeaways:
  - 'Key point 1'
  - 'Key point 2'
  - 'Key point 3'
targetAudience: 'Developers building privacy features'

# Optional
heroImage: './images/hero.png'
author: 'SIP Protocol Team'
readingTime: 5
featured: false
relatedPosts:
  - 'stealth-addresses-for-humans'
  - 'viewing-keys-tldr'
---
```

### 3. Write Content

```mdx
import Callout from '../components/Callout.astro'
import CodeBlock from '../components/CodeBlock.astro'

# Introduction

Your content here...

<Callout type="info">
  Important note for readers
</Callout>

## Code Example

<CodeBlock language="typescript">
{`const sip = new SIP({ network: 'mainnet' })`}
</CodeBlock>
```

### 4. Preview & Publish

```bash
# Preview locally
npm run dev

# Build to check for errors
npm run build

# Commit and push
git add . && git commit -m "feat(blog): add new post" && git push
```

---

## 🏗️ Architecture

### Project Structure

```
blog-sip/
├── src/
│   ├── content/
│   │   ├── blog/                 # Blog posts (34 MDX files)
│   │   │   ├── why-privacy-matters-solana.md
│   │   │   ├── stealth-addresses-for-humans.md
│   │   │   ├── noir-zk-proofs-solana.md
│   │   │   └── ...
│   │   ├── authors/              # Author profiles
│   │   └── config.ts             # Content collections schema
│   │
│   ├── components/
│   │   ├── Callout.astro         # Info/warning/tip boxes
│   │   ├── CodeBlock.astro       # Syntax-highlighted code
│   │   ├── TLDRBox.astro         # TLDR summary component
│   │   ├── PostCard.astro        # Blog post preview card
│   │   └── ...
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro      # Site-wide layout
│   │   └── PostLayout.astro      # Blog post layout
│   │
│   ├── pages/
│   │   ├── index.astro           # Homepage
│   │   ├── blog/[...slug].astro  # Dynamic post routes
│   │   ├── tags/[tag].astro      # Tag archives
│   │   ├── category/[cat].astro  # Category archives
│   │   └── rss.xml.ts            # RSS feed
│   │
│   └── styles/
│       └── global.css            # Tailwind + custom styles
│
├── public/
│   ├── images/                   # Static images
│   └── favicon.svg               # Site icon
│
├── astro.config.mjs              # Astro configuration
├── tailwind.config.js            # Tailwind configuration
└── package.json                  # Dependencies
```

### Content Flow

```
MDX File → Content Collection → Astro Page → Static HTML
    │              │                │             │
    │              ▼                │             │
    │      Schema Validation       │             │
    │      (frontmatter)           │             │
    │              │                │             │
    └──────────────┴────────────────┴─────────────┘
```

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Astro 5 | Static site generator |
| **Content** | MDX | Markdown + components |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Typography** | @tailwindcss/typography | Prose styling |
| **Search** | Pagefind | Static search index |
| **RSS** | @astrojs/rss | Feed generation |
| **Sitemap** | @astrojs/sitemap | SEO sitemap |
| **OG Images** | astro-og-canvas | Dynamic social images |
| **Syntax** | Shiki | Code highlighting |

---

## ✨ Features

### 📖 Content Features
- **34 published posts** across 5 categories
- **MDX support** for interactive components
- **Related posts** for discovery
- **Reading time** estimates
- **Tag & category** archives

### 🔍 SEO & Discovery
- **LLMO optimized** for AI discoverability
- **RSS feed** for subscribers
- **Sitemap** for search engines
- **OG images** for social sharing
- **JSON-LD** structured data

### ⚡ Performance
- **Static generation** for fast loads
- **Pagefind search** (client-side, no server)
- **Optimized images** with Sharp
- **Minimal JavaScript** (Astro islands)

### 🎨 Design
- **Dark mode** by default
- **Mobile responsive**
- **Typography optimized** for reading
- **Syntax highlighting** for code

---

## 💻 Development

### Commands

```bash
npm run dev           # Start dev server (localhost:4321)
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Lint with ESLint
npm run lint:fix      # Fix lint errors
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```

### Adding Components

```astro
---
// src/components/MyComponent.astro
interface Props {
  title: string
  type?: 'info' | 'warning' | 'tip'
}

const { title, type = 'info' } = Astro.props
---

<div class={`callout callout-${type}`}>
  <h3>{title}</h3>
  <slot />
</div>
```

### Using in MDX

```mdx
import MyComponent from '../components/MyComponent.astro'

<MyComponent title="Note" type="info">
  This is a custom callout component.
</MyComponent>
```

---

## 🚀 Deployment

### Docker (Production)

```bash
# Build Docker image
docker build -t blog-sip .

# Run locally
docker run -p 4321:80 blog-sip
```

### VPS Configuration

| Service | Port | Domain |
|---------|------|--------|
| blog-sip | 5004 | blog.sip-protocol.org |

```yaml
# docker-compose.yml (on VPS)
name: sip-blog

services:
  blog:
    image: ghcr.io/sip-protocol/blog-sip:latest
    container_name: sip-blog
    ports:
      - "5004:80"
    restart: unless-stopped
```

### CI/CD Pipeline

```
Push to main → GitHub Actions → Build Astro → Build Docker → Push GHCR → SSH Deploy
```

---

## 🔗 Related Projects

| Project | Description | Link |
|---------|-------------|------|
| **sip-protocol** | Core SDK (reference for technical content) | [GitHub](https://github.com/sip-protocol/sip-protocol) |
| **docs-sip** | Documentation (complements blog) | [docs.sip-protocol.org](https://docs.sip-protocol.org) |
| **sip-website** | Marketing website | [sip-protocol.org](https://sip-protocol.org) |
| **sip-app** | Privacy application | [app.sip-protocol.org](https://app.sip-protocol.org) |

---

## 📄 License

[MIT License](LICENSE) — see LICENSE file for details.

---

<div align="center">

**34 Posts Published** | **Privacy Thought Leadership for Web3**

*Privacy is not a feature. It's a right.*

[Read the Blog](https://blog.sip-protocol.org) · [RSS Feed](https://blog.sip-protocol.org/rss.xml) · [Contribute](https://github.com/sip-protocol/blog-sip/issues)

*Part of the [SIP Protocol](https://github.com/sip-protocol) ecosystem*

</div>
