"use client"

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
