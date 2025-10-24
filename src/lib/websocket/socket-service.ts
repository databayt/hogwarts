"use client";

import { io, Socket } from 'socket.io-client';
import type { AttendanceRecord, AttendanceUpdate, AttendanceStats } from '@/components/platform/attendance/shared/types';

export interface SocketEvents {
  // Attendance events
  'attendance:marked': (data: AttendanceRecord) => void;
  'attendance:updated': (data: AttendanceUpdate) => void;
  'attendance:deleted': (data: { attendanceId: string }) => void;
  'attendance:stats': (data: AttendanceStats) => void;

  // Real-time tracking events
  'location:update': (data: { studentId: string; location: { lat: number; lon: number } }) => void;
  'geofence:enter': (data: { studentId: string; geofenceId: string }) => void;
  'geofence:exit': (data: { studentId: string; geofenceId: string }) => void;

  // Device events
  'device:scan': (data: { deviceId: string; method: string; studentId: string }) => void;
  'device:connected': (data: { deviceId: string; type: string }) => void;
  'device:disconnected': (data: { deviceId: string }) => void;

  // System events
  'notification': (data: { type: string; message: string }) => void;
  'error': (data: { error: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<keyof SocketEvents, Set<Function>> = new Map();
  private isConnecting = false;

  constructor() {
    // Use environment variable or default to local development URL
    this.url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
  }

  /**
   * Connect to WebSocket server
   */
  connect(schoolId: string, userId: string, role: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Wait for existing connection attempt
        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
        return;
      }

      this.isConnecting = true;

      try {
        this.socket = io(this.url, {
          transports: ['websocket', 'polling'],
          query: {
            schoolId,
            userId,
            role
          },
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 10000
        });

        // Connection event handlers
        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.emit('notification', {
            type: 'success',
            message: 'Real-time updates connected'
          });
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ WebSocket disconnected:', reason);
          this.isConnecting = false;
          this.emit('notification', {
            type: 'warning',
            message: 'Real-time updates disconnected'
          });
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnecting = false;
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.emit('error', {
              error: 'Failed to connect to real-time server'
            });
            reject(new Error('Max reconnection attempts reached'));
          }
        });

        // Register all event listeners
        this.setupEventListeners();

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)?.add(callback);

    // If socket is already connected, add listener directly
    if (this.socket) {
      this.socket.on(event, callback as any);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback as any);
      }
    };
  }

  /**
   * Emit an event locally (for internal use)
   */
  private emit<K extends keyof SocketEvents>(event: K, data: Parameters<SocketEvents[K]>[0]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Send an event to the server
   */
  send(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Unable to send event:', event);
    }
  }

  /**
   * Join a room (e.g., class or school)
   */
  joinRoom(room: string): void {
    this.send('join:room', { room });
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    this.send('leave:room', { room });
  }

  /**
   * Setup event listeners for incoming events
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Attendance events
    this.socket.on('attendance:marked', (data) => {
      this.emit('attendance:marked', data);
    });

    this.socket.on('attendance:updated', (data) => {
      this.emit('attendance:updated', data);
    });

    this.socket.on('attendance:deleted', (data) => {
      this.emit('attendance:deleted', data);
    });

    this.socket.on('attendance:stats', (data) => {
      this.emit('attendance:stats', data);
    });

    // Location tracking events
    this.socket.on('location:update', (data) => {
      this.emit('location:update', data);
    });

    this.socket.on('geofence:enter', (data) => {
      this.emit('geofence:enter', data);
    });

    this.socket.on('geofence:exit', (data) => {
      this.emit('geofence:exit', data);
    });

    // Device events
    this.socket.on('device:scan', (data) => {
      this.emit('device:scan', data);
    });

    this.socket.on('device:connected', (data) => {
      this.emit('device:connected', data);
    });

    this.socket.on('device:disconnected', (data) => {
      this.emit('device:disconnected', data);
    });

    // Re-attach custom listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback as any);
      });
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Request attendance stats for a class
   */
  requestStats(classId: string): void {
    this.send('request:stats', { classId });
  }

  /**
   * Request live attendance updates for a class
   */
  subscribeToClass(classId: string): void {
    this.joinRoom(`class:${classId}`);
    this.send('subscribe:attendance', { classId });
  }

  /**
   * Unsubscribe from class updates
   */
  unsubscribeFromClass(classId: string): void {
    this.leaveRoom(`class:${classId}`);
    this.send('unsubscribe:attendance', { classId });
  }

  /**
   * Send location update
   */
  sendLocationUpdate(location: { lat: number; lon: number; accuracy?: number }): void {
    this.send('location:update', location);
  }

  /**
   * Send device scan event
   */
  sendDeviceScan(data: { method: string; identifier: string; deviceId: string }): void {
    this.send('device:scan', data);
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;