import { AccessOption, SharingOption, VisibilityOption } from "./types"

export const SHARING_OPTIONS: SharingOption[] = [
  {
    id: "full-transparency",
    title: "Full transparency",
    description:
      "Share attendance reports, announcements, and academic progress with all relevant parties.",
    features: [
      "Attendance tracking visible to parents",
      "Academic progress reports",
      "School announcements",
      "Event calendar",
      "Teacher communications",
    ],
  },
  {
    id: "limited-sharing",
    title: "Limited sharing",
    description:
      "Share only essential information and require approval for detailed reports.",
    features: [
      "Basic attendance status",
      "Important announcements only",
      "Limited progress reports",
      "Controlled access to details",
      "Approval required for sensitive data",
    ],
  },
] as const

export const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    id: "public",
    title: "Public",
    description:
      "Your school will be visible in search results and the school directory.",
    recommended: true,
  },
  {
    id: "private",
    title: "Private",
    description: "Your school will only be visible to invited users.",
  },
  {
    id: "unlisted",
    title: "Unlisted",
    description: "Your school will be accessible only via direct link.",
  },
] as const

export const ACCESS_OPTIONS: AccessOption[] = [
  {
    id: "all",
    title: "Open Access",
    description: "Anyone can view basic school information.",
  },
  {
    id: "registered",
    title: "Registered Users",
    description: "Only registered users can access school details.",
    requirements: ["Valid email verification", "Account approval"],
  },
  {
    id: "approved",
    title: "Approved Members",
    description: "Access restricted to approved members only.",
    requirements: [
      "Admin approval",
      "Identity verification",
      "Role assignment",
    ],
  },
] as const

export const VISIBILITY_DEFAULTS = {
  informationSharing: "limited-sharing",
  visibilityLevel: "public",
  accessLevel: "registered",
  isPubliclyListed: true,
  allowSelfEnrollment: false,
  requireParentApproval: true,
  publicDirectory: true,
} as const

export const VISIBILITY_MESSAGES = {
  SELECT_SHARING: "Please select an information sharing level",
  SELECT_VISIBILITY: "Please select a visibility level",
  SELECT_ACCESS: "Please select an access level",
  PARENT_APPROVAL_WARNING:
    "Disabling parent approval may affect student privacy",
  PUBLIC_DIRECTORY_WARNING:
    "Public directory listing may expose school information",
  SELF_ENROLLMENT_WARNING:
    "Self-enrollment requires additional verification measures",
} as const
