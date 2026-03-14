import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const buttonGroupVariants = cva(
  "inline-flex items-center justify-center rounded-md [&>button:not(:first-child)]:rounded-s-none [&>button:not(:last-child)]:rounded-e-none [&>button:not(:first-child)]:-ms-px [&>input:not(:first-child)]:rounded-s-none [&>input:not(:last-child)]:rounded-e-none [&>input:not(:first-child)]:-ms-px",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      data-slot="button-group"
      className={cn(buttonGroupVariants({ orientation, className }))}
      {...props}
    />
  )
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      orientation={orientation}
      className={cn("-mx-px h-5 self-center", className)}
      {...props}
    />
  )
}

export { ButtonGroup, ButtonGroupSeparator }
