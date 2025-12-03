import * as React from 'react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ComponentPreview } from "@/components/docs/component-preview"
import { ComponentSource } from "@/components/docs/component-source"
import { CodeTabs } from "@/components/docs/code-tabs"
import { CodeBlockCommand } from "@/components/docs/code-block-command"
import { CopyButton } from "@/components/docs/copy-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Docs components
import { DirectoryStructure } from "@/components/docs/directory-structure"
import { Structure } from "@/components/docs/structure"
import { PrismaStructure } from "@/components/docs/prisma-structure"
import { StoryVideo } from "@/components/docs/story-video"
// Atom components (available in hogwarts)
import { StickyScroll } from "@/components/atom/sticky-scroll"
import { ThemeProvider } from "@/components/atom/theme-provider"
import { InfiniteSlider } from "@/components/atom/infinite-slider"
import { InfiniteMovingCards as InfiniteCards } from "@/components/atom/infinite-cards"
import { ProgressiveBlur } from "@/components/atom/progressive-blur"
import { Faceted } from "@/components/atom/faceted"
import { HeaderSection } from "@/components/atom/header-section"
import { TabsNav } from "@/components/atom/tabs"
import Loading from "@/components/atom/loading"
import { GradientAnimation } from "@/components/atom/gradient-animation"

// This file is required to use MDX in `app` directory.

// Create a default dictionary for MDX components that require it
const defaultDictionary = {
  locale: 'en',
  cards: {},
} as any

