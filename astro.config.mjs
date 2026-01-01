// @ts-check
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import node from '@astrojs/node'

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.sip-protocol.org',
  adapter: node({
    mode: 'standalone',
  }),

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
