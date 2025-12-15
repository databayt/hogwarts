"use client"

import { Card } from "@/components/ui/card"

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <Card className="text-muted-foreground flex flex-col items-center justify-center gap-2 p-8 text-center text-sm">
      <div className="text-foreground text-base font-medium">{title}</div>
      {description ? <div>{description}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </Card>
  )
}
