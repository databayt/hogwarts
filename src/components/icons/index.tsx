/**
 * Icon System - Main Export
 *
 * Provides three export patterns:
 * 1. Namespace (Icons.github) - Backward compatible, recommended
 * 2. Individual exports (GithubIcon) - Tree-shaking support
 * 3. Dynamic (Icon component) - Registry-based loading
 */

// Export types
export * from "./types"
export * from "./constants"
export * from "./utils"
export * from "./registry"

// Export components
export * from "./components/icon-wrapper"

// Import all icons from categories
import * as SystemIcons from "./categories/system"
import * as IntegrationIcons from "./categories/integrations"
import * as ContentIcons from "./categories/content"
import * as AppIcons from "./categories/apps"
import * as ProductivityIcons from "./categories/productivity"
import * as DevelopmentIcons from "./categories/development"
import * as ProgrammingIcons from "./categories/programming"
import * as RatingIcons from "./categories/ratings"
import * as ShapeIcons from "./categories/shapes"
import * as AnthropicIcons from "./categories/anthropic"

// Re-export individual icons for tree-shaking
export * from "./categories/system"
export * from "./categories/integrations"
export * from "./categories/content"
export * from "./categories/apps"
export * from "./categories/productivity"
export * from "./categories/development"
export * from "./categories/programming"
export * from "./categories/ratings"
export * from "./categories/shapes"
export * from "./categories/anthropic"

/**
 * Icons Namespace
 *
 * Unified namespace for all icons (shadcn pattern).
 * Usage: <Icons.github className="size-5" />
 *
 * All icons use `currentColor` and inherit parent text color.
 * Override with className: <Icons.github className="text-primary" />
 */
export const Icons = {
  // System icons
  logo: SystemIcons.LogoIcon,
  patreon: SystemIcons.PatreonIcon,
  coffee: SystemIcons.CoffeeIcon,
  onboarding: SystemIcons.OnboardingIcon,
  notification: SystemIcons.NotificationIcon,
  authentication: SystemIcons.AuthenticationIcon,
  subscription: SystemIcons.SubscriptionIcon,
  dashboard: SystemIcons.DashboardIcon,
  invoice: SystemIcons.InvoiceIcon,
  salary: SystemIcons.SalaryIcon,
  timesheet: SystemIcons.TimesheetIcon,
  trash: SystemIcons.TrashIcon,

  // Integration icons (consistent naming: lowercase, no "Icon" suffix in key)
  nextjs: IntegrationIcons.NextjsIcon,
  react: IntegrationIcons.ReactIcon,
  typescript: IntegrationIcons.TypescriptIcon,
  tailwindcss: IntegrationIcons.TailwindcssIcon,
  shadcnui: IntegrationIcons.ShadcnuiIcon,
  planetscale: IntegrationIcons.PlanetscaleIcon,
  prisma: IntegrationIcons.PrismaIcon,
  zod: IntegrationIcons.ZodIcon,
  reactHookForm: IntegrationIcons.ReactHookFormIcon,
  claude: IntegrationIcons.ClaudeIcon,
  github: IntegrationIcons.GitHubIcon,
  git: IntegrationIcons.GitIcon,
  figma: IntegrationIcons.FigmaIcon,
  discord: IntegrationIcons.DiscordIcon,
  framer: IntegrationIcons.FramerIcon,

  // Content icons
  docs: ContentIcons.DocsIcon,
  report: ContentIcons.ReportIcon,
  pdf: ContentIcons.PdfIcon,
  logbook: ContentIcons.LogbookIcon,
  proposal: ContentIcons.ProposalIcon,

  // App icons
  starterKit: AppIcons.StarterKitIcon,
  contentlayer: AppIcons.ContentlayerIcon,
  math: AppIcons.MathIcon,
  flow: AppIcons.FlowIcon,
  chatbot: AppIcons.ChatbotIcon,
  leads: AppIcons.LeadsIcon,

  // Productivity icons
  rules: ProductivityIcons.RulesIcon,
  prompts: ProductivityIcons.PromptsIcon,
  tweets: ProductivityIcons.TweetsIcon,

  // Development icons
  mcp: DevelopmentIcons.McpIcon,
  cursor: DevelopmentIcons.CursorIcon,
  extensions: DevelopmentIcons.ExtensionsIcon,
  mcpAlt: DevelopmentIcons.McpIconAlt,

  // Programming language icons
  python: ProgrammingIcons.PythonIcon,
  rust: ProgrammingIcons.RustIcon,
  r: ProgrammingIcons.RIcon,

  // Rating icons
  excellent: RatingIcons.ExcellentIcon,
  good: RatingIcons.GoodIcon,
  average: RatingIcons.AverageIcon,
  poor: RatingIcons.PoorIcon,

  // Shape icons
  triangle: ShapeIcons.TriangleIcon,

  // Anthropic icons (UI - theme-aware)
  anthropicA: AnthropicIcons.AnthropicAIcon,
  anthropicArrowRight: AnthropicIcons.AnthropicArrowRightIcon,
  anthropicChevronDown: AnthropicIcons.AnthropicChevronDownIcon,
  anthropicExternalLink: AnthropicIcons.AnthropicExternalLinkIcon,
  anthropicLinkedIn: AnthropicIcons.AnthropicLinkedInIcon,
  anthropicPlay: AnthropicIcons.AnthropicPlayIcon,
  anthropicYouTube: AnthropicIcons.AnthropicYouTubeIcon,
  anthropicXTwitter: AnthropicIcons.AnthropicXTwitterIcon,
  anthropicQuote: AnthropicIcons.AnthropicQuoteIcon,

  // Anthropic illustrative icons (brand colors)
  handsBuild: AnthropicIcons.HandsBuildIcon,
} as const

/**
 * Anthropic Illustration Paths
 *
 * For large illustrative icons, use as img src or Next/Image
 * Usage: <Image src={ANTHROPIC_ILLUSTRATIONS.category01} alt="..." />
 */
export { ANTHROPIC_ILLUSTRATIONS } from "./categories/anthropic"

/**
 * Dynamic Icon Component
 *
 * Load icons by name from registry.
 * Usage: <Icon name="github" className="w-6 h-6" />
 */
import type { IconProps, IconComponent } from "./types"
import { iconRegistry } from "./registry"

export function Icon({
  name,
  ...props
}: IconProps & { name: string }) {
  const icon = iconRegistry.find((i) => i.id === name)
  if (!icon) {
    console.warn(`Icon "${name}" not found in registry`)
    return null
  }

  const IconComponent = icon.component
  return <IconComponent {...props} />
}

/**
 * Icon count helper
 */
export function getIconCount(): number {
  return Object.keys(Icons).length
}

/**
 * Get all icon names
 */
export function getAllIconNames(): string[] {
  return Object.keys(Icons)
}

/**
 * Get icon for programming language/file extension
 *
 * Usage:
 * const Icon = getIconForLanguage("ts")
 * <Icon className="size-4" />
 */
export function getIconForLanguage(language: string): IconComponent {
  const lang = language.toLowerCase().replace(/^\./, "")

  switch (lang) {
    case "ts":
    case "tsx":
    case "typescript":
      return Icons.typescript
    case "py":
    case "python":
      return Icons.python
    case "rs":
    case "rust":
      return Icons.rust
    case "r":
      return Icons.r
    case "json":
      return Icons.docs // fallback to docs for now
    default:
      return Icons.docs
  }
}

/**
 * Icon type - union of all icon names
 */
export type IconName = keyof typeof Icons
