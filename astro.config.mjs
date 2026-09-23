// @ts-check
import { unified } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import node from '@astrojs/node'
import vercel from '@astrojs/vercel'

// Vercel sets VERCEL=1 during its builds. There we use the Vercel adapter
// (prerenders the static routes and compiles the /api/newsletter endpoint into a
// serverless function). Everywhere else — local dev and the VPS Docker image built
// by deploy.yml — we keep the Node standalone server so the VPS remains a working
// rollback target during the DNS cutover window.
const adapter = process.env.VERCEL ? vercel() : node({ mode: 'standalone' })

const markdownPlugins = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    [
      rehypeAutolinkHeadings,
      {
        behavior: 'wrap',
        properties: {
          className: ['anchor-link'],
        },
      },
    ],
  ],
}

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.sip-protocol.org',
  adapter,

  integrations: [mdx(), sitemap()],

  markdown: {
    // Astro 7 defaults to the Sätteri pipeline; stay on the unified pipeline so
    // the remark/rehype plugins keep working. MDX inherits them from the processor.
    processor: unified(markdownPlugins),
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
