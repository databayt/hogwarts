"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import type {
  AttendanceMethod,
  AttendanceRecord,
  AttendanceStats,
  AttendanceMethodConfig,
  AttendanceFilters,
  AttendancePermissions,
  StudentIdentifier
} from '../shared/types';
import { calculateAttendanceStats } from '../shared/utils';

// Define the attendance method configurations
const ATTENDANCE_METHODS: AttendanceMethodConfig[] = [
  {
    method: 'MANUAL',
    enabled: true,
    name: 'Manual Entry',
    description: 'Manually mark attendance for students',
    icon: 'Edit',
    color: 'blue',
    requiresHardware: false,
    supportedDevices: ['WEB_CAMERA']
  },
  {
    method: 'GEOFENCE',
    enabled: true,
    name: 'Location-Based',
    description: 'Automatic attendance based on location',
    icon: 'MapPin',
    color: 'green',
    requiresHardware: false,
    supportedDevices: ['MOBILE_APP']
  },
  {
    method: 'QR_CODE',
    enabled: true,
    name: 'QR Code',
    description: 'Scan QR codes for quick check-in',
    icon: 'QrCode',
    color: 'purple',
    requiresHardware: false,
    supportedDevices: ['WEB_CAMERA', 'MOBILE_APP']
  },
  {
    method: 'BARCODE',
    enabled: true,
    name: 'Barcode Scanner',
    description: 'Scan student ID barcodes',
    icon: 'Barcode',
    color: 'orange',
    requiresHardware: false,
    supportedDevices: ['WEB_CAMERA']
  },
  {
    method: 'RFID',
    enabled: false,
    name: 'RFID Card',
    description: 'Tap RFID cards for instant attendance',
    icon: 'CreditCard',
    color: 'cyan',
    requiresHardware: true,
    supportedDevices: ['RFID_READER']
  },
  {
    method: 'FINGERPRINT',
    enabled: false,
    name: 'Fingerprint',
    description: 'Biometric fingerprint scanning',
    icon: 'Fingerprint',
    color: 'pink',
    requiresHardware: true,
    supportedDevices: ['FINGERPRINT_SCANNER']
  },
  {
    method: 'FACE_RECOGNITION',
    enabled: false,
    name: 'Face Recognition',
    description: 'AI-powered facial recognition',
    icon: 'User',
    color: 'indigo',
    requiresHardware: false,
    supportedDevices: ['WEB_CAMERA']
  },
  {
    method: 'NFC',
    enabled: false,
    name: 'NFC Tap',
    description: 'Tap NFC-enabled devices or cards',
    icon: 'Smartphone',
    color: 'teal',
    requiresHardware: false,
    supportedDevices: ['NFC_READER', 'MOBILE_APP']
  },
  {
    method: 'BLUETOOTH',
    enabled: false,
    name: 'Bluetooth Proximity',
    description: 'Automatic detection via Bluetooth beacons',
    icon: 'Bluetooth',
    color: 'blue',
    requiresHardware: true,
    supportedDevices: ['BLE_BEACON']
  },
  {
    method: 'BULK_UPLOAD',
    enabled: true,
    name: 'Bulk Upload',
    description: 'Upload attendance from CSV/Excel files',
    icon: 'Upload',
    color: 'gray',
    requiresHardware: false,
    supportedDevices: []
  }
];

interface AttendanceContextType {
  // State
  currentMethod: AttendanceMethod;
  methods: AttendanceMethodConfig[];
  attendance: AttendanceRecord[];
  stats: AttendanceStats | null;
  selectedClass: string | null;
  selectedDate: string;
  studentIdentifiers: StudentIdentifier[];
  permissions: AttendancePermissions;
  loading: boolean;
  error: string | null;

  // Actions
  setCurrentMethod: (method: AttendanceMethod) => void;
  setSelectedClass: (classId: string | null) => void;
  setSelectedDate: (date: string) => void;
  markAttendance: (record: Partial<AttendanceRecord>) => Promise<AttendanceRecord>;
  markBulkAttendance: (records: Partial<AttendanceRecord>[]) => Promise<void>;
  updateAttendance: (id: string, updates: Partial<AttendanceRecord>) => Promise<void>;
  deleteAttendance: (id: string) => Promise<void>;
  fetchAttendance: (filters?: AttendanceFilters) => Promise<void>;
  fetchStudentIdentifiers: (studentId?: string) => Promise<void>;
  addStudentIdentifier: (identifier: Omit<StudentIdentifier, 'id'>) => Promise<void>;
  removeStudentIdentifier: (id: string) => Promise<void>;
  refreshStats: () => void;
  clearError: () => void;
  checkMethodSupport: (method: AttendanceMethod) => boolean;
}

const AttendanceContext = createContext<AttendanceContextType | null>(null);

