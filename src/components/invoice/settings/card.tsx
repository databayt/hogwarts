"use client"

import { Card, CardContent, CardTitle } from "@/components/ui/card"

export function SettingsSectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent>
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="mt-2">{children}</div>
      </CardContent>
    </Card>
  )
}


