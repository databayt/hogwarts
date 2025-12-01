// Shared types for all attendance methods

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'EXCUSED'
  | 'SICK'
  | 'HOLIDAY';

export type AttendanceMethod =
  | 'MANUAL'
  | 'GEOFENCE'
  | 'QR_CODE'
  | 'BARCODE'
  | 'RFID'
  | 'FINGERPRINT'
  | 'FACE_RECOGNITION'
  | 'NFC'
  | 'BLUETOOTH'
  | 'BULK_UPLOAD';

export type IdentifierType =
  | 'BARCODE'
  | 'QR_CODE'
  | 'RFID_CARD'
  | 'NFC_TAG'
  | 'FINGERPRINT'
  | 'FACE_ID'
  | 'BLUETOOTH_MAC';

export type DeviceType =
  | 'WEB_CAMERA'
  | 'RFID_READER'
  | 'NFC_READER'
  | 'FINGERPRINT_SCANNER'
  | 'BLE_BEACON'
  | 'MOBILE_APP';

export interface AttendanceRecord {
  id?: string;
  schoolId: string;
  studentId: string;
  studentName?: string;
  classId: string;
  date: Date | string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  deviceId?: string;
  checkInTime?: Date | string;
  checkOutTime?: Date | string;
  location?: {
    lat?: number;
    lon?: number;
    accuracy?: number;
  };
  confidence?: number;
  notes?: string;
  markedBy?: string;
  markedAt?: Date | string;
}

export interface StudentIdentifier {
  id: string;
  schoolId: string;
  studentId: string;
  studentName?: string;
  type: IdentifierType;
  value: string;
  isActive: boolean;
  issuedAt: Date | string;
  expiresAt?: Date | string;
}

export interface AttendanceDevice {
  id: string;
  schoolId: string;
  name: string;
  type: DeviceType;
  location?: string;
  isActive: boolean;
  lastPing?: Date | string;
  configuration?: Record<string, unknown>;
}

export interface AttendanceSession {
  id: string;
  schoolId: string;
  studentId: string;
  date: Date | string;
  checkIn: Date | string;
  checkOut?: Date | string;
  duration?: number; // in minutes
  method: AttendanceMethod;
  locations?: Array<{
    timestamp: Date | string;
    lat: number;
    lon: number;
  }>;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  sick: number;
  holiday: number;
  attendanceRate: number;
  lastUpdated?: Date | string;
}

export interface AttendanceMethodConfig {
  method: AttendanceMethod;
  enabled: boolean;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiresHardware: boolean;
  supportedDevices: DeviceType[];
  settings?: Record<string, unknown>;
}

export interface QRCodeConfig {
  refreshInterval: number; // seconds
  validityPeriod: number; // seconds
  includeLocation: boolean;
  requireStudentAuth: boolean;
  preventScreenshot: boolean;
}

export interface GeofenceConfig {
  updateInterval: number; // seconds
  requiredAccuracy: number; // meters
  dwellTime: number; // seconds before marking present
  autoCheckOut: boolean;
  batteryOptimization: boolean;
}

export interface BiometricConfig {
  type: 'FINGERPRINT' | 'FACE_RECOGNITION';
  confidenceThreshold: number; // 0-1
  maxAttempts: number;
  livelinessCheck: boolean;
  storeTemplate: boolean;
}

export interface BarcodeConfig {
  supportedFormats: string[];
  scanTimeout: number; // seconds
  autoFocus: boolean;
  torch: boolean;
  soundFeedback: boolean;
}

export interface RFIDConfig {
  readerType: string;
  readRange: number; // centimeters
  multiRead: boolean;
  beepOnScan: boolean;
}

export interface NFCConfig {
  scanTimeout: number; // seconds
  writeCapable: boolean;
  encryption: boolean;
}

export interface BluetoothConfig {
  scanInterval: number; // seconds
  rssiThreshold: number; // signal strength
  beaconUUIDs: string[];
  maxDistance: number; // meters
}

// API Response Types
export interface AttendanceResponse {
  success: boolean;
  message?: string;
  data?: AttendanceRecord | AttendanceRecord[];
  error?: string;
}

export interface BulkAttendanceResult {
  successful: number;
  failed: number;
  errors: Array<{
    studentId: string;
    error: string;
  }>;
}

// Filter Types for Reports
export interface AttendanceFilters {
  schoolId: string;
  classId?: string;
  studentId?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  status?: AttendanceStatus | AttendanceStatus[];
  method?: AttendanceMethod | AttendanceMethod[];
  limit?: number;
  offset?: number;
}

// Export Types
export interface ExportOptions {
  format: 'CSV' | 'EXCEL' | 'PDF' | 'JSON';
  filters: AttendanceFilters;
  includeStats: boolean;
  groupBy?: 'student' | 'class' | 'date' | 'method';
}

// Real-time Update Types
export interface AttendanceUpdate {
  type: 'CHECK_IN' | 'CHECK_OUT' | 'STATUS_CHANGE';
  attendanceId: string;
  studentId: string;
  timestamp: Date | string;
  method: AttendanceMethod;
  data?: Partial<AttendanceRecord>;
}

// Validation Types
export interface AttendanceValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Method-specific payloads
export interface ManualAttendancePayload {
  classId: string;
  date: string;
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
  }>;
}

export interface QRCodeScanPayload {
  code: string;
  scannedAt: Date | string;
  deviceId: string;
  location?: {
    lat: number;
    lon: number;
  };
}

export interface BiometricScanPayload {
  type: 'FINGERPRINT' | 'FACE';
  template: string; // Base64 encoded
  confidence: number;
  deviceId: string;
}

export interface ProximityScanPayload {
  method: 'NFC' | 'RFID' | 'BLUETOOTH';
  identifier: string;
  signalStrength?: number;
  distance?: number;
  deviceId: string;
}

// Analytics Types
export interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
  rate: number;
}

export interface MethodUsageStats {
  method: AttendanceMethod;
  count: number;
  percentage: number;
  avgProcessingTime: number;
  successRate: number;
}

export interface StudentAttendancePattern {
  studentId: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
  commonAbsenceDays: string[]; // Day names
  streaks: {
    currentPresent: number;
    longestPresent: number;
    currentAbsent: number;
  };
}

// Permission Types
export interface AttendancePermissions {
  canMarkManual: boolean;
  canUseGeofence: boolean;
  canScanQR: boolean;
  canScanBarcode: boolean;
  canUseRFID: boolean;
  canUseBiometric: boolean;
  canUseNFC: boolean;
  canUseBluetooth: boolean;
  canViewReports: boolean;
  canExport: boolean;
  canEditPast: boolean;
  canBulkUpload: boolean;
}