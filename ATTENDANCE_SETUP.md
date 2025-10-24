# Attendance System Environment Setup Guide

This guide explains how to configure your environment for the comprehensive attendance tracking system.

## Quick Start

### 1. Copy the Attendance Configuration Template

```bash
# Copy the attendance environment template
cp .env.attendance.example .env.attendance.local

# Open and configure with your values
nano .env.attendance.local
```

### 2. Merge with Your Main Environment

**Option A: Manual Merge (Recommended for production)**

Open your `.env` or `.env.local` file and add the variables from `.env.attendance.local` that you need.

**Option B: Automated Merge (Development only)**

```bash
# Append attendance config to your .env.local
cat .env.attendance.example >> .env.local

# Remove duplicate comments and organize
# Then edit .env.local with your actual values
```

### 3. Configure Required Variables

At minimum, you need to configure these variables:

```bash
# WebSocket Server (update after deploying socket server)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001  # Development
# NEXT_PUBLIC_SOCKET_URL=https://socket.yourdomain.com  # Production

# Enable real-time features
NEXT_PUBLIC_ENABLE_REALTIME=true

# Attendance configuration
ATTENDANCE_DEFAULT_METHOD=MANUAL
ATTENDANCE_LATE_THRESHOLD=15
ATTENDANCE_ABSENT_THRESHOLD=30

# Feature flags - enable the methods you want to use
FEATURE_QR_ATTENDANCE=true
FEATURE_BARCODE_ATTENDANCE=true
FEATURE_GEOFENCE_ATTENDANCE=true
FEATURE_REALTIME_DASHBOARD=true
FEATURE_ADVANCED_ANALYTICS=true
```

## Environment Variables by Category

### Core Attendance Settings

```bash
# Default attendance tracking method
# Options: MANUAL, QR_CODE, BARCODE, GEOFENCE, RFID, FINGERPRINT, FACE_RECOGNITION, NFC, BLUETOOTH, BULK_UPLOAD
ATTENDANCE_DEFAULT_METHOD=MANUAL

# Late arrival threshold (minutes after class start)
# Students checking in within this window are marked as LATE
ATTENDANCE_LATE_THRESHOLD=15

# Absent threshold (minutes after class start)
# Students not checking in after this are marked ABSENT
ATTENDANCE_ABSENT_THRESHOLD=30

# Allow editing attendance for past days (days)
# Limits how far back teachers can modify attendance
ATTENDANCE_ALLOW_EDIT_DAYS=7

# Location accuracy threshold (meters)
# Required GPS accuracy for location-based attendance
ATTENDANCE_LOCATION_ACCURACY=50
```

### WebSocket / Real-time Configuration

```bash
# WebSocket server URL (Socket.io)
# Development: http://localhost:3001
# Production: https://socket.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Enable/disable real-time updates globally
NEXT_PUBLIC_ENABLE_REALTIME=true

# Number of reconnection attempts before giving up
NEXT_PUBLIC_SOCKET_RECONNECT_ATTEMPTS=5
```

### QR Code Settings

```bash
# How often QR codes refresh (seconds)
# Lower = more secure but more scanning issues
# Higher = less secure but easier to scan
QR_CODE_REFRESH_INTERVAL=60

# How long each QR code is valid (seconds)
# Should be >= REFRESH_INTERVAL
QR_CODE_VALIDITY_PERIOD=120

# Maximum scans per QR code before it's invalidated
# Prevents QR code sharing
QR_CODE_MAX_SCANS=100

# Require location verification when scanning QR code
# Students must be within geofence to scan
QR_CODE_REQUIRE_LOCATION=false

# Enable anti-screenshot protection
# Prevents QR codes from being captured and shared
QR_CODE_PREVENT_SCREENSHOT=true
```

### Geofence Settings

```bash
# Location update interval (seconds)
# How often to check student location
GEOFENCE_UPDATE_INTERVAL=30

# Dwell time before marking attendance (seconds)
# Student must remain in geofence for this duration
GEOFENCE_DWELL_TIME=30

# Required GPS accuracy for geofence (meters)
# More accurate = more battery drain
GEOFENCE_REQUIRED_ACCURACY=20

# Enable battery optimization
# Reduces location update frequency when battery low
GEOFENCE_BATTERY_OPTIMIZATION=true

# Auto check-out when leaving geofence
# Automatically marks student as checked out
GEOFENCE_AUTO_CHECKOUT=false
```

### Barcode/RFID Settings

