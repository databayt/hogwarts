import { cn } from "@/lib/utils"

type Props = {
  label: string
  className?: string
}

export function DateSeparator({ label, className }: Props) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center pt-[23px] pb-px",
        className
      )}
    >
      <div className="flex items-center justify-center rounded-[8px] bg-[color:var(--wa-surface-date)] px-[12px] py-[2px]">
        <span className="text-[13px] leading-[15px] font-semibold text-[color:var(--wa-text-primary)]">
          {label}
        </span>
      </div>
    </div>
  )
}
