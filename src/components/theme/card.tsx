/**
 * Theme Preview Card Component
 *
 * Displays a visual preview of a theme with color swatches.
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ThemePreset, ThemeConfig } from './types'

interface ThemeCardProps {
  preset?: ThemePreset
  themeConfig?: ThemeConfig
  name: string
  description?: string
  isActive?: boolean
  isPreset?: boolean
  onApply?: () => void
  onDelete?: () => void
  className?: string
}

export function ThemeCard({
  preset,
  themeConfig,
  name,
  description,
  isActive = false,
  isPreset: isPresetProp = false,
  onApply,
  onDelete,
  className,
}: ThemeCardProps) {
  // Use preset config if provided, otherwise use themeConfig
  const config = preset?.config || themeConfig

  if (!config) {
    return null
  }

  // Extract primary colors for preview
  const lightPrimary = config.light.primary
  const lightSecondary = config.light.secondary
  const lightAccent = config.light.accent
  const darkPrimary = config.dark.primary
  const darkSecondary = config.dark.secondary
  const darkAccent = config.dark.accent

  return (
    <Card className={cn('relative overflow-hidden transition-shadow hover:shadow-lg', className)}>
      {isActive && (
        <div className="absolute right-3 top-3 z-10">
          <Badge variant="default" className="gap-1">
            <Check className="h-3 w-3" />
            Active
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>{name}</CardTitle>
            {description && (
              <CardDescription className="line-clamp-2">{description}</CardDescription>
            )}
          </div>
        </div>

        {preset?.tags && preset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {preset.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Light mode preview */}
        <div>
          <h4 className="mb-2 text-sm font-medium">Light Mode</h4>
          <div className="flex gap-2">
            <div
              className="h-10 w-full rounded-md border"
              style={{
                background: `linear-gradient(135deg, ${lightPrimary} 0%, ${lightSecondary} 50%, ${lightAccent} 100%)`,
              }}
            />
          </div>
        </div>

        {/* Dark mode preview */}
        <div>
          <h4 className="mb-2 text-sm font-medium">Dark Mode</h4>
          <div className="flex gap-2">
            <div
              className="h-10 w-full rounded-md border"
              style={{
                background: `linear-gradient(135deg, ${darkPrimary} 0%, ${darkSecondary} 50%, ${darkAccent} 100%)`,
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {!isActive && onApply && (
            <Button onClick={onApply} size="sm" className="flex-1">
              Apply Theme
            </Button>
          )}

          {!isPresetProp && onDelete && (
            <Button onClick={onDelete} size="sm" variant="outline" disabled={isActive}>
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
