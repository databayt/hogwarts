import React from "react"

interface IconProps {
  className?: string
  size?: number
}

export const SendIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 48 48"
    className={className}
  >
    <path
      fill="currentColor"
      d="M7.262 4.244c-1.787-.893-3.765.812-3.146 2.711L8.13 19.26a2 2 0 0 0 1.573 1.352l15.86 2.643c.835.14.835 1.34 0 1.48L9.704 27.378a2 2 0 0 0-1.573 1.352L4.116 41.042c-.62 1.9 1.359 3.605 3.146 2.712l35.494-17.742c1.659-.83 1.659-3.197 0-4.026z"
    />
  </svg>
)

export const ResetIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 21 21"
    className={className}
  >
    <g
      fill="none"
      fillRule="evenodd"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <path d="M3.578 6.487A8 8 0 1 1 2.5 10.5" />
      <path d="M7.5 6.5h-4v-4" />
    </g>
  </svg>
)

export const PriceIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 48 48"
    className={className}
  >
    <circle
      cx="24"
      cy="24"
      r="19.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18.135 31.36a5.48 5.48 0 0 0 4.6 2.07h2.76a4.6 4.6 0 0 0 0-9.2h-2.99a4.6 4.6 0 1 1 0-9.2h2.76c2.07 0 3.45.46 4.6 2.07m-5.98-4.6v23"
      strokeWidth="1.5"
    />
  </svg>
)

export const TimeIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 512 512"
    className={className}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeMiterlimit="10"
      strokeWidth="32"
      d="M256 64C150 64 64 150 64 256s86 192 192 192s192-86 192-192S362 64 256 64Z"
    />
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="32"
      d="M256 128v144h96"
    />
  </svg>
)

export const ServicesIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1"
      d="m12 21l8.131-4.208c.316-.164.474-.245.589-.366a1 1 0 0 0 .226-.373c.054-.159.054-.336.054-.692V7.533M12 21l-8.131-4.208c-.316-.164-.474-.245-.589-.366a1 1 0 0 1-.226-.373C3 15.894 3 15.716 3 15.359V7.533M12 21v-9.063m9-4.404l-9 4.404m9-4.404l-8.27-4.28c-.267-.138-.4-.208-.541-.235a1 1 0 0 0-.378 0c-.14.027-.274.097-.542.235L3 7.533m0 0l9 4.404"
    />
  </svg>
)

export const InfoIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <g fill="none">
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1" />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1"
        d="M12 11.813v5"
      />
      <circle cx="12" cy="8.438" r="1.25" fill="currentColor" />
    </g>
  </svg>
)

export const AddIcon: React.FC<IconProps> = ({ className = "", size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      fill="currentColor"
      d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1"
      strokeWidth="0.5"
      stroke="currentColor"
    />
  </svg>
)

export const VoiceIcon: React.FC<IconProps> = ({
  className = "",
  size = 24,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 16 16"
    className={className}
  >
    <path
      fill="currentColor"
      d="M8 2a2.5 2.5 0 0 0-2.5 2.5V8a2.5 2.5 0 0 0 5 0V4.5A2.5 2.5 0 0 0 8 2M4 7.5a.5.5 0 0 1 .5.5a3.5 3.5 0 1 0 7 0a.5.5 0 0 1 1 0a4.5 4.5 0 0 1-4 4.473V13.5a.5.5 0 0 1-1 0v-1.027A4.5 4.5 0 0 1 3.5 8a.5.5 0 0 1 .5-.5"
    />
  </svg>
)

export const ChatBotIcon: React.FC<IconProps> = ({
  className = "",
  size = 48,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      fill="currentColor"
      d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10a9.954 9.954 0 0 1-4.644-1.141l-4.29 1.117a.85.85 0 0 1-1.037-1.036l1.116-4.289A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2Zm-2 9a1 1 0 1 0 0 2a1 1 0 0 0 0-2Zm4 0a1 1 0 1 0 0 2a1 1 0 0 0 0-2Zm4 0a1 1 0 1 0 0 2a1 1 0 0 0 0-2Z"
    />
  </svg>
)
