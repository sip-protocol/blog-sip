/**
 * Category gradient colors for visual distinction
 */

export interface CategoryStyle {
  gradient: string
  bg: string
  border: string
}

const categoryStyles: Record<string, CategoryStyle> = {
  technical: {
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    bg: 'rgba(99, 102, 241, 0.1)',
    border: 'rgba(99, 102, 241, 0.3)',
  },
  announcements: {
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.3)',
  },
  tutorials: {
    gradient: 'linear-gradient(135deg, #22c55e, #14b8a6)',
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.3)',
  },
  ecosystem: {
    gradient: 'linear-gradient(135deg, #f97316, #eab308)',
    bg: 'rgba(249, 115, 22, 0.1)',
    border: 'rgba(249, 115, 22, 0.3)',
  },
  'thought-leadership': {
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    bg: 'rgba(236, 72, 153, 0.1)',
    border: 'rgba(236, 72, 153, 0.3)',
  },
  research: {
    gradient: 'linear-gradient(135deg, #a855f7, #d946ef)',
    bg: 'rgba(168, 85, 247, 0.1)',
    border: 'rgba(168, 85, 247, 0.3)',
  },
  security: {
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
  },
}

// Default style for unknown categories
const defaultStyle: CategoryStyle = {
  gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  bg: 'rgba(99, 102, 241, 0.1)',
  border: 'rgba(99, 102, 241, 0.3)',
}

export function getCategoryStyle(category: string): CategoryStyle {
  const normalizedCategory = category.toLowerCase().trim()
  return categoryStyles[normalizedCategory] || defaultStyle
}

export function getCategoryGradient(category: string): string {
  return getCategoryStyle(category).gradient
}
