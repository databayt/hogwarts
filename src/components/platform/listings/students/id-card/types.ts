export interface IDCardData {
  // Student Information
  studentId: string
  grNumber: string
  studentName: string
  profilePhotoUrl?: string

  // Academic Information
  class: string
  section?: string
  academicYear: string

  // Personal Details
  dateOfBirth: Date
  bloodGroup?: string

  // Contact Information
  mobileNumber?: string
  emergencyContact?: string

  // School Information
  schoolName: string
  schoolLogo?: string
  schoolAddress?: string
  schoolPhone?: string
  schoolWebsite?: string

  // Card Details
  issueDate: Date
  validUntil: Date
  cardNumber?: string
  barcode?: string
}

export interface IDCardTemplate {
  id: string
  name: string
  orientation: "portrait" | "landscape"
  size: {
    width: number
    height: number
    unit: "mm" | "in"
  }
  design: "modern" | "classic" | "minimal" | "colorful"
  includeBarcode: boolean
  includeQRCode: boolean
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
}

export interface IDCardGenerationOptions {
  template: IDCardTemplate
  students: string[] // Array of student IDs
  format: "pdf" | "image" | "print"
  quality?: "low" | "medium" | "high"
  includeFront: boolean
  includeBack: boolean
}
