// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading preview...</p>
      </div>
    </div>
  )
}
