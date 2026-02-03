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
    description: "Hogwarts school-dashboard logo icon",
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
    description: "PlanetScale database school-dashboard logo",
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
    description: "GitHub school-dashboard logo",
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
    description: "Discord chat school-dashboard logo",
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

  // Anthropic Icons (34 icons)
  {
    id: "anthropicA",
    name: "Anthropic A",
    category: IconCategory.BRANDING,
    tags: ["anthropic", "branding", "logo", "ai"],
    description: "Anthropic A logo icon",
  },
  {
    id: "anthropicArrowRight",
    name: "Arrow Right",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "arrow", "navigation", "direction"],
    description: "Anthropic arrow right icon",
  },
  {
    id: "anthropicChevronDown",
    name: "Chevron Down",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "chevron", "dropdown", "expand"],
    description: "Anthropic chevron down icon",
  },
  {
    id: "anthropicExternalLink",
    name: "External Link",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "external", "link", "open"],
    description: "Anthropic external link icon",
  },
  {
    id: "anthropicLinkedIn",
    name: "LinkedIn",
    category: IconCategory.INTEGRATIONS,
    tags: ["anthropic", "linkedin", "social", "network"],
    description: "Anthropic LinkedIn icon",
  },
  {
    id: "anthropicPlay",
    name: "Play",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "play", "media", "video"],
    description: "Anthropic play button icon",
  },
  {
    id: "anthropicYouTube",
    name: "YouTube",
    category: IconCategory.INTEGRATIONS,
    tags: ["anthropic", "youtube", "video", "social"],
    description: "Anthropic YouTube icon",
  },
  {
    id: "anthropicXTwitter",
    name: "X (Twitter)",
    category: IconCategory.INTEGRATIONS,
    tags: ["anthropic", "twitter", "x", "social"],
    description: "Anthropic X/Twitter icon",
  },
  {
    id: "anthropicQuote",
    name: "Quote",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "quote", "citation", "testimonial"],
    description: "Anthropic quote/quotation marks icon",
  },
  {
    id: "anthropicAnnouncement",
    name: "Announcement",
    category: IconCategory.COMMUNICATION,
    tags: ["anthropic", "announcement", "megaphone", "broadcast"],
    description: "Anthropic announcement/megaphone icon",
  },
  {
    id: "anthropicChecklist",
    name: "Checklist",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "checklist", "tasks", "todo"],
    description: "Anthropic checklist icon",
  },
  {
    id: "anthropicBook",
    name: "Book",
    category: IconCategory.LIBRARY,
    tags: ["anthropic", "book", "reading", "documentation"],
    description: "Anthropic book icon",
  },
  {
    id: "anthropicArchive",
    name: "Archive",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "archive", "storage", "box"],
    description: "Anthropic archive/storage icon",
  },
  {
    id: "anthropicFuelPump",
    name: "Fuel Pump",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "fuel", "energy", "gas"],
    description: "Anthropic fuel pump icon",
  },
  {
    id: "anthropicDevices",
    name: "Devices",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "devices", "responsive", "screens"],
    description: "Anthropic multiple devices icon",
  },
  {
    id: "anthropicRedo",
    name: "Redo",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "redo", "retry", "refresh"],
    description: "Anthropic redo/retry icon",
  },
  {
    id: "anthropicStopwatch",
    name: "Stopwatch",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "stopwatch", "timer", "time"],
    description: "Anthropic stopwatch/timer icon",
  },
  {
    id: "anthropicCalendarChart",
    name: "Calendar Chart",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "calendar", "chart", "schedule"],
    description: "Anthropic calendar with chart icon",
  },
  {
    id: "anthropicSparkle",
    name: "Sparkle",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "sparkle", "ai", "magic"],
    description: "Anthropic sparkle/AI icon",
  },
  {
    id: "anthropicGrantProposal",
    name: "Grant Proposal",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "grant", "proposal", "document"],
    description: "Anthropic grant proposal icon",
  },
  {
    id: "anthropicHandsBuild",
    name: "Hands Build",
    category: IconCategory.ILLUSTRATIONS,
    tags: ["anthropic", "hands", "build", "create"],
    description: "Anthropic hands building illustration",
  },
  {
    id: "anthropicCodeWindow",
    name: "Code Window",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "code", "terminal", "development"],
    description: "Anthropic code window icon",
  },
  {
    id: "anthropicLocationPin",
    name: "Location Pin",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "location", "map", "pin"],
    description: "Anthropic location/map pin icon",
  },
  {
    id: "anthropicNotebook",
    name: "Notebook",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "notebook", "notes", "document"],
    description: "Anthropic notebook icon",
  },
  {
    id: "anthropicShieldCheck",
    name: "Shield Check",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "shield", "security", "verified"],
    description: "Anthropic security shield with checkmark",
  },
  {
    id: "anthropicPencil",
    name: "Pencil",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "pencil", "edit", "write"],
    description: "Anthropic pencil/edit icon",
  },
  {
    id: "anthropicBriefcase",
    name: "Briefcase",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "briefcase", "work", "business"],
    description: "Anthropic briefcase icon",
  },
  {
    id: "anthropicFlow",
    name: "Flow",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "flow", "workflow", "connection"],
    description: "Anthropic flow/workflow icon",
  },
  {
    id: "anthropicTaskList",
    name: "Task List",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "tasks", "list", "checklist"],
    description: "Anthropic task list icon",
  },
  {
    id: "anthropicCopy",
    name: "Copy",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "copy", "duplicate", "clipboard"],
    description: "Anthropic copy/duplicate icon",
  },
  {
    id: "anthropicGlobe",
    name: "Globe",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "globe", "world", "international"],
    description: "Anthropic globe/world icon",
  },
  {
    id: "anthropicChat",
    name: "Chat",
    category: IconCategory.COMMUNICATION,
    tags: ["anthropic", "chat", "conversation", "message"],
    description: "Anthropic chat/conversation icon",
  },
  {
    id: "anthropicLightning",
    name: "Lightning",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "lightning", "fast", "speed"],
    description: "Anthropic lightning bolt icon",
  },
  {
    id: "anthropicTerminal",
    name: "Terminal",
    category: IconCategory.SYSTEM,
    tags: ["anthropic", "terminal", "command", "cli"],
    description: "Anthropic terminal/command prompt icon",
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
