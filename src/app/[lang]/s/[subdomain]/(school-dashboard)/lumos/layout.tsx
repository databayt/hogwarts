// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ReactNode } from "react"

interface StreamLayoutProps {
  children: ReactNode
}

// Deliberately bare. The section heading + tab strip belong to the app
// surfaces (dashboard / settings / courses), each of which brings its own
// layout — /stream itself is the landing page and keeps its own hero.
export default function StreamLayout({ children }: StreamLayoutProps) {
  return <div className="min-h-screen">{children}</div>
}
