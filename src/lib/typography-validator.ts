/**
 * Typography Validator - Semantic HTML Enforcement
 *
 * PURPOSE: Detects hardcoded typography that violates design system
 * Ensures consistent semantic HTML and theme-aware colors
 *
 * VIOLATIONS DETECTED (6 types):
 * 1. hardcoded-typography: text-sm, text-xl, font-bold (should use semantic tags)
 * 2. non-semantic-text: div/span with text content (should be p, h1-h6, small)
 * 3. hardcoded-color: text-gray-500, text-blue-600 (should use theme colors)
 * 4. hardcoded-direction: text-left, text-right (should use text-start for RTL)
 * 5. heading-hierarchy: Skipped heading levels (h1 → h3 invalid, must be h2)
 * 6. multiple-h1: Page has multiple h1 elements (only one per page allowed)
 *
 * SEMANTIC MAPPINGS (typography.ts reference):
 * - text-4xl + font-extrabold → use <h1>
 * - text-3xl + font-bold → use <h2>
 * - text-2xl + font-semibold → use <h3>
 * - text-xl + font-semibold → use <h4>
 * - text-sm + text-muted-foreground → use <p className="muted">
 * - text-xl + text-muted-foreground → use <p className="lead">
 *
 * THEME COLORS (semantic tokens):
 * - text-foreground: Primary text (respects light/dark mode)
 * - text-muted-foreground: Secondary text
 * - text-primary, text-secondary, text-destructive, text-accent
 *
 * ARCHITECTURE:
 * - parseElements(): Extracts tags, classes, content from HTML
 * - hasHardcodedTypography(): Detects Tailwind text/font classes
 * - hasHardcodedColors(): Detects color utilities (not theme colors)
 * - checkHeadingHierarchy(): Validates heading level progression
 * - suggestSemanticElement(): Maps violations to recommended HTML element
 *
 * CONSTRAINTS & GOTCHAS:
 * - Only validates HTML-like strings (JSX strings, not compiled components)
 * - Doesn't detect inline styles or CSS-in-JS violations
 * - Regex-based parsing (won't catch complex nested structures)
 * - Self-closing tags not supported (<img/>, <br/>)
 * - Theme colors are whitelisted (anything else is flagged as hardcoded)
 *
 * PERFORMANCE:
 * - Linear scan through HTML (O(n) string length)
 * - Multiple regex passes (one per violation type)
 * - Consider caching validation results for large files
 *
 * INTEGRATION:
 * - CI/CD: Pre-commit hooks can run this validator
 * - Editor: ESLint plugin could use this validation
 * - Build: Warn or fail on typography violations
 */

export interface TypographyViolation {
  type: 'hardcoded-typography' | 'non-semantic-text' | 'hardcoded-color' | 'hardcoded-direction' | 'heading-hierarchy' | 'multiple-h1'
  element: string
  classes?: string[]
  suggestion: string
  line?: number
  column?: number
}

// Typography mapping based on the project's typography system
// Aligned with reference codebase at /Users/abdout/codebase
const TYPOGRAPHY_MAPPINGS: Record<string, string> = {
  'text-4xl font-extrabold': 'h1',
  'text-5xl font-extrabold': 'h1',
  'text-4xl font-bold': 'h2',
  'text-3xl font-bold': 'h2',
  'text-2xl font-semibold': 'h3',
  'text-xl font-semibold': 'h4',
  'text-sm font-semibold': 'h5',
  'text-lg font-semibold': 'h5', // Legacy mapping
  'text-sm font-normal': 'h6',
  'text-base font-semibold': 'h6', // Legacy mapping
  'text-sm text-muted-foreground': 'p className="muted"',
  'text-xs text-muted-foreground': 'small className="muted"',
  'text-xl text-muted-foreground': 'p className="lead"',
  'text-xs': 'small',
  'text-xl': 'p className="lead"',
  'text-sm': 'p className="muted"'
}

