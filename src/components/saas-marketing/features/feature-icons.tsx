// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

type IconProps = React.HTMLAttributes<SVGElement>

// Core — Filled shield
export const CoreIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
    />
  </svg>
)

// Academic — Open book (from LogbookIcon)
export const AcademicIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M18.75 16.714a1 1 0 0 1-.014.143a.75.75 0 0 1-.736.893H4a1.25 1.25 0 1 0 0 2.5h14a.75.75 0 0 1 0 1.5H4A2.75 2.75 0 0 1 1.25 19V5A2.75 2.75 0 0 1 4 2.25h13.4c.746 0 1.35.604 1.35 1.35zM7 6.25a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5z"
      clipRule="evenodd"
    />
  </svg>
)

// Scheduling — Clock (from TimesheetIcon)
export const SchedulingIcon = (props: IconProps) => (
  <svg viewBox="0 0 20 20" {...props}>
    <path
      fill="currentColor"
      d="M10 0c5.523 0 10 4.477 10 10s-4.477 10-10 10S0 15.523 0 10S4.477 0 10 0m-.93 5.581a.7.7 0 0 0-.698.698v5.581c0 .386.312.698.698.698h5.581a.698.698 0 1 0 0-1.395H9.767V6.279a.7.7 0 0 0-.697-.698"
    />
  </svg>
)

// Finance — Receipt (from InvoiceIcon)
export const FinanceIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="currentColor" d="m21 22l-3-2l-3 2l-3-2l-3 2l-3-2l-3 2V3h18z" />
  </svg>
)

// Facilities — Grid layout (from DashboardIcon)
export const FacilitiesIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 3a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm8 0a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm0 10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1zM3 14a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"
    />
  </svg>
)

// HR — People group (filled)
export const HRIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 12.75c1.63 0 3.07.39 4.24.9c1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73c1.17-.52 2.61-.91 4.24-.91M4 13c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2m1.13 1.1c-.37-.06-.74-.1-1.13-.1c-.99 0-1.93.21-2.78.58A2.01 2.01 0 0 0 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29M20 13c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2m4 3.43c0-.81-.48-1.53-1.22-1.85A6.95 6.95 0 0 0 20 14c-.39 0-.76.04-1.13.1c.4.68.63 1.46.63 2.29V18H24zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3s-3-1.34-3-3s1.34-3 3-3"
    />
  </svg>
)

// Operations — Shield with lines (from RulesIcon)
export const OperationsIcon = (props: IconProps) => (
  <svg viewBox="0 0 32 32" {...props}>
    <path fill="none" d="M9 16h14v2H9zm0-6h14v2H9z" />
    <path
      fill="currentColor"
      d="M26 2H6a2 2 0 0 0-2 2v13a10.98 10.98 0 0 0 5.824 9.707L16 30l6.176-3.293A10.98 10.98 0 0 0 28 17V4a2 2 0 0 0-2-2m-3 16H9v-2h14Zm0-6H9v-2h14Z"
    />
  </svg>
)

// Analytics — Report badge (from ReportIcon)
export const AnalyticsIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M10 17q.425 0 .713-.288T11 16t-.288-.712T10 15t-.712.288T9 16t.288.713T10 17m0-4q.425 0 .713-.288T11 12V8q0-.425-.288-.712T10 7t-.712.288T9 8v4q0 .425.288.713T10 13m-2.925 8q-.4 0-.762-.15t-.638-.425l-4.1-4.1q-.275-.275-.425-.638T1 14.926v-5.85q0-.4.15-.762t.425-.638l4.1-4.1q.275-.275.638-.425T7.075 3h5.85q.4 0 .763.15t.637.425l4.1 4.1q.275.275.425.638t.15.762v5.85q0 .4-.15.763t-.425.637l-4.1 4.1q-.275.275-.638.425t-.762.15z"
    />
  </svg>
)

// Communication — Chat bubble (from ChatbotIcon)
export const CommunicationIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M21 10.975V8a2 2 0 0 0-2-2h-6V4.688c.305-.274.5-.668.5-1.11a1.5 1.5 0 0 0-3 0c0 .442.195.836.5 1.11V6H5a2 2 0 0 0-2 2v2.998l-.072.005A1 1 0 0 0 2 12v2a1 1 0 0 0 1 1v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a1 1 0 0 0 1-1v-1.938a1 1 0 0 0-.072-.455c-.202-.488-.635-.605-.928-.632M7 12c0-1.104.672-2 1.5-2s1.5.896 1.5 2s-.672 2-1.5 2S7 13.104 7 12m8.998 6c-1.001-.003-7.997 0-7.998 0v-2s7.001-.002 8.002 0zm-.498-4c-.828 0-1.5-.896-1.5-2s.672-2 1.5-2s1.5.896 1.5 2s-.672 2-1.5 2"
    />
  </svg>
)

