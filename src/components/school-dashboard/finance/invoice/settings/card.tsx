"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Card, CardContent, CardTitle } from "@/components/ui/card"

export function SettingsSectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardContent>
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="mt-2">{children}</div>
      </CardContent>
    </Card>
  )
}
