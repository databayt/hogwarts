import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-shimmer from-accent via-accent/40 to-accent rounded-md bg-gradient-to-r bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
