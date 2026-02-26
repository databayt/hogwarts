"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Progress as ProgressPrimitive } from "radix-ui"

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
      <ProgressIndicator value={value} />
    </ProgressPrimitive.Root>
  )
}

function ProgressIndicator({ value }: { value?: number | null }) {
  const percentage = 100 - (value || 0)
  const [dir, setDir] = React.useState<string>("ltr")

  React.useEffect(() => {
    const htmlDir = document.documentElement.dir || "ltr"
    setDir(htmlDir)
  }, [])

  const translateValue =
    dir === "rtl" ? `translateX(${percentage}%)` : `translateX(-${percentage}%)`

  return (
    <motion.div
      data-slot="progress-indicator"
      className="bg-primary h-full w-full flex-1"
      style={{ transformOrigin: dir === "rtl" ? "right" : "left" }}
      initial={{
        transform: dir === "rtl" ? "translateX(100%)" : "translateX(-100%)",
      }}
      animate={{ transform: translateValue }}
      transition={{
        type: "tween",
        duration: 0.8,
        ease: [0.4, 0.0, 0.2, 1],
      }}
    />
  )
}

export { Progress }
