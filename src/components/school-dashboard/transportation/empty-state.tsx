// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface Props {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function TransportationEmptyState({
  title,
  description,
  action,
  className,
}: Props) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className
      )}
    >
      <h4 className="text-lg font-medium">{title}</h4>
      {description ? (
        <p className="text-muted-foreground max-w-md text-sm">{description}</p>
      ) : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </Card>
  )
}
