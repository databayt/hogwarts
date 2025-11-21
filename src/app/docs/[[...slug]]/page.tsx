import { notFound } from "next/navigation"
import { cookies } from 'next/headers'
import { DocsTableOfContents } from "@/components/docs/toc"
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsMobileNav } from "@/components/docs/docs-mobile-nav"
import { getPage, getPages, findNeighbour } from "@/lib/source"
import { MDXContent } from "@/components/mdx/mdx-content"
import type { Metadata } from "next"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DocsPageProps {
  params: Promise<{
    slug?: string[]
  }>
}

// Helper to get language from cookies
async function getLanguage(): Promise<'ar' | 'en'> {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || cookieStore.get('NEXT_LOCALE')?.value
  return (lang === 'en' ? 'en' : 'ar') as 'ar' | 'en'
}

// Generate static params for all doc pages (both languages)
export async function generateStaticParams() {
  // Generate params for both languages
  const params = []

  // Root docs pages
  params.push({ slug: undefined })

  // Getting started pages
  params.push({ slug: ['getting-started'] })

  // Add more pages as they are created
  // Since we generate for both languages at runtime, we don't need to duplicate here

  return params
}

// Generate metadata for the page
export async function generateMetadata({
  params,
}: DocsPageProps): Promise<Metadata> {
  const { slug } = await params
  const lang = await getLanguage()
  const path = slug ? slug.join('/') : ''
  const url = `/docs/${path}`

  const page = getPage([lang, ...slug || []])
  if (!page) return { title: 'Not Found' }

  const { title, description } = page.data

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: url,
    },
  }
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = await params
  const lang = await getLanguage()
  const segments = slug ? [...slug] : []

  // Build the URL path for the page
  const pagePath = segments.length > 0 ? segments.join('/') : 'index'
  const url = `/docs/${segments.join('/')}`

  // Try different path combinations to find the page
  let page = null

  // Try with full path including language and segments
  if (segments.length > 0) {
    page = getPage([lang, ...segments])
  } else {
    // For root docs page, try with language and 'index'
    page = getPage([lang, 'index'])
  }

  // If not found, try alternative paths
  if (!page && segments.length === 0) {
    page = getPage(['index']) // Try just index
  }

  if (!page) {
    page = getPage(segments) // Try without language
  }

  if (!page) {
    // As a fallback, list all available pages for debugging
    const allPages = getPages()
    console.log('Available pages:', allPages.map(p => p.url))
    console.log('Attempted path:', [lang, ...segments])
    notFound()
  }

  const { title, description } = page.data
  const toc = (page.data as any).toc || []
  // MDX content can be in different properties based on how it's exported
  const Content = (page.data as any).body || (page.data as any).default || (page.data as any).content

  // Find neighbor pages for navigation (update to use non-prefixed URLs)
  const neighbours = findNeighbour(url, lang)
  const isRTL = lang === 'ar'

  return (
    <div className="container mx-auto">
      <div className="flex-1 md:grid md:grid-cols-[1fr_200px] md:gap-6 lg:grid-cols-[1fr_240px] lg:gap-10">
        <div className="flex flex-col">
          {/* Breadcrumb */}
          <DocsBreadcrumb
            segments={[
              { title: isRTL ? 'التوثيق' : 'Docs', href: `/docs` },
              ...slug?.map((s, i) => ({
                title: s.replace(/-/g, ' '),
                href: `/docs/${slug.slice(0, i + 1).join('/')}`,
              })) || [],
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