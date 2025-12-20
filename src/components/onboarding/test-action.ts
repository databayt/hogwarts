"use server"

// Minimal test action with no imports to diagnose 500 error

// Test getSchoolTitle - same as title/actions.ts but in test-action.ts
export async function testGetSchoolTitle(schoolId: string) {
  console.log("🧪 [TEST GET SCHOOL TITLE] Called with schoolId:", schoolId)
  return {
    success: true,
    data: {
      title: "Test School from test-action.ts",
      subdomain: "test-subdomain-from-test-action",
    },
  }
}

export async function testMinimalAction() {
  console.log("🧪 [TEST MINIMAL] Called at", new Date().toISOString())
  return {
    success: true,
    data: {
      message: "Minimal action works!",
      timestamp: new Date().toISOString(),
    },
  }
}

export async function testDbAction() {
  console.log("🧪 [TEST DB] Called at", new Date().toISOString())
  try {
    // Dynamic import to avoid module-level issues
    const { db } = await import("@/lib/db")
    const count = await db.school.count()
    console.log("🧪 [TEST DB] School count:", count)
    return {
      success: true,
      data: { count, timestamp: new Date().toISOString() },
    }
  } catch (error) {
    console.error("🧪 [TEST DB] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