// Hardcoded Tailwind typography classes to detect
const HARDCODED_TEXT_SIZES = [
  'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl',
  'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl',
  'text-7xl', 'text-8xl', 'text-9xl'
]

const HARDCODED_FONT_WEIGHTS = [
  'font-thin', 'font-extralight', 'font-light', 'font-normal',
  'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black'
]

const HARDCODED_COLORS = [
  'text-gray-', 'text-slate-', 'text-zinc-', 'text-neutral-',
  'text-stone-', 'text-red-', 'text-orange-', 'text-amber-',
  'text-yellow-', 'text-lime-', 'text-green-', 'text-emerald-',
  'text-teal-', 'text-cyan-', 'text-sky-', 'text-blue-',
  'text-indigo-', 'text-violet-', 'text-purple-', 'text-fuchsia-',
  'text-pink-', 'text-rose-', 'text-black', 'text-white'
]

const THEME_COLORS = [
  'text-foreground', 'text-muted-foreground', 'text-primary',
  'text-secondary', 'text-destructive', 'text-accent'
]

const SEMANTIC_TEXT_ELEMENTS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'small', 'strong', 'em', 'code', 'pre',
  'blockquote', 'cite', 'q', 'abbr', 'address',
  'time', 'mark', 'del', 'ins', 'sub', 'sup'
]

/**
 * Parse HTML-like string to extract elements and their classes
 */
function parseElements(html: string): Array<{ tag: string; classes: string[]; content: string }> {
  const elements: Array<{ tag: string; classes: string[]; content: string }> = []
  const regex = /<(\w+)(?:\s+[^>]*)?>(.*?)<\/\1>/g
  const classRegex = /className=["']([^"']*)["']/

  let match
  while ((match = regex.exec(html)) !== null) {
    const tag = match[1]
    const fullTag = match[0]
    const content = match[2]
    const classMatch = classRegex.exec(fullTag)
    const classes = classMatch ? classMatch[1].split(' ') : []

    elements.push({ tag, classes, content })
  }

  return elements
}

/**
 * Check if element has hardcoded typography classes
 */
function hasHardcodedTypography(classes: string[]): { found: boolean; hardcodedClasses: string[] } {
  const hardcodedClasses: string[] = []

  classes.forEach(cls => {
    if (HARDCODED_TEXT_SIZES.includes(cls) ||
        HARDCODED_FONT_WEIGHTS.includes(cls)) {
      hardcodedClasses.push(cls)
    }
  })

  return { found: hardcodedClasses.length > 0, hardcodedClasses }
}

/**
 * Check if element has hardcoded color classes
 */
function hasHardcodedColors(classes: string[]): boolean {
  return classes.some(cls =>
    HARDCODED_COLORS.some(color => cls.startsWith(color))
  )
}

/**
 * Suggest semantic HTML element based on classes
 */
function suggestSemanticElement(classes: string[]): string {
  const classString = classes.join(' ')

  // Check for exact matches first
  for (const [pattern, suggestion] of Object.entries(TYPOGRAPHY_MAPPINGS)) {
    if (classString.includes(pattern)) {
      return `Use <${suggestion}> instead`
    }
  }

  // Check for partial matches
  const hasTextSize = classes.some(cls => HARDCODED_TEXT_SIZES.includes(cls))
  const hasFontWeight = classes.some(cls => HARDCODED_FONT_WEIGHTS.includes(cls))

  if (hasTextSize && hasFontWeight) {
    const textSize = classes.find(cls => HARDCODED_TEXT_SIZES.includes(cls))
    const fontWeight = classes.find(cls => HARDCODED_FONT_WEIGHTS.includes(cls))
    const combined = `${textSize} ${fontWeight}`

    for (const [pattern, suggestion] of Object.entries(TYPOGRAPHY_MAPPINGS)) {
      if (pattern === combined) {
        return `Use <${suggestion}> instead`
      }
    }
  }

  // Default suggestions based on individual classes
  if (classes.includes('text-xs')) return 'Use <small> instead'
  if (classes.includes('text-sm')) return 'Use <p className="muted"> instead'
  if (classes.includes('text-xl') && !hasFontWeight) return 'Use <p className="lead"> instead'

  return 'Use semantic HTML element'
}

