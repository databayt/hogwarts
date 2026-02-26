// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Image from "next/image"

export default function Loading() {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center gap-4">
      <Image
        src={"/Loading.png"}
        alt="loading"
        width={40}
        height={40}
        className="animate-spin transition-all select-none"
      />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  )
}
