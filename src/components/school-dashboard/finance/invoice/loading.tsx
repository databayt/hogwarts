"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"

import { useDictionary } from "@/components/internationalization/use-dictionary"

export default function Loading() {
  const { dictionary } = useDictionary()
  const t = (dictionary as any)?.finance?.invoiceMisc

  return (
    <div className="flex min-h-24 flex-col items-center justify-center gap-4">
      <Image
        src={"/Loading.png"}
        alt="loading"
        width={40}
        height={40}
        className="animate-spin transition-all select-none"
      />
      <p className="text-muted-foreground">{t?.loading || "Loading..."}</p>
    </div>
  )
}
