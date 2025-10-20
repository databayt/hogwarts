/**
 * Script to set up PostGIS spatial indexes for geofence performance
 * Run with: npx tsx scripts/setup-geo-indexes.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import pg from 'pg'

// Environment variables are loaded by Next.js

const { Pool } = pg

async function setupIndexes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log('🔧 Setting up PostGIS spatial indexes for geofence performance...')

    // Read the SQL file
    const sqlPath = join(process.cwd(), 'prisma', 'sql', 'geo-spatial-indexes.sql')
    const sql = readFileSync(sqlPath, 'utf-8')

    // Execute the SQL
    console.log('Executing SQL file...')
    await pool.query(sql)

    console.log('✅ PostGIS spatial indexes created successfully!')
    console.log('   - idx_geofence_center_point (GiST) for circular geofences')
    console.log('   - idx_geofence_polygon (GiST) for polygon geofences')
    console.log('   - idx_location_traces_point (GiST) for location spatial queries')
    console.log('   - idx_location_traces_timestamp_brin (BRIN) for time-series queries')
    console.log('   - idx_geo_events_timestamp_brin (BRIN) for event time-series')

    // Verify indexes were created
    const result = await pool.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (
          indexname LIKE 'idx_geofence_%'
          OR indexname LIKE 'idx_location_traces_%'
          OR indexname LIKE 'idx_geo_events_%'
        )
        AND (
          indexname LIKE '%_point'
          OR indexname LIKE '%_polygon'
          OR indexname LIKE '%_brin'
        )
      ORDER BY tablename, indexname;
    `)

    console.log('\n📋 Installed spatial indexes:')
    result.rows.forEach((row: {
      tablename: string
      indexname: string
      indexdef: string
    }) => {
      const indexType = row.indexdef.includes('USING gist') ? 'GiST' : 'BRIN'
      console.log(`   - ${row.indexname} (${indexType}) on ${row.tablename}`)
    })

    // Get index sizes
    const sizeResult = await pool.query(`
      SELECT
        indexname,
        pg_size_pretty(pg_relation_size(indexname::regclass)) as size
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (
          indexname LIKE 'idx_geofence_%'
          OR indexname LIKE 'idx_location_traces_%'
          OR indexname LIKE 'idx_geo_events_%'
        )
        AND (
          indexname LIKE '%_point'
          OR indexname LIKE '%_polygon'
          OR indexname LIKE '%_brin'
        )
      ORDER BY pg_relation_size(indexname::regclass) DESC;
    `)

    console.log('\n💾 Index sizes:')
    sizeResult.rows.forEach((row: { indexname: string; size: string }) => {
      console.log(`   - ${row.indexname}: ${row.size}`)
    })
  } catch (error) {
    console.error('❌ Error setting up spatial indexes:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setupIndexes()
