"use server"

// ULTRA MINIMAL: No imports at all to isolate 500 error
// This file should work exactly like test-action.ts

// Inline type definition
export interface TitleFormData {
  title: string
  subdomain?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  errors?: Record<string, string>
}

// ULTRA MINIMAL: getSchoolTitle with zero imports, just hardcoded response
export async function getSchoolTitle(
  schoolId: string
): Promise<ActionResponse> {
  console.log("🔍 [GET SCHOOL TITLE] ULTRA MINIMAL - schoolId:", schoolId)

  // Return hardcoded response - no db, no imports
  return {
    success: true,
    data: {
      title: "Test School Name",
      subdomain: "test-subdomain",
    },
  }
}

// ULTRA MINIMAL: updateSchoolTitle with zero imports
export async function updateSchoolTitle(
  schoolId: string,
  data: TitleFormData
): Promise<ActionResponse> {
  console.log("🎯 [UPDATE SCHOOL TITLE] ULTRA MINIMAL", { schoolId, data })

  // Return hardcoded success - no db, no imports
  return {
    success: true,
    data: {
      id: schoolId,
      name: data.title,
      domain: data.subdomain,
    },
  }
}

// ULTRA MINIMAL: proceedToDescription - just log and return
export async function proceedToDescription(schoolId: string): Promise<void> {
  console.log("🚀 [PROCEED TO DESCRIPTION] schoolId:", schoolId)
  // In ultra-minimal mode, we just return without redirecting
  // The client will handle navigation
}
