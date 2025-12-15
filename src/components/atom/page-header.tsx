import React from "react"

import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: string | React.ReactNode
  description?: string | React.ReactNode
  actions?: React.ReactNode
  announcement?: React.ReactNode
  headingClassName?: string
  descriptionClassName?: string
  actionsClassName?: string
  announcementClassName?: string
}

export function PageHeader({
  className,
  heading,
  description,
  actions,
  announcement,
  headingClassName,
  descriptionClassName,
  actionsClassName,
  announcementClassName,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <section className={cn(className)} {...props}>
      <div className="flex flex-col items-start gap-1 px-4 py-8 md:px-0 md:py-10 lg:py-12">
        {announcement && (
          <div className={cn(announcementClassName)}>{announcement}</div>
        )}
        {heading && <h2 className={cn(headingClassName)}>{heading}</h2>}
        {description && (
          <p
            className={cn(
              "text-foreground max-w-2xl text-base leading-7 font-light text-balance sm:text-lg",
              descriptionClassName
            )}
          >
            {description}
          </p>
        )}
        {actions && (
          <div
            className={cn(
              "flex w-full items-center justify-start gap-2 pt-2",
              actionsClassName
            )}
          >
            {actions}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
