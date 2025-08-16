"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden",
        className
      )}
      {...props}
    >
      <motion.div
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 origin-left"
        initial={{ transform: "translateX(-100%)" }}
        animate={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        transition={{
          type: "tween",
          duration: 0.8,
          ease: [0.4, 0.0, 0.2, 1] // Material Design easing for steady movement
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
