import { cn } from "@/lib/utils"

type Props = {
  emojis: string[]
  side: "me" | "other"
  className?: string
}

export function ReactionCluster({ emojis, side, className }: Props) {
  if (emojis.length === 0) return null
  return (
    <div
      className={cn(
        "flex w-full px-[16px] pb-[6px]",
        side === "me" ? "justify-end" : "justify-start",
        className
      )}
    >
      <div className="inline-flex items-center gap-[2px] rounded-full border-[0.66px] border-[color:var(--wa-surface-shadow-baloon)] bg-[color:var(--wa-surface-baloon-other)] px-[6px] py-[2px] shadow-sm">
        {emojis.map((e, i) => (
          <span key={i} className="text-[12px] leading-none">
            {e}
          </span>
        ))}
      </div>
    </div>
  )
}
