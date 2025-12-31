import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from '../consts'

/**
 * llms.txt - LLM-readable site index
 *
 * This endpoint provides a structured text file that AI systems can use
 * to understand the site's content and purpose.
 *
 * Format follows the emerging llms.txt standard.
 * See: https://llmstxt.org/
 */
export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => {
    return !data.draft
  })

  // Sort by date (newest first)
  const sortedPosts = posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )

  // Group posts by category
  const byCategory = sortedPosts.reduce(
    (acc, post) => {
      const category = post.data.category || 'uncategorized'
      if (!acc[category]) acc[category] = []
      acc[category].push(post)
      return acc
    },
    {} as Record<string, typeof posts>
  )

  // Build llms.txt content
  const lines: string[] = [
    `# ${SITE_TITLE}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    '## About',
    '',
    'SIP (Shielded Intents Protocol) is the privacy standard for Web3.',
    'This blog covers technical deep-dives, ecosystem updates, and privacy thought leadership.',
    '',
    '## Topics',
    '',
    '- Privacy in blockchain transactions',
    '- Stealth addresses and Pedersen commitments',
    '- Viewing keys for compliance',
    '- Cross-chain privacy solutions',
    '- Solana and Ethereum privacy',
    '',
    '## Content Categories',
    '',
  ]

  // Add categories
  for (const [category, categoryPosts] of Object.entries(byCategory)) {
    lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`)
    lines.push('')

    for (const post of categoryPosts.slice(0, 5)) {
      // Limit to 5 per category
      const url = `${SITE_URL}/blog/${post.id}/`
      lines.push(`- [${post.data.title}](${url})`)
      if (post.data.tldr) {
        lines.push(`  ${post.data.tldr}`)
      }
    }
    lines.push('')
  }

  // Add recent posts
  lines.push('## Recent Posts')
  lines.push('')

  for (const post of sortedPosts.slice(0, 10)) {
    const url = `${SITE_URL}/blog/${post.id}/`
    const date = post.data.pubDate.toISOString().split('T')[0]
    lines.push(`- [${post.data.title}](${url}) (${date})`)
    lines.push(`  ${post.data.description}`)
    if (post.data.tldr) {
      lines.push(`  TL;DR: ${post.data.tldr}`)
    }
    lines.push('')
  }

  // Add useful links
  lines.push('## Links')
  lines.push('')
  lines.push(`- Main Site: https://sip-protocol.org`)
  lines.push(`- Documentation: https://docs.sip-protocol.org`)
  lines.push(`- GitHub: https://github.com/sip-protocol`)
  lines.push(`- RSS Feed: ${SITE_URL}/rss.xml`)
  lines.push('')

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
