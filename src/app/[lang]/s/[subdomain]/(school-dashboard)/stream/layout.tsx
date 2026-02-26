// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ReactNode } from "react"

interface StreamLayoutProps {
  children: ReactNode
}

export default function StreamLayout({ children }: StreamLayoutProps) {
  return <div className="min-h-screen">{children}</div>
}
