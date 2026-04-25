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
      <div className="flex min-w-[100px] items-center justify-center rounded-[8px] border-[0.66px] border-[color:var(--wa-surface-shadow-baloon)] bg-[color:var(--wa-surface-date)] px-[14px] py-[3px]">
        <span className="text-[12px] font-semibold text-[color:var(--wa-text-primary)]">
          {label}
        </span>
      </div>
    </div>
  )
}
