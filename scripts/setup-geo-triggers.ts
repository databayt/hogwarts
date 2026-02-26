// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Script to set up PostgreSQL triggers for real-time geofence notifications
 * Run with: npx tsx scripts/setup-geo-triggers.ts
 */

import { readFileSync } from "fs"
import { join } from "path"
import pg from "pg"

// Environment variables are loaded by Next.js

const { Pool } = pg

async function setupTriggers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log(
      "🔧 Setting up PostgreSQL triggers for geofence notifications..."
    )

    // Read the SQL file
    const sqlPath = join(process.cwd(), "prisma", "sql", "geo-triggers.sql")
    const sql = readFileSync(sqlPath, "utf-8")

    // Execute the entire SQL file
    console.log("Executing SQL file...")
    await pool.query(sql)

    console.log("✅ PostgreSQL triggers created successfully!")
    console.log("   - notify_geo_location() function")
    console.log("   - notify_geo_event() function")
    console.log("   - geo_location_notify trigger on location_traces")
    console.log("   - geo_event_notify trigger on geo_attendance_events")
    console.log("   - Performance indexes for LISTEN/NOTIFY")

    // Test the triggers by checking if they exist
    const result = await pool.query(`
      SELECT trigger_name, event_manipulation
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND (trigger_name = 'geo_location_notify' OR trigger_name = 'geo_event_notify')
      ORDER BY trigger_name;
    `)

    console.log("\n📋 Installed triggers:")
    result.rows.forEach(
      (t: { trigger_name: string; event_manipulation: string }) => {
        console.log(`   - ${t.trigger_name} (${t.event_manipulation})`)
      }
    )
  } catch (error) {
    console.error("❌ Error setting up triggers:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupTriggers()