```bash
# Barcode scan timeout (seconds)
# Scanner will timeout after this period of inactivity
BARCODE_SCAN_TIMEOUT=30

# Supported barcode formats (comma-separated)
# Options: CODE128, EAN13, EAN8, CODE39, CODE93, CODABAR, ITF, UPC, QR_CODE
BARCODE_SUPPORTED_FORMATS=CODE128,EAN13,QR_CODE

# Enable sound feedback on successful scan
BARCODE_SOUND_FEEDBACK=true

# RFID reader type (if using RFID)
# Options: ACR122U, RC522, PN532
RFID_READER_TYPE=ACR122U

# RFID read range (centimeters)
RFID_READ_RANGE=10
```

### Biometric Settings (Optional)

```bash
# Fingerprint matching confidence threshold (0-1)
# Higher = more secure but more false negatives
BIOMETRIC_FINGERPRINT_THRESHOLD=0.85

# Face recognition confidence threshold (0-1)
BIOMETRIC_FACE_THRESHOLD=0.90

# Enable liveness detection (anti-spoofing)
BIOMETRIC_LIVENESS_CHECK=true

# Maximum biometric match attempts
BIOMETRIC_MAX_ATTEMPTS=3

# Store biometric templates (encrypted)
# Required for offline matching
BIOMETRIC_STORE_TEMPLATES=true
```

### Database Optimization

```bash
# Enable query result caching
DB_ENABLE_QUERY_CACHE=true

# Query cache time-to-live (seconds)
DB_QUERY_CACHE_TTL=300

# Database connection pool size
# Increase for high-concurrency environments
DATABASE_POOL_SIZE=20

# Connection timeout (milliseconds)
DATABASE_CONNECTION_TIMEOUT=10000
```

### Redis Configuration (Optional but Recommended)

```bash
# Redis URL for caching and real-time features
# Leave empty to disable Redis
REDIS_URL=redis://localhost:6379

# Session data TTL in Redis (seconds)
REDIS_SESSION_TTL=3600

# Attendance statistics cache TTL (seconds)
REDIS_ATTENDANCE_CACHE_TTL=300

# Use Redis for WebSocket scaling
# Required when running multiple socket server instances
REDIS_ENABLE_REALTIME=true
```

### Notification Settings

```bash
# Enable parent notifications
NOTIFY_PARENTS=true

# Notify parents on absence
NOTIFY_ON_ABSENCE=true

# Notify parents on late arrival
NOTIFY_ON_LATE=true

# Low attendance threshold (percentage)
# Trigger alert when student attendance drops below this
NOTIFY_LOW_ATTENDANCE_THRESHOLD=80

# Notification delivery method
# Options: email, sms, push (comma-separated for multiple)
NOTIFICATION_METHOD=email
```

### Security Settings

```bash
# Enable proxy/VPN detection
# Prevents attendance fraud via location spoofing
SECURITY_PREVENT_PROXY=true

# Track IP addresses for attendance events
SECURITY_TRACK_IP=true

# Enable device fingerprinting
# Detects if multiple students use same device
SECURITY_DEVICE_FINGERPRINT=true

# Rate limiting (requests per minute)
# Prevents brute force and DoS attacks
SECURITY_RATE_LIMIT=60

# Maximum concurrent sessions per user
# Prevents account sharing
SECURITY_MAX_SESSIONS=3
```

### Analytics Settings

```bash
# Enable attendance analytics dashboard
ANALYTICS_ENABLED=true

# Analytics data retention (days)
# Older data is archived or deleted
ANALYTICS_RETENTION_DAYS=365

# Materialized views refresh interval (minutes)
# How often to update analytics statistics
ANALYTICS_REFRESH_INTERVAL=60

# Export formats enabled (comma-separated)
# Options: CSV, EXCEL, PDF, JSON
ANALYTICS_EXPORT_FORMATS=CSV,EXCEL,PDF,JSON
```

### Performance Settings

```bash
# Enable response compression (gzip/brotli)
ENABLE_COMPRESSION=true

# API response cache TTL (seconds)
API_CACHE_TTL=60

# Maximum records per page (pagination)
MAX_RECORDS_PER_PAGE=100

# Enable lazy loading for lists
ENABLE_LAZY_LOADING=true

# Preload frequently accessed data
ENABLE_DATA_PRELOAD=true
```

### Maintenance Settings

```bash
# Auto-archive old attendance data (days)
# Data older than this is moved to archive table
AUTO_ARCHIVE_AFTER_DAYS=365

# Location trace retention (days)
# GPS tracking data is deleted after this
LOCATION_TRACE_RETENTION=30

# Event log retention (days)
# Audit logs are deleted after this
EVENT_LOG_RETENTION=90

# QR code cleanup interval (minutes)
# How often to delete expired QR codes
QR_CLEANUP_INTERVAL=15

# Card expiry check interval (hours)
# How often to deactivate expired ID cards
CARD_EXPIRY_CHECK_INTERVAL=24
```

### Feature Flags

