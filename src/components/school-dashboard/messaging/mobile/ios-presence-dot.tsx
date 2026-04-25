import { cn } from "@/lib/utils"

type Props = {
  online?: boolean
  className?: string
}

export function IosPresenceDot({ online = false, className }: Props) {
  if (!online) return null
  return (
    <span
      aria-label="Online"
      className={cn(
        "absolute end-0 bottom-0 size-[14px] rounded-full border-[2px] border-[color:var(--wa-surface-primary)] bg-[color:var(--wa-surface-product)]",
        className
      )}
    />
  )
}