/**
 * Check for heading hierarchy violations
 */
function checkHeadingHierarchy(html: string): TypographyViolation[] {
  const violations: TypographyViolation[] = []
  const headingRegex = /<h(\d)(?:\s+[^>]*)?>/g
  const headings: number[] = []

  let match
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push(parseInt(match[1]))
  }

  // Check for multiple h1s
  const h1Count = headings.filter(h => h === 1).length
  if (h1Count > 1) {
    violations.push({
      type: 'multiple-h1',
      element: 'h1',
      suggestion: 'Use only one h1 per page'
    })
  }

  // Check for skipped heading levels
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      violations.push({
        type: 'heading-hierarchy',
        element: `h${headings[i]}`,
        suggestion: `Heading levels should not skip (h${headings[i - 1]} → h${headings[i - 1] + 1} → h${headings[i]})`
      })
    }
  }

  return violations
}

/**
 * Main validation function
 */
export function validateTypography(html: string): TypographyViolation[] {
  const violations: TypographyViolation[] = []
  const elements = parseElements(html)

  // Check each element
  elements.forEach(({ tag, classes, content }) => {
    // Check for div/span with text content (non-semantic)
    if ((tag === 'div' || tag === 'span') && content.trim() && !content.includes('<')) {
      violations.push({
        type: 'non-semantic-text',
        element: tag,
        suggestion: 'Use semantic HTML element like <p>, <h1-h6>, or <small>'
      })
    }

    // Check for hardcoded typography
    const { found, hardcodedClasses } = hasHardcodedTypography(classes)
    if (found) {
      violations.push({
        type: 'hardcoded-typography',
        element: tag,
        classes: hardcodedClasses,
        suggestion: suggestSemanticElement(classes)
      })
    }

    // Check for hardcoded colors (except theme colors)
    if (hasHardcodedColors(classes)) {
      const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)
      violations.push({
        type: 'hardcoded-color',
        element: tag,
        classes: classes.filter(cls => HARDCODED_COLORS.some(color => cls.startsWith(color))),
        suggestion: isHeading
          ? 'Use text-foreground for theme-aware colors'
          : 'Use text-muted-foreground or className="muted"'
      })
    }

    // Check for hardcoded text direction
    if (classes.includes('text-left') || classes.includes('text-right')) {
      violations.push({
        type: 'hardcoded-direction',
        element: tag,
        classes: classes.filter(cls => cls === 'text-left' || cls === 'text-right'),
        suggestion: 'Use text-start for RTL support'
      })
    }
  })

  // Check heading hierarchy
  violations.push(...checkHeadingHierarchy(html))

  return violations
}

/**
 * Validate a file's content for typography violations
 */
export function validateFile(content: string): TypographyViolation[] {
  return validateTypography(content)
}

/**
 * Get suggested fix for a violation
 */
export function getSuggestedFix(violation: TypographyViolation, originalHtml: string): string {
  if (!violation.classes) return originalHtml

  const classString = violation.classes.join(' ')
  const mapping = TYPOGRAPHY_MAPPINGS[classString]

  if (mapping) {
    if (mapping.includes('className=')) {
      const [tag, className] = mapping.split(' className=')
      return originalHtml.replace(
        new RegExp(`<${violation.element}[^>]*>(.*?)<\/${violation.element}>`),
        `<${tag} className=${className}>$1</${tag}>`
      )
    } else {
      return originalHtml.replace(
        new RegExp(`<${violation.element}[^>]*>(.*?)<\/${violation.element}>`),
        `<${mapping}>$1</${mapping}>`
      )
    }
  }

  return originalHtml
}