import { getCollection } from 'astro:content'
import { OGImageRoute } from 'astro-og-canvas'

const posts = await getCollection('blog')

const pages = Object.fromEntries(
  posts.map((post) => [
    post.id,
    {
      title: post.data.title,
      description: post.data.description,
      category: post.data.category,
    },
  ])
)

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'slug',
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    logo: {
      path: './public/favicon.svg',
      size: [60],
    },
    bgGradient: [[30, 27, 75], [49, 46, 129], [67, 56, 202]],
    border: {
      color: [99, 102, 241],
      width: 10,
      side: 'inline-start',
    },
    font: {
      title: {
        color: [255, 255, 255],
        size: 60,
        lineHeight: 1.2,
        families: ['Inter', 'sans-serif'],
        weight: 'Bold',
      },
      description: {
        color: [255, 255, 255, 0.8],
        size: 28,
        lineHeight: 1.4,
        families: ['Inter', 'sans-serif'],
      },
    },
    fonts: [
      'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff2',
      'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff2',
    ],
  }),
})
