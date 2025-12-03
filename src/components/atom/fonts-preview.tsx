"use client"

import { fontSans, fontMono } from "./fonts"

export function FontsPreview() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Sans (Inter)</h4>
        <p className={`text-2xl ${fontSans.className}`}>
          The quick brown fox jumps over the lazy dog
        </p>
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Mono (JetBrains Mono)</h4>
        <p className={`text-2xl ${fontMono.className}`}>
          const greeting = &quot;Hello, World!&quot;
        </p>
      </div>
    </div>
  )
}
