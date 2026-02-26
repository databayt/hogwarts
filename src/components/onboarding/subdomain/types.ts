// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Subdomain step types

export interface SubdomainFormData {
  domain: string
}

export interface SubdomainData {
  domain?: string
  isCustom?: boolean
}

export interface SubdomainAvailability {
  subdomain: string
  available: boolean
  message: string
}

export interface SubdomainSuggestions {
  suggestions: string[]
  baseName: string
}

export interface SubdomainProps {
  schoolId: string
  schoolName?: string
  initialData?: SubdomainData
  onSubmit?: (data: SubdomainFormData) => Promise<void>
  onBack?: () => void
  isSubmitting?: boolean
}

export interface SubdomainValidationResult {
  isValid: boolean
  available?: boolean
  message: string
}
