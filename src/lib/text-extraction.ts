/**
 * Text Extraction Utilities - Unstructured Data Parser
 *
 * PURPOSE: Extract structured data from unstructured text
 * Handles contact forms, pasted data, and mixed Arabic/English content
 *
 * USE CASE: Lead import from business cards, emails, or user-pasted data
 * Input: Raw text with name, email, phone mixed → Output: Structured contact info
 *
 * EXTRACTION FUNCTIONS:
 * - extractEmails(): Find all email addresses
 * - extractPhones(): Find international phone numbers
 * - extractNames(): Extract full names (Arabic + English)
 * - extractCompanies(): Find company/organization names
 * - extractWebsites(): Extract URLs
 * - extractLeadFromText(): Single lead from single text block
 * - extractMultipleLeads(): Multiple leads from text with separators
 *
 * REGEX PATTERNS:
 * - Emails: Standard RFC5322 simplified pattern
 * - Phones: International (+1 234 567 8901), local (123-456-7890)
 * - Names: English (Title + First Last), Arabic (شرط + أسماء)
 * - Companies: English suffixes (Inc, LLC, Group), Arabic (شركة, مجموعة)
 *
 * BILINGUAL SUPPORT:
 * - Arabic script: Unicode range U+0600 to U+06FF
 * - English: A-Z, a-z characters
 * - Mixed: Company names like "KMCC شركة" supported
 * - Title recognition: "Eng.", "Engineer", "م.", "مهندس", etc.
 *
 * MULTI-LEAD EXTRACTION:
 * Uses hierarchical separator detection:
 * 1. Dashes/equals lines: "---" or "===" or "___"
 * 2. Hash marks: "##"
 * 3. Asterisks: "***"
 * 4. Multiple blank lines: 3+ empty lines
 * 5. Email addresses: Split by email if no clear separators
 *
 * ALGORITHM (extractLeadFromText):
 * 1. Extract all contact info independently
 * 2. Filter names: Prefer signature context, longer names, valid format
 * 3. Select best candidate from each category
 * 4. Clean up extracted strings
 * 5. Return structured ExtractedLead
 *
 * CONSTRAINTS & GOTCHAS:
 * - Greedy name extraction: Picks first valid multi-word pattern
 *   May match company names as person names
 * - Phone patterns: Tuned for international formats
 *   May match partial numbers (e.g., social security formats)
 * - Company detection: Word count heuristic (avoids single words)
 * - Signature context: Looks for 50 chars before/after name
 *   May miss names in middle of text
 * - Description: Replaces bullet points with hyphens for readability
 *
 * QUALITY ISSUES:
 * - No fuzzy matching (exact substring required)
 * - No ML/NLP (purely regex-based)
 * - High false positive rate for names in casual text
 * - May extract promotional text as "description"
 *
 * PERFORMANCE:
 * - Linear scan with multiple regex passes (O(n))
 * - extractMultipleLeads: O(n * m) where m = separator patterns
 * - Can handle up to 10KB text blocks efficiently
 *
 * LIMITATIONS:
 * - Won't extract phone numbers written as words ("five five five")
 * - Won't recognize email aliases with + sign variants
 * - Limited company detection for non-standard formats
 * - Doesn't handle URLs with query parameters well
 */

export interface ExtractedLead {
  name?: string
  company?: string
  email?: string
  phone?: string
  website?: string
  description?: string
  notes?: string
  rawInput: string
}

/**
 * Extract email addresses from text
 */
export function extractEmails(text: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  return text.match(emailRegex) || []
}

/**
 * Extract phone numbers from text (supports international formats)
 */
export function extractPhones(text: string): string[] {
  const phonePatterns = [
    /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, // International format
    /(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, // General format
    /\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, // Simple format
  ]

  const phones = new Set<string>()
  phonePatterns.forEach((pattern) => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach((match) => phones.add(match.trim()))
    }
  })

  return Array.from(phones)
}

/**
 * Extract names from text (supports Arabic and English)
 */
