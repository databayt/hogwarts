/**
 * Development Icons
 *
 * Icons for development tools like MCP, Cursor, extensions.
 * Migrated from src/components/atom/icons.tsx
 */

import type { IconProps } from "../types"

export const McpIcon = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 200"
    {...props}
  >
    <path
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="6"
      d="M111.5 21L121.5 23L133 31.5Q139.6 39.2 139 53Q157.1 52.6 165 63.5Q171.4 70.6 171 84.5Q169.3 93.8 164 99.5L104 160.5L118 175.5L118 178.5L115.5 182L110.5 182L96 167.5Q92.8 164.2 94 156.5L96 152.5L158 90.5L161 80.5L158 71.5L152.5 66L142.5 63L133.5 66L82.5 117L78.5 118L75 115.5L74 111.5L126 58.5L129 48.5L126 39.5L120.5 34Q115.8 30.7 106.5 32L99.5 36L34.5 101L31.5 102L28 99.5L27 94.5L94.5 27L101.5 23L111.5 21Z"
    />
    <path
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="4"
      d="M109.5 44Q115 43 116 46.5L116 51.5L66 101.5Q62.1 105.6 63 114.5Q64.9 122.1 70.5 126Q74.6 129.9 83.5 129L90.5 126L140.5 76L145.5 76Q149 77 148 82.5L95.5 135Q88.6 140.6 74.5 139Q64.9 136.1 59 129.5L53 117.5L53 106.5L57 96.5L109.5 44Z"
    />
  </svg>
)

export const CursorIcon = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    {...props}
  >
    <path
      fill="currentColor"
      fillOpacity="0.3"
      d="M3.75 9v14h24.5V9L16 2"
    />
    <path
      fill="currentColor"
      fillOpacity="0.6"
      d="M16 16V2L3.75 9l24.5 14L16 30L3.75 23"
    />
    <path
      fill="currentColor"
      fillOpacity="0.9"
      d="M28.25 9H16v21"
    />
    <path
      fill="currentColor"
      d="M3.75 9h24.5L16 16"
    />
  </svg>
)

export const ExtensionsIcon = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      fill="currentColor"
      d="M8.954 20H5q-.421 0-.71-.29Q4 19.422 4 19v-3.954q.854-.25 1.427-.945T6 12.5t-.573-1.601T4 9.954V6q0-.421.29-.71Q4.579 5 5 5h4q.27-.858.946-1.371q.677-.514 1.554-.514t1.554.514T14 5h4q.421 0 .71.29q.29.289.29.71v4q.858.27 1.371.946q.514.677.514 1.554t-.514 1.554T19 15v4q0 .421-.29.71q-.289.29-.71.29h-3.954q-.269-.904-.97-1.452T11.5 18t-1.576.548T8.954 20"
    />
  </svg>
)

export const McpIconAlt = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    {...props}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.7"
      d="m4.4 15l11-11c1.5-1.5 4-1.5 5.5 0v0c1.5 1.5 1.5 4 0 5.5l-8.3 8.3m0 0l8.3-8.3c1.5-1.5 4-1.5 5.5 0l.057.057c1.5 1.5 1.5 4 0 5.5l-10 10c-.51.51-.51 1.3 0 1.8l2 2m-.4-22l-8.1 8.1c-1.5 1.5-1.5 4 0 5.5v0c1.5 1.5 4 1.5 5.5 0l8.1-8.1"
    />
  </svg>
)
