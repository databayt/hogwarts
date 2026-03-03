// Shared subject color utility for consistent styling across timetable and profile components
// Uses semantic chart tokens for theme-aware coloring

export const SUBJECT_COLORS = [
  "bg-chart-1 hover:bg-chart-1/80",
  "bg-chart-2 hover:bg-chart-2/80",
  "bg-chart-3 hover:bg-chart-3/80",
  "bg-chart-4 hover:bg-chart-4/80",
  "bg-chart-5 hover:bg-chart-5/80",
]

export const SUBJECT_COLORS_SOLID = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
]

export const SUBJECT_COLORS_HOVER = [
  "hover:bg-chart-1/80",
  "hover:bg-chart-2/80",
  "hover:bg-chart-3/80",
  "hover:bg-chart-4/80",
  "hover:bg-chart-5/80",
]

export const SUBJECT_COLORS_TEXT = [
  "text-chart-1",
  "text-chart-2",
  "text-chart-3",
  "text-chart-4",
  "text-chart-5",
]

export function getSubjectColor(
  subject: string,
  variant: "full" | "solid" | "hover" | "text" = "full"
): string {
  if (!subject || subject.trim() === "") {
    return "bg-muted hover:bg-muted/80"
  }

  const colorIndex = subject.charCodeAt(0) % SUBJECT_COLORS.length

  switch (variant) {
    case "solid":
      return SUBJECT_COLORS_SOLID[colorIndex]
    case "hover":
      return SUBJECT_COLORS_HOVER[colorIndex]
    case "text":
      return SUBJECT_COLORS_TEXT[colorIndex]
    case "full":
    default:
      return SUBJECT_COLORS[colorIndex]
  }
}

export function getSubjectColorClasses(
  subject: string,
  includeHover: boolean = true
): string {
  if (!subject || subject.trim() === "") {
    return includeHover ? "bg-muted hover:bg-muted/80" : "bg-muted"
  }

  const colorIndex = subject.charCodeAt(0) % SUBJECT_COLORS.length
  return includeHover
    ? SUBJECT_COLORS[colorIndex]
    : SUBJECT_COLORS_SOLID[colorIndex]
}

// Common subject categories with chart tokens (rotates through 5 colors for visual distinction)
export const SUBJECT_CATEGORIES = {
  Mathematics: "bg-chart-1 hover:bg-chart-1/80",
  Science: "bg-chart-2 hover:bg-chart-2/80",
  English: "bg-chart-3 hover:bg-chart-3/80",
  History: "bg-chart-4 hover:bg-chart-4/80",
  Geography: "bg-chart-5 hover:bg-chart-5/80",
  Literature: "bg-chart-1 hover:bg-chart-1/80",
  Physics: "bg-chart-2 hover:bg-chart-2/80",
  Chemistry: "bg-chart-3 hover:bg-chart-3/80",
  Biology: "bg-chart-4 hover:bg-chart-4/80",
  "Computer Science": "bg-chart-5 hover:bg-chart-5/80",
  Art: "bg-chart-1 hover:bg-chart-1/80",
  Music: "bg-chart-2 hover:bg-chart-2/80",
  "Physical Education": "bg-chart-3 hover:bg-chart-3/80",
  "Social Studies": "bg-chart-4 hover:bg-chart-4/80",
  "Foreign Language": "bg-chart-5 hover:bg-chart-5/80",
}

export function getSubjectCategoryColor(
  subject: string,
  includeHover: boolean = true
): string {
  const normalizedSubject = subject.trim()

  // Check if we have a predefined color for this subject
  if (
    SUBJECT_CATEGORIES[normalizedSubject as keyof typeof SUBJECT_CATEGORIES]
  ) {
    const baseColor =
      SUBJECT_CATEGORIES[normalizedSubject as keyof typeof SUBJECT_CATEGORIES]
    if (!includeHover) {
      // Remove hover classes if not needed
      return baseColor.replace(/hover:bg-chart-\d+\/\d+/g, "")
    }
    return baseColor
  }

  // Fallback to the character-based color system
  return getSubjectColorClasses(subject, includeHover)
}
