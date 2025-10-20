-- PostgreSQL LISTEN/NOTIFY Triggers for Real-Time Geofence Events
-- Part of the Hogwarts School Management System

-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS geo_location_notify ON location_traces;
DROP TRIGGER IF EXISTS geo_event_notify ON geo_attendance_events;
DROP FUNCTION IF EXISTS notify_geo_location();
DROP FUNCTION IF EXISTS notify_geo_event();

-- Function to notify when a new location trace is added
CREATE OR REPLACE FUNCTION notify_geo_location()
RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
BEGIN
  -- Create JSON payload with essential data (keep under 8KB)
  payload := json_build_object(
    'type', 'location',
    'schoolId', NEW."schoolId",
    'studentId', NEW."studentId",
    'lat', NEW.lat,
    'lon', NEW.lon,
    'accuracy', NEW.accuracy,
    'timestamp', NEW.timestamp
  )::TEXT;

  -- Send notification on school-specific channel
  PERFORM pg_notify('geo_location_' || NEW."schoolId", payload);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify when a geofence event occurs (ENTER/EXIT)
CREATE OR REPLACE FUNCTION notify_geo_event()
RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
BEGIN
  -- Create JSON payload with essential data (keep under 8KB)
  payload := json_build_object(
    'type', 'event',
    'schoolId', NEW."schoolId",
    'studentId', NEW."studentId",
    'geofenceId', NEW."geofenceId",
    'eventType', NEW."eventType",
    'lat', NEW.lat,
    'lon', NEW.lon,
    'timestamp', NEW.timestamp
  )::TEXT;

  -- Send notification on school-specific channel
  PERFORM pg_notify('geo_event_' || NEW."schoolId", payload);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for location traces (fires on every INSERT)
CREATE TRIGGER geo_location_notify
AFTER INSERT ON location_traces
FOR EACH ROW
EXECUTE FUNCTION notify_geo_location();

-- Trigger for geofence events (fires on every INSERT)
CREATE TRIGGER geo_event_notify
AFTER INSERT ON geo_attendance_events
FOR EACH ROW
EXECUTE FUNCTION notify_geo_event();

-- Create indexes for LISTEN/NOTIFY performance
CREATE INDEX IF NOT EXISTS idx_location_traces_school_timestamp
ON location_traces("schoolId", timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_geo_events_school_timestamp
ON geo_attendance_events("schoolId", timestamp DESC);

-- Comments for documentation
COMMENT ON FUNCTION notify_geo_location() IS
'Trigger function that sends real-time notifications when students submit location updates. Notifications are sent on school-specific channels (geo_location_{schoolId}) to support multi-tenancy.';

COMMENT ON FUNCTION notify_geo_event() IS
'Trigger function that sends real-time notifications when geofence events occur (ENTER/EXIT/INSIDE). Notifications are sent on school-specific channels (geo_event_{schoolId}) to support multi-tenancy.';

COMMENT ON TRIGGER geo_location_notify ON location_traces IS
'Sends real-time notifications to WebSocket clients when students submit location updates';

COMMENT ON TRIGGER geo_event_notify ON geo_attendance_events IS
'Sends real-time notifications to WebSocket clients when geofence events occur (student enters/exits geofence)';
