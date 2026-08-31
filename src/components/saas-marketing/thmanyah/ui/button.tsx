import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-98",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-neutral-800 shadow-sm",
        green:
          "bg-[#00bc6d] text-black font-semibold hover:bg-[#00a862] shadow-sm",
        outline:
          "border border-neutral-300 bg-transparent hover:bg-neutral-100 text-neutral-900",
        secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        ghost: "hover:bg-neutral-100 text-neutral-800",
        link: "text-neutral-900 underline-offset-4 hover:underline",
        pill: "bg-black text-white hover:bg-neutral-800 rounded-full px-6 py-2.5",
        pillGreen:
          "bg-[#00bc6d] text-black font-bold hover:bg-[#00a862] rounded-full px-6 py-2.5",
        pillOutline:
          "border border-black/20 text-black hover:bg-black/5 rounded-full px-6 py-2.5",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-full px-3 text-xs",
        lg: "h-12 rounded-full px-8 text-base",
        icon: "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
