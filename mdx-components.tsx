import type { ComponentProps } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExternalLink, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

// Custom Cards component for documentation
function Cards({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 my-6">
      {children}
    </div>
  )
}

// Custom Card component for documentation
function DocCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className="no-underline">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}

// Custom Callout component
function Callout({
  type = 'info',
  title,
  children
}: {
  type?: 'info' | 'warning' | 'error' | 'success'
  title?: string
  children: React.ReactNode
}) {
  const icons = {
    info: <Info className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    error: <XCircle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
  }

  const variants = {
    info: 'default' as const,
    warning: 'default' as const,
    error: 'destructive' as const,
    success: 'default' as const,
  }

  return (
    <Alert variant={variants[type]} className="my-4">
      <div className="flex gap-2">
        {icons[type]}
        <div className="flex-1">
          {title && <AlertTitle>{title}</AlertTitle>}
          <AlertDescription>{children}</AlertDescription>
        </div>
      </div>
    </Alert>
  )
}

// Steps component for numbered instructions
function Steps({ children }: { children: React.ReactNode }) {
  return (
    <div className="[&>h3]:step steps mb-12 ml-4 border-l pl-6 [counter-reset:step]">
      {children}
    </div>
  )
}

// MDX components object - exported separately for use in pages
export const mdxComponents = {
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
    a: ({ className, target, rel, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      const isExternal = typeof href === "string" && /^(https?:)?\/\//.test(href)
      const isAnchorOrInternal = typeof href === "string" && (href.startsWith("/") || href.startsWith("#") || (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)))

      return (
        <a
          className={cn(
            "font-medium underline underline-offset-4 hover:no-underline",
            className
          )}
          target={isExternal ? (target ?? "_blank") : target}
          rel={isExternal ? (rel ?? "noreferrer noopener") : rel}
          href={href}
          {...props}
        />
      )
    },
    p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p
        className={cn("leading-relaxed [&:not(:first-child)]:mt-6", className)}
        {...props}
      />
    ),
    ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className={cn("my-6 ml-6 list-disc space-y-2", className)} {...props} />
    ),
    ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className={cn("my-6 ml-6 list-decimal space-y-2", className)} {...props} />
    ),
    li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
      <li className={cn("", className)} {...props} />
    ),
    blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        className={cn("mt-6 border-l-2 pl-6 italic", className)}
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
    hr: ({ ...props }) => <hr className="my-12 border-border" {...props} />,
    table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className={cn("w-full", className)} {...props} />
      </div>
    ),
    tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr
        className={cn("m-0 border-t p-0 even:bg-muted", className)}
        {...props}
      />
    ),
    th: ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
      <th
        className={cn(
          "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
          className
        )}
        {...props}
      />
    ),
    td: ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
      <td
        className={cn(
          "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
          className
        )}
        {...props}
      />
    ),
    pre: ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
      <pre
        className={cn(
          "mb-4 mt-6 overflow-x-auto rounded-md mr-7 [&_*]:!font-normal border bg-muted px-4 py-4 ",
          className
        )}
        {...props}
      />
    ),
    code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <code
        className={cn(
          "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono muted",
          className
        )}
        {...props}
      />
    ),
    // Custom components
    Card: DocCard,
    Cards,
    Callout,
    Steps,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Alert,
    AlertDescription,
    AlertTitle,
    Image,
}

// This file is required to use MDX in `app` directory.
export function useMDXComponents(components: Record<string, React.ComponentType<any>>): Record<string, React.ComponentType<any>> {
  return {
    ...mdxComponents,
    ...components,
  }
} 