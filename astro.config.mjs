// @ts-check
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
const adapter = process.env.VERCEL
  ? vercel({
      webAnalytics: {
        enabled: true,
      },
    })
  : node({ mode: 'standalone' })

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.sip-protocol.org',
  adapter,

  integrations: [
    mdx({
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
    }),
    sitemap(),
  ],

  markdown: {
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
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
