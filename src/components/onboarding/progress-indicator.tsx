import React from "react"

import { Progress } from "@/components/ui/progress"

interface ProgressIndicatorProps {
  value: number // 0-100
  label?: string
  className?: string
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  value,
  label,
  className,
}) => (
  <div className={className}>
    {label && (
      <div className="text-muted-foreground mb-1 text-xs sm:mb-2 sm:text-sm">
        {label}
      </div>
    )}
    <Progress value={value} className="h-1 sm:h-2" />
  </div>
)

export default ProgressIndicator
