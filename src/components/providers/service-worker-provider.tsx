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
      process.env.NODE_ENV === "production"
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
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
