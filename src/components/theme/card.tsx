/**
 * Theme Preview Card Component
 *
 * Displays a visual preview of a theme with color swatches.
 * Uses flat structure following tweakcn pattern.
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ThemePreset } from '@/types/theme-editor'

interface ThemeCardProps {
  preset: ThemePreset
  isActive?: boolean
  onApply?: () => void
  onDelete?: () => void
  className?: string
}

export function ThemeCard({
  preset,
  isActive = false,
  onApply,
  onDelete,
  className,
}: ThemeCardProps) {
  const { label, styles, source } = preset

  // Extract primary colors for preview
  const lightPrimary = styles.light.primary || 'oklch(0.5 0.2 250)'
  const lightSecondary = styles.light.secondary || 'oklch(0.9 0.04 250)'
  const lightAccent = styles.light.accent || 'oklch(0.7 0.15 250)'
  const darkPrimary = styles.dark.primary || 'oklch(0.7 0.2 250)'
  const darkSecondary = styles.dark.secondary || 'oklch(0.25 0.04 250)'
  const darkAccent = styles.dark.accent || 'oklch(0.5 0.15 250)'

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
            <CardTitle>{label}</CardTitle>
            {source && (
              <Badge variant="outline" className="text-xs">
                {source === 'BUILT_IN' ? 'Built-in' : 'Custom'}
              </Badge>
            )}
          </div>
        </div>
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

          {source !== 'BUILT_IN' && onDelete && (
            <Button onClick={onDelete} size="sm" variant="outline" disabled={isActive}>
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
