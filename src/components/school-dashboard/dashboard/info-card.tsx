// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function InfoCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
        <Users className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">+2350</div>
        <p className="text-muted-foreground text-xs">+180.1% from last month</p>
      </CardContent>
    </Card>
  )
}
