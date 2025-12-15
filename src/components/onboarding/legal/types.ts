export type OperationalStatus = "licensed" | "pending" | "exempt"
export type DocumentType =
  | "terms"
  | "privacy"
  | "safety"
  | "conduct"
  | "enrollment"
export type ComplianceLevel = "required" | "recommended" | "optional"
export type SafetyFeature =
  | "background_checks"
  | "cctv"
  | "visitor_logs"
  | "emergency_plan"
  | "health_safety"

export interface LegalData {
  operationalStatus: OperationalStatus
  licenseNumber?: string
  licenseAuthority?: string
  licenseExpiryDate?: Date
  taxId?: string
  insuranceProvider?: string
  insurancePolicyNumber?: string
  insuranceExpiryDate?: Date
  safetyFeatures: SafetyFeature[]
  acceptedDocuments: DocumentType[]
  customPolicies?: string[]
  lastComplianceCheck?: Date
  complianceOfficer?: string
  complianceEmail?: string
}

export interface LegalFormData {
  operationalStatus: OperationalStatus
  licenseNumber?: string
  licenseAuthority?: string
  licenseExpiryDate?: string
  taxId?: string
  insuranceProvider?: string
  insurancePolicyNumber?: string
  insuranceExpiryDate?: string
  safetyFeatures: SafetyFeature[]
  acceptedDocuments: DocumentType[]
  customPolicies?: string[]
  lastComplianceCheck?: string
  complianceOfficer?: string
  complianceEmail?: string
}

export interface DocumentRequirement {
  type: DocumentType
  label: string
  description: string
  level: ComplianceLevel
  requiredForLicense: boolean
  updateFrequency: string
  template?: string
}

export interface SafetyRequirement {
  feature: SafetyFeature
  label: string
  description: string
  level: ComplianceLevel
  verificationMethod: string
  updateFrequency: string
}

export interface LicenseRequirement {
  status: OperationalStatus
  label: string
  description: string
  requirements: string[]
  renewalPeriod: string
  verificationProcess: string
}

export interface ComplianceConfig {
  minSafetyFeatures: number
  requiredDocuments: DocumentType[]
  backgroundCheckValidityDays: number
  insuranceMinCoverage: number
  maxPolicyValidityDays: number
}
