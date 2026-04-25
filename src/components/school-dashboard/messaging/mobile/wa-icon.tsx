import { cn } from "@/lib/utils"

import { WA_ICONS, waIcon, type WaIconName } from "./wa-tokens"

type Props = {
  name: WaIconName
  className?: string
  tint?: boolean
  ariaLabel?: string
}

export function WaIcon({ name, className, tint = true, ariaLabel }: Props) {
  const url = waIcon(name)

  if (!tint) {
    return (
      <img
        src={url}
        alt={ariaLabel ?? ""}
        className={cn("select-none", className)}
        draggable={false}
      />
    )
  }

  return (
    <span
      role={ariaLabel ? "img" : "presentation"}
      aria-label={ariaLabel}
      className={cn("inline-block bg-current", className)}
      style={{
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  )
}

export { WA_ICONS, waIcon, type WaIconName }
