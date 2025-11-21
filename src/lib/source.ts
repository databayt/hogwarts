import { loader } from 'fumadocs-core/source'
import { docs } from '@/.source'

// Export loader with i18n support for Arabic and English
export const { getPage, getPages, getLanguages } = loader({
  baseUrl: '/docs',
  source: docs,
  languages: [
    { code: 'ar', name: 'العربية' },
    { code: 'en', name: 'English' },
  ],
  defaultLanguage: 'ar',
})

// Export page tree for navigation - will be generated from actual content
export const pageTree = { name: 'Docs', children: [] }

// Helper function to get page tree for a specific language
export function getPageTree(lang: 'ar' | 'en') {
  // For now, return a basic tree structure
  // This will be populated when we have actual MDX content
  return {
    name: 'Docs',
    children: []
  }
}

// Helper to find neighbor pages for navigation
export function findNeighbour(
  url: string,
  lang: 'ar' | 'en'
): { previous?: { name: string; url: string }; next?: { name: string; url: string } } {
  const pages = getPages()
  const currentIndex = pages.findIndex(p => p.url === url)

  return {
    previous: currentIndex > 0 ? {
      name: pages[currentIndex - 1].data.title || 'Previous',
      url: pages[currentIndex - 1].url
    } : undefined,
    next: currentIndex < pages.length - 1 ? {
      name: pages[currentIndex + 1].data.title || 'Next',
      url: pages[currentIndex + 1].url
    } : undefined,
  }
}