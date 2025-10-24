import { z } from 'zod';

// Enum schemas
export const attendanceStatusSchema = z.enum([
  'PRESENT',
  'ABSENT',
  'LATE',
  'EXCUSED',
  'SICK',
  'HOLIDAY'
]);

export const attendanceMethodSchema = z.enum([
  'MANUAL',
  'GEOFENCE',
  'QR_CODE',
  'BARCODE',
  'RFID',
  'FINGERPRINT',
  'FACE_RECOGNITION',
  'NFC',
  'BLUETOOTH',
  'BULK_UPLOAD'
]);

export const identifierTypeSchema = z.enum([
  'BARCODE',
  'QR_CODE',
  'RFID_CARD',
  'NFC_TAG',
  'FINGERPRINT',
  'FACE_ID',
  'BLUETOOTH_MAC'
]);

// Core attendance record schema
export const attendanceRecordSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string().min(1, 'School ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  date: z.string().or(z.date()),
  status: attendanceStatusSchema,
  method: attendanceMethodSchema,
  deviceId: z.string().optional(),
  checkInTime: z.string().or(z.date()).optional(),
  checkOutTime: z.string().or(z.date()).optional(),
  location: z.object({
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
    accuracy: z.number().positive().optional()
  }).optional(),
  confidence: z.number().min(0).max(1).optional(),
  notes: z.string().max(500).optional(),
  markedBy: z.string().optional(),
  markedAt: z.string().or(z.date()).optional()
});

// Manual attendance payload schema
export const manualAttendanceSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  date: z.string().min(1, 'Date is required'),
  records: z.array(z.object({
    studentId: z.string().min(1),
    status: attendanceStatusSchema,
    notes: z.string().optional()
  })).min(1, 'At least one record is required')
});

// QR Code scan payload schema
export const qrCodeScanSchema = z.object({
  code: z.string().min(1, 'QR code is required'),
  scannedAt: z.string().or(z.date()),
  deviceId: z.string().min(1),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180)
  }).optional()
});

// QR Code generation schema
export const qrCodeGenerationSchema = z.object({
  classId: z.string().min(1),
  validFor: z.number().min(30).max(600).default(60), // seconds
  includeLocation: z.boolean().default(false),
  secret: z.string().optional()
});

// Barcode scan schema
export const barcodeScanSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
  format: z.string().optional(),
  scannedAt: z.string().or(z.date()),
  deviceId: z.string().min(1)
});

// RFID scan schema
export const rfidScanSchema = z.object({
  cardId: z.string().min(1, 'Card ID is required'),
  readerId: z.string().min(1),
  signalStrength: z.number().optional(),
  scannedAt: z.string().or(z.date())
});

// NFC scan schema
export const nfcScanSchema = z.object({
  tagId: z.string().min(1, 'Tag ID is required'),
  payload: z.string().optional(),
  deviceId: z.string().min(1),
  scannedAt: z.string().or(z.date())
});

// Bluetooth proximity schema
export const bluetoothProximitySchema = z.object({
  beaconId: z.string().min(1),
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/),
  rssi: z.number(),
  distance: z.number().positive().optional(),
  deviceId: z.string().min(1),
  timestamp: z.string().or(z.date())
});

// Biometric scan schema
export const biometricScanSchema = z.object({
  type: z.enum(['FINGERPRINT', 'FACE']),
  template: z.string().min(1), // Base64 encoded
  confidence: z.number().min(0).max(1),
  deviceId: z.string().min(1),
  livenessScore: z.number().min(0).max(1).optional()
});

// Student identifier schema
export const studentIdentifierSchema = z.object({
  studentId: z.string().min(1),
  type: identifierTypeSchema,
  value: z.string().min(1),
  isActive: z.boolean().default(true),
  expiresAt: z.string().or(z.date()).optional()
});

// Bulk upload schema
export const bulkUploadSchema = z.object({
  classId: z.string().min(1),
  date: z.string().min(1),
  method: attendanceMethodSchema.default('BULK_UPLOAD'),
  records: z.array(z.object({
    studentId: z.string().min(1),
    status: attendanceStatusSchema,
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    notes: z.string().optional()
  })).min(1)
});

