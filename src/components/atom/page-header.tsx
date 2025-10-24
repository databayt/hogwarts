import React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  variant?: "default" | "dashboard" | "centered"
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, variant = "default", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full flex-col gap-2",
          variant === "default" && "max-w-4xl text-center",
          variant === "centered" && "max-w-4xl text-center mx-auto",
          variant === "dashboard" && "text-left ltr:text-left rtl:text-right",
          className
        )}
        {...props}
      >
        <h1 className={cn(
          "font-heading",
          variant === "dashboard" && "text-3xl font-bold"
        )}>
          {title}
        </h1>
        {description && (
          <p className={cn(
            "leading-normal text-muted-foreground sm:leading-7",
            variant !== "dashboard" && "mx-auto max-w-[85%]"
          )}>
            {description}
          </p>
        )}
      </div>
    )
  }
)

PageHeader.displayName = "PageHeader"

export default PageHeader 