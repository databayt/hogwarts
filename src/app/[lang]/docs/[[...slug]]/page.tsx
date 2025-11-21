import { notFound } from "next/navigation"
import { DocsTableOfContents } from "@/components/docs/toc"
import { source } from "@/lib/source"
import { mdxComponents } from "../../../../../mdx-components"
import type { Metadata } from "next"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { findNeighbour } from "fumadocs-core/page-tree"

interface DocsPageProps {
  params: Promise<{
    lang: string
    slug?: string[]
  }>
}

export const revalidate = false
export const dynamic = "force-static"
export const dynamicParams = false

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
    notFound()
  }

  const { title, description } = page.data
  const toc = (page.data as any).toc || []
  const Content = (page.data as any).body || (page.data as any).default || (page.data as any).content

  // Find neighbor pages for navigation
  const neighbours = findNeighbour(source.pageTree, page.url)

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

  const transformedNeighbours = {
    previous: neighbours.previous ? {
      ...neighbours.previous,
      url: transformUrl(neighbours.previous.url)
    } : undefined,
    next: neighbours.next ? {
      ...neighbours.next,
      url: transformUrl(neighbours.next.url)
    } : undefined,
  }

  const isRTL = lang === 'ar'

  return (
    <div className="flex items-stretch text-[1.05rem] sm:text-[15px] xl:w-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-(--top-spacing) shrink-0" />
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-1 flex-col gap-8 px-4 py-6 text-neutral-800 md:px-0 lg:py-8 dark:text-neutral-300">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <h1 className="scroll-m-20 text-4xl font-semibold tracking-tight sm:text-3xl xl:text-4xl">
                  {title}
                </h1>
                <div className="docs-nav bg-background/80 border-border/50 fixed inset-x-0 bottom-0 isolate z-50 flex items-center gap-2 border-t px-6 py-4 backdrop-blur-sm sm:static sm:z-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:pt-1.5 sm:backdrop-blur-none">
                  {transformedNeighbours.previous && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="extend-touch-target ml-auto size-8 shadow-none md:size-7"
                      asChild
                    >
                      <Link href={transformedNeighbours.previous.url}>
                        {isRTL ? <ChevronRight /> : <ChevronLeft />}
                        <span className="sr-only">Previous</span>
                      </Link>
                    </Button>
                  )}
                  {transformedNeighbours.next && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="extend-touch-target size-8 shadow-none md:size-7"
                      asChild
                    >
                      <Link href={transformedNeighbours.next.url}>
                        <span className="sr-only">Next</span>
                        {isRTL ? <ChevronLeft /> : <ChevronRight />}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              {description && (
                <p className="text-muted-foreground text-[1.05rem] text-balance sm:text-base">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="w-full flex-1 *:data-[slot=alert]:first:mt-0">
            {Content ? (
              typeof Content === 'function' ? <Content components={mdxComponents} /> : Content
            ) : (
              <div className="text-muted-foreground">
                {isRTL ? 'محتوى الصفحة غير متوفر' : 'Page content not available'}
              </div>
            )}
          </div>
        </div>
        <div className="mx-auto hidden h-16 w-full max-w-2xl items-center gap-2 px-4 sm:flex md:px-0">
          {transformedNeighbours.previous && (
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="shadow-none"
            >
              <Link href={transformedNeighbours.previous.url}>
                {isRTL ? (
                  <>
                    {transformedNeighbours.previous.name} <ChevronRight />
                  </>
                ) : (
                  <>
                    <ChevronLeft /> {transformedNeighbours.previous.name}
                  </>
                )}
              </Link>
            </Button>
          )}
          {transformedNeighbours.next && (
            <Button
              variant="secondary"
              size="sm"
              className="ml-auto shadow-none"
              asChild
            >
              <Link href={transformedNeighbours.next.url}>
                {isRTL ? (
                  <>
                    <ChevronLeft /> {transformedNeighbours.next.name}
                  </>
                ) : (
                  <>
                    {transformedNeighbours.next.name} <ChevronRight />
                  </>
                )}
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div className="sticky top-[calc(var(--header-height)+1px)] z-30 ml-auto hidden h-[calc(100svh-var(--footer-height)+2rem)] w-72 flex-col gap-4 overflow-hidden overscroll-none pb-8 xl:flex">
        <div className="h-(--top-spacing) shrink-0" />
        {toc?.length ? (
          <div className="no-scrollbar overflow-y-auto px-8">
            <DocsTableOfContents toc={toc} />
            <div className="h-12" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
