/**
 * Productivity Icons
 *
 * Icons for rules, prompts, tweets, and productivity features.
 * Migrated from src/components/atom/icons.tsx
 */

import type { IconProps } from "../types"

export const RulesIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" {...props}>
    <path fill="none" d="M9 16h14v2H9zm0-6h14v2H9z" />
    <path
      fill="currentColor"
      d="M26 2H6a2 2 0 0 0-2 2v13a10.98 10.98 0 0 0 5.824 9.707L16 30l6.176-3.293A10.98 10.98 0 0 0 28 17V4a2 2 0 0 0-2-2m-3 16H9v-2h14Zm0-6H9v-2h14Z"
    />
  </svg>
)

export const PromptsIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
      d="m5 7l5 5l-5 5m8 0h6"
    />
  </svg>
)

export const TweetsIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M22.46 6c-.77.35-1.6.58-2.46.69c.88-.53 1.56-1.37 1.88-2.38c-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29c0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15c0 1.49.75 2.81 1.91 3.56c-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.2 4.2 0 0 1-1.93.07a4.28 4.28 0 0 0 4 2.98a8.52 8.52 0 0 1-5.33 1.84q-.51 0-1.02-.06C3.44 20.29 5.7 21 8.12 21C16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56c.84-.6 1.56-1.36 2.14-2.23"
    />
  </svg>
)
