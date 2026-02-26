"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"

import { Button } from "@/components/ui/button"

interface BackButtonProps {
  href: string
  label: string
}

export const BackButton = ({ href, label }: BackButtonProps) => {
  return (
    <Button variant="link" className="w-full font-normal" size="sm" asChild>
      <Link href={href}>{label}</Link>
    </Button>
  )
}
