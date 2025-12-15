import * as React from "react"

import { cn } from "@/lib/utils"
import { Icons } from "@/components/marketing/pricing/shared/icons"

interface EmptyPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function EmptyPlaceholder({
  className,
  children,
  ...props
}: EmptyPlaceholderProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in-50 flex flex-1 items-center justify-center rounded-lg border border-dashed p-8 text-center shadow-sm",
        className
      )}
      {...props}
    >
      <div className="flex max-w-[420px] flex-col items-center text-center">
        {children}
      </div>
    </div>
  )
}

interface EmptyPlaceholderIconProps extends Partial<
  React.SVGProps<SVGSVGElement>
> {
  name: keyof typeof Icons
  ref?:
    | ((instance: SVGSVGElement | null) => void)
    | React.RefObject<SVGSVGElement>
    | null
}

EmptyPlaceholder.Icon = function EmptyPlaceholderIcon({
  name,
  className,
  ...props
}: EmptyPlaceholderIconProps) {
  const Icon = Icons[name]

  if (!Icon) {
    return null
  }

  return (
    <div className="bg-muted flex size-20 items-center justify-center rounded-full">
      <Icon className={cn("size-10", className)} {...props} />
    </div>
  )
}

interface EmptyPlaceholderTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

EmptyPlaceholder.Title = function EmptyPlaceholderTitle({
  className,
  ...props
}: EmptyPlaceholderTitleProps) {
  return <h3 className={cn("font-heading mt-5", className)} {...props} />
}

interface EmptyPlaceholderDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

EmptyPlaceholder.Description = function EmptyPlaceholderDescription({
  className,
  ...props
}: EmptyPlaceholderDescriptionProps) {
  return (
    <p
      className={cn(
        "text-muted-foreground mt-1.5 mb-5 text-center leading-6",
        className
      )}
      {...props}
    />
  )
}
