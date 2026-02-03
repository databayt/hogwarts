import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  title: string
  className?: string
}

/**
 * Simple section heading for dashboard sections.
 * Just renders a styled title - nothing else.
 */
export function SectionHeading({ title, className }: SectionHeadingProps) {
  return (
    <h2 className={cn("mb-4 text-lg font-semibold", className)}>{title}</h2>
  )
}
