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
         subdomain.length >= 2 && 
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
 * Generates a beautiful, short subdomain from a school name
 * Prioritizes unique meaningful words and creates elegant suggestions
 */
export function generateSubdomain(schoolName: string): string {
  if (!schoolName) return ''

  // Common words to filter out (expanded list for better filtering)
  const filterWords = [
    'international', 'national', 'global', 'world', 'worldwide',
    'school', 'academy', 'college', 'university', 'institute', 'institution',
    'private', 'public', 'charter', 'magnet', 'independent',
    'primary', 'secondary', 'elementary', 'middle', 'high', 'senior',
    'preparatory', 'prep', 'grammar', 'comprehensive', 'community',
    'day', 'boarding', 'residential',
    'boys', 'girls', 'coeducational', 'co-ed', 'mixed',
    'christian', 'catholic', 'islamic', 'jewish', 'hindu', 'buddhist', 'religious',
    'british', 'american', 'canadian', 'australian', 'european',
    'modern', 'traditional', 'progressive', 'classical', 'advanced',
    'education', 'educational', 'learning', 'study', 'studies',
    'center', 'centre', 'campus', 'foundation',
    'the', 'and', 'of', 'for', 'in', 'at', 'with', 'by', 'to', 'a', 'an'
  ]

  // Clean and split the school name
  const cleanName = schoolName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
    .trim()

  const allWords = cleanName.split(/\s+/).filter(word => word.length >= 2)

  // Step 1: Try to find unique, meaningful words
  const uniqueWords = allWords.filter(word =>
    !filterWords.includes(word) && word.length >= 3
  )

  // Step 2: If we have unique words, prioritize them
  if (uniqueWords.length > 0) {
    // For single unique word, check if it's long enough to abbreviate
    if (uniqueWords.length === 1) {
      const word = uniqueWords[0]
      if (word.length <= 8) {
        return word
      } else {
        // Create smart abbreviation for long single words
        return createSmartAbbreviation(word)
      }
    }

    // For multiple unique words, combine strategically
    if (uniqueWords.length === 2) {
      const combined = uniqueWords.join('')
      if (combined.length <= 12) {
        return combined
      } else {
        // Use first letters or smart combination
        return createSmartCombination(uniqueWords)
      }
    }

    // For 3+ unique words, use first 2 or create abbreviation
    if (uniqueWords.length >= 3) {
      const firstTwo = uniqueWords.slice(0, 2)
      const combined = firstTwo.join('')
      if (combined.length <= 10) {
        return combined
      } else {
        return createSmartCombination(uniqueWords.slice(0, 3))
      }
    }
  }

  // Step 3: Fallback - use all non-filtered words with smart logic
  const meaningfulWords = allWords.filter(word => !filterWords.includes(word) && word.length >= 2)

  if (meaningfulWords.length > 0) {
    if (meaningfulWords.length === 1) {
      return meaningfulWords[0].substring(0, 15)
    }

    // Combine first 2-3 meaningful words intelligently
    if (meaningfulWords.length >= 2) {
      return createSmartCombination(meaningfulWords.slice(0, 2))
    }
  }

  // Step 4: Ultimate fallback - use original logic with improvements
  let words = allWords.filter(word => word.length >= 2).slice(0, 2)

  if (words.length === 0) {
    words = [cleanName.replace(/[^a-z0-9]/g, '').substring(0, 10)]
  }

  let subdomain = words.join('-')

  // Clean up and ensure proper format
  subdomain = subdomain.replace(/^-+|-+$/g, '')

  if (subdomain.length > 63) {
    subdomain = subdomain.substring(0, 63).replace(/-+$/, '')
  }

  return subdomain || 'school'
}

/**
 * Creates smart abbreviation for long words
 */
function createSmartAbbreviation(word: string): string {
  // For very long words, create pronunciation-friendly abbreviation
  if (word.length > 12) {
    // Take first 3 letters + consonants from middle + last letter
    const first3 = word.substring(0, 3)
    const middle = word.substring(3, word.length - 1)
    const consonants = middle.replace(/[aeiou]/g, '').substring(0, 2)
    const last = word[word.length - 1]
    return first3 + consonants + last
  }

  // For moderately long words, smart truncation
  if (word.length > 8) {
    // Keep important parts - beginning and consonants
    const vowels = 'aeiou'
    let result = word[0] // First letter always
    let consonantCount = 0

    for (let i = 1; i < word.length && result.length < 6; i++) {
      const char = word[i]
      if (!vowels.includes(char)) {
        result += char
        consonantCount++
      } else if (consonantCount === 0 || i === word.length - 1) {
        // Keep vowels if no consonants yet or it's the last letter
        result += char
      }
    }

    return result.substring(0, 8)
  }

  return word
}