```bash
# Enable experimental features (not production-ready)
ENABLE_EXPERIMENTAL=false

# Individual method toggles
FEATURE_BARCODE_ATTENDANCE=true
FEATURE_QR_ATTENDANCE=true
FEATURE_GEOFENCE_ATTENDANCE=true
FEATURE_RFID_ATTENDANCE=false        # Requires hardware
FEATURE_NFC_ATTENDANCE=false         # Requires hardware
FEATURE_BLUETOOTH_ATTENDANCE=false   # Requires beacons
FEATURE_BIOMETRIC_ATTENDANCE=false   # Requires hardware

# Feature toggles
FEATURE_BULK_UPLOAD=true
FEATURE_REALTIME_DASHBOARD=true
FEATURE_ADVANCED_ANALYTICS=true
```

### Development/Debug Settings

**⚠️ DISABLE IN PRODUCTION**

```bash
# Enable debug mode (verbose logging)
DEBUG_MODE=false

# Log all events to console
VERBOSE_LOGGING=false

# Log WebSocket events
LOG_WEBSOCKET_EVENTS=false

# Log database queries
LOG_DATABASE_QUERIES=false

# Simulate device scans (testing)
SIMULATE_DEVICE_SCANS=false
```

### Third-Party Integration Settings (Optional)

```bash
# SMS Provider (Twilio example)
SMS_PROVIDER=twilio
SMS_API_KEY=your_twilio_account_sid
SMS_API_SECRET=your_twilio_auth_token

# Push Notifications (Firebase example)
PUSH_NOTIFICATION_PROVIDER=firebase
FIREBASE_SERVER_KEY=your_firebase_server_key

# Map Provider (Mapbox example)
MAP_PROVIDER=mapbox
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token
```

### Monitoring Settings

```bash
# Enable performance monitoring
ENABLE_PERFORMANCE_MONITORING=true

# Performance data sample rate (0-1)
# 0.1 = 10% of requests are monitored
PERFORMANCE_SAMPLE_RATE=0.1

# Enable real-time metrics export
ENABLE_REALTIME_METRICS=true

# Metrics export interval (seconds)
METRICS_EXPORT_INTERVAL=60
```

## Configuration by Deployment Environment

### Development Environment

```bash
# Minimal configuration for local development
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_REALTIME=true
ATTENDANCE_DEFAULT_METHOD=MANUAL
FEATURE_QR_ATTENDANCE=true
FEATURE_BARCODE_ATTENDANCE=true
FEATURE_GEOFENCE_ATTENDANCE=true
DEBUG_MODE=true
SIMULATE_DEVICE_SCANS=true
```

### Staging Environment

```bash
# Configuration for testing before production
NEXT_PUBLIC_SOCKET_URL=https://socket-staging.yourdomain.com
NEXT_PUBLIC_ENABLE_REALTIME=true
ATTENDANCE_DEFAULT_METHOD=MANUAL
FEATURE_QR_ATTENDANCE=true
FEATURE_BARCODE_ATTENDANCE=true
FEATURE_GEOFENCE_ATTENDANCE=true
REDIS_URL=redis://staging-redis:6379
SECURITY_RATE_LIMIT=120
DEBUG_MODE=false
VERBOSE_LOGGING=true
```

### Production Environment

```bash
# Production-ready configuration
NEXT_PUBLIC_SOCKET_URL=https://socket.yourdomain.com
NEXT_PUBLIC_ENABLE_REALTIME=true
ATTENDANCE_DEFAULT_METHOD=MANUAL

# Enable all production-ready methods
FEATURE_QR_ATTENDANCE=true
FEATURE_BARCODE_ATTENDANCE=true
FEATURE_GEOFENCE_ATTENDANCE=true
FEATURE_BULK_UPLOAD=true
FEATURE_REALTIME_DASHBOARD=true
FEATURE_ADVANCED_ANALYTICS=true

# Security hardened
SECURITY_PREVENT_PROXY=true
SECURITY_TRACK_IP=true
SECURITY_DEVICE_FINGERPRINT=true
SECURITY_RATE_LIMIT=60
SECURITY_MAX_SESSIONS=3

# Performance optimized
REDIS_URL=redis://production-redis:6379
DB_ENABLE_QUERY_CACHE=true
ENABLE_COMPRESSION=true
API_CACHE_TTL=60

# Monitoring enabled
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_REALTIME_METRICS=true

# Debug disabled
DEBUG_MODE=false
VERBOSE_LOGGING=false
LOG_WEBSOCKET_EVENTS=false
LOG_DATABASE_QUERIES=false
SIMULATE_DEVICE_SCANS=false
```

## Validation

After configuring your environment, validate the setup:

### 1. Check Required Variables

