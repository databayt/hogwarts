-- Database Optimization for Attendance System
-- Run these SQL commands after Prisma migrations to add performance optimizations

-- =============================================================================
-- ATTENDANCE TABLE OPTIMIZATIONS
-- =============================================================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_attendance_class_date
ON attendances(schoolId, classId, date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_student_date
ON attendances(schoolId, studentId, date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_method_date
ON attendances(method, date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_status_date
ON attendances(status, date DESC);

-- Index for date range queries (reports)
CREATE INDEX IF NOT EXISTS idx_attendance_date_range
ON attendances(schoolId, date DESC, status);

-- Index for check-in time queries
CREATE INDEX IF NOT EXISTS idx_attendance_checkin
ON attendances(schoolId, "checkInTime" DESC)
WHERE "checkInTime" IS NOT NULL;

-- Partial index for today's attendance (hot data)
CREATE INDEX IF NOT EXISTS idx_attendance_today
ON attendances(schoolId, classId, status)
WHERE date = CURRENT_DATE;

-- =============================================================================
-- STUDENT IDENTIFIER OPTIMIZATIONS
-- =============================================================================

-- Index for barcode lookups (most common)
CREATE INDEX IF NOT EXISTS idx_identifier_barcode
ON student_identifiers(schoolId, value)
WHERE type = 'BARCODE' AND "isActive" = true;

-- Index for active identifiers by type
CREATE INDEX IF NOT EXISTS idx_identifier_type_active
ON student_identifiers(schoolId, type, "isActive");

-- Index for student identifier lookups
CREATE INDEX IF NOT EXISTS idx_identifier_student
ON student_identifiers(studentId, type, "isActive");

-- Index for expired identifiers cleanup
CREATE INDEX IF NOT EXISTS idx_identifier_expired
ON student_identifiers("expiresAt")
WHERE "expiresAt" IS NOT NULL AND "isActive" = true;

-- =============================================================================
-- ATTENDANCE EVENTS OPTIMIZATIONS
-- =============================================================================

-- Index for event log queries
CREATE INDEX IF NOT EXISTS idx_events_student_timestamp
ON attendance_events(schoolId, studentId, timestamp DESC);

-- Index for method-specific event analysis
CREATE INDEX IF NOT EXISTS idx_events_method_success
ON attendance_events(method, success, timestamp DESC);

-- Index for failed events monitoring
CREATE INDEX IF NOT EXISTS idx_events_failures
ON attendance_events(schoolId, timestamp DESC)
WHERE success = false;

-- Partial index for recent events (last 30 days)
CREATE INDEX IF NOT EXISTS idx_events_recent
ON attendance_events(schoolId, "eventType", timestamp DESC)
WHERE timestamp > CURRENT_DATE - INTERVAL '30 days';

-- =============================================================================
-- ATTENDANCE SESSIONS OPTIMIZATIONS
-- =============================================================================

-- Index for active sessions
CREATE INDEX IF NOT EXISTS idx_sessions_active
ON attendance_sessions(schoolId, studentId, "checkIn" DESC)
WHERE "checkOut" IS NULL;

-- Index for date-based session queries
CREATE INDEX IF NOT EXISTS idx_sessions_date
ON attendance_sessions(schoolId, date, method);

-- Index for duration calculations
CREATE INDEX IF NOT EXISTS idx_sessions_duration
ON attendance_sessions(schoolId, duration DESC)
WHERE duration IS NOT NULL;

-- =============================================================================
-- GEOFENCE OPTIMIZATIONS
-- =============================================================================

-- Spatial index for PostGIS geofence queries (if using polygon geofences)
-- CREATE INDEX IF NOT EXISTS idx_geofence_geometry
-- ON geo_fences USING GIST(geometry)
-- WHERE "isActive" = true;

-- Index for circular geofence queries
CREATE INDEX IF NOT EXISTS idx_geofence_location
ON geo_fences(schoolId, "isActive")
WHERE type IN ('SCHOOL_GROUNDS', 'CLASSROOM');

-- =============================================================================
-- LOCATION TRACE OPTIMIZATIONS
-- =============================================================================

-- Index for recent location traces (hot data)
CREATE INDEX IF NOT EXISTS idx_location_recent
ON location_traces(schoolId, studentId, timestamp DESC)
WHERE timestamp > CURRENT_DATE - INTERVAL '1 day';

-- Partial index for active tracking
CREATE INDEX IF NOT EXISTS idx_location_active
ON location_traces(studentId, timestamp DESC)
WHERE timestamp > CURRENT_DATE - INTERVAL '2 hours';

-- =============================================================================
-- QR CODE SESSIONS OPTIMIZATIONS
-- =============================================================================

-- Index for active QR codes
CREATE INDEX IF NOT EXISTS idx_qr_active
ON qr_code_sessions(schoolId, classId, "isActive")
WHERE "isActive" = true AND "expiresAt" > NOW();

-- Index for QR code lookup
CREATE INDEX IF NOT EXISTS idx_qr_code_lookup
ON qr_code_sessions(code)
WHERE "isActive" = true;

-- Index for expired QR cleanup
CREATE INDEX IF NOT EXISTS idx_qr_expired
ON qr_code_sessions("expiresAt")
WHERE "isActive" = true AND "expiresAt" < NOW();

-- =============================================================================
-- BIOMETRIC TEMPLATES OPTIMIZATIONS
-- =============================================================================

-- Index for biometric lookup
CREATE INDEX IF NOT EXISTS idx_biometric_student
ON biometric_templates(schoolId, studentId, type, "isActive")
WHERE "isActive" = true;

-- Index for primary templates
CREATE INDEX IF NOT EXISTS idx_biometric_primary
ON biometric_templates(schoolId, type)
WHERE "isPrimary" = true AND "isActive" = true;

-- =============================================================================
-- ACCESS CARDS OPTIMIZATIONS
-- =============================================================================

-- Index for card number lookup (RFID/NFC)
CREATE INDEX IF NOT EXISTS idx_card_number
ON access_cards(cardNumber, "isActive")
WHERE "isActive" = true;

-- Index for student cards
CREATE INDEX IF NOT EXISTS idx_card_student
ON access_cards(schoolId, studentId, "cardType")
WHERE "isActive" = true;

-- Index for expired cards cleanup
CREATE INDEX IF NOT EXISTS idx_card_expired
ON access_cards("expiresAt")
WHERE "expiresAt" IS NOT NULL AND "isActive" = true;

-- =============================================================================
-- BLUETOOTH BEACONS OPTIMIZATIONS
-- =============================================================================

-- Index for beacon UUID lookup
CREATE INDEX IF NOT EXISTS idx_beacon_uuid
ON bluetooth_beacons(uuid, major, minor)
WHERE "isActive" = true;

-- Index for location-based beacon queries
CREATE INDEX IF NOT EXISTS idx_beacon_location
ON bluetooth_beacons(schoolId, location, "isActive");

-- =============================================================================
-- ATTENDANCE POLICIES OPTIMIZATIONS
-- =============================================================================

-- Index for active policies
CREATE INDEX IF NOT EXISTS idx_policy_active
ON attendance_policies(schoolId, "isActive", priority DESC)
WHERE "isActive" = true;

-- =============================================================================
-- STATISTICS AND ANALYTICS OPTIMIZATIONS
-- =============================================================================

-- Materialized view for daily attendance statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_attendance_stats AS
SELECT
    "schoolId",
    "classId",
    date,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'PRESENT') as present,
    COUNT(*) FILTER (WHERE status = 'ABSENT') as absent,
    COUNT(*) FILTER (WHERE status = 'LATE') as late,
    COUNT(*) FILTER (WHERE status = 'EXCUSED') as excused,
    COUNT(*) FILTER (WHERE status = 'SICK') as sick,
    ROUND(
        (COUNT(*) FILTER (WHERE status IN ('PRESENT', 'LATE'))::numeric / COUNT(*)::numeric) * 100,
        2
    ) as attendance_rate,
    COUNT(DISTINCT method) as methods_used
FROM attendances
GROUP BY "schoolId", "classId", date;

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_daily_stats
ON mv_daily_attendance_stats("schoolId", date DESC);

-- Refresh schedule (call this periodically via cron or scheduler)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_attendance_stats;

-- Materialized view for student attendance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_student_attendance_summary AS
SELECT
    a."schoolId",
    a."studentId",
    s."firstName",
    s."lastName",
    COUNT(*) as total_days,
    COUNT(*) FILTER (WHERE status = 'PRESENT') as present_days,
    COUNT(*) FILTER (WHERE status = 'ABSENT') as absent_days,
    COUNT(*) FILTER (WHERE status = 'LATE') as late_days,
    ROUND(
        (COUNT(*) FILTER (WHERE status IN ('PRESENT', 'LATE'))::numeric / COUNT(*)::numeric) * 100,
        2
    ) as attendance_rate,
    MAX(date) as last_attendance_date
FROM attendances a
JOIN students s ON a."studentId" = s.id
WHERE a.date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY a."schoolId", a."studentId", s."firstName", s."lastName";

-- Index on student summary
CREATE INDEX IF NOT EXISTS idx_mv_student_summary
ON mv_student_attendance_summary("schoolId", "studentId");

-- =============================================================================
-- PERFORMANCE TUNING SETTINGS
-- =============================================================================

-- Analyze tables for query planner (run after bulk inserts)
ANALYZE attendances;
ANALYZE attendance_events;
ANALYZE student_identifiers;
ANALYZE attendance_sessions;

-- Set statistics target for important columns (improves query planning)
ALTER TABLE attendances ALTER COLUMN "schoolId" SET STATISTICS 1000;
ALTER TABLE attendances ALTER COLUMN "classId" SET STATISTICS 1000;
ALTER TABLE attendances ALTER COLUMN date SET STATISTICS 1000;
ALTER TABLE attendances ALTER COLUMN status SET STATISTICS 500;
ALTER TABLE attendances ALTER COLUMN method SET STATISTICS 500;

-- =============================================================================
-- PARTITIONING STRATEGY (for very large datasets)
-- =============================================================================

-- Example: Partition attendance table by date (monthly partitions)
-- Uncomment and adjust as needed for very large schools

/*
-- Create partitioned table
CREATE TABLE attendances_partitioned (
    LIKE attendances INCLUDING ALL
) PARTITION BY RANGE (date);

-- Create partitions for current and next 12 months
CREATE TABLE attendances_2024_10 PARTITION OF attendances_partitioned
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');

CREATE TABLE attendances_2024_11 PARTITION OF attendances_partitioned
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

-- Add more partitions as needed...

-- Migrate data
INSERT INTO attendances_partitioned SELECT * FROM attendances;

-- Rename tables
ALTER TABLE attendances RENAME TO attendances_old;
ALTER TABLE attendances_partitioned RENAME TO attendances;
*/

-- =============================================================================
-- CLEANUP AND MAINTENANCE
-- =============================================================================

-- Function to archive old location traces (keep last 30 days)
CREATE OR REPLACE FUNCTION archive_old_location_traces()
RETURNS void AS $$
BEGIN
    DELETE FROM location_traces
    WHERE timestamp < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired QR codes
CREATE OR REPLACE FUNCTION cleanup_expired_qr_codes()
RETURNS void AS $$
BEGIN
    UPDATE qr_code_sessions
    SET "isActive" = false,
        "invalidatedAt" = NOW()
    WHERE "isActive" = true
    AND "expiresAt" < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to deactivate expired cards
CREATE OR REPLACE FUNCTION deactivate_expired_cards()
RETURNS void AS $$
BEGIN
    UPDATE access_cards
    SET "isActive" = false,
        "deactivatedAt" = NOW()
    WHERE "isActive" = true
    AND "expiresAt" IS NOT NULL
    AND "expiresAt" < CURRENT_DATE;

    UPDATE student_identifiers
    SET "isActive" = false
    WHERE "isActive" = true
    AND "expiresAt" IS NOT NULL
    AND "expiresAt" < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MONITORING QUERIES
-- =============================================================================

-- Check index usage
/*
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND tablename IN ('attendances', 'attendance_events', 'student_identifiers')
ORDER BY idx_scan DESC;
*/

-- Check table sizes
/*
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS bytes
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename LIKE '%attendance%'
ORDER BY bytes DESC;
*/

-- Check slow queries (enable pg_stat_statements extension first)
/*
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE query LIKE '%attendance%'
ORDER BY mean_time DESC
LIMIT 20;
*/

-- =============================================================================
-- NOTES
-- =============================================================================

/*
Maintenance Schedule Recommendations:

1. VACUUM ANALYZE - Daily during low-traffic hours
2. Refresh materialized views - Every hour
3. Archive old location traces - Daily
4. Cleanup expired QR codes - Every 15 minutes
5. Deactivate expired cards - Daily
6. Full database backup - Daily
7. Index rebuild (REINDEX) - Weekly during maintenance window

Performance Monitoring:
- Monitor slow query log
- Track index usage statistics
- Monitor table bloat
- Watch for missing indexes on new query patterns
- Monitor connection pool utilization

Scaling Considerations:
- Consider read replicas for reporting queries
- Implement connection pooling (PgBouncer)
- Use Redis for session data and real-time updates
- Consider table partitioning for schools with >100k records
- Implement query result caching for repeated queries
*/