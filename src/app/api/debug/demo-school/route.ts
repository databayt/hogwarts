import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { normalizeSubdomain } from "@/lib/subdomain"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Test 1: Check if database is connected
    const count = await db.school.count()

    // Test 2: Query demo school specifically
    const normalized = normalizeSubdomain("demo")
    const demoSchool = await db.school.findUnique({
      where: { domain: normalized },
      select: { id: true, name: true, domain: true, isActive: true },
    })

    // Test 3: List all schools
    const allSchools = await db.school.findMany({
      select: { id: true, name: true, domain: true },
      take: 5,
    })

    return NextResponse.json({
      success: true,
      databaseConnected: true,
      totalSchools: count,
      normalizedSubdomain: normalized,
      demoSchool: demoSchool || null,
      allSchools,
      envCheck: {
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 50) + "...",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        envCheck: {
          hasDbUrl: !!process.env.DATABASE_URL,
          dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 50) + "...",
        },
      },
      { status: 500 }
    )
  }
}
