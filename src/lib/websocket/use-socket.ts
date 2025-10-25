"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';
import socketService, { SocketEvents } from './socket-service';
import type { AttendanceRecord, AttendanceUpdate, AttendanceStats } from '@/components/platform/attendance/shared/types';

interface UseSocketOptions {
  autoConnect?: boolean;
  classId?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

interface UseSocketReturn {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: <K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) => () => void;
  send: (event: string, data: any) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  subscribeToClass: (classId: string) => void;
  unsubscribeFromClass: (classId: string) => void;
  sendLocationUpdate: (location: { lat: number; lon: number; accuracy?: number }) => void;
  stats: AttendanceStats | null;
  recentUpdates: AttendanceUpdate[];
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<AttendanceUpdate[]>([]);
  const unsubscribers = useRef<Array<() => void>>([]);

  const connect = useCallback(async () => {
    if (!session?.user) {
      console.warn('No session available for WebSocket connection');
      return;
    }

    try {
      await socketService.connect(
        session.user.schoolId || '',
        session.user.id || "",
        session.user.role
      );
      setIsConnected(true);
      options.onConnect?.();
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      options.onError?.(error instanceof Error ? error.message : 'Connection failed');
      setIsConnected(false);
    }
  }, [session, options]);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
    options.onDisconnect?.();
  }, [options]);

  const subscribe = useCallback(<K extends keyof SocketEvents>(
    event: K,
    callback: SocketEvents[K]
  ): (() => void) => {
    const unsubscribe = socketService.on(event, callback);
    unsubscribers.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const send = useCallback((event: string, data: any) => {
    socketService.send(event, data);
  }, []);

  const joinRoom = useCallback((room: string) => {
    socketService.joinRoom(room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketService.leaveRoom(room);
  }, []);

  const subscribeToClass = useCallback((classId: string) => {
    socketService.subscribeToClass(classId);
  }, []);

  const unsubscribeFromClass = useCallback((classId: string) => {
    socketService.unsubscribeFromClass(classId);
  }, []);

  const sendLocationUpdate = useCallback((location: { lat: number; lon: number; accuracy?: number }) => {
    socketService.sendLocationUpdate(location);
  }, []);

  // Auto-connect if enabled
  useEffect(() => {
    if (options.autoConnect && session?.user) {
      connect();
    }

    return () => {
      if (options.autoConnect) {
        disconnect();
      }
    };
  }, [options.autoConnect, session, connect, disconnect]);

  // Subscribe to class updates if classId provided
  useEffect(() => {
    if (isConnected && options.classId || "") {
      subscribeToClass(options.classId || "");

      return () => {
        unsubscribeFromClass(options.classId || "");
      };
    }
  }, [isConnected, options.classId, subscribeToClass, unsubscribeFromClass]);

  // Set up default event listeners
  useEffect(() => {
    const subscriptions: Array<() => void> = [];

    // Listen for attendance updates
    subscriptions.push(
      subscribe('attendance:marked', (data) => {
        setRecentUpdates(prev => [
          {
            type: 'CHECK_IN',
            attendanceId: data.id || '',
            studentId: data.studentId,
            timestamp: data.markedAt || new Date().toISOString(),
            method: data.method,
            data
          },
          ...prev.slice(0, 9) // Keep last 10 updates
        ]);
      })
    );

    subscriptions.push(
      subscribe('attendance:updated', (data) => {
        setRecentUpdates(prev => [data, ...prev.slice(0, 9)]);
      })
    );

    subscriptions.push(
      subscribe('attendance:stats', (data) => {
        setStats(data);
      })
    );

    subscriptions.push(
      subscribe('notification', (data) => {
        toast({
          title: data.type === 'success' ? 'Success' : 'Notification',
          description: data.message
        });
      })
    );

    subscriptions.push(
      subscribe('error', (data) => {
        toast({
          title: 'Error',
          description: data.error,
        });
        options.onError?.(data.error);
      })
    );

    // Cleanup
    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [subscribe, options]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      unsubscribers.current.forEach(unsubscribe => unsubscribe());
      unsubscribers.current = [];
    };
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    subscribe,
    send,
    joinRoom,
    leaveRoom,
    subscribeToClass,
    unsubscribeFromClass,
    sendLocationUpdate,
    stats,
    recentUpdates
  };
}

// Hook for real-time attendance updates in a class
export function useClassAttendance(classId: string) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [liveCount, setLiveCount] = useState({ present: 0, absent: 0, late: 0 });

  const { isConnected, subscribe, subscribeToClass, unsubscribeFromClass } = useSocket({
    autoConnect: true,
    classId
  });

  useEffect(() => {
    if (!isConnected || !classId) return;

    const unsubscribers: Array<() => void> = [];

    // Subscribe to attendance events
    unsubscribers.push(
      subscribe('attendance:marked', (data) => {
        if (data.classId === classId) {
          setAttendance(prev => {
            const index = prev.findIndex(r => r.studentId === data.studentId);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = data;
              return updated;
            }
            return [...prev, data];
          });

          // Update live count
          setLiveCount(prev => ({
            ...prev,
            [data.status.toLowerCase()]: prev[data.status.toLowerCase() as keyof typeof prev] + 1
          }));
        }
      })
    );

    unsubscribers.push(
      subscribe('attendance:updated', (update) => {
        if (update.data?.classId === classId) {
          setAttendance(prev => {
            const index = prev.findIndex(r => r.id === update.attendanceId);
            if (index >= 0 && update.data) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...update.data };
              return updated;
            }
            return prev;
          });
        }
      })
    );

    // Cleanup
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [isConnected, classId, subscribe]);

  return {
    attendance,
    liveCount,
    isConnected
  };
}

// Hook for real-time geolocation tracking
export function useLocationTracking(enabled: boolean = false) {
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<GeolocationPosition | null>(null);
  const watchId = useRef<number | null>(null);

  const { sendLocationUpdate } = useSocket({ autoConnect: enabled });

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported',
      });
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setLastLocation(position);

        // Send location update via WebSocket
        sendLocationUpdate({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error('Location error:', error);
        toast({
          title: 'Location Error',
          description: error.message,
        });
        setIsTracking(false);
      },
      options
    );

    setIsTracking(true);
  }, [sendLocationUpdate]);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, startTracking, stopTracking]);

  return {
    isTracking,
    lastLocation,
    startTracking,
    stopTracking
  };
}