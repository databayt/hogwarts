import { 
  DocumentRequirement, 
  SafetyRequirement, 
  LicenseRequirement, 
  ComplianceConfig 
} from './types';

export const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    type: 'terms',
    label: 'Terms of Service',
    description: 'Standard terms and conditions for school services',
    level: 'required',
    requiredForLicense: true,
    updateFrequency: 'annual',
    template: 'terms_template',
  },
  {
    type: 'privacy',
    label: 'Privacy Policy',
    description: 'Data collection and protection policies',
    level: 'required',
    requiredForLicense: true,
    updateFrequency: 'annual',
    template: 'privacy_template',
  },
  {
    type: 'safety',
    label: 'Safety Protocol',
    description: 'Safety and emergency procedures',
    level: 'required',
    requiredForLicense: true,
    updateFrequency: 'semi-annual',
    template: 'safety_template',
  },
  {
    type: 'conduct',
    label: 'Code of Conduct',
    description: 'Expected behavior and disciplinary policies',
    level: 'recommended',
    requiredForLicense: false,
    updateFrequency: 'annual',
    template: 'conduct_template',
  },
  {
    type: 'enrollment',
    label: 'Enrollment Agreement',
    description: 'Terms of enrollment and attendance',
    level: 'required',
    requiredForLicense: true,
    updateFrequency: 'annual',
    template: 'enrollment_template',
  },
] as const;

export const SAFETY_REQUIREMENTS: SafetyRequirement[] = [
  {
    feature: 'background_checks',
    label: 'Background Checks',
    description: 'Criminal record checks for all staff',
    level: 'required',
    verificationMethod: 'document_upload',
    updateFrequency: 'annual',
  },
  {
    feature: 'cctv',
    label: 'CCTV System',
    description: 'Video monitoring in common areas',
    level: 'recommended',
    verificationMethod: 'self_declaration',
    updateFrequency: 'continuous',
  },
  {
    feature: 'visitor_logs',
    label: 'Visitor Management',
    description: 'Visitor registration and tracking',
    level: 'required',
    verificationMethod: 'system_integration',
    updateFrequency: 'continuous',
  },
  {
    feature: 'emergency_plan',
    label: 'Emergency Response',
    description: 'Emergency procedures and evacuation plans',
    level: 'required',
    verificationMethod: 'document_upload',
    updateFrequency: 'annual',
  },
  {
    feature: 'health_safety',
    label: 'Health & Safety',
    description: 'Health and safety compliance measures',
    level: 'required',
    verificationMethod: 'inspection',
    updateFrequency: 'quarterly',
  },
] as const;

export const LICENSE_REQUIREMENTS: LicenseRequirement[] = [
  {
    status: 'licensed',
    label: 'Licensed',
    description: 'Fully licensed and operational',
    requirements: [
      'Valid operating license',
      'Insurance coverage',
      'Safety compliance',
      'Staff certifications',
    ],
    renewalPeriod: 'annual',
    verificationProcess: 'document_review',
  },
  {
    status: 'pending',
    label: 'License Pending',
    description: 'Application in process',
    requirements: [
      'Application submission',
      'Initial inspection',
      'Document preparation',
    ],
    renewalPeriod: 'not_applicable',
    verificationProcess: 'application_tracking',
  },
  {
    status: 'exempt',
    label: 'License Exempt',
    description: 'Qualifying for exemption',
    requirements: [
      'Exemption documentation',
      'Compliance declaration',
    ],
    renewalPeriod: 'annual',
    verificationProcess: 'self_declaration',
  },
] as const;

export const COMPLIANCE_CONFIG: ComplianceConfig = {
  minSafetyFeatures: 3,
  requiredDocuments: ['terms', 'privacy', 'safety', 'enrollment'],
  backgroundCheckValidityDays: 365,
  insuranceMinCoverage: 1000000,
  maxPolicyValidityDays: 365,
} as const;

export const LEGAL_MESSAGES = {
  STATUS_REQUIRED: 'Operational status is required',
  LICENSE_REQUIRED: 'License number is required for licensed status',
  LICENSE_FORMAT: 'Invalid license number format',
  LICENSE_EXPIRY: 'License expiry date is required',
  TAX_ID_FORMAT: 'Invalid tax ID format',
  INSURANCE_REQUIRED: 'Insurance information is required',
  INSURANCE_EXPIRY: 'Insurance expiry date is required',
  MIN_SAFETY: `At least ${COMPLIANCE_CONFIG.minSafetyFeatures} safety features required`,
  REQUIRED_DOCS: 'All required documents must be accepted',
  COMPLIANCE_EMAIL: 'Valid compliance officer email required',
  EXPIRY_INVALID: 'Expiry date must be in the future',
  POLICY_INVALID: `Policy validity cannot exceed ${COMPLIANCE_CONFIG.maxPolicyValidityDays} days`,
} as const;
