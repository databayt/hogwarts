"use client"

import Card from "./card"
import { FileText } from "lucide-react"

export function CardPreview() {
  return (
    <Card
      id="example"
      title="Example Card"
      description="This is an example card component with an icon and hover effect."
      icon={<FileText className="w-8 h-8" />}
      href="#"
    />
  )
}
