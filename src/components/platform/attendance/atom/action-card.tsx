"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ChevronRight, Pencil, QrCode, Upload, FileText } from "lucide-react"
import type { ElementType } from "react"

// Icon map for string-based icon names (prevents Server Component serialization issues)
const iconMap: Record<string, ElementType> = {
  Pencil,
  QrCode,
  Upload,
  FileText,
}

interface ActionCardProps {
  title: string
  description: string
  href: string
  icon?: ElementType
  iconName?: string
  iconColor?: string
  className?: string
}

export function ActionCard({
  title,
  description,
  href,
  icon: IconProp,
  iconName,
  iconColor = "text-primary",
  className,
}: ActionCardProps) {
  // Prefer iconName (string) over icon (component) to avoid serialization issues
  const Icon = iconName ? iconMap[iconName] : IconProp
  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          "transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group",
          className
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-muted">
                {Icon && <Icon className={cn("h-6 w-6", iconColor)} />}
              </div>
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-sm">
                  {description}
                </CardDescription>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
