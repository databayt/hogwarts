"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

export type MediaPermission = PermissionState | "unknown"

/**
 * The browser's own answer for the microphone or camera, kept live. Safari and
 * Firefox may refuse to answer (or not know the name): that is "unknown", and
 * nothing here may throw. Listens for `change`, so allowing the device in the
 * browser's settings reaches the page without a reload.
 */
export function useMediaPermission(
  name: "microphone" | "camera"
): MediaPermission {
  const [state, setState] = useState<MediaPermission>("unknown")
  useEffect(() => {
    let status: PermissionStatus | null = null
    let alive = true
    const onChange = () => {
      if (alive && status) setState(status.state)
    }
    try {
      void navigator.permissions
        .query({ name: name as PermissionName })
        .then((s) => {
          if (!alive) return
          status = s
          setState(s.state)
          s.addEventListener("change", onChange)
        })
        .catch(() => alive && setState("unknown"))
    } catch {
      setState("unknown")
    }
    return () => {
      alive = false
      status?.removeEventListener("change", onChange)
    }
  }, [name])
  return state
}
