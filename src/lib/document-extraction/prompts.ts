/**
 * Document Extraction Prompts
 * Step-specific AI prompts for Claude Vision API
 */

import type { OnboardingStep } from './types'

export const stepPrompts: Record<OnboardingStep, string> = {
  title: `Extract school identification information from this document.

Instructions:
1. Extract the official school name (full name, not abbreviations)
2. Suggest a suitable subdomain based on the school name (lowercase, no spaces, alphanumeric only)
3. Extract any tagline, motto, or slogan

If the document doesn't contain school identification information, return empty values.
Be precise and extract only what is explicitly stated in the document.`,

  description: `Extract school descriptive information from this document.

Instructions:
1. Extract the mission statement (usually a paragraph describing the school's purpose)
2. Extract the vision statement (usually describes future goals and aspirations)
3. Extract core values (typically a list of principles or beliefs)
4. Extract general school description or overview

If any section is not found, return empty values for that field.
Preserve the original wording as much as possible.`,

  location: `Extract school location and contact information from this document.

Instructions:
1. Extract complete address details (country, state/province, city, street address, postal code)
2. Extract contact information (phone number, email address)
3. Extract website URL if present
4. Ensure phone numbers are in standard format
5. Ensure email addresses are valid
6. Ensure URLs include protocol (http:// or https://)

If any information is missing, return empty values for those fields.
Only extract information that is clearly visible and accurate.`,

  capacity: `Extract school capacity and facility information from this document.

Instructions:
1. Extract total student enrollment or capacity
2. Extract total number of teachers or faculty members
3. Extract number of classes or classrooms
4. Extract maximum class size if specified
5. Extract list of facilities (e.g., library, science lab, gymnasium, cafeteria)

Look for:
- Enrollment numbers or student capacity
- Faculty size or teacher count
- Classroom or class information
- Facility lists or infrastructure descriptions

If numeric values are given as ranges, use the maximum value.
Return only explicitly stated information.`,

  branding: `Extract branding and visual identity information from this document.

Instructions:
1. Note any color schemes or brand colors mentioned
2. Extract design guidelines or brand standards
3. Identify visual elements or logo descriptions

This is typically found in brand guidelines or marketing materials.
Return empty if no branding information is found.`,

  import: `Extract data suitable for bulk import from this document.

Instructions:
1. Identify if the document contains student, teacher, or class data
2. Extract structured data (names, emails, IDs, etc.)
3. Maintain the tabular structure if present

This prompt is for detecting importable data sets.
Return empty if the document is not a data file.`,

  price: `Extract fee and pricing information from this document.

Instructions:
1. Extract currency code (USD, EUR, etc.)
2. Extract tuition fees (annual, semester, or monthly)
3. Extract registration or enrollment fees
4. Extract other fees (lab fees, technology fees, activity fees, etc.)
5. Note the payment frequency for each fee (one-time, monthly, annual)

Look for:
- Fee schedules or pricing tables
- Tuition cost information
- Payment plans or billing information

Ensure all amounts are numeric values.
Include fee names and frequencies where specified.`,

  legal: `Extract legal and compliance information from this document.

Instructions:
1. Extract terms and conditions
2. Extract privacy policy statements
3. Extract licensing or accreditation information
4. Extract legal disclaimers

Return empty if no legal information is found.
This is typically found in official documents or agreements.`,
}

export function getPromptForStep(stepId: OnboardingStep): string {
  return stepPrompts[stepId] || stepPrompts.title
}

// System message for all extraction tasks
export const systemMessage = `You are a precise data extraction assistant specializing in educational institution documents.

Your task is to:
- Extract ONLY information that is explicitly stated in the document
- Maintain accuracy and precision
- Return empty values for missing information rather than guessing
- Preserve original wording when extracting text
- Format data according to the provided schema

Never infer or make assumptions. If information is not clearly visible, return empty values.`