export function AttendanceProvider({
  children,
  initialMethod = 'MANUAL',
  userPermissions
}: {
  children: React.ReactNode;
  initialMethod?: AttendanceMethod;
  userPermissions?: AttendancePermissions;
}) {
  const router = useRouter();

  // State
  const [currentMethod, setCurrentMethod] = useState<AttendanceMethod>(initialMethod);
  const [methods] = useState<AttendanceMethodConfig[]>(ATTENDANCE_METHODS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [studentIdentifiers, setStudentIdentifiers] = useState<StudentIdentifier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default permissions (can be overridden by userPermissions prop)
  const [permissions] = useState<AttendancePermissions>(userPermissions || {
    canMarkManual: true,
    canUseGeofence: true,
    canScanQR: true,
    canScanBarcode: true,
    canUseRFID: true,
    canUseBiometric: true,
    canUseNFC: true,
    canUseBluetooth: true,
    canViewReports: true,
    canExport: true,
    canEditPast: true,
    canBulkUpload: true
  });

  // Calculate stats whenever attendance changes
  useEffect(() => {
    if (attendance.length > 0) {
      setStats(calculateAttendanceStats(attendance));
    } else {
      setStats(null);
    }
  }, [attendance]);

  // Mark single attendance record
  const markAttendance = useCallback(async (record: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    setLoading(true);
    setError(null);
    try {
      // Add method if not provided
      const fullRecord = {
        ...record,
        method: record.method || currentMethod,
        markedAt: new Date().toISOString(),
        id: Date.now().toString() // Temporary ID
      } as AttendanceRecord;

      // TODO: API call would go here
      // const response = await fetch('/api/attendance', { ... });

      setAttendance(prev => [...prev, fullRecord]);

      toast({
        title: "Success",
        description: "Attendance marked successfully"
      });

      return fullRecord;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark attendance';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentMethod]);

  // Mark bulk attendance
  const markBulkAttendance = useCallback(async (records: Partial<AttendanceRecord>[]) => {
    setLoading(true);
    setError(null);
    try {
      const fullRecords = records.map(record => ({
        ...record,
        method: record.method || currentMethod,
        markedAt: new Date().toISOString(),
        id: `${Date.now()}_${Math.random()}` // Temporary IDs
      } as AttendanceRecord));

      // TODO: API call would go here
      // const response = await fetch('/api/attendance/bulk', { ... });

      setAttendance(prev => [...prev, ...fullRecords]);

      toast({
        title: "Success",
        description: `Marked attendance for ${records.length} students`
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark bulk attendance';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentMethod]);

  // Update attendance record
  const updateAttendance = useCallback(async (id: string, updates: Partial<AttendanceRecord>) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: API call would go here
      // const response = await fetch(`/api/attendance/${id}`, { ... });

      setAttendance(prev =>
        prev.map(record =>
          record.id === id ? { ...record, ...updates } : record
        )
      );

      toast({
        title: "Success",
        description: "Attendance updated successfully"
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update attendance';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete attendance record
  const deleteAttendance = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: API call would go here
      // const response = await fetch(`/api/attendance/${id}`, { method: 'DELETE' });

      setAttendance(prev => prev.filter(record => record.id !== id));

      toast({
        title: "Success",
        description: "Attendance record deleted"
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete attendance';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch attendance records
  const fetchAttendance = useCallback(async (filters?: AttendanceFilters) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: API call would go here
      // const response = await fetch('/api/attendance?' + new URLSearchParams(filters));

      // For now, just clear attendance
      setAttendance([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch attendance';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch student identifiers
  const fetchStudentIdentifiers = useCallback(async (studentId?: string) => {
    setLoading(true);
    try {
      // TODO: API call would go here
      // const response = await fetch('/api/student-identifiers?' + new URLSearchParams({ studentId }));

      setStudentIdentifiers([]);
    } catch (err) {
      console.error('Failed to fetch student identifiers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add student identifier
  const addStudentIdentifier = useCallback(async (identifier: Omit<StudentIdentifier, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const newIdentifier = {
        ...identifier,
        id: Date.now().toString()
      } as StudentIdentifier;

      // TODO: API call would go here
      // const response = await fetch('/api/student-identifiers', { ... });

      setStudentIdentifiers(prev => [...prev, newIdentifier]);

      toast({
        title: "Success",
        description: "Identifier added successfully"
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add identifier';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove student identifier
  const removeStudentIdentifier = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: API call would go here
      // const response = await fetch(`/api/student-identifiers/${id}`, { method: 'DELETE' });

      setStudentIdentifiers(prev => prev.filter(i => i.id !== id));

      toast({
        title: "Success",
        description: "Identifier removed"
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove identifier';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh stats
  const refreshStats = useCallback(() => {
    if (attendance.length > 0) {
      setStats(calculateAttendanceStats(attendance));
    }
  }, [attendance]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if a method is supported
  const checkMethodSupport = useCallback((method: AttendanceMethod): boolean => {
    const config = methods.find(m => m.method === method);
    return config?.enabled || false;
  }, [methods]);

  const value: AttendanceContextType = {
    // State
    currentMethod,
    methods,
    attendance,
    stats,
    selectedClass,
    selectedDate,
    studentIdentifiers,
    permissions,
    loading,
    error,

    // Actions
    setCurrentMethod,
    setSelectedClass,
    setSelectedDate,
    markAttendance,
    markBulkAttendance,
    updateAttendance,
    deleteAttendance,
    fetchAttendance,
    fetchStudentIdentifiers,
    addStudentIdentifier,
    removeStudentIdentifier,
    refreshStats,
    clearError,
    checkMethodSupport
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

// Custom hook to use the attendance context
export function useAttendanceContext() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendanceContext must be used within AttendanceProvider');
  }
  return context;
}