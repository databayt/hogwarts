// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Poppins } from "next/font/google"

import { cn } from "@/lib/utils"

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"],
})

interface HeaderProps {
  label: string
}

export const Header = ({ label }: HeaderProps) => {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-y-4">
      <h1 className={cn("text-3xl font-semibold", font.className)}>
        {/* 🔐 Auth */}
      </h1>
      <p className="text-muted-foreground muted">{label}</p>
    </div>
  )
}