// Enrollment — Magnifying glass (from LeadsIcon)
export const EnrollmentIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <g fill="none">
      <path d="M0 0h24v24H0z" />
      <path
        fill="currentColor"
        d="M10.5 2a8.5 8.5 0 0 1 6.676 13.762l3.652 3.652a1 1 0 0 1-1.414 1.414l-3.652-3.652A8.5 8.5 0 1 1 10.5 2m0 2a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13m0 1a5.5 5.5 0 1 1 0 11a5.5 5.5 0 0 1 0-11"
      />
    </g>
  </svg>
)

// Community — Puzzle piece (from ExtensionsIcon)
export const CommunityIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M8.954 20H5q-.421 0-.71-.29Q4 19.422 4 19v-3.954q.854-.25 1.427-.945T6 12.5t-.573-1.601T4 9.954V6q0-.421.29-.71Q4.579 5 5 5h4q.27-.858.946-1.371q.677-.514 1.554-.514t1.554.514T14 5h4q.421 0 .71.29q.29.289.29.71v4q.858.27 1.371.946q.514.677.514 1.554t-.514 1.554T19 15v4q0 .421-.29.71q-.289.29-.71.29h-3.954q-.269-.904-.97-1.452T11.5 18t-1.576.548T8.954 20"
    />
  </svg>
)

// Welfare — Filled heart
export const WelfareIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="m12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z"
    />
  </svg>
)

// E-Learning — Command grid (from CommandsIcon)
export const ELearningIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M6 2a4 4 0 0 0-4 4v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 2h2v4H4V6a2 2 0 0 1 2-2m10 0a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V6a4 4 0 0 0-4-4zm0 2h2v4h-2a2 2 0 0 1-2-2V6zM6 12a4 4 0 0 0-4 4v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2zm0 2h2v4H4v-2a2 2 0 0 1 2-2m10 0a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2zm0 2h2v4h-2a2 2 0 0 1-2-2v-2z"
    />
  </svg>
)

// Documents — Filled document (from ProposalIcon)
export const DocumentsIcon = (props: IconProps) => (
  <svg viewBox="0 0 15 15" {...props}>
    <path
      fill="currentColor"
      d="M2.5 0A1.5 1.5 0 0 0 1 1.5v12A1.5 1.5 0 0 0 2.5 15h10a1.5 1.5 0 0 0 1.5-1.5V3.293L10.707 0z"
    />
  </svg>
)

// AI — Sparkle/brain icon
export const AIIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M9 4a1 1 0 0 1 1 1a3 3 0 0 0 3 3a1 1 0 1 1 0 2a3 3 0 0 0-3 3a1 1 0 1 1-2 0a3 3 0 0 0-3-3a1 1 0 1 1 0-2a3 3 0 0 0 3-3a1 1 0 0 1 1-1m8-2a1 1 0 0 1 1 1a5 5 0 0 0 5 5a1 1 0 1 1 0 2a5 5 0 0 0-5 5a1 1 0 1 1-2 0a5 5 0 0 0-5-5a1 1 0 1 1 0-2a5 5 0 0 0 5-5a1 1 0 0 1 1-1"
    />
  </svg>
)

// LMS — Monitor/screen icon
export const LMSIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M21 2H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7v2H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-2v-2h7a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2m0 14H3V4h18z"
    />
  </svg>
)

// Category → Icon resolver (10 OpenEduCat modules)
const categoryIconMap: Record<string, (props: IconProps) => React.JSX.Element> =
  {
    core: CoreIcon,
    essential: AcademicIcon,
    advance: ELearningIcon,
    erp: FinanceIcon,
    management: FacilitiesIcon,
    communication: CommunicationIcon,
    lms: LMSIcon,
    technical: OperationsIcon,
    integration: CommunityIcon,
    ai: AIIcon,
  }

export function getCategoryIcon(
  category: string
): (props: IconProps) => React.JSX.Element {
  return categoryIconMap[category] || CoreIcon
}
