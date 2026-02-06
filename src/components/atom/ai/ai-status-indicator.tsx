"use client"

import {
  AlertCircle,
  Brain,
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export type AiStatus =
  | "idle"
  | "loading"
  | "processing"
  | "streaming"
  | "success"
  | "error"
  | "warning"

interface AiStatusIndicatorProps {
  status: AiStatus
  message?: string
  provider?: string
  model?: string
  tokensUsed?: number
  timeElapsed?: number
  className?: string
  showDetails?: boolean
}

export function AiStatusIndicator({
  status,
  message,
  provider,
  model,
  tokensUsed,
  timeElapsed,
  className,
  showDetails = false,
}: AiStatusIndicatorProps) {
  const statusConfig = {
    idle: {
      icon: Brain,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      label: "Ready",
      animate: false,
    },
    loading: {
      icon: Loader2,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      label: "Loading...",
      animate: true,
    },
    processing: {
      icon: Brain,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      label: "Thinking...",
      animate: true,
    },
    streaming: {
      icon: Zap,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      label: "Streaming...",
      animate: true,
    },
    success: {
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      label: "Complete",
      animate: false,
    },
    error: {
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/20",
      label: "Error",
      animate: false,
    },
    warning: {
      icon: AlertCircle,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      label: "Warning",
      animate: false,
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  const formatTime = (ms?: number) => {
    if (!ms) return null
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatTokens = (tokens?: number) => {
    if (!tokens) return null
    if (tokens < 1000) return `${tokens} tokens`
    return `${(tokens / 1000).toFixed(1)}k tokens`
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Main Status */}
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
          config.bgColor,
          config.color
        )}
      >
        <Icon className={cn("h-4 w-4", config.animate && "animate-spin")} />
        <span>{message || config.label}</span>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="flex items-center gap-2">
          {provider && (
            <Badge variant="outline" className="text-xs">
              {provider}
            </Badge>
          )}

          {model && (
            <Badge variant="outline" className="text-xs">
              {model}
            </Badge>
          )}

          {tokensUsed && (
            <Badge variant="secondary" className="text-xs">
              {formatTokens(tokensUsed)}
            </Badge>
          )}

          {timeElapsed && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="me-1 h-3 w-3" />
              {formatTime(timeElapsed)}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
