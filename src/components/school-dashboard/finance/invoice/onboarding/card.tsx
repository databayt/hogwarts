"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Card, CardContent, CardTitle } from "@/components/ui/card"

export function OnboardingInfoCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card>
      <CardContent>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  )
}
