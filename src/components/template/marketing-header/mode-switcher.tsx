"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

export function ModeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }, [resolvedTheme, setTheme])

  if (!mounted) {
    return (
      <button className="p-2 rounded hover:bg-[#3c4b5e] transition-colors text-white">
        <Sun className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      className="p-2 rounded hover:bg-[#3c4b5e] transition-colors text-white"
      onClick={toggleTheme}
      title="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}