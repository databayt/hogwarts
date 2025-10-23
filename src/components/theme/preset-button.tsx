/**
 * Preset Button Component
 *
 * Simple button UI for theme presets showing three colored circles.
 * Based on tweakcn's example section design.
 */

'use client'

import { motion } from 'framer-motion'
import type { ThemePreset } from '@/types/theme-editor'

interface ColorBoxProps {
  color: string
}

function ColorBox({ color }: ColorBoxProps) {
  return (
    <div
      className="h-3 w-3 rounded-sm border border-border/50"
      style={{ backgroundColor: color }}
    />
  )
}

interface PresetButtonProps {
  preset: ThemePreset
  onApply: () => void
  isActive?: boolean
}

export function PresetButton({ preset, onApply, isActive = false }: PresetButtonProps) {
  // Extract colors from the current mode (use light mode for preview)
  const colors = preset.styles.light
  const primaryColor = colors.primary || '#3b82f6'
  const secondaryColor = colors.secondary || '#e5e7eb'
  const accentColor = colors.accent || '#f3f4f6'

  // Format label: capitalize and replace dashes with spaces
  const formattedLabel = preset.label
    ? preset.label
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Untitled'

  return (
    <motion.button
      onClick={onApply}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col items-center gap-2 rounded-lg border p-3 transition-shadow hover:shadow-md"
      style={{
        backgroundColor: `${primaryColor}10`, // 10% opacity
        borderColor: isActive ? primaryColor : 'hsl(var(--border))',
        borderWidth: isActive ? '2px' : '1px',
      }}
    >
      {/* Color circles */}
      <div className="flex gap-1.5">
        <ColorBox color={primaryColor} />
        <ColorBox color={secondaryColor} />
        <ColorBox color={accentColor} />
      </div>

      {/* Theme name */}
      <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground">
        {formattedLabel}
      </span>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute right-2 top-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} />
        </div>
      )}
    </motion.button>
  )
}