```bash
# Run validation script (if available)
pnpm validate:env

# Or manually check
node -e "
const required = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_SOCKET_URL'
];

required.forEach(key => {
  if (!process.env[key]) {
    console.error(\`❌ Missing: \${key}\`);
  } else {
    console.log(\`✅ Found: \${key}\`);
  }
});
"
```

### 2. Test Database Connection

```bash
# Test Prisma connection
pnpm prisma db pull

# If successful, you'll see "Introspecting database..."
```

### 3. Test WebSocket Connection

```bash
# Start WebSocket server (in separate terminal)
cd attendance-socket-server
pnpm dev

# In browser console (on your app):
# Should show "✅ WebSocket Connected"
```

### 4. Verify Feature Flags

Create a test page to verify configuration:

```typescript
// src/app/[lang]/test-config/page.tsx
export default function TestConfig() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Configuration Test</h1>
      <table className="border">
        <tbody>
          <tr>
            <td>Socket URL:</td>
            <td>{process.env.NEXT_PUBLIC_SOCKET_URL}</td>
          </tr>
          <tr>
            <td>Real-time Enabled:</td>
            <td>{process.env.NEXT_PUBLIC_ENABLE_REALTIME}</td>
          </tr>
          <tr>
            <td>QR Attendance:</td>
            <td>{process.env.FEATURE_QR_ATTENDANCE}</td>
          </tr>
          <tr>
            <td>Barcode Attendance:</td>
            <td>{process.env.FEATURE_BARCODE_ATTENDANCE}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

## Troubleshooting

### Environment Variables Not Loading

**Problem:** Changes to `.env` don't take effect

**Solutions:**
```bash
# 1. Restart dev server
pnpm dev

# 2. Clear Next.js cache
rm -rf .next

# 3. Verify file name is correct (.env.local for local dev)
ls -la | grep env

# 4. Check if variables are correctly formatted (no spaces around =)
# Correct: KEY=value
# Wrong: KEY = value
```

### NEXT_PUBLIC_ Variables Not Available in Client

**Problem:** `process.env.NEXT_PUBLIC_SOCKET_URL` is undefined

**Solutions:**
1. Ensure variable name starts with `NEXT_PUBLIC_`
2. Restart dev server after adding new variables
3. Check browser console for actual value
4. Verify variable is not being overridden in `next.config.ts`

### Database Connection Fails

**Problem:** "Can't reach database server"

**Solutions:**
```bash
# 1. Verify DATABASE_URL is correct
echo $DATABASE_URL

# 2. Check if database is running
pg_isready -h your-db-host -p 5432

# 3. Test connection with psql
psql $DATABASE_URL -c "SELECT 1"

# 4. Check if SSL is required
# Add ?sslmode=require to connection string if needed
```

### WebSocket Connection Fails

**Problem:** "WebSocket connection failed" in browser console

**Solutions:**
1. Verify socket server is running: `curl http://localhost:3001/api/status`
2. Check `NEXT_PUBLIC_SOCKET_URL` matches server address
3. Ensure CORS is configured to allow your domain
4. Check browser console for specific error message
5. Try with WebSocket transport only: `transports: ['websocket']`

## Security Best Practices

1. **Never commit `.env` files to version control**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.*.local
   .env.attendance.local
   ```

2. **Use different secrets for each environment**
   - Development: Simple secrets for convenience
   - Staging: Production-like secrets for testing
   - Production: Strong, randomly generated secrets

3. **Rotate secrets regularly**
   - API keys: Every 90 days
   - Database passwords: Every 180 days
   - NextAuth secret: Every year

4. **Store secrets securely**
   - Use environment variable management (Vercel, Railway, etc.)
   - Use secret managers (AWS Secrets Manager, HashiCorp Vault)
   - Encrypt backups of `.env` files

5. **Audit secret access**
   - Log when secrets are accessed
   - Monitor for unusual patterns
   - Set up alerts for unauthorized access attempts

## Next Steps

1. ✅ Configure all required environment variables
2. ✅ Test database connection
3. ✅ Deploy WebSocket server
4. ✅ Update `NEXT_PUBLIC_SOCKET_URL` with production URL
5. ✅ Test all attendance methods
6. ✅ Enable production feature flags
7. ✅ Configure monitoring and alerts
8. ✅ Set up automated backups
9. ✅ Document your configuration for team

## Additional Resources

- **Full Documentation**: [/docs/attendance](../docs/attendance/page.mdx)
- **Deployment Guide**: [/docs/attendance/deployment](../docs/attendance/deployment.mdx)
- **API Reference**: [/docs/attendance#api-reference](../docs/attendance/page.mdx#api-reference)
- **Troubleshooting**: [/docs/attendance#troubleshooting](../docs/attendance/page.mdx#troubleshooting)

---

**Need help?** Contact support or check the [troubleshooting section](#troubleshooting) above.
