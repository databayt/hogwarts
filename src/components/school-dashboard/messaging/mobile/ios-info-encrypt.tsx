import { cn } from "@/lib/utils"

import { WaIcon } from "./wa-icon"

type Props = {
  prefix?: string
  topic?: string
  suffix?: string
  className?: string
}

export function IosInfoEncrypt({
  prefix = "Your personal",
  topic = "messages",
  suffix = "are",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex w-full items-start justify-center gap-[4px] py-px",
        className
      )}
    >
      <WaIcon
        name="ic-wa-lock-12"
        className="size-[12px] shrink-0 text-[color:var(--wa-text-secondary)]"
      />
      <p className="flex gap-[2px] text-center text-[11px] leading-tight">
        <span className="text-[color:var(--wa-text-secondary)]">{prefix}</span>
        <span className="text-[color:var(--wa-text-secondary)]">{topic}</span>
        <span className="text-[color:var(--wa-text-secondary)]">{suffix}</span>
        <span className="text-[color:var(--wa-text-product)]">
          end-to-end encrypted
        </span>
      </p>
    </div>
  )
}
