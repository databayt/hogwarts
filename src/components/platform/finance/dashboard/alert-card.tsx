"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CircleAlert, CircleCheck, Info, CircleX } from "lucide-react"
import type { FinancialAlert } from "./types"

interface AlertCardProps {
  alert: FinancialAlert
  onDismiss?: (id: string) => void
}

export function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const getIcon = () => {
    switch (alert.type) {
      case 'error':
        return <CircleX className="h-4 w-4" />
      case 'warning':
        return <CircleAlert className="h-4 w-4" />
      case 'success':
        return <CircleCheck className="h-4 w-4" />
      case 'info':
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getVariant = () => {
    switch (alert.type) {
      case 'error':
        return 'destructive' as const
      case 'warning':
        return 'default' as const
      case 'success':
        return 'default' as const
      case 'info':
        return 'default' as const
      default:
        return 'default' as const
    }
  }

  return (
    <Alert variant={getVariant()} className="relative">
      {getIcon()}
      <div className="flex-1">
        <AlertTitle>{alert.title}</AlertTitle>
        <AlertDescription>{alert.description}</AlertDescription>
      </div>
      <div className="flex items-center gap-2">
        {alert.action && (
          <Link href={alert.action.href}>
            <Button size="sm" variant="outline">
              {alert.action.label}
            </Button>
          </Link>
        )}
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDismiss(alert.id)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        )}
      </div>
    </Alert>
  )
}