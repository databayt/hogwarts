"use client"

import { Icons } from "./icons"

export function IconsPreview() {
  const iconEntries = Object.entries(Icons).filter(
    ([_, value]) => typeof value === "function" || typeof value === "object"
  )

  return (
    <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
      {iconEntries.slice(0, 16).map(([name, Icon]) => (
        <div
          key={name}
          className="flex flex-col items-center justify-center gap-2 rounded-md border p-4"
        >
          {typeof Icon === "function" ? <Icon className="h-6 w-6" /> : null}
          <span className="text-muted-foreground max-w-full truncate text-xs">
            {name}
          </span>
        </div>
      ))}
    </div>
  )
}
