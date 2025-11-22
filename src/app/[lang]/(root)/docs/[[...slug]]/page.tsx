import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { findNeighbour } from "fumadocs-core/page-tree"
import type { Metadata } from "next"
import { source } from "@/lib/source"
import { DocsTableOfContents } from "@/components/docs/toc"
import { DocsCopyPage } from "@/components/docs/docs-copy-page"
import { Button } from "@/components/ui/button"
import { mdxComponents } from "../../../../../../mdx-components"

export const runtime = "nodejs";
export const revalidate = false
export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  // Generate params for both languages
  const params = []

  // Root docs pages for each language
  params.push({ lang: 'en', slug: undefined })
  params.push({ lang: 'ar', slug: undefined })

  // Getting started pages
  params.push({ lang: 'en', slug: ['getting-started'] })
  params.push({ lang: 'ar', slug: ['getting-started'] })

  return params
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[]; lang: string }>
}): Promise<Metadata> {
  const params = await props.params
  const { lang, slug } = params

  // Construct path: lang/slug or just lang for root
  const fullPath = slug ? [lang, ...slug] : [lang]
  const page = source.getPage(fullPath)

  if (!page) {
    return { title: 'Not Found' }
  }

  const doc = page.data

  return {
    title: doc.title || 'Documentation',
    description: doc.description || '',
    openGraph: {
      title: doc.title || 'Documentation',
      description: doc.description || '',
      type: "article",
      url: `https://ed.databayt.org/${lang}/docs${slug ? '/' + slug.join('/') : ''}`,
    },
  }
}

export default async function DocsPage(props: {
  params: Promise<{ slug?: string[]; lang: string }>
}) {
  const params = await props.params
  const { lang, slug } = params

  // Construct path: lang/slug or just lang for root
  const fullPath = slug ? [lang, ...slug] : [lang]
  const page = source.getPage(fullPath)

  if (!page) {
    notFound()
  }

  const doc = page.data
  const MDX = doc.body
  const neighbours = findNeighbour(source.pageTree, page.url)

  // Get raw markdown content for copy functionality
  // Construct a simple text representation from the page data
  const raw = `# ${doc.title}\n\n${doc.description || ''}`
  const absoluteUrl = `https://ed.databayt.org/${lang}/docs${slug ? '/' + slug.join('/') : ''}`

  return (
    <div className="flex items-stretch text-[1.05rem] sm:text-[15px] xl:w-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-(--top-spacing) shrink-0" />
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-1 flex-col gap-8 px-4 py-6 text-neutral-800 md:px-0 lg:py-8 dark:text-neutral-300">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <h1 className="scroll-m-20 text-4xl font-semibold tracking-tight sm:text-3xl xl:text-4xl">
                  {doc.title}
                </h1>
                <div className="docs-nav bg-background/80 border-border/50 fixed inset-x-0 bottom-0 isolate z-50 flex items-center gap-2 border-t px-6 py-4 backdrop-blur-sm sm:static sm:z-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:pt-1.5 sm:backdrop-blur-none">
                  <DocsCopyPage page={raw} url={absoluteUrl} />
                  {neighbours.previous && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="extend-touch-target ml-auto size-8 shadow-none md:size-7"
                      asChild
                    >
                      <Link href={neighbours.previous.url}>
                        <ArrowLeft />
                        <span className="sr-only">Previous</span>
                      </Link>
                    </Button>
                  )}
                  {neighbours.next && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="extend-touch-target size-8 shadow-none md:size-7"
                      asChild
                    >
                      <Link href={neighbours.next.url}>
                        <span className="sr-only">Next</span>
                        <ArrowRight />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              {doc.description && (
                <p className="text-muted-foreground text-[1.05rem] text-balance sm:text-base">
                  {doc.description}
                </p>
              )}
            </div>
          </div>
          <div className="w-full flex-1 *:data-[slot=alert]:first:mt-0">
            <MDX components={mdxComponents} />
          </div>
        </div>
        <div className="mx-auto hidden h-16 w-full max-w-2xl items-center gap-2 px-4 sm:flex md:px-0">
          {neighbours.previous && (
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="shadow-none"
            >
              <Link href={neighbours.previous.url}>
                <ArrowLeft /> {neighbours.previous.name}
              </Link>
            </Button>
          )}
          {neighbours.next && (
            <Button
              variant="secondary"
              size="sm"
              className="ml-auto shadow-none"
              asChild
            >
              <Link href={neighbours.next.url}>
                {neighbours.next.name} <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div className="sticky top-[calc(var(--header-height)+1px)] z-30 ml-auto hidden h-[calc(100svh-var(--footer-height)+2rem)] w-72 flex-col gap-4 overflow-hidden overscroll-none pb-8 xl:flex">
        <div className="h-(--top-spacing) shrink-0" />
        {doc.toc?.length ? (
          <div className="no-scrollbar overflow-y-auto px-8">
            <DocsTableOfContents toc={doc.toc} />
            <div className="h-12" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
