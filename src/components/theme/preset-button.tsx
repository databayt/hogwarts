/**
 * Preset Button Component
 *
 * Simple button UI for theme presets showing three colored circles.
 * Based on tweakcn's example section design.
 */

"use client"

import { motion } from "framer-motion"
import { useTheme as useNextTheme } from "next-themes"

import type { ThemePreset } from "@/types/theme-editor"
import { addAlphaChannel } from "@/lib/color-converter"

interface ColorBoxProps {
  color: string
}

function ColorBox({ color }: ColorBoxProps) {
  return (
    <div
      className="border-border/50 h-3 w-3 rounded-sm border"
      style={{ backgroundColor: color }}
    />
  )
}

interface PresetButtonProps {
  preset: ThemePreset
  onApply: () => void
  isActive?: boolean
}

export function PresetButton({
  preset,
  onApply,
  isActive = false,
}: PresetButtonProps) {
  const { resolvedTheme } = useNextTheme()

  // Extract colors based on current theme mode
  const mode = resolvedTheme === "dark" ? "dark" : "light"
  const colors = preset.styles[mode] || preset.styles.light
  const primaryColor = colors.primary || "#3b82f6"
  const secondaryColor = colors.secondary || "#e5e7eb"
  const accentColor = colors.accent || "#f3f4f6"

  // Use color converter for proper opacity handling
  const backgroundColor = addAlphaChannel(primaryColor, 0.1)

  // Format label: capitalize and replace dashes with spaces
  const formattedLabel = preset.label
    ? preset.label
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Untitled"

  return (
    <motion.button
      onClick={onApply}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-row items-center gap-2.5 rounded-lg border px-4 py-2.5 transition-shadow hover:shadow-md"
      style={{
        backgroundColor,
        borderColor: isActive ? primaryColor : "hsl(var(--border))",
        borderWidth: isActive ? "2px" : "1px",
      }}
    >
      {/* Color circles */}
      <div className="flex gap-1">
        <ColorBox color={primaryColor} />
        <ColorBox color={secondaryColor} />
        <ColorBox color={accentColor} />
      </div>

      {/* Theme name */}
      <span className="text-foreground/80 group-hover:text-foreground text-xs font-medium">
        {formattedLabel}
      </span>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute end-2 top-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
        </div>
      )}
    </motion.button>
  )
}
