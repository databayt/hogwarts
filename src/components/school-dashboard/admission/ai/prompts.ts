// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Admission Document Extraction Prompts
 * AI prompts for Claude Vision API, one per document type
 */

import type { AdmissionDocumentType } from "./types"

// ============================================
// CLASSIFICATION PROMPT
// ============================================

export const classificationPrompt = `Classify this document into one of the following types:

- "degree": A degree certificate, diploma, or academic award document
- "transcript": An academic transcript showing courses, grades, and GPA
- "national_id": A national ID card, passport, or government-issued identification document
- "resume": A resume, CV, or curriculum vitae
- "other": Any document that does not fit the above categories

Instructions:
1. Examine the document layout, headers, seals, and content
2. Look for key indicators (university logos for degree/transcript, government seals for ID, personal info sections for resume)
3. Return the document type and your confidence level
4. If the document is in Arabic, still classify it based on its content and structure

Be precise. If you are not confident, classify as "other".`

// ============================================
// PER-TYPE EXTRACTION PROMPTS
// ============================================

export const documentPrompts: Record<AdmissionDocumentType, string> = {
  degree: `Extract information from this degree certificate or diploma.

Instructions:
1. Extract the institution name (full official name, not abbreviations)
2. Extract the degree title (Bachelor, Master, PhD, etc.)
3. Extract the field of study or major
4. Extract the graduation year
5. Extract GPA if stated on the certificate, along with its scale
6. Extract any honors or distinction (Cum Laude, First Class, etc.)
7. Extract the country of the institution

If the document is in Arabic:
- Transliterate institution and degree names to Latin script
- Keep the original meaning intact
- For Arabic universities, use their commonly known English names if available

Return empty values for any information not clearly visible on the document.
Only extract information that is explicitly stated.`,

  transcript: `Extract information from this academic transcript.

Instructions:
1. Extract the institution name
2. Extract the student name as it appears on the transcript
3. Extract the student ID number
4. Extract ALL courses listed, including:
   - Course name
   - Grade received (letter grade, percentage, or GPA points)
   - Credit hours
   - Semester or term
5. Extract the cumulative GPA and its scale
6. Extract total credit hours completed
7. Extract the academic year or period

If the document is in Arabic:
- Transliterate the student name to Latin script
- Translate course names to English where possible
- Keep grade values in their original format

For tabular data, extract every visible row.
If grades use a local system, note them as-is without converting.
Return empty values for missing information.`,

  national_id: `Extract information from this identification document (national ID, passport, or equivalent).

Instructions:
1. Extract the full name exactly as printed
2. Extract date of birth in YYYY-MM-DD format
3. Extract the ID number / passport number
4. Extract nationality
5. Extract gender
6. Extract issue date in YYYY-MM-DD format
7. Extract expiry date in YYYY-MM-DD format
8. Extract place of birth if present

If the document is in Arabic:
- Transliterate the full name to Latin script
- If both Arabic and English names are present, prefer the English version
- Convert Hijri dates to Gregorian (YYYY-MM-DD) if only Hijri dates are shown

Handle both Gregorian and Hijri calendar dates.
Do not guess information that is not visible. Return empty for missing fields.`,

  resume: `Extract structured information from this resume or CV.

Instructions:
1. Extract the person's full name
2. Extract email address and phone number
3. Extract ALL education entries:
   - Institution name
   - Degree obtained
   - Field of study
   - Year of completion
4. Extract ALL work experience entries:
   - Company/organization name
   - Job title/role
   - Duration in years
   - Brief description of responsibilities
5. Extract skills list
6. Extract languages spoken

If the document is in Arabic:
- Transliterate names and institution names to Latin script
- Translate job titles and skills to English
- Keep company names in their original form (transliterated)

Extract all entries, not just the most recent ones.
Return empty values for sections not present in the document.`,

  other: `Extract any structured information from this document.

Instructions:
1. Identify the document type and purpose
2. Extract any names, dates, or identification numbers
3. Extract any relevant academic or professional information
4. Note any official seals, stamps, or signatures

If the document is in Arabic, transliterate key names and terms to Latin script.
Return empty values for fields that cannot be determined.`,
}

// ============================================
// SYSTEM MESSAGE
// ============================================

export const admissionSystemMessage = `You are a precise data extraction assistant specializing in educational and identification documents for school admission processing.

Your task is to:
- Extract ONLY information that is explicitly stated in the document
- Maintain accuracy and precision
- Return empty values for missing information rather than guessing
- Handle documents in both Arabic and English
- Transliterate Arabic names to Latin script when extracting
- Convert dates to ISO format (YYYY-MM-DD) when possible
- Preserve original grade formats without converting between systems
- Format data according to the provided schema

Never infer or make assumptions. If information is not clearly visible, return empty values.
This data is used for admission decisions, so accuracy is critical.`

// ============================================
// HELPERS
// ============================================

export function getPromptForDocumentType(type: AdmissionDocumentType): string {
  return documentPrompts[type] || documentPrompts.other
}
