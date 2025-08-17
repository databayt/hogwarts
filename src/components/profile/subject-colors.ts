// Shared subject color utility for consistent styling across timetable and profile components

export const SUBJECT_COLORS = [
  'bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/70',
  'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/50 dark:hover:bg-orange-900/70',
  'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:hover:bg-yellow-900/70', 
  'bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-900/70',
  'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70'
]

export const SUBJECT_COLORS_SOLID = [
  'bg-red-100 dark:bg-red-900/50',
  'bg-orange-100 dark:bg-orange-900/50',
  'bg-yellow-100 dark:bg-yellow-900/50', 
  'bg-green-100 dark:bg-green-900/50',
  'bg-blue-100 dark:bg-blue-900/50'
]

export const SUBJECT_COLORS_HOVER = [
  'hover:bg-red-200 dark:hover:bg-red-900/70',
  'hover:bg-orange-200 dark:hover:bg-orange-900/70',
  'hover:bg-yellow-200 dark:hover:bg-yellow-900/70', 
  'hover:bg-green-200 dark:hover:bg-green-900/70',
  'hover:bg-blue-200 dark:hover:bg-blue-900/70'
]

export const SUBJECT_COLORS_TEXT = [
  'text-red-700 dark:text-red-300',
  'text-orange-700 dark:text-orange-300',
  'text-yellow-700 dark:text-yellow-300', 
  'text-green-700 dark:text-green-300',
  'text-blue-700 dark:text-blue-300'
]

export function getSubjectColor(subject: string, variant: 'full' | 'solid' | 'hover' | 'text' = 'full'): string {
  if (!subject || subject.trim() === '') {
    return 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700'
  }
  
  const colorIndex = subject.charCodeAt(0) % SUBJECT_COLORS.length
  
  switch (variant) {
    case 'solid':
      return SUBJECT_COLORS_SOLID[colorIndex]
    case 'hover':
      return SUBJECT_COLORS_HOVER[colorIndex]
    case 'text':
      return SUBJECT_COLORS_TEXT[colorIndex]
    case 'full':
    default:
      return SUBJECT_COLORS[colorIndex]
  }
}

export function getSubjectColorClasses(subject: string, includeHover: boolean = true): string {
  if (!subject || subject.trim() === '') {
    return includeHover 
      ? 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700' 
      : 'bg-neutral-100 dark:bg-neutral-800'
  }
  
  const colorIndex = subject.charCodeAt(0) % SUBJECT_COLORS.length
  return includeHover ? SUBJECT_COLORS[colorIndex] : SUBJECT_COLORS_SOLID[colorIndex]
}

// Common subject categories with predefined colors
export const SUBJECT_CATEGORIES = {
  'Mathematics': 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70',
  'Science': 'bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-900/70',
  'English': 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/50 dark:hover:bg-purple-900/70',
  'History': 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/50 dark:hover:bg-orange-900/70',
  'Geography': 'bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/50 dark:hover:bg-teal-900/70',
  'Literature': 'bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/50 dark:hover:bg-pink-900/70',
  'Physics': 'bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-900/70',
  'Chemistry': 'bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900/50 dark:hover:bg-cyan-900/70',
  'Biology': 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:hover:bg-emerald-900/70',
  'Computer Science': 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/50 dark:hover:bg-slate-900/70',
  'Art': 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/50 dark:hover:bg-rose-900/70',
  'Music': 'bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/50 dark:hover:bg-violet-900/70',
  'Physical Education': 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900/70',
  'Social Studies': 'bg-lime-100 hover:bg-lime-200 dark:bg-lime-900/50 dark:hover:bg-lime-900/70',
  'Foreign Language': 'bg-fuchsia-100 hover:bg-fuchsia-200 dark:bg-fuchsia-900/50 dark:hover:bg-fuchsia-900/70'
}

export function getSubjectCategoryColor(subject: string, includeHover: boolean = true): string {
  const normalizedSubject = subject.trim()
  
  // Check if we have a predefined color for this subject
  if (SUBJECT_CATEGORIES[normalizedSubject as keyof typeof SUBJECT_CATEGORIES]) {
    const baseColor = SUBJECT_CATEGORIES[normalizedSubject as keyof typeof SUBJECT_CATEGORIES]
    if (!includeHover) {
      // Remove hover classes if not needed
      return baseColor.replace(/hover:bg-\w+-\d+ dark:hover:bg-\w+-\d+\/\d+/g, '')
    }
    return baseColor
  }
  
  // Fallback to the character-based color system
  return getSubjectColorClasses(subject, includeHover)
}
