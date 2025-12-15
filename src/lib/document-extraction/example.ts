/**
 * Document Extraction Usage Examples
 * These examples demonstrate how to use the document extraction service
 */

import { extractFromDocument } from "./index"

// Example 1: Extract from PDF
export async function extractFromPDF() {
  // In a real application, this would come from a file upload
  const file = new File([Buffer.from("")], "school-info.pdf", {
    type: "application/pdf",
  })

  const result = await extractFromDocument(file, "location", {
    maxFileSize: 10 * 1024 * 1024, // 10MB
  })

  if (result.success && result.data) {
    console.log("Extracted fields:", result.data.fields)
    console.log("Confidence:", result.data.confidence)
    console.log("Processing time:", result.processingTime, "ms")

    // Access specific fields
    const locationFields = result.data.fields.reduce(
      (acc, field) => {
        acc[field.key] = field.value
        return acc
      },
      {} as Record<string, unknown>
    )

    console.log("Country:", locationFields.country)
    console.log("City:", locationFields.city)
  } else {
    console.error("Extraction failed:", result.error)
  }

  return result
}

// Example 2: Extract from Image
export async function extractFromImage() {
  const file = new File([Buffer.from("")], "school-brochure.jpg", {
    type: "image/jpeg",
  })

  const result = await extractFromDocument(file, "title")

  if (result.success && result.data) {
    const titleFields = result.data.fields.reduce(
      (acc, field) => {
        acc[field.key] = field.value
        return acc
      },
      {} as Record<string, unknown>
    )

    console.log("School name:", titleFields.schoolName)
    console.log("Subdomain:", titleFields.subdomain)
    console.log("Tagline:", titleFields.tagline)
  }

  return result
}

// Example 3: Extract from Excel
export async function extractFromExcel() {
  const file = new File([Buffer.from("")], "fee-schedule.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  const result = await extractFromDocument(file, "price")

  if (result.success && result.data) {
    const priceFields = result.data.fields.reduce(
      (acc, field) => {
        acc[field.key] = field.value
        return acc
      },
      {} as Record<string, unknown>
    )

    console.log("Currency:", priceFields.currency)
    console.log("Tuition fee:", priceFields.tuitionFee)
    console.log("Other fees:", priceFields.otherFees)
  }

  return result
}

// Example 4: Client-side usage with form auto-fill
export async function autoFillForm(
  file: File,
  stepId: "title" | "description" | "location" | "capacity" | "price",
  setValue: (key: string, value: unknown) => void
) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("stepId", stepId)

  try {
    const response = await fetch("/api/onboarding/extract", {
      method: "POST",
      body: formData,
    })

    const result = await response.json()

    if (result.success && result.data) {
      // Auto-fill form fields
      result.data.fields.forEach((field: any) => {
        setValue(field.key, field.value)
      })

      return {
        success: true,
        fieldsSet: result.data.fields.length,
        confidence: result.data.confidence,
      }
    } else {
      return {
        success: false,
        error: result.error,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    }
  }
}

// Example 5: Batch processing multiple files
export async function batchExtract(
  files: File[],
  stepId: "title" | "description" | "location" | "capacity" | "price"
) {
  const results = await Promise.all(
    files.map((file) => extractFromDocument(file, stepId))
  )

  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  console.log(`Processed ${results.length} files:`)
  console.log(`- Successful: ${successful.length}`)
  console.log(`- Failed: ${failed.length}`)

  // Merge all extracted fields
  const allFields = successful.flatMap((r) => r.data?.fields || [])

  // Calculate average confidence
  const avgConfidence =
    successful.reduce((sum, r) => sum + (r.data?.confidence || 0), 0) /
    successful.length

  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    fields: allFields,
    averageConfidence: avgConfidence,
    results,
  }
}

// Example 6: Validation before extraction
export async function extractWithValidation(
  file: File,
  stepId: "title" | "description" | "location" | "capacity" | "price"
) {
  // Validate file size
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      success: false,
      error: "File size exceeds 10MB limit",
    }
  }

  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]

  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `File type ${file.type} not supported`,
    }
  }

  // Extract
  const result = await extractFromDocument(file, stepId, {
    maxFileSize: maxSize,
    allowedTypes,
  })

  return result
}

// Example 7: Retry with fallback
export async function extractWithRetry(
  file: File,
  stepId: "title" | "description" | "location" | "capacity" | "price",
  maxRetries = 3
) {
  let lastError: string | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Extraction attempt ${attempt}/${maxRetries}`)

    const result = await extractFromDocument(file, stepId)

    if (result.success) {
      return result
    }

    lastError = result.error
    console.warn(`Attempt ${attempt} failed:`, lastError)

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      )
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
    processingTime: 0,
  }
}
