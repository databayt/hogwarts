import { cn } from "@/lib/utils"
import React from "react"

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
      <div className="flex flex-col items-start gap-1 py-8 md:py-10 lg:py-12 px-4 md:px-0">
        {announcement && (
          <div className={cn(announcementClassName)}>
            {announcement}
          </div>
        )}
        {heading && (
          <h2
            className={cn(
              headingClassName
            )}
          >
            {heading}
          </h2>
        )}
        {description && (
          <p
            className={cn(
              "max-w-2xl text-balance text-base font-light text-foreground leading-7 sm:text-lg ",
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