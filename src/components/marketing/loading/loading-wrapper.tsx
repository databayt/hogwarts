"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, type ReactNode } from "react"

import { LoadingProvider, useLoading } from "./loading-context"
import { LoadingScreen } from "./loading-screen"

type LoadingState = "loading" | "transitioning" | "complete"

function LoadingContent({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadingState>("loading")
  const { isContentReady, setContentReady } = useLoading()

  // Auto-trigger content ready after mount (no video to wait for)
  useEffect(() => {
    const timeout = setTimeout(setContentReady, 100)
    return () => clearTimeout(timeout)
  }, [setContentReady])

  useEffect(() => {
    if (state !== "complete") {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [state])

  const handleLoadingComplete = () => {
    setState("transitioning")
    setTimeout(() => setState("complete"), 700)
  }

  const isLoading = state === "loading"
  const isTransitioning = state === "transitioning"
  const isComplete = state === "complete"

  return (
    <>
      {!isComplete && (
        <div
          className="transition-opacity duration-500 ease-out"
          style={{
            opacity: isTransitioning ? 0 : 1,
            pointerEvents: isTransitioning ? "none" : "auto",
          }}
        >
          <LoadingScreen
            isContentReady={isContentReady}
            onComplete={handleLoadingComplete}
          />
        </div>
      )}

      <div
        className={isComplete ? "" : "transition-all duration-700 ease-out"}
        style={
          isComplete
            ? undefined
            : {
                opacity: isTransitioning ? 1 : 0,
                transform: isTransitioning ? "none" : "scale(0.98)",
                visibility: isLoading ? "hidden" : "visible",
              }
        }
      >
        {children}
      </div>
    </>
  )
}

export function LoadingWrapper({ children }: { children: ReactNode }) {
  return (
    <LoadingProvider>
      <LoadingContent>{children}</LoadingContent>
    </LoadingProvider>
  )
}
