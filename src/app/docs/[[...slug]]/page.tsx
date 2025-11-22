import { notFound } from "next/navigation"
import { cookies } from 'next/headers'
import { DocsTableOfContents } from "@/components/docs/toc"
import { DocsCopyPage } from "@/components/docs/docs-copy-page"
import { getPage, getPages, findNeighbour } from "@/lib/source"
import { MDXContent } from "@/components/mdx/mdx-content"
import type { Metadata } from "next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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

  // Get raw content for copy button
  const raw = (page.data as any).raw || ''
  const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ed.databayt.org'}${url}`

  // Find neighbor pages for navigation
  const neighbours = findNeighbour(url, lang)

  return (
    <div className="flex items-stretch text-[1.05rem] sm:text-[15px] xl:w-full">
      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-(--top-spacing) shrink-0" />

        {/* Content Container */}
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-1 flex-col gap-8 px-4 py-6 text-neutral-800 md:px-0 lg:py-8 dark:text-neutral-300">

          {/* Header Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              {/* Title */}
              <h1 className="scroll-m-20 text-4xl font-semibold tracking-tight sm:text-3xl xl:text-4xl">
                {title}
              </h1>

              {/* Copy Page Button + Navigation (Mobile: Fixed Bottom, Desktop: Static Top) */}
              <div className="docs-nav bg-background/80 border-border/50 fixed inset-x-0 bottom-0 isolate z-50 flex items-center gap-2 border-t px-6 py-4 backdrop-blur-sm sm:static sm:z-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:pt-1.5 sm:backdrop-blur-none">
                <DocsCopyPage page={raw} url={pageUrl} />
                {neighbours.previous && (
                  <Button variant="secondary" size="icon" asChild className="h-8 w-8 shadow-none md:h-7 md:w-7">
                    <Link href={neighbours.previous.url}>
                      <ArrowLeft className="size-4" />
                    </Link>
                  </Button>
                )}
                {neighbours.next && (
                  <Button variant="secondary" size="icon" asChild className="h-8 w-8 shadow-none md:h-7 md:w-7">
                    <Link href={neighbours.next.url}>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Description */}
            {description && (
              <p className="text-muted-foreground text-[1.05rem] text-balance sm:text-base">
                {description}
              </p>
            )}
          </div>

          {/* MDX Content */}
          <div className="w-full flex-1">
            {Content ? (
              <MDXContent>
                {typeof Content === 'function' ? <Content /> : Content}
              </MDXContent>
            ) : null}
          </div>
        </div>

        {/* Desktop Footer Navigation */}
        <div className="mx-auto hidden h-16 w-full max-w-2xl items-center gap-2 px-4 sm:flex md:px-0">
          {neighbours.previous && (
            <Button variant="secondary" size="sm" asChild className="shadow-none">
              <Link href={neighbours.previous.url}>
                <ArrowLeft className="size-4" /> {neighbours.previous.name}
              </Link>
            </Button>
          )}
          {neighbours.next && (
            <Button variant="secondary" size="sm" asChild className="shadow-none">
              <Link href={neighbours.next.url}>
                {neighbours.next.name} <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Table of Contents (Right Side) */}
      <div className="sticky top-[calc(var(--header-height)+2rem)] z-30 ml-auto hidden h-[calc(100vh-var(--header-height)-4rem)] w-72 flex-col gap-4 overflow-hidden pb-8 xl:flex">
        <div className="h-(--top-spacing) shrink-0" />
        {toc?.length ? (
          <div className="no-scrollbar overflow-y-auto px-8">
            <DocsTableOfContents toc={toc} />
          </div>
        ) : null}
      </div>
    </div>
  )
}