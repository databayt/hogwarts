import { useCallback } from "react";

/**
 * Hook to trigger confetti animation
 * TODO: Implement actual confetti animation (e.g., using canvas-confetti library)
 */
export function useConfetti() {
  const triggerConfetti = useCallback(() => {
    // For now, just log - can be enhanced with a confetti library later
    console.log("🎉 Confetti triggered!");
  }, []);

  return triggerConfetti;
}
