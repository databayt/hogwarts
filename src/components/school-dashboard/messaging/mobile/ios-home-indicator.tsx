import { cn } from "@/lib/utils"

export function IosHomeIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center pt-[21px] pb-[8px]",
        className
      )}
    >
      <span className="h-[5px] w-[140px] rounded-full bg-[color:var(--wa-surface-invert)]" />
    </div>
  )
}
