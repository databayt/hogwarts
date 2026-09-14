import { cn } from "@/lib/utils"

type Props = {
  label: string
  className?: string
}

export function DateSeparator({ label, className }: Props) {
  return (
    <div
      className={cn(
        // File (4).png: 36px from the bubble above (its 14px run gap + 22),
        // a 21px pill, 14px to whatever follows.
        "flex w-full items-center justify-center pt-[22px] pb-[14px]",
        className
      )}
    >
      <div className="flex items-center justify-center rounded-[8px] bg-[color:var(--wa-surface-date)] px-[12px] py-[3px]">
        <span className="text-[13px] leading-[15px] font-semibold text-[color:var(--wa-text-primary)]">
          {label}
        </span>
      </div>
    </div>
  )
}
