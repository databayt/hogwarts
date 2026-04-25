import { cn } from "@/lib/utils"

import { WaIcon } from "./wa-icon"

type Props = {
  count?: number
  onClick?: () => void
  label?: string
  className?: string
}

export function IosArchivedRow({
  count,
  onClick,
  label = "Archived",
  className,
}: Props) {
  const Tag = onClick ? "button" : "div"
  return (
    <Tag
      onClick={onClick}
      type={onClick ? "button" : undefined}
      className={cn(
        "flex w-full items-start gap-[28.66px] ps-[32px] pt-[10px]",
        onClick && "active:bg-black/5",
        className
      )}
    >
      <WaIcon
        name="ic-wa-archived-24"
        className="size-[24px] shrink-0 text-[color:var(--wa-text-secondary)]"
        ariaLabel="Archived"
      />
      <div className="flex min-w-0 flex-1 items-start justify-between border-b-[0.33px] border-[color:var(--wa-border-separator)] pe-[15px] pt-[2.5px] pb-[12px]">
        <span className="truncate text-[16px] leading-tight font-semibold tracking-[-0.32px] text-[color:var(--wa-text-primary)]">
          {label}
        </span>
        {typeof count === "number" && count > 0 && (
          <span className="text-[14px] text-[color:var(--wa-text-secondary)]">
            {count}
          </span>
        )}
      </div>
    </Tag>
  )
}
