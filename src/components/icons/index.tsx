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

/**
 * Icons Namespace
 *
 * Backward-compatible namespace for all icons.
 * Usage: <Icons.github className="w-6 h-6" />
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

  // Integration icons
  nextjs: IntegrationIcons.NextjsIcon,
  reactIcon: IntegrationIcons.ReactIcon,
  typescript: IntegrationIcons.TypescriptIcon,
  tailwindcss: IntegrationIcons.TailwindcssIcon,
  shadcnui: IntegrationIcons.ShadcnuiIcon,
  planetscale: IntegrationIcons.PlanetscaleIcon,
  prismaIcon: IntegrationIcons.PrismaIcon,
  zodIcon: IntegrationIcons.ZodIcon,
  reactHookForm: IntegrationIcons.ReactHookFormIcon,
  claude: IntegrationIcons.ClaudeIcon,
  gitHub: IntegrationIcons.GitHubIcon,
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
  mcpIcon: DevelopmentIcons.McpIconAlt,

  // Programming language icons
  pythonIcon: ProgrammingIcons.PythonIcon,
  rustIcon: ProgrammingIcons.RustIcon,
  rIcon: ProgrammingIcons.RIcon,

  // Rating icons
  excellentIcon: RatingIcons.ExcellentIcon,
  goodIcon: RatingIcons.GoodIcon,
  averageIcon: RatingIcons.AverageIcon,
  poorIcon: RatingIcons.PoorIcon,

  // Shape icons
  triangle: ShapeIcons.TriangleIcon,
} as const

/**
 * Dynamic Icon Component
 *
 * Load icons by name from registry.
 * Usage: <Icon name="github" className="w-6 h-6" />
 */
import type { IconProps } from "./types"
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
