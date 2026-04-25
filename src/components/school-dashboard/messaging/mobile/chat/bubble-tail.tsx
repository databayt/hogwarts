import { cn } from "@/lib/utils"

type Props = {
  side: "me" | "other"
  className?: string
}

export function BubbleTail({ side, className }: Props) {
  const color =
    side === "me"
      ? "text-[color:var(--wa-surface-baloon-me)]"
      : "text-[color:var(--wa-surface-baloon-other)]"

  return (
    <svg
      viewBox="0 0 13.4 18"
      width="15"
      height="18"
      className={cn(
        "pointer-events-none absolute bottom-0",
        side === "me" ? "-right-[7.5px]" : "-left-[7.5px] scale-x-[-1]",
        "rtl:scale-x-[-1]",
        color,
        className
      )}
      aria-hidden
    >
      <path
        d="M7.5 4L7.5 0H0V14C3.66 17.25 10.63 17.86 13.1 17.97C13.41 17.99 13.56 17.6 13.35 17.38C11.7 15.73 7.5 10.83 7.5 4Z"
        fill="currentColor"
      />
    </svg>
  )
}