export function extractNames(text: string): string[] {
  const patterns = [
    // English names with titles
    /(?:Eng\.|Engineer|Mr\.|Ms\.|Dr\.|م\.|مهندس)\s+([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/g,
    // Arabic names with titles
    /(?:مهندس|دكتور|أستاذ|الأستاذ)\s+([\u0600-\u06FF\s]+)/g,
    // Names in signature sections (English/Arabic)
    /(?:Best regards|Contact|From|مع أطيب التحيات|للتواصل|من)[,:\s]+([\u0600-\u06FF\s]+|[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/gi,
    // Standard English name patterns
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
    // Arabic name patterns (at least 2 words)
    /[\u0600-\u06FF]+\s+[\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)*/g,
  ]

  const names = new Set<string>()
  patterns.forEach((pattern) => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach((match) => {
        // Clean up the match
        const cleaned = match
          .replace(
            /^(Eng\.|Engineer|Mr\.|Ms\.|Dr\.|م\.|مهندس|مهندس|دكتور|أستاذ|الأستاذ|Best regards|Contact|From|مع أطيب التحيات|للتواصل|من)[,:\s]+/gi,
            ""
          )
          .trim()

        // Check if it's a valid name (at least 2 characters and contains either Arabic or English letters)
        if (
          cleaned.length > 2 &&
          (/[\u0600-\u06FF]/.test(cleaned) || // Contains Arabic
            /[A-Za-z]/.test(cleaned)) // Contains English
        ) {
          const words = cleaned.split(/\s+/)
          if (words.length >= 2) {
            names.add(cleaned)
          }
        }
      })
    }
  })

  return Array.from(names)
}

/**
 * Extract company names from text (supports Arabic and English)
 */
export function extractCompanies(text: string): string[] {
  const patterns = [
    // English companies with legal suffixes
    /\b[A-Z][A-Za-z&\s]+(?:Inc|LLC|Ltd|Corp|Company|Co|Group)\b/g,
    // All caps company names (English)
    /\b[A-Z]{2,}(?:\s[A-Z]{2,})*\s(?:Group|Company|Corp|Inc|LLC|Ltd)\b/g,
    // Company patterns in specific contexts (English)
    /(?:of|at|for)\s+([A-Z][A-Za-z&\s]+Group)/gi,
    // Arabic companies with common suffixes
    /[\u0600-\u06FF\s]+(?:شركة|مجموعة|مؤسسة|معهد|مركز)/g,
    /(?:شركة|مجموعة|مؤسسة|معهد|مركز)\s+[\u0600-\u06FF\s]+/g,
    // Mixed Arabic-English company names
    /(?:KMCC|[A-Z]{2,})\s+(?:Group|شركة|مجموعة)/gi,
  ]

  const companies = new Set<string>()
  patterns.forEach((pattern) => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach((match) => {
        const cleaned = match.replace(/^(of|at|for|في|لدى|من)\s+/gi, "").trim()
        if (cleaned.length > 2) {
          companies.add(cleaned)
        }
      })
    }
  })

  return Array.from(companies)
}

/**
 * Extract website URLs from text
 */
export function extractWebsites(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/g
  return text.match(urlRegex) || []
}

/**
 * Clean and limit text length for fields
 */
export function cleanAndLimit(text: string, maxLength: number): string {
  return text.trim().substring(0, maxLength)
}

/**
 * Extract structured data from complex text
 */
export function extractLeadFromText(text: string): ExtractedLead {
  const emails = extractEmails(text)
  const phones = extractPhones(text)
  const names = extractNames(text)
  const companies = extractCompanies(text)
  const websites = extractWebsites(text)

  // Filter names to get the most likely candidate (longest name with good context)
  const bestName = names.reduce(
    (best, current) => {
      // Prefer names that appear in signature context or with titles
      const hasSignatureContext =
        /(?:Best regards|Contact|From|Eng\.|Engineer)/i.test(
          text.substring(text.indexOf(current) - 50, text.indexOf(current) + 50)
        )
      const isSufficient = current.split(" ").length >= 2 && current.length >= 5

      if (!best) return isSufficient ? current : undefined

      if (
        hasSignatureContext &&
        !best.includes("Eng.") &&
        !best.includes("Best regards")
      ) {
        return current
      }

      // Prefer longer, more complete names
      if (current.length > best.length && isSufficient) {
        return current
      }

      return best
    },
    undefined as string | undefined
  )

  // Create a comprehensive description from the original text
  const description = text.replace(/\s+/g, " ").replace(/[•·]/g, "-").trim()

  return {
    name: bestName ? cleanAndLimit(bestName, 100) : undefined,
    company:
      companies.length > 0 ? cleanAndLimit(companies[0], 100) : undefined,
    email: emails.length > 0 ? emails[0] : undefined,
    phone: phones.length > 0 ? phones[0] : undefined,
    website: websites.length > 0 ? websites[0] : undefined,
    description: cleanAndLimit(description, 1000),
    notes: `Auto-extracted from: ${cleanAndLimit(text.substring(0, 200), 200)}...`,
    rawInput: text,
  }
}

/**
 * Extract multiple leads from text (split by common separators)
 */
export function extractMultipleLeads(text: string): ExtractedLead[] {
  // Split text by common separators that indicate new leads
  const separators = [
    /\n\s*[-=_]{3,}\s*\n/g, // Lines with dashes/equals/underscores
    /\n\s*#{2,}\s*\n/g, // Multiple hash marks
    /\n\s*\*{3,}\s*\n/g, // Multiple asterisks
    /(?:\n\s*){3,}/g, // Multiple empty lines
  ]

  let chunks = [text]

  // Apply each separator
  separators.forEach((separator) => {
    const newChunks: string[] = []
    chunks.forEach((chunk) => {
      newChunks.push(...chunk.split(separator))
    })
    chunks = newChunks.filter((chunk) => chunk.trim().length > 50)
  })

  // If no clear separators, try to split by email addresses or phone numbers
  if (chunks.length === 1 && chunks[0].length > 500) {
    const emailSplit = text.split(
      /(?=\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/
    )
    if (emailSplit.length > 1) {
      chunks = emailSplit.filter((chunk) => chunk.trim().length > 50)
    }
  }

  return chunks
    .map(extractLeadFromText)
    .filter((lead) => lead.email || lead.phone || lead.name || lead.company)
}
