/**
 * Utility functions for subdomain detection and handling
 */

export interface SubdomainResult {
  subdomain: string | null
  isSpecialCase: boolean
  reason?: string
}

/**
 * Extracts subdomain from hostname, handling special cases
 */
export function extractSubdomain(host: string, rootDomain?: string): SubdomainResult {
  // Handle edge cases
  if (!host || !rootDomain) {
    return { subdomain: null, isSpecialCase: false, reason: 'Missing host or rootDomain' }
  }

  // Dev convenience: check for query param (you can remove this later)
  if (host.includes('localhost')) {
    return { subdomain: null, isSpecialCase: false, reason: 'Localhost environment' }
  }

  // Production subdomain detection
  if (host.endsWith("." + rootDomain)) {
    const dotRootDomain = "." + rootDomain
    const subdomainEndIndex = host.lastIndexOf(dotRootDomain)
    
    if (subdomainEndIndex > 0) {
      const subdomain = host.substring(0, subdomainEndIndex)
      
      // Special case: ed.databayt.org should show marketing, not be treated as subdomain
      if (subdomain === 'ed') {
        return { 
          subdomain: null, 
          isSpecialCase: true, 
          reason: 'ed.databayt.org - using marketing route' 
        }
      }
      
      return { subdomain, isSpecialCase: false }
    }
  }

  return { subdomain: null, isSpecialCase: false, reason: 'No subdomain found' }
}

/**
 * Checks if a subdomain is valid for tenant creation
 */
export function isValidSubdomain(subdomain: string): boolean {
  // Only allow letters, numbers, hyphens
  const validPattern = /^[a-z0-9-]+$/
  return validPattern.test(subdomain) && 
         subdomain.length >= 3 && 
         subdomain.length <= 63 &&
         !subdomain.startsWith('-') &&
         !subdomain.endsWith('-')
}

/**
 * Normalizes a subdomain for consistent handling
 */
export function normalizeSubdomain(subdomain: string): string {
  return subdomain.toLowerCase().trim()
}

/**
 * Generates a subdomain from a school name
 */
export function generateSubdomain(schoolName: string): string {
  if (!schoolName) return ''
  
  // Common words to filter out (case-insensitive)
  const filterWords = [
    'international', 'national', 'global', 'world',
    'school', 'academy', 'college', 'university', 'institute',
    'private', 'public', 'charter', 'magnet',
    'primary', 'secondary', 'elementary', 'middle', 'high',
    'preparatory', 'prep', 'grammar', 'comprehensive',
    'day', 'boarding', 'residential',
    'boys', 'girls', 'coeducational', 'co-ed',
    'christian', 'catholic', 'islamic', 'jewish', 'hindu', 'buddhist',
    'british', 'american', 'canadian', 'australian',
    'modern', 'traditional', 'progressive', 'classical',
    'the', 'and', 'of', 'for', 'in', 'at'
  ]
  
  // Split into words and filter out common words
  let words = schoolName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
    .trim()
    .split(/\s+/)
    .filter(word => {
      // Keep words that are not in the filter list and have meaningful length
      return !filterWords.includes(word) && word.length >= 2
    })
  
  // If we filtered out too many words, keep the first meaningful word
  if (words.length === 0) {
    words = schoolName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .filter(word => word.length >= 2)
      .slice(0, 1)
  }
  
  // If still no words, use the original name
  if (words.length === 0) {
    words = [schoolName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10)]
  }
  
  // Join words with hyphens
  let subdomain = words.join('-')
  
  // Remove leading/trailing hyphens
  subdomain = subdomain.replace(/^-+|-+$/g, '')
  
  // Ensure minimum length
  if (subdomain.length < 3) {
    subdomain = `school-${subdomain}`
  }
  
  // Ensure maximum length
  if (subdomain.length > 63) {
    subdomain = subdomain.substring(0, 63)
    // Remove trailing hyphens
    subdomain = subdomain.replace(/-+$/, '')
  }
  
  return subdomain
}

/**
 * Generates alternative subdomain suggestions
 */
export function generateSubdomainSuggestions(schoolName: string): string[] {
  const base = generateSubdomain(schoolName)
  const suggestions: string[] = [base]
  
  // Add variations
  if (base.includes('-')) {
    // Remove hyphens
    suggestions.push(base.replace(/-/g, ''))
    
    // Add school suffix if not present
    if (!base.includes('school')) {
      suggestions.push(`${base}-school`)
    }
  }
  
  // Add numbered variations
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${base}${i}`)
  }
  
  // Add location-based variations if we have multiple meaningful words
  const words = schoolName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(word => word.length >= 2)
  
  if (words.length >= 2) {
    // Try first two words
    const firstTwo = words.slice(0, 2).join('-')
    if (firstTwo !== base && firstTwo.length >= 3) {
      suggestions.push(firstTwo)
    }
    
    // Try first word only
    const firstWord = words[0]
    if (firstWord !== base && firstWord.length >= 3) {
      suggestions.push(firstWord)
    }
  }
  
  // Remove duplicates and return
  return [...new Set(suggestions)].slice(0, 6)
}

/**
 * Checks if a subdomain is available in the database
 */
export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  try {
    // Dynamic import to avoid issues in middleware
    const { db } = await import('@/lib/db')
    
    // Check if subdomain already exists
    const existingSchool = await db.school.findUnique({
      where: { domain: subdomain },
      select: { id: true }
    })
    
    // Return true if no school found with this subdomain
    return !existingSchool
  } catch (error) {
    console.error('Error checking subdomain availability:', error)
    // If there's an error, assume unavailable for safety
    return false
  }
}
