"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import { logger } from "@/lib/logger"

export function ServiceWorkerProvider() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      // Production only — with an escape hatch so `next build && next start`
      // can verify the worker locally (NEXT_PUBLIC_SW_DEV=1). `next dev`
      // never registers it: HMR chunks would poison the static cache.
      (process.env.NODE_ENV === "production" ||
        process.env.NEXT_PUBLIC_SW_DEV === "1")
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            // Some environments (e.g. automated browsers that block SW
            // registration) resolve with `undefined` instead of rejecting —
            // guard before touching `.scope`/`.update()`.
            if (!registration) return

            logger.info("Service Worker registered", {
              action: "service_worker_registered",
              scope: registration.scope,
            })

            // Check for updates periodically
            setInterval(
              () => {
                registration.update()
              },
              60 * 60 * 1000
            ) // Every hour
          })
          .catch((error) => {
            logger.error("Service Worker registration failed", error)
          })
      })
    }
  }, [])

  return null
}
