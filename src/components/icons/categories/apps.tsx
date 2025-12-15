/**
 * Application Icons
 *
 * Icons for specific applications and features like starter kits, chatbots, flows, etc.
 * Migrated from src/components/atom/icons.tsx
 */

import type { IconProps } from "../types"

export const StarterKitIcon = (props: IconProps) => (
  <svg viewBox="0 0 32 32" {...props}>
    <path
      fill="currentColor"
      d="m12.807 10.906l5.865-8.505C19.787.802 21.214 0 22.974 0q2.148.001 3.719 1.526c1.047 1.021 1.568 2.234 1.568 3.651c0 1.042-.276 1.969-.833 2.771l-5.286 7.693l6.469 8.203c.646.818.969 1.776.969 2.865c0 1.448-.505 2.693-1.526 3.734Q26.531 31.998 24.361 32q-2.382 0-3.63-1.547l-7.922-9.891v5.453q0 2.335-.813 3.63c-.979 1.568-2.401 2.354-4.281 2.354c-1.708 0-3.036-.583-3.974-1.734q-1.319-1.596-1.318-4.229V5.817c0-1.656.448-3.031 1.339-4.109C4.694.573 5.986 0 7.637 0c1.573 0 2.88.573 3.927 1.708c.583.635.953 1.271 1.109 1.922c.094.401.141 1.141.141 2.24v5.036z"
    />
  </svg>
)

export const ContentlayerIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      stroke="currentColor"
      strokeWidth="2.146"
      d="M-2.482.404A1.93 1.93 0 0 1-.16.427l6.967 5.356a1.93 1.93 0 0 1 0 3.058L4.15 10.883l2.7 2.171c.983.79.956 2.294-.053 3.048l-7.152 5.344a1.93 1.93 0 0 1-2.439-.106l-5.596-4.996l-.782-.672c-3.492-3-3.062-8.526.845-10.951zm5.6 9.65L-.13 7.444a1.93 1.93 0 0 0-2.384-.026l-2.403 1.848a1.93 1.93 0 0 0 0 3.058l2.42 1.86a1.93 1.93 0 0 0 2.352 0l3.246-2.494l2.944 2.366a.643.643 0 0 1-.018 1.016l-7.152 5.344a.64.64 0 0 1-.813-.035l-5.6-5l-.796-.684c-2.839-2.439-2.482-6.935.705-8.896l.023-.014l5.888-4.349a.64.64 0 0 1 .774.008l6.967 5.356a.643.643 0 0 1 0 1.02zm-1.049.807l-2.998 2.304a.64.64 0 0 1-.783 0l-2.421-1.86a.643.643 0 0 1 0-1.02l2.403-1.848a.64.64 0 0 1 .795.009z"
      clipRule="evenodd"
      transform="matrix(.5949 0 0 .61208 9.182 1.311)"
    />
  </svg>
)

export const MathIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
      d="M3 8h10M5 8v8m6-8v6.03A1.97 1.97 0 0 0 12.97 16H13"
    />
  </svg>
)

export const FlowIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...props}>
    <path
      fill="currentColor"
      d="M256 128a8 8 0 0 1-8 8h-39.58a80 80 0 0 1-158.84 0H8a8 8 0 0 1 0-16h39.58a80 80 0 0 1 158.84 0H248a8 8 0 0 1 8 8"
    />
  </svg>
)

export const ChatbotIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M21 10.975V8a2 2 0 0 0-2-2h-6V4.688c.305-.274.5-.668.5-1.11a1.5 1.5 0 0 0-3 0c0 .442.195.836.5 1.11V6H5a2 2 0 0 0-2 2v2.998l-.072.005A1 1 0 0 0 2 12v2a1 1 0 0 0 1 1v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a1 1 0 0 0 1-1v-1.938a1 1 0 0 0-.072-.455c-.202-.488-.635-.605-.928-.632M7 12c0-1.104.672-2 1.5-2s1.5.896 1.5 2s-.672 2-1.5 2S7 13.104 7 12m8.998 6c-1.001-.003-7.997 0-7.998 0v-2s7.001-.002 8.002 0zm-.498-4c-.828 0-1.5-.896-1.5-2s.672-2 1.5-2s1.5.896 1.5 2s-.672 2-1.5 2"
    />
  </svg>
)

export const LeadsIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <g fill="none">
      <path d="M0 0h24v24H0z" />
      <path
        fill="currentColor"
        d="M10.5 2a8.5 8.5 0 0 1 6.676 13.762l3.652 3.652a1 1 0 0 1-1.414 1.414l-3.652-3.652A8.5 8.5 0 1 1 10.5 2m0 2a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13m0 1a5.5 5.5 0 1 1 0 11a5.5 5.5 0 0 1 0-11"
      />
    </g>
  </svg>
)
