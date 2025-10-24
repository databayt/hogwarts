"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import type {
  AttendanceRecord,
  AttendanceStats,
  AttendanceMethod,
  AttendanceStatus,
  AttendanceFilters,
  AttendanceValidation
} from './types';
import { calculateAttendanceStats, checkDeviceSupport } from './utils';

/**
 * Hook for managing attendance state and operations
 */
export function useAttendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate stats when attendance changes
  useEffect(() => {
    if (attendance.length > 0) {
      setStats(calculateAttendanceStats(attendance));
    }
  }, [attendance]);

  const markAttendance = useCallback(async (record: Partial<AttendanceRecord>) => {
    setLoading(true);
    setError(null);
    try {
      // API call would go here
      const newRecord = { ...record, id: Date.now().toString() } as AttendanceRecord;
      setAttendance(prev => [...prev, newRecord]);
      toast({
        title: "Success",
        description: "Attendance marked successfully"
      });
      return newRecord;
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
  }, []);

  const updateAttendance = useCallback(async (id: string, updates: Partial<AttendanceRecord>) => {
    setLoading(true);
    setError(null);
    try {
      // API call would go here
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

  const fetchAttendance = useCallback(async (filters?: AttendanceFilters) => {
    setLoading(true);
    setError(null);
    try {
      // API call would go here
      // For now, return mock data
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

  return {
    attendance,
    stats,
    loading,
    error,
    markAttendance,
    updateAttendance,
    fetchAttendance
  };
}

/**
 * Hook for device camera access
 */
export function useCamera() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const requestPermission = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setHasPermission(false);
      toast({
        title: "Camera Permission Denied",
        description: "Please allow camera access to scan codes",
        variant: "destructive"
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    hasPermission,
    stream,
    videoRef,
    requestPermission,
    stopCamera
  };
}

/**
 * Hook for geolocation access
 */
export function useGeolocation(options?: PositionOptions) {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(false);
  const watchId = useRef<number | null>(null);

  const requestLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        toast({
          title: "Location Error",
          description: err.message,
          variant: "destructive"
        });
      },
      options
    );
  }, [options]);

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError);
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(position);
      },
      (err) => {
        setError(err);
      },
      options
    );
  }, [options]);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    location,
    error,
    loading,
    requestLocation,
    watchLocation,
    stopWatching
  };
}

/**
 * Hook for auto-save functionality
 */
export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  delay: number = 5000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (data) {
        setIsSaving(true);
        try {
          await saveFn(data);
          setLastSaved(new Date());
        } catch (err) {
          console.error('Auto-save failed:', err);
        } finally {
          setIsSaving(false);
        }
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveFn, delay]);

  return { isSaving, lastSaved };
}

/**
 * Hook for real-time updates via WebSocket or polling
 */
export function useRealTimeAttendance(classId: string, method: 'websocket' | 'polling' = 'polling') {
  const [updates, setUpdates] = useState<AttendanceRecord[]>([]);
  const [connected, setConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (method === 'polling') {
      // Polling implementation
      const fetchUpdates = async () => {
        try {
          // API call would go here
          console.log('Fetching attendance updates for class:', classId);
        } catch (err) {
          console.error('Failed to fetch updates:', err);
        }
      };

      fetchUpdates();
      intervalRef.current = setInterval(fetchUpdates, 10000); // Poll every 10 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      // WebSocket implementation
      try {
        const ws = new WebSocket(`wss://api.example.com/attendance/${classId}`);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
          const update = JSON.parse(event.data) as AttendanceRecord;
          setUpdates(prev => [...prev, update]);
        };

        ws.onclose = () => {
          setConnected(false);
          console.log('WebSocket disconnected');
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        return () => {
          ws.close();
        };
      } catch (err) {
        console.error('Failed to connect WebSocket:', err);
      }
    }
  }, [classId, method]);

  return { updates, connected };
}

/**
 * Hook for device support detection
 */
export function useDeviceSupport(method: AttendanceMethod) {
  const [support, setSupport] = useState<{ supported: boolean; message?: string }>({
    supported: false
  });

  useEffect(() => {
    setSupport(checkDeviceSupport(method));
  }, [method]);

  return support;
}

/**
 * Hook for handling keyboard shortcuts
 */
export function useAttendanceShortcuts(callbacks: {
  markAllPresent?: () => void;
  markAllAbsent?: () => void;
  markAllLate?: () => void;
  save?: () => void;
}) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        callbacks.save?.();
      }

      // P for all present
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        callbacks.markAllPresent?.();
      }

      // A for all absent
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        callbacks.markAllAbsent?.();
      }

      // L for all late
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        callbacks.markAllLate?.();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [callbacks]);
}

/**
 * Hook for countdown timer (for QR codes, etc.)
 */
export function useCountdown(initialTime: number, onExpire?: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive || timeLeft === 0) {
      if (timeLeft === 0 && onExpire) {
        onExpire();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isActive, onExpire]);

  const reset = useCallback((newTime?: number) => {
    setTimeLeft(newTime || initialTime);
    setIsActive(true);
  }, [initialTime]);

  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  const resume = useCallback(() => {
    setIsActive(true);
  }, []);

  return { timeLeft, isActive, reset, pause, resume };
}

/**
 * Hook for handling offline queue
 */
export function useOfflineQueue<T>() {
  const [queue, setQueue] = useState<T[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Syncing offline data..."
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "Data will be synced when connection is restored",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToQueue = useCallback((item: T) => {
    setQueue(prev => [...prev, item]);
  }, []);

  const processQueue = useCallback(async (processFn: (item: T) => Promise<void>) => {
    if (!isOnline || queue.length === 0) return;

    const failures: T[] = [];

    for (const item of queue) {
      try {
        await processFn(item);
      } catch (err) {
        failures.push(item);
      }
    }

    setQueue(failures);
  }, [queue, isOnline]);

  return { queue, isOnline, addToQueue, processQueue };
}