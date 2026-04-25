import { cn } from "@/lib/utils"

import { WaIcon, type WaIconName } from "./wa-icon"

type LeadingKind =
  | "check-read"
  | "check-sent"
  | "voice"
  | "location"
  | "deleted"
  | null

type Props = {
  text: string
  leading?: LeadingKind
  italic?: boolean
  className?: string
}

const LEADING_MAP: Record<
  Exclude<LeadingKind, null>,
  { icon: WaIconName; color: string; size: string; top: string }
> = {
  "check-read": {
    icon: "ic-wa-check-read-19",
    color: "text-[color:var(--wa-text-product)]",
    size: "size-[19px]",
    top: "top-0",
  },
  "check-sent": {
    icon: "ic-wa-check-sent-19",
    color: "text-[color:var(--wa-text-secondary)]",
    size: "size-[19px]",
    top: "top-0",
  },
  voice: {
    icon: "ic-wa-voice-16",
    color: "text-[color:var(--wa-text-secondary)]",
    size: "size-[16px]",
    top: "top-[1.5px]",
  },
  location: {
    icon: "ic-wa-location-16",
    color: "text-[color:var(--wa-text-secondary)]",
    size: "size-[16px]",
    top: "top-[1.5px]",
  },
  deleted: {
    icon: "ic-wa-deleted-16",
    color: "text-[color:var(--wa-text-secondary)]",
    size: "size-[16px]",
    top: "top-[1.5px]",
  },
}

export function IosMessagePreview({
  text,
  leading,
  italic = false,
  className,
}: Props) {
  const spec = leading ? LEADING_MAP[leading] : null
  const indent = spec
    ? spec.size.includes("19")
      ? "ps-[21.5px]"
      : "ps-[18px]"
    : ""

  return (
    <div className={cn("relative flex w-full items-start", className)}>
      {spec && (
        <span
          className={cn("absolute start-0 overflow-clip", spec.size, spec.top)}
        >
          <WaIcon name={spec.icon} className={cn("size-full", spec.color)} />
        </span>
      )}
      <p
        className={cn(
          "min-w-0 flex-1 truncate text-[14px] leading-[19px] tracking-[-0.14px] text-[color:var(--wa-text-secondary)]",
          italic && "italic",
          indent
        )}
      >
        {text}
      </p>
    </div>
  )
}
