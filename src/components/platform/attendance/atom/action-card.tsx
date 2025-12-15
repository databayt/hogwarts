"use client"

import type { ElementType } from "react"
import Link from "next/link"
import {
  Activity,
  ChevronRight,
  FileText,
  Pencil,
  QrCode,
  Upload,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Icon map for string-based icon names (prevents Server Component serialization issues)
const iconMap: Record<string, ElementType> = {
  Pencil,
  QrCode,
  Upload,
  FileText,
  Activity,
}

interface ActionCardProps {
  title: string
  description?: string
  href: string
  icon?: ElementType
  iconName?: string
  iconColor?: string
  iconBgColor?: string
  className?: string
}

export function ActionCard({
  title,
  description,
  href,
  icon: IconProp,
  iconName,
  iconColor = "text-white",
  iconBgColor = "bg-muted",
  className,
}: ActionCardProps) {
  // Prefer iconName (string) over icon (component) to avoid serialization issues
  const Icon = iconName ? iconMap[iconName] : IconProp
  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          "hover:border-primary/50 group cursor-pointer transition-all hover:shadow-md",
          className
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("rounded-lg p-3", iconBgColor)}>
                {Icon && <Icon className={cn("h-6 w-6", iconColor)} />}
              </div>
              <div>
                <CardTitle className="text-base whitespace-pre-line">
                  {title}
                </CardTitle>
                {description && (
                  <CardDescription className="text-sm">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            <ChevronRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
