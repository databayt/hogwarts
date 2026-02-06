import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { mdxComponents } from "@/mdx-components"
import fm from "front-matter"
import { findNeighbour } from "fumadocs-core/page-tree"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"
import z from "zod"

import { docsArabicSource, docsSource } from "@/lib/source"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DocsCopyPage } from "@/components/docs/docs-copy-page"
import { DocsTableOfContents } from "@/components/docs/toc"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

// Force rebuild: 2025-12-07
export const runtime = "nodejs"
export const revalidate = false
export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  const enParams = docsSource
    .generateParams()
    .map((p) => ({ ...p, lang: "en" }))
  const arParams = docsArabicSource
    .generateParams()
    .map((p) => ({ ...p, lang: "ar" }))
  return [...enParams, ...arParams]
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[]; lang: string }>
}): Promise<Metadata> {
  const params = await props.params
  const source = params.lang === "ar" ? docsArabicSource : docsSource
  const page = source.getPage(params.slug)

  if (!page) {
    notFound()
  }

  const doc = page.data

  if (!doc.title || !doc.description) {
    notFound()
  }

  return {
    title: doc.title,
    description: doc.description,
    openGraph: {
      title: doc.title,
      description: doc.description,
      type: "article",
      url: `https://ed.databayt.org${page.url}`,
    },
  }
}

export default async function DocsPage(props: {
  params: Promise<{ slug?: string[]; lang: string }>
}) {
  const params = await props.params
  const source = params.lang === "ar" ? docsArabicSource : docsSource
  const page = source.getPage(params.slug)
  const dictionary = await getDictionary(params.lang as Locale)

  if (!page) {
    notFound()
  }

  const doc = page.data
  const MDX = doc.body
  const neighbours = findNeighbour(source.pageTree, page.url)

  const raw = (await (page.data as any).exports?.getText?.("raw")) || ""
  const pageUrl = `https://ed.databayt.org${page.url}`

  const { attributes } = fm(raw)
  const { links } = z
    .object({
      links: z
        .object({
          doc: z.string().optional(),
          api: z.string().optional(),
        })
        .optional(),
    })
    .parse(attributes || {})

  return (
    <div className="flex items-stretch text-[1.05rem] sm:text-[15px] xl:w-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-(--top-spacing) shrink-0" />
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-1 flex-col gap-8 py-6 text-neutral-800 lg:py-8 dark:text-neutral-300">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <h1 className="scroll-m-20 text-4xl font-semibold tracking-tight sm:text-3xl xl:text-4xl">
                  {doc.title}
                </h1>
                <div className="docs-nav bg-background/80 border-border/50 fixed inset-x-0 bottom-0 isolate z-50 flex items-center gap-2 border-t px-6 py-4 backdrop-blur-sm sm:static sm:z-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:pt-1.5 sm:backdrop-blur-none">
                  <DocsCopyPage
                    page={raw}
                    url={pageUrl}
                    dictionary={dictionary}
                  />
                  {neighbours.previous && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="extend-touch-target ms-auto size-8 shadow-none md:size-7"
                      asChild
                    >
                      <Link href={neighbours.previous.url}>
                        <ArrowLeft />
                        <span className="sr-only">
                          {dictionary?.common?.previous || "Previous"}
                        </span>
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
                        <span className="sr-only">
                          {dictionary?.common?.next || "Next"}
                        </span>
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
            {links ? (
              <div className="flex items-center gap-2 pt-4">
                {links?.doc && (
                  <Badge asChild variant="secondary" className="rounded-full">
                    <a href={links.doc} target="_blank" rel="noreferrer">
                      Docs <ArrowUpRight className="ms-1 h-3 w-3" />
                    </a>
                  </Badge>
                )}
                {links?.api && (
                  <Badge asChild variant="secondary" className="rounded-full">
                    <a href={links.api} target="_blank" rel="noreferrer">
                      API Reference <ArrowUpRight className="ms-1 h-3 w-3" />
                    </a>
                  </Badge>
                )}
              </div>
            ) : null}
          </div>
          <div className="w-full flex-1 *:data-[slot=alert]:first:mt-0">
            <MDX components={mdxComponents} />
          </div>
        </div>
        <div className="mx-auto hidden h-16 w-full max-w-2xl items-center gap-2 sm:flex">
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
              className="ms-auto shadow-none"
              asChild
            >
              <Link href={neighbours.next.url}>
                {neighbours.next.name} <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      </div>
      <div className="sticky top-[calc(var(--header-height)+2rem)] z-30 ms-auto hidden h-[calc(100vh-var(--header-height)-4rem)] w-72 flex-col gap-4 overflow-hidden pb-8 xl:flex">
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
