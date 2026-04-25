import { cn } from "@/lib/utils"

import { WaIcon } from "../wa-icon"

export type BubbleStatus = "sent" | "delivered" | "read" | null

type Props = {
  time: string
  status?: BubbleStatus
  className?: string
}

export function BubbleTimestamp({ time, status, className }: Props) {
  return (
    <div className={cn("flex items-center justify-end gap-[2px]", className)}>
      <time className="text-[11px] leading-none tracking-[0.55px] text-[color:var(--wa-text-secondary-alpha)]">
        {time}
      </time>
      {status && (
        <WaIcon
          name="ic-wa-check-bubble-17"
          className={cn(
            "size-[17px]",
            status === "read"
              ? "text-[#53BDEB]"
              : "text-[color:var(--wa-text-secondary-alpha)]"
          )}
          ariaLabel={
            status === "read"
              ? "Read"
              : status === "delivered"
                ? "Delivered"
                : "Sent"
          }
        />
      )}
    </div>
  )
}
