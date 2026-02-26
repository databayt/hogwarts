"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { FileText } from "lucide-react"

import Card from "./card"

export function CardPreview() {
  return (
    <Card
      id="example"
      title="Example Card"
      description="This is an example card component with an icon and hover effect."
      icon={<FileText className="h-8 w-8" />}
      href="#"
    />
  )
}
