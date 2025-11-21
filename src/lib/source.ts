import { loader } from 'fumadocs-core/source'
import { docs } from '../../.source'

// Create the source loader following shadcn v4 pattern
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
})

// Re-export the functions for compatibility
export const { getPage, getPages, getLanguages } = source

// Export page tree for navigation - default to Arabic
export const pageTree = { name: 'Docs', children: [] }

// Helper function to get page tree for a specific language
export function getPageTree(lang: 'ar' | 'en') {
  // Build a simple page tree from available pages
  const pages = getPages()
  const langPages = pages.filter(p => p.url.startsWith(`/docs`))

  const tree = {
    name: lang === 'ar' ? 'التوثيق' : 'Documentation',
    children: langPages.map(page => ({
      type: 'page' as const,
      name: page.data.title || 'Untitled',
      url: page.url
    }))
  }

  return tree
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