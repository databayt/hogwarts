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
        // Logical insets: under RTL "me" sits on the left, so the tail has to
        // follow the bubble rather than stay pinned to a physical edge.
        // The path points right. Both flips write the same `--tw-scale-x`, so
        // they never cancel — each side states its RTL value outright.
        side === "me"
          ? "-end-[7.5px] rtl:scale-x-[-1]"
          : "-start-[7.5px] scale-x-[-1] rtl:scale-x-100",
        color,
        className
      )}
      aria-hidden
    >
      <path
        // One concave sweep from the bubble's edge down to the tip, over the
        // full 18px — File (4).png flares across ~13px, not the last 6.
        d="M0 0H7.5C7.5 7 9.2 13.2 13.1 16.9C13.5 17.3 13.3 18 12.7 18H0Z"
        fill="currentColor"
      />
    </svg>
  )
}
