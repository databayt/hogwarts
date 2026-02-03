"use client"

/**
 * Proctor Guard Component
 *
 * Security wrapper that monitors and prevents suspicious activity during exams:
 * - Browser focus/blur detection
 * - Tab switching detection
 * - Copy/paste prevention
 * - Context menu blocking
 * - Print prevention
 * - DevTools detection (basic)
 *
 * Modes:
 * - NONE: No restrictions
 * - BASIC: Question randomization only (no active monitoring)
 * - STANDARD: Focus detection + copy prevention
 * - STRICT: Full lockdown with all restrictions
 */
import * as React from "react"
import { useCallback, useEffect, useRef } from "react"
import type { ProctorMode } from "@prisma/client"

import { cn } from "@/lib/utils"

import type { ProctorCallback, ProctorEventType } from "./types"

interface ProctorGuardProps {
  mode: ProctorMode
  onFlag: ProctorCallback
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function ProctorGuard({
  mode,
  onFlag,
  children,
  className,
  disabled = false,
}: ProctorGuardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lastFocusTime = useRef<number>(Date.now())
  const devToolsOpen = useRef<boolean>(false)

  // Memoized flag handler to prevent re-renders
  const handleFlag = useCallback(
    (event: ProctorEventType, details?: string) => {
      if (disabled || mode === "NONE") return
      onFlag(event, details)
    },
    [disabled, mode, onFlag]
  )

  useEffect(() => {
    if (disabled || mode === "NONE" || mode === "BASIC") return

    // Visibility change (tab switch, window minimize)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFlag("FOCUS_LOST", "Document became hidden")
        handleFlag("TAB_SWITCH", "Tab was switched")
      } else {
        handleFlag("FOCUS_RESTORED", "Document became visible")
      }
    }

    // Window blur (clicking outside browser)
    const handleWindowBlur = () => {
      const now = Date.now()
      // Debounce: only flag if more than 500ms since last focus event
      if (now - lastFocusTime.current > 500) {
        handleFlag("FOCUS_LOST", "Window lost focus")
      }
    }

    // Window focus (returning to browser)
    const handleWindowFocus = () => {
      lastFocusTime.current = Date.now()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleWindowBlur)
    window.addEventListener("focus", handleWindowFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleWindowBlur)
      window.removeEventListener("focus", handleWindowFocus)
    }
  }, [disabled, mode, handleFlag])

  // Copy/paste prevention (STANDARD and STRICT)
  useEffect(() => {
    if (disabled || mode === "NONE" || mode === "BASIC") return

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      handleFlag("COPY_ATTEMPT", "Attempted to copy content")
    }

    const handlePaste = (e: ClipboardEvent) => {
      // Allow paste in text inputs for essay answers
      const target = e.target as HTMLElement
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
        return // Allow paste in answer fields
      }
      e.preventDefault()
      handleFlag("PASTE_ATTEMPT", "Attempted to paste content")
    }

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault()
      handleFlag("COPY_ATTEMPT", "Attempted to cut content")
    }

    document.addEventListener("copy", handleCopy)
    document.addEventListener("paste", handlePaste)
    document.addEventListener("cut", handleCut)

    return () => {
      document.removeEventListener("copy", handleCopy)
      document.removeEventListener("paste", handlePaste)
      document.removeEventListener("cut", handleCut)
    }
  }, [disabled, mode, handleFlag])

  // Context menu prevention (STRICT only)
  useEffect(() => {
    if (disabled || mode !== "STRICT") return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      handleFlag("CONTEXT_MENU", "Right-click menu blocked")
    }

    document.addEventListener("contextmenu", handleContextMenu)

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [disabled, mode, handleFlag])

  // Print prevention (STRICT only)
  useEffect(() => {
    if (disabled || mode !== "STRICT") return

    const handleBeforePrint = () => {
      handleFlag("PRINT_ATTEMPT", "Print dialog opened")
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault()
        handleFlag("PRINT_ATTEMPT", "Print shortcut blocked")
      }
      // Block Ctrl+Shift+I / Cmd+Shift+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
        e.preventDefault()
        handleFlag("DEVTOOLS_OPEN", "DevTools shortcut blocked")
      }
      // Block F12 (DevTools)
      if (e.key === "F12") {
        e.preventDefault()
        handleFlag("DEVTOOLS_OPEN", "F12 blocked")
      }
    }

    window.addEventListener("beforeprint", handleBeforePrint)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [disabled, mode, handleFlag])

  // DevTools detection (basic - STRICT only)
  useEffect(() => {
    if (disabled || mode !== "STRICT") return

    const checkDevTools = () => {
      const threshold = 160
      const widthThreshold = window.outerWidth - window.innerWidth > threshold
      const heightThreshold =
        window.outerHeight - window.innerHeight > threshold

      if ((widthThreshold || heightThreshold) && !devToolsOpen.current) {
        devToolsOpen.current = true
        handleFlag("DEVTOOLS_OPEN", "DevTools may be open")
      } else if (!widthThreshold && !heightThreshold && devToolsOpen.current) {
        devToolsOpen.current = false
      }
    }

    const interval = setInterval(checkDevTools, 1000)

    return () => clearInterval(interval)
  }, [disabled, mode, handleFlag])

  // Selection prevention (STRICT only)
  useEffect(() => {
    if (disabled || mode !== "STRICT") return

    const container = containerRef.current
    if (!container) return

    const preventSelect = (e: Event) => {
      const target = e.target as HTMLElement
      // Allow selection in input/textarea
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
        return
      }
      e.preventDefault()
    }

    container.addEventListener("selectstart", preventSelect)

    return () => {
      container.removeEventListener("selectstart", preventSelect)
    }
  }, [disabled, mode])

  return (
    <div
      ref={containerRef}
      className={cn(mode === "STRICT" && "select-none", className)}
      style={
        mode === "STRICT"
          ? {
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
              userSelect: "none",
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}
