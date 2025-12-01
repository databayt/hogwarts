"use client"

import { usePageHeading } from "./page-heading-context"
import PageHeading from "@/components/atom/page-heading"

export function PageHeadingDisplay() {
  const { heading } = usePageHeading()

  if (!heading) return null

  return <PageHeading title={heading.title} description={heading.description} />
}