/**
 * Creates smart combination of multiple words
 */
function createSmartCombination(words: string[]): string {
  if (words.length === 1) {
    return createSmartAbbreviation(words[0])
  }

  if (words.length === 2) {
    const [first, second] = words

    // If both words are short, combine them
    if (first.length + second.length <= 10) {
      return first + second
    }

    // Smart abbreviation of both
    const firstPart = first.length <= 4 ? first : createSmartAbbreviation(first).substring(0, 4)
    const secondPart = second.length <= 4 ? second : createSmartAbbreviation(second).substring(0, 4)

    return firstPart + secondPart
  }

  // For 3+ words, use initials + first word or creative combination
  if (words.length >= 3) {
    const firstWord = words[0].length <= 6 ? words[0] : createSmartAbbreviation(words[0])
    const initials = words.slice(1, 4).map(w => w[0]).join('')

    const result = firstWord + initials
    return result.substring(0, 8)
  }

  return words.join('').substring(0, 8)
}

/**
 * Generates beautiful alternative subdomain suggestions
 */
export function generateSubdomainSuggestions(schoolName: string): string[] {
  if (!schoolName) return []

  const base = generateSubdomain(schoolName)
  const suggestions: string[] = [base]

  // Get clean words for variations
  const cleanName = schoolName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  const allWords = cleanName.split(/\s+/).filter(word => word.length >= 2)

  const filterWords = [
    'international', 'national', 'global', 'world', 'worldwide',
    'school', 'academy', 'college', 'university', 'institute', 'institution',
    'private', 'public', 'charter', 'magnet', 'independent',
    'primary', 'secondary', 'elementary', 'middle', 'high', 'senior',
    'preparatory', 'prep', 'grammar', 'comprehensive', 'community',
    'education', 'educational', 'learning'
  ]

  const meaningfulWords = allWords.filter(word =>
    !filterWords.includes(word) && word.length >= 3
  )

  // Strategy 1: Variations of the base
  if (base.includes('-')) {
    // Remove hyphens version
    const noDashes = base.replace(/-/g, '')
    if (noDashes.length >= 3 && noDashes.length <= 15) {
      suggestions.push(noDashes)
    }
  }

  // Strategy 2: Use different word combinations
  if (meaningfulWords.length >= 2) {
    // First word only
    const firstWord = meaningfulWords[0]
    if (firstWord !== base && firstWord.length >= 3 && firstWord.length <= 12) {
      suggestions.push(firstWord)
    }

    // Last word only (often the most distinctive)
    const lastWord = meaningfulWords[meaningfulWords.length - 1]
    if (lastWord !== base && lastWord !== firstWord && lastWord.length >= 3 && lastWord.length <= 12) {
      suggestions.push(lastWord)
    }

    // Initials + first word
    if (meaningfulWords.length >= 2) {
      const initials = meaningfulWords.slice(1).map(w => w[0]).join('')
      const initialsCombo = firstWord + initials
      if (initialsCombo !== base && initialsCombo.length >= 3 && initialsCombo.length <= 10) {
        suggestions.push(initialsCombo)
      }
    }
  }

  // Strategy 3: Add elegant suffixes for short bases
  if (base.length <= 6) {
    const suffixes = ['edu', 'sch', 'academy']
    for (const suffix of suffixes) {
      const withSuffix = base + suffix
      if (withSuffix.length <= 12) {
        suggestions.push(withSuffix)
      }
    }
  }

  // Strategy 4: Creative abbreviations if we have a long school name
  if (schoolName.length > 20 && meaningfulWords.length >= 2) {
    // Take first 2 letters of each meaningful word
    const abbreviated = meaningfulWords.slice(0, 3).map(w => w.substring(0, 2)).join('')
    if (abbreviated.length >= 4 && abbreviated.length <= 8) {
      suggestions.push(abbreviated)
    }
  }

  // Strategy 5: Add a few numbered variations only if base is very short
  if (base.length <= 8) {
    for (let i = 1; i <= 2; i++) {
      suggestions.push(`${base}${i}`)
    }
  }

  // Remove duplicates and invalid suggestions
  const validSuggestions = [...new Set(suggestions)]
    .filter(s => s.length >= 2 && s.length <= 20 && /^[a-z0-9-]+$/.test(s))
    .slice(0, 6)

  return validSuggestions
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
