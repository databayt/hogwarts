// Icon data for the icon browser

import { IconCategory } from "@/components/icons/types"

export type IconItem = {
  id: string
  name: string
  category: IconCategory
  tags: string[]
  description?: string
}

/**
 * Icon metadata for the browser
 * Organized by category with searchable tags
 */
export const iconItems: IconItem[] = [
  // System Icons (12)
  {
    id: "logo",
    name: "Logo",
    category: IconCategory.SYSTEM,
    tags: ["system", "branding", "logo"],
    description: "Hogwarts platform logo icon",
  },
  {
    id: "patreon",
    name: "Patreon",
    category: IconCategory.SYSTEM,
    tags: ["system", "support", "patreon"],
    description: "Patreon support icon",
  },
  {
    id: "coffee",
    name: "Coffee",
    category: IconCategory.SYSTEM,
    tags: ["system", "support", "donation"],
    description: "Buy me a coffee support icon",
  },
  {
    id: "onboarding",
    name: "Onboarding",
    category: IconCategory.SYSTEM,
    tags: ["system", "setup", "guide"],
    description: "Onboarding and setup process icon",
  },
  {
    id: "notification",
    name: "Notification",
    category: IconCategory.SYSTEM,
    tags: ["system", "alerts", "bell"],
    description: "Notification bell icon",
  },
  {
    id: "authentication",
    name: "Authentication",
    category: IconCategory.SYSTEM,
    tags: ["system", "security", "shield", "auth"],
    description: "Authentication and security icon",
  },
  {
    id: "subscription",
    name: "Subscription",
    category: IconCategory.SYSTEM,
    tags: ["system", "billing", "dollar", "payment"],
    description: "Subscription and payment icon",
  },
  {
    id: "dashboard",
    name: "Dashboard",
    category: IconCategory.SYSTEM,
    tags: ["system", "overview", "grid"],
    description: "Dashboard overview icon",
  },
  {
    id: "invoice",
    name: "Invoice",
    category: IconCategory.SYSTEM,
    tags: ["system", "billing", "receipt", "document"],
    description: "Invoice and receipt icon",
  },
  {
    id: "salary",
    name: "Salary",
    category: IconCategory.SYSTEM,
    tags: ["system", "payment", "money", "finance"],
    description: "Salary and payment icon",
  },
  {
    id: "timesheet",
    name: "Timesheet",
    category: IconCategory.SYSTEM,
    tags: ["system", "time", "clock", "tracking"],
    description: "Timesheet and time tracking icon",
  },
  {
    id: "trash",
    name: "Trash",
    category: IconCategory.SYSTEM,
    tags: ["system", "delete", "remove"],
    description: "Delete and remove icon",
  },

  // Integration Icons (17)
  {
    id: "nextjs",
    name: "Next.js",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "framework", "react", "nextjs"],
    description: "Next.js framework logo",
  },
  {
    id: "reactIcon",
    name: "React",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "library", "react", "ui"],
    description: "React library logo",
  },
  {
    id: "typescript",
    name: "TypeScript",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "language", "typescript", "ts"],
    description: "TypeScript programming language logo",
  },
  {
    id: "tailwindcss",
    name: "Tailwind CSS",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "css", "styling", "tailwind"],
    description: "Tailwind CSS framework logo",
  },
  {
    id: "shadcnui",
    name: "shadcn/ui",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "components", "ui", "shadcn"],
    description: "shadcn/ui component library logo",
  },
  {
    id: "planetscale",
    name: "PlanetScale",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "database", "mysql", "planetscale"],
    description: "PlanetScale database platform logo",
  },
  {
    id: "prismaIcon",
    name: "Prisma",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "orm", "database", "prisma"],
    description: "Prisma ORM logo",
  },
  {
    id: "zodIcon",
    name: "Zod",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "validation", "schema", "zod"],
    description: "Zod validation library logo",
  },
  {
    id: "reactHookForm",
    name: "React Hook Form",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "forms", "validation", "react"],
    description: "React Hook Form library logo",
  },
  {
    id: "claude",
    name: "Claude",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "ai", "anthropic", "claude"],
    description: "Claude AI assistant logo",
  },
  {
    id: "gitHub",
    name: "GitHub",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "git", "github", "version-control"],
    description: "GitHub platform logo",
  },
  {
    id: "git",
    name: "Git",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "version-control", "git"],
    description: "Git version control logo",
  },
  {
    id: "figma",
    name: "Figma",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "design", "figma", "ui"],
    description: "Figma design tool logo",
  },
  {
    id: "discord",
    name: "Discord",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "chat", "discord", "community"],
    description: "Discord chat platform logo",
  },
  {
    id: "framer",
    name: "Framer",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "design", "framer", "animation"],
    description: "Framer design tool logo",
  },
  {
    id: "pythonIcon",
    name: "Python",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "language", "python", "programming"],
    description: "Python programming language logo",
  },
  {
    id: "rustIcon",
    name: "Rust",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "language", "rust", "programming"],
    description: "Rust programming language logo",
  },

  // Content Icons (5)
  {
    id: "docs",
    name: "Docs",
    category: IconCategory.SYSTEM,
    tags: ["content", "documentation", "book"],
    description: "Documentation icon",
  },
  {
    id: "report",
    name: "Report",
    category: IconCategory.SYSTEM,
    tags: ["content", "analytics", "chart", "report"],
    description: "Report and analytics icon",
  },
  {
    id: "pdf",
    name: "PDF",
    category: IconCategory.SYSTEM,
    tags: ["content", "document", "pdf", "file"],
    description: "PDF document icon",
  },
  {
    id: "logbook",
    name: "Logbook",
    category: IconCategory.SYSTEM,
    tags: ["content", "journal", "log", "book"],
    description: "Logbook and journal icon",
  },
  {
    id: "proposal",
    name: "Proposal",
    category: IconCategory.SYSTEM,
    tags: ["content", "document", "proposal"],
    description: "Proposal document icon",
  },

  // App Icons (6)
  {
    id: "starterKit",
    name: "Starter Kit",
    category: IconCategory.SYSTEM,
    tags: ["app", "starter", "template"],
    description: "Starter kit icon",
  },
  {
    id: "contentlayer",
    name: "Contentlayer",
    category: IconCategory.INTEGRATIONS,
    tags: ["app", "content", "cms"],
    description: "Contentlayer CMS icon",
  },
  {
    id: "math",
    name: "Math",
    category: IconCategory.ACADEMIC,
    tags: ["app", "math", "calculate", "academic"],
    description: "Mathematics icon",
  },
  {
    id: "flow",
    name: "Flow",
    category: IconCategory.SYSTEM,
    tags: ["app", "workflow", "automation"],
    description: "Flow and workflow icon",
  },
  {
    id: "chatbot",
    name: "Chatbot",
    category: IconCategory.COMMUNICATION,
    tags: ["app", "chat", "ai", "bot"],
    description: "Chatbot icon",
  },
  {
    id: "leads",
    name: "Leads",
    category: IconCategory.SYSTEM,
    tags: ["app", "search", "discover", "leads"],
    description: "Leads and discovery icon",
  },

  // Productivity Icons (3)
  {
    id: "rules",
    name: "Rules",
    category: IconCategory.SYSTEM,
    tags: ["productivity", "rules", "policy"],
    description: "Rules and policies icon",
  },
  {
    id: "prompts",
    name: "Prompts",
    category: IconCategory.SYSTEM,
    tags: ["productivity", "terminal", "command"],
    description: "Command prompts icon",
  },
  {
    id: "tweets",
    name: "Tweets",
    category: IconCategory.COMMUNICATION,
    tags: ["productivity", "social", "twitter"],
    description: "Twitter/tweets icon",
  },

  // Development Icons (4)
  {
    id: "mcp",
    name: "MCP",
    category: IconCategory.SYSTEM,
    tags: ["development", "mcp", "protocol"],
    description: "Model Context Protocol icon",
  },
  {
    id: "cursor",
    name: "Cursor",
    category: IconCategory.SYSTEM,
    tags: ["development", "editor", "cursor"],
    description: "Cursor editor icon",
  },
  {
    id: "extensions",
    name: "Extensions",
    category: IconCategory.SYSTEM,
    tags: ["development", "plugins", "extensions"],
    description: "Extensions and plugins icon",
  },
  {
    id: "mcpIcon",
    name: "MCP Alt",
    category: IconCategory.SYSTEM,
    tags: ["development", "mcp", "protocol", "alternative"],
    description: "Alternative MCP icon",
  },

  // Rating Icons (4)
  {
    id: "excellentIcon",
    name: "Excellent",
    category: IconCategory.SYSTEM,
    tags: ["rating", "star", "excellent", "quality"],
    description: "Excellent rating icon",
  },
  {
    id: "goodIcon",
    name: "Good",
    category: IconCategory.SYSTEM,
    tags: ["rating", "good", "quality"],
    description: "Good rating icon",
  },
  {
    id: "averageIcon",
    name: "Average",
    category: IconCategory.SYSTEM,
    tags: ["rating", "average", "quality"],
    description: "Average rating icon",
  },
  {
    id: "poorIcon",
    name: "Poor",
    category: IconCategory.SYSTEM,
    tags: ["rating", "poor", "quality"],
    description: "Poor rating icon",
  },

  // Shape Icons (1)
  {
    id: "triangle",
    name: "Triangle",
    category: IconCategory.SYSTEM,
    tags: ["shape", "geometry", "triangle"],
    description: "Triangle shape icon",
  },

  // Additional Icons (rIcon from programming)
  {
    id: "rIcon",
    name: "R Language",
    category: IconCategory.INTEGRATIONS,
    tags: ["integration", "language", "r", "statistics"],
    description: "R programming language logo",
  },
]

/**
 * Get unique categories from icon items
 */
export function getCategories(): IconCategory[] {
  const categories = new Set<IconCategory>()
  iconItems.forEach((icon) => categories.add(icon.category))
  return Array.from(categories).sort()
}

/**
 * Get unique tags from icon items
 */
export function getTags(): string[] {
  const tags = new Set<string>()
  iconItems.forEach((icon) => icon.tags.forEach((tag) => tags.add(tag)))
  return Array.from(tags).sort()
}
