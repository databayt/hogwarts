/**
 * Typography Constants - shadcn/ui Pattern
 *
 * Use these constants for consistent typography across components.
 * Import and apply directly to className props.
 *
 * @example
 * import { typography } from "@/lib/typography"
 *
 * <h1 className={typography.h1}>Page Title</h1>
 * <p className={typography.p}>Body text</p>
 * <p className={typography.lead}>Intro paragraph</p>
 */

export const typography = {
  // Headings
  h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
  h2: "scroll-m-20 text-3xl font-semibold tracking-tight border-b pb-2 first:mt-0",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight",

  // Text variants
  p: "leading-7 [&:not(:first-child)]:mt-6",
  lead: "text-xl text-muted-foreground",
  large: "text-lg font-semibold",
  small: "text-sm font-medium leading-none",
  muted: "text-sm text-muted-foreground",

  // Special elements
  blockquote: "mt-6 border-s-2 ps-6 italic",
  code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",

  // Lists
  ul: "my-6 ms-6 list-disc [&>li]:mt-2",
  ol: "my-6 ms-6 list-decimal [&>li]:mt-2",
  li: "mt-2",

  // Links
  link: "font-medium text-primary underline underline-offset-4",
} as const

/**
 * Typography variants for specific contexts
 */
export const typographyVariants = {
  // Page headers
  pageTitle:
    "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-balance",
  pageDescription: "text-xl text-muted-foreground",

  // Section headers
  sectionTitle: "scroll-m-20 text-3xl font-semibold tracking-tight",
  sectionDescription: "text-muted-foreground",

  // Card typography
  cardTitle: "text-lg font-semibold leading-none tracking-tight",
  cardDescription: "text-sm text-muted-foreground",

  // Form labels
  label:
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  hint: "text-sm text-muted-foreground",
  error: "text-sm text-destructive",

  // Table
  tableHeader:
    "h-12 px-4 text-start align-middle font-medium text-muted-foreground",
  tableCell: "p-4 align-middle",
} as const

export type TypographyKey = keyof typeof typography
export type TypographyVariantKey = keyof typeof typographyVariants
