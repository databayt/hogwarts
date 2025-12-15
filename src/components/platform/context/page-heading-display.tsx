"use client"

import PageHeading from "@/components/atom/page-heading"

import { usePageHeading } from "./page-heading-context"

export function PageHeadingDisplay() {
  const { heading } = usePageHeading()

  if (!heading) return null

  return <PageHeading title={heading.title} description={heading.description} />
}
