export type InformationSharing = "full-transparency" | "limited-sharing"
export type VisibilityLevel = "public" | "private" | "unlisted"
export type AccessLevel = "all" | "registered" | "approved"

export interface VisibilityData {
  informationSharing: InformationSharing
  visibilityLevel: VisibilityLevel
  accessLevel: AccessLevel
  isPubliclyListed: boolean
  allowSelfEnrollment: boolean
  requireParentApproval: boolean
  publicDirectory: boolean
}

export interface VisibilityFormData {
  informationSharing: InformationSharing
  visibilityLevel: VisibilityLevel
  accessLevel: AccessLevel
  isPubliclyListed: boolean
  allowSelfEnrollment: boolean
  requireParentApproval: boolean
  publicDirectory: boolean
}

export interface SharingOption {
  id: InformationSharing
  title: string
  description: string
  features: string[]
}

export interface VisibilityOption {
  id: VisibilityLevel
  title: string
  description: string
  recommended?: boolean
}

export interface AccessOption {
  id: AccessLevel
  title: string
  description: string
  requirements?: string[]
}
