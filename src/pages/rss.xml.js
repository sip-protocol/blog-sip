import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts'

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => {
    // Filter out drafts in production
    return import.meta.env.PROD ? !data.draft : true
  })

  // Sort by date (newest first)
  const sortedPosts = posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    language: 'en-us',
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags || [],
      author: post.data.author || 'SIP Protocol Team',
      // Custom fields
      customData: post.data.tldr
        ? `<content:encoded><![CDATA[<p><strong>TL;DR:</strong> ${post.data.tldr}</p>]]></content:encoded>`
        : undefined,
    })),
    // Custom XML namespace for content:encoded
    xmlns: {
      content: 'http://purl.org/rss/1.0/modules/content/',
    },
  })
}