const mdxComponents = {
    // Allows customizing built-in components, e.g. to add styling.
    h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1
        className={cn(
          "font-heading mt-2 scroll-m-28 text-3xl font-bold tracking-tight",
          className
        )}
        {...props}
      />
    ),
    h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      return (
        <h2
          id={props.children
            ?.toString()
            .replace(/ /g, "-")
            .replace(/'/g, "")
            .replace(/\?/g, "")
            .toLowerCase()}
          className={cn(
            "font-heading [&+]*:[code]:text-xl mt-10 scroll-m-28 text-xl font-medium tracking-tight first:mt-0 lg:mt-16 [&+.steps]:!mt-0 [&+.steps>h3]:!mt-4 [&+h3]:!mt-6 [&+p]:!mt-4",
            className
          )}
          {...props}
        />
      )
    },
    h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3
        className={cn(
          "font-heading mt-12 scroll-m-28 text-lg font-medium tracking-tight [&+p]:!mt-4 *:[code]:text-xl",
          className
        )}
        {...props}
      />
    ),
    h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4
        className={cn(
          "font-heading mt-8 scroll-m-28 text-base font-medium tracking-tight",
          className
        )}
        {...props}
      />
    ),
    h5: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h5
        className={cn(
          "mt-8 scroll-m-28 text-base font-medium tracking-tight",
          className
        )}
        {...props}
      />
    ),
    h6: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h6
        className={cn(
          "mt-8 scroll-m-28 text-base font-medium tracking-tight",
          className
        )}
        {...props}
      />
    ),
    a: ({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        className={cn("font-medium underline underline-offset-4", className)}
        {...props}
      />
    ),
    p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p
        className={cn("leading-relaxed [&:not(:first-child)]:mt-6", className)}
        {...props}
      />
    ),
    strong: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <strong className={cn("font-medium", className)} {...props} />
    ),
    ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className={cn("my-6 ms-6 list-disc", className)} {...props} />
    ),
    ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className={cn("my-6 ms-6 list-decimal", className)} {...props} />
    ),
    li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
      <li className={cn("mt-2", className)} {...props} />
    ),
    blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        className={cn("mt-6 border-s-2 ps-6 italic", className)}
        {...props}
      />
    ),
    img: ({
      className,
      alt,
      ...props
    }: React.ImgHTMLAttributes<HTMLImageElement>) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={cn("rounded-md", className)} alt={alt} {...props} />
    ),
    hr: ({ ...props }) => <hr className="my-4 md:my-8" {...props} />,
    table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="no-scrollbar my-6 w-full overflow-y-auto rounded-lg border">
        <table
          className={cn(
            "relative w-full overflow-hidden border-none text-sm [&_tbody_tr:last-child]:border-b-0",
            className
          )}
          {...props}
        />
      </div>
    ),
    tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr className={cn("m-0 border-b", className)} {...props} />
    ),
    th: ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
      <th
        className={cn(
          "px-4 py-2 text-start font-bold [&[align=center]]:text-center [&[align=right]]:text-right rtl:[&[align=right]]:text-left",
          className
        )}
        {...props}
      />
    ),
    td: ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
      <td
        className={cn(
          "px-4 py-2 text-start whitespace-nowrap [&[align=center]]:text-center [&[align=right]]:text-right rtl:[&[align=right]]:text-left",
          className
        )}
        {...props}
      />
    ),
    pre: ({ className, children, ...props }: React.ComponentProps<"pre">) => {
      return (
        <pre
          className={cn(
            "no-scrollbar min-w-0 overflow-x-auto px-4 py-3.5 outline-none has-[[data-highlighted-line]]:px-0 has-[[data-line-numbers]]:px-0 has-[[data-slot=tabs]]:p-0",
            className
          )}
          {...props}
        >
          {children}
        </pre>
      )
    },
    figure: ({ className, ...props }: React.ComponentProps<"figure">) => {
      return <figure className={cn(className)} {...props} />
    },
    code: ({
      className,
      __raw__,
      __npm__,
      __yarn__,
      __pnpm__,
      __bun__,
      ...props
    }: React.ComponentProps<"code"> & {
      __raw__?: string
      __npm__?: string
      __yarn__?: string
      __pnpm__?: string
      __bun__?: string
    }) => {
      // Inline Code.
      if (typeof props.children === "string") {
        return (
          <code
            className={cn(
              "bg-muted relative rounded-md px-[0.3rem] py-[0.2rem] font-mono text-[0.8rem] break-words outline-none",
              className
            )}
            {...props}
          />
        )
      }

      // npm command.
      const isNpmCommand = __npm__ && __yarn__ && __pnpm__ && __bun__
      if (isNpmCommand) {
        return (
          <CodeBlockCommand
            __npm__={__npm__}
            __yarn__={__yarn__}
            __pnpm__={__pnpm__}
            __bun__={__bun__}
          />
        )
      }

      // Default codeblock.
      return (
        <>
          {__raw__ && <CopyButton value={__raw__} />}
          <code {...props} />
        </>
      )
    },
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
    ComponentPreview,
    ComponentSource,
    CodeTabs,
    Tabs: ({ className, ...props }: ComponentProps<typeof Tabs>) => {
      return <Tabs className={cn("relative mt-6 w-full", className)} {...props} />
    },
    TabsList: ({
      className,
      ...props
    }: ComponentProps<typeof TabsList>) => (
      <TabsList
        className={cn(
          "justify-start gap-4 rounded-none bg-transparent px-0",
          className
        )}
        {...props}
      />
    ),
    TabsTrigger: ({
      className,
      ...props
    }: ComponentProps<typeof TabsTrigger>) => (
      <TabsTrigger
        className={cn(
          "text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-primary dark:data-[state=active]:border-primary hover:text-primary rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3 text-base data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent",
          className
        )}
        {...props}
      />
    ),
    TabsContent: ({
      className,
      ...props
    }: ComponentProps<typeof TabsContent>) => (
      <TabsContent
        className={cn(
          "relative [&_h3.font-heading]:text-base [&_h3.font-heading]:font-medium *:[figure]:first:mt-0 [&>.steps]:mt-6",
          className
        )}
        {...props}
      />
    ),
    Step: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <h3
        className={cn(
          "font-heading mt-8 scroll-m-32 text-xl font-medium tracking-tight",
          className
        )}
        {...props}
      />
    ),
    Steps: ({ ...props }) => (
      <div
        className="[&>h3]:step steps mb-12 [counter-reset:step] *:[h3]:first:!mt-0"
        {...props}
      />
    ),
    // Docs components
    DirectoryStructure,
    Structure,
    PrismaStructure,
    StoryVideo,
    // Atom components (available in hogwarts)
    StickyScroll,
    ThemeProvider,
    InfiniteSlider,
    InfiniteCards,
    ProgressiveBlur,
    Faceted,
    HeaderSection,
    TabsNav,
    Loading,
    GradientAnimation,
}

export function useMDXComponents(components: Record<string, React.ComponentType<any>>): Record<string, React.ComponentType<any>> {
  return {
    ...mdxComponents,
    ...components,
  }
}

export { mdxComponents }
