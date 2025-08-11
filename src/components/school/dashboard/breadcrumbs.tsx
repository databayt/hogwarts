"use client";

import { usePathname } from 'next/navigation'

export function DashboardBreadcrumbs() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  const idx = parts.indexOf('dashboard')
  const trail = idx >= 0 ? parts.slice(idx) : parts
  return (
    <div className="text-xs text-muted-foreground">
      {trail.map((p, i) => (
        <span key={i}>
          {i > 0 && ' / '}
          {p}
        </span>
      ))}
    </div>
  )
}







