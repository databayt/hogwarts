import { notFound } from "next/navigation"
import { DocsTableOfContents } from "@/components/docs/toc"
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsMobileNav } from "@/components/docs/docs-mobile-nav"
import { source } from "@/lib/source"
import { MDXContent } from "@/components/mdx/mdx-content"
import type { Metadata } from "next"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DocsPageProps {
  params: Promise<{
    lang: string
    slug?: string[]
  }>
}

// Generate static params for all doc pages
export function generateStaticParams() {
  // Get all pages from source
  const allPages = source.generateParams()

  // Transform to include language in params
  const params = []

  for (const page of allPages) {
    // The page.slug from source includes language prefix (e.g., ['ar', 'getting-started'])
    // We need to split it into lang and slug
    if (page.slug && page.slug.length > 0) {
      const [lang, ...rest] = page.slug
      if (lang === 'ar' || lang === 'en') {
        params.push({
          lang,
          slug: rest.length > 0 ? rest : undefined
        })
      }
    }
  }

  // Add root pages for each language if not already included
  if (!params.some(p => p.lang === 'ar' && !p.slug)) {
    params.push({ lang: 'ar', slug: undefined })
  }
  if (!params.some(p => p.lang === 'en' && !p.slug)) {
    params.push({ lang: 'en', slug: undefined })
  }

  return params
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: DocsPageProps): Promise<Metadata> {
  const { lang, slug } = await params

  // Construct the full slug for source.getPage
  // Note: fumadocs strips trailing 'index' from paths, so en/index.mdx becomes slug ['en']
  const fullSlug = slug ? [lang, ...slug] : [lang]
  const page = source.getPage(fullSlug)

  if (!page) {
    return { title: 'Not Found' }
  }

  const { title, description } = page.data

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: page.url,
    },
  }
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { lang, slug } = await params
  const segments = slug ? [...slug] : []

  // Construct the full slug for source.getPage
  // Note: fumadocs strips trailing 'index' from paths, so en/index.mdx becomes slug ['en']
  const fullSlug = segments.length > 0
    ? [lang, ...segments]
    : [lang] // For root docs page, just use the language

  // Get the page from source
  const page = source.getPage(fullSlug)

  if (!page) {
    // Debug: List available pages
    const allPages = source.getPages()
    console.log('Available pages:', allPages.map(p => ({
      url: p.url,
      slugs: p.slugs
    })))
    console.log('Attempted slug:', fullSlug)
    notFound()
  }

  const { title, description } = page.data
  const toc = (page.data as any).toc || []
  const Content = (page.data as any).body || (page.data as any).default || (page.data as any).content

  // Find neighbor pages for navigation
  // Filter pages by language first to avoid mixing Arabic and English pages
  const allPages = source.getPages()
  const langPages = allPages.filter(p => {
    // Check if page belongs to current language
    return p.slugs && p.slugs.length > 0 && p.slugs[0] === lang
  })

  const currentIndex = langPages.findIndex(p =>
    p.slugs.join('/') === fullSlug.join('/')
  )

  // Transform URLs from /docs/en/... to /en/docs/...
  const transformUrl = (url: string) => {
    // URL format from fumadocs: /docs/en or /docs/en/getting-started
    // Transform to: /en/docs or /en/docs/getting-started
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

  const neighbours = {
    previous: currentIndex > 0 ? {
      name: langPages[currentIndex - 1].data.title || 'Previous',
      url: transformUrl(langPages[currentIndex - 1].url)
    } : undefined,
    next: currentIndex < langPages.length - 1 ? {
      name: langPages[currentIndex + 1].data.title || 'Next',
      url: transformUrl(langPages[currentIndex + 1].url)
    } : undefined,
  }

  const isRTL = lang === 'ar'

  return (
    <div className="container mx-auto">
      <div className="flex-1 md:grid md:grid-cols-[1fr_200px] md:gap-6 lg:grid-cols-[1fr_240px] lg:gap-10">
        <div className="flex flex-col">
          {/* Breadcrumb */}
          <DocsBreadcrumb
            segments={[
              { title: isRTL ? 'التوثيق' : 'Docs', href: `/${lang}/docs` },
              ...segments.map((s, i) => ({
                title: s.replace(/-/g, ' '),
                href: `/${lang}/docs/${segments.slice(0, i + 1).join('/')}`,
              })),
            ]}
          />

          {/* Page Title and Description */}
          <div className="space-y-2 py-6">
            <h1 className="scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="text-lg text-muted-foreground">{description}</p>
            )}
          </div>

          {/* MDX Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {Content ? (
              <MDXContent>
                {typeof Content === 'function' ? <Content /> : Content}
              </MDXContent>
            ) : (
              <div className="text-muted-foreground">
                {isRTL ? 'محتوى الصفحة غير متوفر' : 'Page content not available'}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex flex-row items-center justify-between py-8">
            {neighbours.previous && (
              <Link
                href={neighbours.previous.url}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isRTL && "flex-row-reverse"
                )}
              >
                {isRTL ? (
                  <>
                    <span>{neighbours.previous.name}</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4" />
                    <span>{neighbours.previous.name}</span>
                  </>
                )}
              </Link>
            )}
            {neighbours.next && (
              <Link
                href={neighbours.next.url}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isRTL && "flex-row-reverse",
                  !neighbours.previous && "ml-auto"
                )}
              >
                {isRTL ? (
                  <>
                    <ChevronLeft className="h-4 w-4" />
                    <span>{neighbours.next.name}</span>
                  </>
                ) : (
                  <>
                    <span>{neighbours.next.name}</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Table of Contents - Desktop */}
        <div className="hidden md:block">
          <DocsTableOfContents toc={toc} />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <DocsMobileNav neighbours={neighbours} lang={lang} />
    </div>
  )
}