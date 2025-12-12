/**
 * Text extraction utilities for parsing complex unstructured data
 * Supports Arabic and English text extraction
 */

export interface ExtractedLead {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  notes?: string;
  rawInput: string;
}

/**
 * Extract email addresses from text
 */
export function extractEmails(text: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return text.match(emailRegex) || [];
}

/**
 * Extract phone numbers from text (supports international formats)
 */
export function extractPhones(text: string): string[] {
  const phonePatterns = [
    /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, // International format
    /(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, // General format
    /\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g // Simple format
  ];

  const phones = new Set<string>();
  phonePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => phones.add(match.trim()));
    }
  });

  return Array.from(phones);
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
    /[\u0600-\u06FF]+\s+[\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)*/g
  ];

  const names = new Set<string>();
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Clean up the match
        const cleaned = match
          .replace(/^(Eng\.|Engineer|Mr\.|Ms\.|Dr\.|م\.|مهندس|مهندس|دكتور|أستاذ|الأستاذ|Best regards|Contact|From|مع أطيب التحيات|للتواصل|من)[,:\s]+/gi, '')
          .trim();

        // Check if it's a valid name (at least 2 characters and contains either Arabic or English letters)
        if (cleaned.length > 2 && (
          /[\u0600-\u06FF]/.test(cleaned) || // Contains Arabic
          /[A-Za-z]/.test(cleaned) // Contains English
        )) {
          const words = cleaned.split(/\s+/);
          if (words.length >= 2) {
            names.add(cleaned);
          }
        }
      });
    }
  });

  return Array.from(names);
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
    /(?:KMCC|[A-Z]{2,})\s+(?:Group|شركة|مجموعة)/gi
  ];

  const companies = new Set<string>();
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/^(of|at|for|في|لدى|من)\s+/gi, '').trim();
        if (cleaned.length > 2) {
          companies.add(cleaned);
        }
      });
    }
  });

  return Array.from(companies);
}

/**
 * Extract website URLs from text
 */
export function extractWebsites(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/g;
  return text.match(urlRegex) || [];
}

/**
 * Clean and limit text length for fields
 */
export function cleanAndLimit(text: string, maxLength: number): string {
  return text.trim().substring(0, maxLength);
}

/**
 * Extract structured data from complex text
 */
export function extractLeadFromText(text: string): ExtractedLead {
  const emails = extractEmails(text);
  const phones = extractPhones(text);
  const names = extractNames(text);
  const companies = extractCompanies(text);
  const websites = extractWebsites(text);

  // Filter names to get the most likely candidate (longest name with good context)
  const bestName = names.reduce((best, current) => {
    // Prefer names that appear in signature context or with titles
    const hasSignatureContext = /(?:Best regards|Contact|From|Eng\.|Engineer)/i.test(text.substring(text.indexOf(current) - 50, text.indexOf(current) + 50));
    const isSufficient = current.split(' ').length >= 2 && current.length >= 5;

    if (!best) return isSufficient ? current : undefined;

    if (hasSignatureContext && !best.includes('Eng.') && !best.includes('Best regards')) {
      return current;
    }

    // Prefer longer, more complete names
    if (current.length > best.length && isSufficient) {
      return current;
    }

    return best;
  }, undefined as string | undefined);

  // Create a comprehensive description from the original text
  const description = text
    .replace(/\s+/g, ' ')
    .replace(/[•·]/g, '-')
    .trim();

  return {
    name: bestName ? cleanAndLimit(bestName, 100) : undefined,
    company: companies.length > 0 ? cleanAndLimit(companies[0], 100) : undefined,
    email: emails.length > 0 ? emails[0] : undefined,
    phone: phones.length > 0 ? phones[0] : undefined,
    website: websites.length > 0 ? websites[0] : undefined,
    description: cleanAndLimit(description, 1000),
    notes: `Auto-extracted from: ${cleanAndLimit(text.substring(0, 200), 200)}...`,
    rawInput: text
  };
}

/**
 * Extract multiple leads from text (split by common separators)
 */
export function extractMultipleLeads(text: string): ExtractedLead[] {
  // Split text by common separators that indicate new leads
  const separators = [
    /\n\s*[-=_]{3,}\s*\n/g, // Lines with dashes/equals/underscores
    /\n\s*#{2,}\s*\n/g,     // Multiple hash marks
    /\n\s*\*{3,}\s*\n/g,    // Multiple asterisks
    /(?:\n\s*){3,}/g        // Multiple empty lines
  ];

  let chunks = [text];

  // Apply each separator
  separators.forEach(separator => {
    const newChunks: string[] = [];
    chunks.forEach(chunk => {
      newChunks.push(...chunk.split(separator));
    });
    chunks = newChunks.filter(chunk => chunk.trim().length > 50);
  });

  // If no clear separators, try to split by email addresses or phone numbers
  if (chunks.length === 1 && chunks[0].length > 500) {
    const emailSplit = text.split(/(?=\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/);
    if (emailSplit.length > 1) {
      chunks = emailSplit.filter(chunk => chunk.trim().length > 50);
    }
  }

  return chunks.map(extractLeadFromText).filter(lead =>
    lead.email || lead.phone || lead.name || lead.company
  );
}