// Attendance filter schema for reports
export const attendanceFilterSchema = z.object({
  schoolId: z.string().optional(),
  classId: z.string().optional(),
  studentId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.union([
    attendanceStatusSchema,
    z.array(attendanceStatusSchema)
  ]).optional(),
  method: z.union([
    attendanceMethodSchema,
    z.array(attendanceMethodSchema)
  ]).optional(),
  limit: z.number().min(1).max(5000).default(100),
  offset: z.number().min(0).default(0)
});

// Export options schema
export const exportOptionsSchema = z.object({
  format: z.enum(['CSV', 'EXCEL', 'PDF', 'JSON']),
  filters: attendanceFilterSchema,
  includeStats: z.boolean().default(true),
  groupBy: z.enum(['student', 'class', 'date', 'method']).optional()
});

// Attendance settings schema
export const attendanceSettingsSchema = z.object({
  defaultMethod: attendanceMethodSchema.default('MANUAL'),
  autoCheckOut: z.boolean().default(false),
  checkOutTime: z.string().optional(), // HH:mm format
  lateThreshold: z.number().min(1).max(60).default(15), // minutes
  requireLocation: z.boolean().default(false),
  allowBulkUpload: z.boolean().default(true),
  notifyParents: z.boolean().default(true),
  notifyOnAbsence: z.boolean().default(true),
  notifyOnLate: z.boolean().default(true)
});

// Method-specific configuration schemas
export const qrCodeConfigSchema = z.object({
  refreshInterval: z.number().min(30).max(300).default(60),
  validityPeriod: z.number().min(30).max(600).default(120),
  includeLocation: z.boolean().default(false),
  requireStudentAuth: z.boolean().default(true),
  preventScreenshot: z.boolean().default(true)
});

export const geofenceConfigSchema = z.object({
  updateInterval: z.number().min(10).max(300).default(30),
  requiredAccuracy: z.number().min(5).max(100).default(20),
  dwellTime: z.number().min(5).max(300).default(30),
  autoCheckOut: z.boolean().default(false),
  batteryOptimization: z.boolean().default(true)
});

export const biometricConfigSchema = z.object({
  type: z.enum(['FINGERPRINT', 'FACE_RECOGNITION']),
  confidenceThreshold: z.number().min(0.5).max(1).default(0.85),
  maxAttempts: z.number().min(1).max(5).default(3),
  livenessCheck: z.boolean().default(true),
  storeTemplate: z.boolean().default(true)
});

export const barcodeConfigSchema = z.object({
  supportedFormats: z.array(z.string()).default(['CODE128', 'EAN13', 'QR_CODE']),
  scanTimeout: z.number().min(5).max(60).default(30),
  autoFocus: z.boolean().default(true),
  torch: z.boolean().default(false),
  soundFeedback: z.boolean().default(true)
});

// Session validation schema
export const attendanceSessionSchema = z.object({
  studentId: z.string().min(1),
  checkIn: z.string().or(z.date()),
  checkOut: z.string().or(z.date()).optional(),
  method: attendanceMethodSchema,
  locations: z.array(z.object({
    timestamp: z.string().or(z.date()),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180)
  })).optional()
});

// Validation result schema
export const validationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string())
});

// Real-time update schema
export const attendanceUpdateSchema = z.object({
  type: z.enum(['CHECK_IN', 'CHECK_OUT', 'STATUS_CHANGE']),
  attendanceId: z.string().min(1),
  studentId: z.string().min(1),
  timestamp: z.string().or(z.date()),
  method: attendanceMethodSchema,
  data: attendanceRecordSchema.partial().optional()
});

// Type exports
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
export type ManualAttendance = z.infer<typeof manualAttendanceSchema>;
export type QRCodeScan = z.infer<typeof qrCodeScanSchema>;
export type BarcodeScan = z.infer<typeof barcodeScanSchema>;
export type RFIDScan = z.infer<typeof rfidScanSchema>;
export type NFCScan = z.infer<typeof nfcScanSchema>;
export type BiometricScan = z.infer<typeof biometricScanSchema>;
export type StudentIdentifier = z.infer<typeof studentIdentifierSchema>;
export type AttendanceFilter = z.infer<typeof attendanceFilterSchema>;
export type AttendanceSettings = z.infer<typeof attendanceSettingsSchema>;