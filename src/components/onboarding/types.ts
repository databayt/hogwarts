// Keep Prisma types minimal here, avoid PropertyType usage on client
import { Amenity, Highlight } from '@prisma/client'

export interface StepConfig {
  id: string
  title: string
  subtitle?: string
  path: string
  isRequired: boolean
  order: number
}

export interface HostStep {
  step: string
  title: string
  description?: string
  isCompleted: boolean
  isRequired: boolean
}

export interface PropertyTypeOption {
  // Migrating away from Prisma PropertyType for school
  id: string
  title: string
  description: string
  icon?: string
}

export interface AmenityOption {
  id: Amenity
  title: string
  icon?: string
  category?: 'essential' | 'features' | 'location' | 'safety'
}

export interface HighlightOption {
  id: Highlight
  title: string
  description?: string
  icon?: string
}

export interface LocationData {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  latitude?: number
  longitude?: number
}

export interface PricingData {
  pricePerNight: number
  securityDeposit?: number
  applicationFee?: number
  weeklyDiscount?: number
  monthlyDiscount?: number
}

export interface BasicInfoData {
  title: string
  description: string
  // Temporary string while migrating to school types
  propertyType: string
}

export interface SpaceInfoData {
  bedrooms: number
  bathrooms: number
  guestCount: number
  squareFeet?: number
}

export interface SettingsData {
  isPetsAllowed: boolean
  isParkingIncluded: boolean
  instantBook: boolean
}

export interface PhotoData {
  photoUrls: string[]
}

// Form validation interfaces
export interface FormStep {
  name: string
  isValid: boolean
  data: any
}

export interface ValidationError {
  field: string
  message: string
}

// Step completion tracking
export interface StepCompletion {
  'about-place': boolean
  'structure': boolean
  'privacy-type': boolean
  'location': boolean
  'floor-plan': boolean
  'stand-out': boolean
  'amenities': boolean
  'photos': boolean
  'title': boolean
  'description': boolean
  'instant-book': boolean
  'price': boolean
  'discount': boolean
  'legal': boolean
  'visibility': boolean
  'finish-setup': boolean
}

// Progress tracking
export interface HostingProgress {
  currentStep: keyof StepCompletion
  completedSteps: (keyof StepCompletion)[]
  totalSteps: number
  progressPercentage: number
}

export type StepKey = keyof StepCompletion 