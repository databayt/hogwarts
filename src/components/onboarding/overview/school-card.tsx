"use client"

import React from "react"
import { CheckCircle, Clock, GraduationCap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface SchoolCardProps {
  id: string
  name: string
  startDate: string
  status?: "draft" | "pending" | "active"
  subdomain?: string
  onClick?: (id: string) => void
  dictionary?: any
}

const SchoolCard: React.FC<SchoolCardProps> = ({
  id,
  name,
  startDate,
  status = "draft",
  subdomain,
  onClick,
  dictionary,
}) => {
  const dict = dictionary?.onboarding || {}
  const handleClick = () => {
    onClick?.(id)
  }

  const getStatusIcon = () => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600 sm:h-5 sm:w-5" />
      default:
        return <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-xs text-green-800"
          >
            {dict.activeStatus || "Active"}
          </Badge>
        )
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-xs text-yellow-800"
          >
            {dict.pendingStatus || "Pending"}
          </Badge>
        )
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-xs text-blue-800"
          >
            {dict.draftStatus || "Draft"}
          </Badge>
        )
    }
  }

  return (
    <Card
      className="hover:border-foreground/50 bg-card hover:bg-accent min-h-[50px] cursor-pointer rounded-lg border py-3 shadow-none transition-all hover:shadow-none sm:min-h-[60px] sm:py-4"
      onClick={handleClick}
    >
      <CardContent className="flex items-center px-2 py-0 sm:px-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md sm:h-10 sm:w-10">
            {getStatusIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h5 className="truncate text-xs font-medium sm:text-sm">
                {name}
              </h5>
              {getStatusBadge()}
            </div>
            <div className="mt-0.5 flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <p className="text-muted-foreground text-xs">
                Started {startDate}
              </p>
              {subdomain && (
                <p className="text-muted-foreground text-xs">
                  <span className="hidden sm:inline">•</span> {subdomain}
                  .databayt.org
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SchoolCard
