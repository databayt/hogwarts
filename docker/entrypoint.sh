#!/bin/sh
# Production entrypoint script with health checks and graceful shutdown

set -e

echo "🚀 Starting Hogwarts Platform..."

# Update ClamAV virus definitions if enabled
if [ "$ENABLE_VIRUS_SCAN" = "true" ]; then
    echo "📦 Updating virus definitions..."
    freshclam --quiet || echo "⚠️  Failed to update virus definitions (non-critical)"
fi

# Run database migrations if enabled
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "🗄️  Running database migrations..."
    npx prisma migrate deploy
    echo "✅ Migrations completed"
fi

# Verify critical environment variables
required_vars="DATABASE_URL NEXTAUTH_SECRET NEXTAUTH_URL"
for var in $required_vars; do
    if [ -z "$(eval echo \$$var)" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Create necessary directories if they don't exist
mkdir -p "$UPLOAD_DIR" "$TEMP_UPLOAD_DIR" "$QUARANTINE_DIR" "$LOG_DIR"

# Set up signal handlers for graceful shutdown
trap 'echo "🛑 Received SIGTERM, shutting down gracefully..."; kill -TERM $PID; wait $PID' TERM
trap 'echo "🛑 Received SIGINT, shutting down gracefully..."; kill -INT $PID; wait $PID' INT

# Start the application
echo "✅ Starting Next.js application on port $PORT..."
exec "$@" &
PID=$!

# Wait for the process to finish
wait $PID