/**
 * Subject Image Mapping
 *
 * Maps subject names to their corresponding illustration images.
 * Images are colorful educational illustrations from ClickView.
 */

// Direct slug to image path mapping
export const SUBJECT_IMAGE_MAP: Record<string, string> = {
  // Sciences
  "biological-sciences": "/subjects/biological-sciences.png",
  "chemical-sciences": "/subjects/chemical-sciences.png",
  "physical-sciences": "/subjects/physical-sciences.png",
  "earth-space-sciences": "/subjects/earth-space-sciences.png",

  // Core subjects
  mathematics: "/subjects/mathematics.png",
  english: "/subjects/english.png",
  languages: "/subjects/languages.png",
  history: "/subjects/history.png",
  geography: "/subjects/geography.png",

  // Social studies
  "civics-citizenship": "/subjects/civics-citizenship.png",
  "economics-business": "/subjects/economics-business.png",
  "religion-philosophy": "/subjects/religion-philosophy.png",

  // Health & PE
  "personal-development-health": "/subjects/personal-development-health.png",
  "physical-education": "/subjects/physical-education.png",

  // Other
  technologies: "/subjects/technologies.png",
  "the-arts": "/subjects/the-arts.png",
}

// Default fallback image
export const DEFAULT_SUBJECT_IMAGE = "/subjects/default.png"

// Keywords for fuzzy matching subject names to images
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  "biological-sciences": [
    "biology",
    "bio",
    "life",
    "biological",
    "living",
    "organism",
  ],
  "chemical-sciences": ["chemistry", "chemical", "chem"],
  "physical-sciences": ["physics", "physical science"],
  "earth-space-sciences": [
    "earth",
    "space",
    "astronomy",
    "geology",
    "planet",
    "solar",
  ],
  mathematics: [
    "math",
    "maths",
    "algebra",
    "geometry",
    "calculus",
    "arithmetic",
    "رياضيات",
  ],
  english: ["english", "language arts", "literature", "writing", "reading"],
  languages: [
    "language",
    "arabic",
    "french",
    "spanish",
    "german",
    "لغة",
    "عربي",
  ],
  history: ["history", "historical", "past", "تاريخ"],
  geography: ["geography", "geo", "map", "جغرافيا"],
  "civics-citizenship": ["civics", "citizenship", "government", "political"],
  "economics-business": [
    "economics",
    "business",
    "economy",
    "finance",
    "اقتصاد",
  ],
  "religion-philosophy": [
    "religion",
    "philosophy",
    "ethics",
    "moral",
    "islamic",
    "دين",
    "فلسفة",
  ],
  "personal-development-health": [
    "health",
    "personal",
    "development",
    "wellbeing",
    "صحة",
  ],
  "physical-education": [
    "pe",
    "sports",
    "fitness",
    "gym",
    "athletics",
    "تربية بدنية",
    "رياضة",
  ],
  technologies: ["technology", "tech", "computer", "digital", "ict", "تقنية"],
  "the-arts": [
    "art",
    "arts",
    "music",
    "drama",
    "visual",
    "performing",
    "فنون",
    "موسيقى",
  ],
}

/**
 * Get the image path for a subject based on its name.
 * Uses fuzzy matching with keywords to find the best match.
 *
 * @param subjectName - The name of the subject (English or Arabic)
 * @returns The path to the subject's image
 */
export function getSubjectImage(subjectName: string): string {
  if (!subjectName) return DEFAULT_SUBJECT_IMAGE

  // Normalize: lowercase and create slug
  const nameLower = subjectName.toLowerCase().trim()
  const slug = nameLower.replace(/\s+/g, "-")

  // Direct match by slug
  if (SUBJECT_IMAGE_MAP[slug]) {
    return SUBJECT_IMAGE_MAP[slug]
  }

  // Fuzzy match by keywords
  for (const [key, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some((kw) => nameLower.includes(kw.toLowerCase()))) {
      return SUBJECT_IMAGE_MAP[key] || DEFAULT_SUBJECT_IMAGE
    }
  }

  // Common variations - try partial matches
  const partialMatches: Record<string, string> = {
    science: "/subjects/physical-sciences.png",
    studies: "/subjects/economics-business.png",
    education: "/subjects/physical-education.png",
  }

  for (const [partial, image] of Object.entries(partialMatches)) {
    if (nameLower.includes(partial)) {
      return image
    }
  }

  return DEFAULT_SUBJECT_IMAGE
}

/**
 * Get a random background color for subjects without images.
 * Used as fallback for the card background.
 */
export function getSubjectColor(subjectName: string): string {
  const colors = [
    "bg-blue-100",
    "bg-green-100",
    "bg-yellow-100",
    "bg-purple-100",
    "bg-pink-100",
    "bg-indigo-100",
    "bg-orange-100",
    "bg-teal-100",
  ]

  // Generate consistent color based on subject name
  let hash = 0
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}
