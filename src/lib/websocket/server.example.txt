/**
 * Example Socket.io Server for Attendance Real-time Updates
 * This would typically be deployed as a separate service
 *
 * To run this server:
 * 1. Create a new directory for the socket server
 * 2. npm init -y
 * 3. npm install socket.io express cors
 * 4. Copy this file and run with: node server.js
 */

import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store connected clients by school
const connectedClients = new Map<string, Set<string>>();

// Store room subscriptions
const roomSubscriptions = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  const { schoolId, userId, role } = socket.handshake.query;

  console.log(`✅ Client connected: ${userId} (${role}) from school ${schoolId}`);

  // Add client to school group
  if (schoolId) {
    socket.join(`school:${schoolId}`);

    if (!connectedClients.has(schoolId as string)) {
      connectedClients.set(schoolId as string, new Set());
    }
    connectedClients.get(schoolId as string)?.add(socket.id);
  }

  // Handle room joining
  socket.on('join:room', (data) => {
    const { room } = data;
    socket.join(room);

    if (!roomSubscriptions.has(room)) {
      roomSubscriptions.set(room, new Set());
    }
    roomSubscriptions.get(room)?.add(socket.id);

    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  // Handle room leaving
  socket.on('leave:room', (data) => {
    const { room } = data;
    socket.leave(room);
    roomSubscriptions.get(room)?.delete(socket.id);

    console.log(`Socket ${socket.id} left room: ${room}`);
  });

  // Handle attendance subscription
  socket.on('subscribe:attendance', (data) => {
    const { classId } = data;
    const room = `class:${classId}`;
    socket.join(room);

    // Send initial stats
    socket.emit('attendance:stats', {
      total: 30,
      present: 25,
      absent: 3,
      late: 2,
      attendanceRate: 90,
      lastUpdated: new Date().toISOString()
    });

    console.log(`Socket ${socket.id} subscribed to class: ${classId}`);
  });

  // Handle attendance unsubscription
  socket.on('unsubscribe:attendance', (data) => {
    const { classId } = data;
    const room = `class:${classId}`;
    socket.leave(room);

    console.log(`Socket ${socket.id} unsubscribed from class: ${classId}`);
  });

  // Handle stats request
  socket.on('request:stats', (data) => {
    const { classId } = data;

    // Send mock stats (in production, fetch from database)
    socket.emit('attendance:stats', {
      total: 30,
      present: Math.floor(Math.random() * 25) + 5,
      absent: Math.floor(Math.random() * 5),
      late: Math.floor(Math.random() * 5),
      attendanceRate: 85 + Math.random() * 15,
      lastUpdated: new Date().toISOString()
    });
  });

  // Handle location updates
  socket.on('location:update', (data) => {
    const { lat, lon, accuracy } = data;

    console.log(`Location update from ${userId}: ${lat}, ${lon} (±${accuracy}m)`);

    // Broadcast to school admins
    socket.to(`school:${schoolId}:admins`).emit('location:update', {
      studentId: userId,
      location: { lat, lon, accuracy },
      timestamp: new Date().toISOString()
    });

    // Check geofences (in production, this would be more sophisticated)
    if (Math.random() > 0.7) {
      socket.emit('geofence:enter', {
        studentId: userId,
        geofenceId: 'school-main',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle device scans
  socket.on('device:scan', (data) => {
    const { method, identifier, deviceId } = data;

    console.log(`Device scan: ${method} - ${identifier} from ${deviceId}`);

    // Simulate attendance marking
    const attendanceRecord = {
      id: `att_${Date.now()}`,
      schoolId,
      studentId: userId,
      classId: 'class-123',
      date: new Date().toISOString(),
      status: 'PRESENT',
      method,
      deviceId,
      checkInTime: new Date().toISOString(),
      markedAt: new Date().toISOString()
    };

    // Emit to relevant rooms
    socket.emit('attendance:marked', attendanceRecord);
    socket.to(`class:${attendanceRecord.classId}`).emit('attendance:marked', attendanceRecord);

    // Update stats
    io.to(`class:${attendanceRecord.classId}`).emit('attendance:stats', {
      total: 30,
      present: 26,
      absent: 2,
      late: 2,
      attendanceRate: 93.3,
      lastUpdated: new Date().toISOString()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${userId}`);

    // Remove from connected clients
    if (schoolId) {
      connectedClients.get(schoolId as string)?.delete(socket.id);

      if (connectedClients.get(schoolId as string)?.size === 0) {
        connectedClients.delete(schoolId as string);
      }
    }

    // Remove from all room subscriptions
    roomSubscriptions.forEach((sockets, room) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        roomSubscriptions.delete(room);
      }
    });
  });
});

// REST API endpoints for triggering events
app.post('/api/attendance/mark', (req, res) => {
  const { classId, studentId, status, method } = req.body;

  const attendanceRecord = {
    id: `att_${Date.now()}`,
    studentId,
    classId,
    status,
    method,
    checkInTime: new Date().toISOString(),
    markedAt: new Date().toISOString()
  };

  // Broadcast to class room
  io.to(`class:${classId}`).emit('attendance:marked', attendanceRecord);

  res.json({ success: true, data: attendanceRecord });
});

app.post('/api/attendance/update-stats', (req, res) => {
  const { classId, stats } = req.body;

  // Broadcast stats update
  io.to(`class:${classId}`).emit('attendance:stats', {
    ...stats,
    lastUpdated: new Date().toISOString()
  });

  res.json({ success: true });
});

app.get('/api/status', (req, res) => {
  const status = {
    connected: io.engine.clientsCount,
    schools: connectedClients.size,
    rooms: roomSubscriptions.size,
    uptime: process.uptime()
  };

  res.json(status);
});

// Simulate random attendance events for testing
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const classes = ['class-123', 'class-456', 'class-789'];
    const methods = ['QR_CODE', 'BARCODE', 'GEOFENCE', 'MANUAL'];
    const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT'];

    const randomClass = classes[Math.floor(Math.random() * classes.length)];
    const randomMethod = methods[Math.floor(Math.random() * methods.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const attendanceRecord = {
      id: `att_${Date.now()}`,
      studentId: `student_${Math.floor(Math.random() * 100)}`,
      studentName: `Student ${Math.floor(Math.random() * 100)}`,
      classId: randomClass,
      status: randomStatus,
      method: randomMethod,
      checkInTime: new Date().toISOString(),
      markedAt: new Date().toISOString()
    };

    io.to(`class:${randomClass}`).emit('attendance:marked', attendanceRecord);

    console.log(`📢 Simulated attendance: ${attendanceRecord.studentName} - ${randomStatus}`);
  }, 5000); // Every 5 seconds
}

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`);
  console.log(`📡 Accepting connections from: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);

  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: Simulating random events');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default httpServer;