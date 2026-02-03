"use client"

import Link from "next/link"
import {
  BarChart,
  Building,
  Calculator,
  DollarSign,
  FileText,
  Plus,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { QuickAction } from "./types"

interface QuickActionsProps {
  actions: QuickAction[]
  className?: string
}

// Icon mapping
const iconMap: Record<string, any> = {
  FileText,
  DollarSign,
  Receipt,
  Users,
  BarChart,
  Building,
  Plus,
  Calculator,
  Wallet,
  TrendingUp,
}

export function QuickActions({ actions, className }: QuickActionsProps) {
  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Plus
    return <Icon className="h-5 w-5" />
  }

  const getColorClasses = (color?: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-500 hover:bg-blue-600 text-white"
      case "green":
        return "bg-green-500 hover:bg-green-600 text-white"
      case "red":
        return "bg-red-500 hover:bg-red-600 text-white"
      case "yellow":
        return "bg-yellow-500 hover:bg-yellow-600 text-white"
      case "purple":
        return "bg-purple-500 hover:bg-purple-600 text-white"
      case "orange":
        return "bg-orange-500 hover:bg-orange-600 text-white"
      case "indigo":
        return "bg-indigo-500 hover:bg-indigo-600 text-white"
      case "teal":
        return "bg-teal-500 hover:bg-teal-600 text-white"
      default:
        return "bg-primary hover:bg-primary/90 text-primary-foreground"
    }
  }

  if (actions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>No actions available for your role</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used financial operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {actions.map((action) => {
            const buttonContent = (
              <>
                {getIcon(action.icon)}
                <span className="text-sm font-medium">{action.label}</span>
              </>
            )

            const buttonClasses = cn(
              "flex flex-col items-center justify-center gap-2 h-24 transition-all hover:scale-105",
              getColorClasses(action.color)
            )

            if (action.href) {
              return (
                <Link key={action.id} href={action.href}>
                  <Button
                    variant="default"
                    className={buttonClasses}
                    title={action.description}
                  >
                    {buttonContent}
                  </Button>
                </Link>
              )
            }

            return (
              <Button
                key={action.id}
                variant="default"
                className={buttonClasses}
                onClick={action.action}
                title={action.description}
              >
                {buttonContent}
              </Button>
            )
          })}
        </div>

        {/* Additional quick stats or actions */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-6">
          <Link href="/finance/reports">
            <Button variant="outline" className="w-full justify-start">
              <BarChart className="mr-2 h-4 w-4" />
              View All Reports
            </Button>
          </Link>
          <Link href="/finance/settings">
            <Button variant="outline" className="w-full justify-start">
              <Calculator className="mr-2 h-4 w-4" />
              Finance Settings
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for smaller spaces
export function QuickActionsCompact({ actions, className }: QuickActionsProps) {
  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Plus
    return <Icon className="h-4 w-4" />
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actions.slice(0, 4).map((action) => {
        if (action.href) {
          return (
            <Link key={action.id} href={action.href}>
              <Button variant="outline" size="sm" title={action.description}>
                {getIcon(action.icon)}
                <span className="ml-2">{action.label}</span>
              </Button>
            </Link>
          )
        }

        return (
          <Button
            key={action.id}
            variant="outline"
            size="sm"
            onClick={action.action}
            title={action.description}
          >
            {getIcon(action.icon)}
            <span className="ml-2">{action.label}</span>
          </Button>
        )
      })}
      {actions.length > 4 && (
        <Link href="/finance">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            <span className="ml-2">More</span>
          </Button>
        </Link>
      )}
    </div>
  )
}
