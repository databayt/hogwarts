import React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description = "beautifully-designed, blazing fast. Open Source. Open Code.", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex w-full max-w-4xl flex-col gap-2 text-center", className)}
        {...props}
      >
        <h2 className="font-heading font-extrabold">
          {title}
        </h2>
        {description && (
          <p className="mx-auto max-w-[85%] leading-normal text-muted-foreground sm:leading-7">
            {description}
          </p>
        )}
      </div>
    )
  }
)

PageHeader.displayName = "PageHeader"

export default PageHeader 