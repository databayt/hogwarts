// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useCallback } from "react"

/**
 * Hook to trigger confetti animation
 * TODO: Implement actual confetti animation (e.g., using canvas-confetti library)
 */
export function useConfetti() {
  const triggerConfetti = useCallback(() => {
    // For now, just log - can be enhanced with a confetti library later
    console.log("🎉 Confetti triggered!")
  }, [])

  return triggerConfetti
}
