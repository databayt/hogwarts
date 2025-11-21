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
  // Transform URLs from /docs/en/... to /en/docs/...
  const transformUrl = (url: string) => {
    if (url.startsWith('/docs/')) {
      const afterDocs = url.substring(6) // Remove '/docs/'
      const parts = afterDocs.split('/')
      if (parts.length > 0 && parts[0]) {
        const pageLang = parts.shift() // Remove language from path
        const rest = parts.join('/')
        return `/${pageLang}/docs${rest ? '/' + rest : ''}`
      }
    }
    return url
  }

  // Build a simple page tree from available pages
  const pages = getPages()
  const langPages = pages.filter(p => {
    // Filter by language - check if slugs start with the language
    return p.slugs && p.slugs.length > 0 && p.slugs[0] === lang
  })

  const tree = {
    name: lang === 'ar' ? 'التوثيق' : 'Documentation',
    children: langPages.map(page => ({
      type: 'page' as const,
      name: page.data.title || 'Untitled',
      url: transformUrl(page.url)
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