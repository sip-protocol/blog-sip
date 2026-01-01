/**
 * Calculate estimated reading time for content
 * Based on average reading speed of 200 words per minute
 */

const WORDS_PER_MINUTE = 200

export function getReadingTime(content: string): number {
  // Remove HTML tags, code blocks, and extra whitespace
  const text = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove markdown images
    .replace(/#{1,6}\s/g, '') // Remove heading markers
    .replace(/[*_~`]/g, '') // Remove formatting chars
    .trim()

  const words = text.split(/\s+/).filter((word) => word.length > 0).length
  const minutes = Math.ceil(words / WORDS_PER_MINUTE)

  // Minimum 1 minute
  return Math.max(1, minutes)
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`
}
