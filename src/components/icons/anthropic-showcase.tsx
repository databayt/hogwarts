"use client"

import * as React from "react"
import Image from "next/image"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AnthropicIcon {
  name: string
  file: string
  tags: string[]
  category: string
}

const ANTHROPIC_ASSETS: AnthropicIcon[] = [
  // Logos
  { name: "Anthropic A (Large)", file: "anthropic-a-large.svg", tags: ["logo", "brand", "primary"], category: "Logos" },
  { name: "Anthropic A (Small)", file: "anthropic-a-small.svg", tags: ["logo", "brand", "compact"], category: "Logos" },
  { name: "Anthropic Logomark", file: "anthropic-logomark.svg", tags: ["logo", "brand", "mark"], category: "Logos" },
  { name: "Anthropic Wordmark", file: "anthropic-wordmark.svg", tags: ["logo", "brand", "text"], category: "Logos" },
  { name: "By Anthropic", file: "by-anthropic.svg", tags: ["logo", "attribution", "badge"], category: "Logos" },

  // Claude
  { name: "Claude Sparkle", file: "claude-sparkle.svg", tags: ["claude", "ai", "sparkle", "brand"], category: "Claude" },
  { name: "Claude Wordmark", file: "claude-wordmark.svg", tags: ["claude", "brand", "text"], category: "Claude" },
  { name: "Claude for Personal", file: "claude-for-personal.svg", tags: ["claude", "product", "personal"], category: "Claude" },
  { name: "Claude for Work", file: "claude-for-work.svg", tags: ["claude", "product", "enterprise"], category: "Claude" },

  // MCP
  { name: "MCP Logo (Dark)", file: "mcp-logo-dark.svg", tags: ["mcp", "protocol", "dark"], category: "MCP" },
  { name: "MCP Logo (Light)", file: "mcp-logo-light.svg", tags: ["mcp", "protocol", "light"], category: "MCP" },

  // Arrows & Navigation
  { name: "Arrow Right", file: "arrow-right.svg", tags: ["arrow", "navigation", "direction"], category: "Navigation" },
  { name: "Arrow Right Line", file: "arrow-right-line.svg", tags: ["arrow", "navigation", "line"], category: "Navigation" },
  { name: "Arrow Down", file: "arrow-down.svg", tags: ["arrow", "navigation", "down"], category: "Navigation" },
  { name: "Arrow Up", file: "arrow-up.svg", tags: ["arrow", "navigation", "up"], category: "Navigation" },
  { name: "Arrow Up Right", file: "arrow-up-right-small.svg", tags: ["arrow", "external", "link"], category: "Navigation" },
  { name: "Arrow Diagonal", file: "arrow-diagonal.svg", tags: ["arrow", "diagonal", "expand"], category: "Navigation" },
  { name: "Chevron Down", file: "chevron-down.svg", tags: ["chevron", "dropdown", "expand"], category: "Navigation" },
  { name: "Chevron Right", file: "chevron-right.svg", tags: ["chevron", "next", "forward"], category: "Navigation" },
  { name: "Caret Down", file: "caret-down.svg", tags: ["caret", "dropdown", "select"], category: "Navigation" },
  { name: "Caret Small", file: "caret-small.svg", tags: ["caret", "compact", "inline"], category: "Navigation" },
  { name: "External Link", file: "external-link.svg", tags: ["link", "external", "new-tab"], category: "Navigation" },

  // UI Elements
  { name: "Search", file: "search.svg", tags: ["search", "find", "ui"], category: "UI" },
  { name: "Search Large", file: "search-large.svg", tags: ["search", "find", "prominent"], category: "UI" },
  { name: "Menu", file: "menu.svg", tags: ["menu", "hamburger", "nav"], category: "UI" },
  { name: "Hamburger Menu", file: "hamburger-menu.svg", tags: ["menu", "mobile", "nav"], category: "UI" },
  { name: "Close", file: "close.svg", tags: ["close", "dismiss", "x"], category: "UI" },
  { name: "Copy", file: "copy.svg", tags: ["copy", "clipboard", "duplicate"], category: "UI" },
  { name: "Download", file: "download.svg", tags: ["download", "save", "export"], category: "UI" },
  { name: "Filter", file: "filter.svg", tags: ["filter", "sort", "refine"], category: "UI" },
  { name: "Settings", file: "settings.svg", tags: ["settings", "config", "gear"], category: "UI" },
  { name: "Check Circle", file: "check-circle.svg", tags: ["check", "success", "done"], category: "UI" },
  { name: "Help Circle", file: "help-circle.svg", tags: ["help", "info", "question"], category: "UI" },
  { name: "More Horizontal", file: "more-horizontal.svg", tags: ["more", "options", "menu"], category: "UI" },
  { name: "More Vertical", file: "more-vertical.svg", tags: ["more", "options", "kebab"], category: "UI" },
  { name: "Grid", file: "grid.svg", tags: ["grid", "layout", "view"], category: "UI" },
  { name: "List", file: "list.svg", tags: ["list", "layout", "view"], category: "UI" },
  { name: "Sidebar", file: "sidebar.svg", tags: ["sidebar", "panel", "layout"], category: "UI" },
  { name: "Globe", file: "globe.svg", tags: ["globe", "world", "international"], category: "UI" },
  { name: "Monitor", file: "monitor.svg", tags: ["monitor", "screen", "display"], category: "UI" },
  { name: "User", file: "user.svg", tags: ["user", "profile", "account"], category: "UI" },
  { name: "Users", file: "users.svg", tags: ["users", "team", "group"], category: "UI" },
  { name: "Pencil", file: "pencil.svg", tags: ["edit", "pencil", "write"], category: "UI" },
  { name: "Star Outline", file: "star-outline.svg", tags: ["star", "favorite", "rating"], category: "UI" },
  { name: "Play", file: "play.svg", tags: ["play", "video", "start"], category: "UI" },
  { name: "Play Filled", file: "play-filled.svg", tags: ["play", "video", "solid"], category: "UI" },
  { name: "Play Outline", file: "play-outline.svg", tags: ["play", "video", "outline"], category: "UI" },

  // Development
  { name: "Terminal", file: "terminal.svg", tags: ["terminal", "cli", "command"], category: "Development" },
  { name: "Terminal Prompt", file: "terminal-prompt.svg", tags: ["terminal", "prompt", "cli"], category: "Development" },
  { name: "Code Brackets", file: "code-brackets.svg", tags: ["code", "brackets", "syntax"], category: "Development" },
  { name: "Curly Braces", file: "curly-braces.svg", tags: ["code", "json", "object"], category: "Development" },
  { name: "Document", file: "document.svg", tags: ["document", "file", "page"], category: "Development" },
  { name: "Route", file: "route.svg", tags: ["route", "path", "api"], category: "Development" },
  { name: "API Vine", file: "api-vine.svg", tags: ["api", "integration", "connect"], category: "Development" },
  { name: "Bar Chart", file: "bar-chart.svg", tags: ["chart", "analytics", "data"], category: "Development" },
  { name: "Lightning", file: "lightning.svg", tags: ["fast", "performance", "speed"], category: "Development" },
  { name: "Lightning Outline", file: "lightning-outline.svg", tags: ["fast", "performance", "outline"], category: "Development" },

  // Social
  { name: "X Twitter", file: "x-twitter.svg", tags: ["twitter", "x", "social"], category: "Social" },
  { name: "LinkedIn", file: "linkedin.svg", tags: ["linkedin", "professional", "social"], category: "Social" },
  { name: "YouTube", file: "youtube.svg", tags: ["youtube", "video", "social"], category: "Social" },
  { name: "Instagram", file: "instagram.svg", tags: ["instagram", "photo", "social"], category: "Social" },

  // Content & Topics
  { name: "Book Open", file: "book-open.svg", tags: ["book", "docs", "learn"], category: "Content" },
  { name: "Cookbook", file: "cookbook.svg", tags: ["cookbook", "recipes", "guide"], category: "Content" },
  { name: "Graduation Cap", file: "graduation-cap.svg", tags: ["education", "learn", "course"], category: "Content" },
  { name: "News", file: "news.svg", tags: ["news", "updates", "blog"], category: "Content" },
  { name: "News Icon", file: "news-icon.svg", tags: ["news", "article", "compact"], category: "Content" },
  { name: "Research Icon", file: "research-icon.svg", tags: ["research", "science", "study"], category: "Content" },
  { name: "Chat Bubble", file: "chat-bubble.svg", tags: ["chat", "message", "conversation"], category: "Content" },
  { name: "Dual Chat", file: "dual-chat.svg", tags: ["chat", "conversation", "dialogue"], category: "Content" },

  // Product Features
  { name: "Agent Skills", file: "agent-skills.svg", tags: ["agent", "skills", "capability"], category: "Features" },
  { name: "Advanced Tool Use", file: "advanced-tool-use.svg", tags: ["tools", "advanced", "feature"], category: "Features" },
  { name: "Build with Claude", file: "build-with-claude.svg", tags: ["build", "develop", "create"], category: "Features" },
  { name: "Building Effective Agents", file: "building-effective-agents.svg", tags: ["agents", "guide", "best-practices"], category: "Features" },
  { name: "Claude Agent SDK", file: "claude-agent-sdk.svg", tags: ["sdk", "agent", "developer"], category: "Features" },
  { name: "Claude Code Best Practices", file: "claude-code-best-practices.svg", tags: ["code", "best-practices", "guide"], category: "Features" },
  { name: "Claude Code Sandboxing", file: "claude-code-sandboxing.svg", tags: ["sandbox", "security", "isolation"], category: "Features" },
  { name: "Code Execution MCP", file: "code-execution-mcp.svg", tags: ["mcp", "execution", "code"], category: "Features" },
  { name: "Context Engineering", file: "context-engineering.svg", tags: ["context", "engineering", "prompts"], category: "Features" },
  { name: "Contextual Retrieval", file: "contextual-retrieval.svg", tags: ["rag", "retrieval", "context"], category: "Features" },
  { name: "Desktop Extensions", file: "desktop-extensions.svg", tags: ["desktop", "extensions", "apps"], category: "Features" },
  { name: "Long Running Agents", file: "long-running-agents.svg", tags: ["agents", "async", "background"], category: "Features" },
  { name: "SWE Bench", file: "swe-bench.svg", tags: ["benchmark", "evaluation", "coding"], category: "Features" },
  { name: "Think Tool", file: "think-tool.svg", tags: ["thinking", "reasoning", "tool"], category: "Features" },
  { name: "Transparency", file: "transparency.svg", tags: ["transparency", "trust", "safety"], category: "Features" },
  { name: "Economic Futures", file: "economic-futures.svg", tags: ["economics", "future", "research"], category: "Features" },

  // Engineering Series
  { name: "Eng Agent SDK", file: "eng-agent-sdk.svg", tags: ["engineering", "sdk", "agent"], category: "Engineering" },
  { name: "Eng Agent Skills", file: "eng-agent-skills.svg", tags: ["engineering", "skills", "agent"], category: "Engineering" },
  { name: "Eng Code Sandboxing", file: "eng-claude-code-sandboxing.svg", tags: ["engineering", "sandbox", "security"], category: "Engineering" },
  { name: "Eng Code Execution MCP", file: "eng-code-execution-mcp.svg", tags: ["engineering", "mcp", "execution"], category: "Engineering" },
  { name: "Eng Context Engineering", file: "eng-context-engineering.svg", tags: ["engineering", "context", "prompts"], category: "Engineering" },
  { name: "Eng Desktop Extensions", file: "eng-desktop-extensions.svg", tags: ["engineering", "desktop", "extensions"], category: "Engineering" },
  { name: "Eng Long Running Agents", file: "eng-harnesses-long-running-agents.svg", tags: ["engineering", "agents", "async"], category: "Engineering" },

  // Pictograms
  { name: "Pictogram Heart", file: "pictogram-heart.svg", tags: ["heart", "love", "care"], category: "Pictograms" },
  { name: "Pictogram Shield", file: "pictogram-shield.svg", tags: ["shield", "security", "protection"], category: "Pictograms" },

  // Illustrations
  { name: "Hands Build", file: "Hands-Build.svg", tags: ["hands", "build", "illustration"], category: "Illustrations" },
  { name: "Hands Stack", file: "Hands-Stack.svg", tags: ["hands", "stack", "illustration"], category: "Illustrations" },
  { name: "Objects Puzzle", file: "Objects-Puzzle.svg", tags: ["puzzle", "objects", "illustration"], category: "Illustrations" },
  { name: "Claude Abstract", file: "6903d22d0099a66d72e05699_33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg", tags: ["claude", "abstract", "illustration", "pattern"], category: "Illustrations" },

  // Categories
  { name: "Category 01", file: "category-01.svg", tags: ["category", "illustration", "1"], category: "Categories" },
  { name: "Category 02", file: "category-02.svg", tags: ["category", "illustration", "2"], category: "Categories" },
  { name: "Category 03", file: "category-03.svg", tags: ["category", "illustration", "3"], category: "Categories" },
  { name: "Category 04", file: "category-04.svg", tags: ["category", "illustration", "4"], category: "Categories" },
  { name: "Category 05", file: "category-05.svg", tags: ["category", "illustration", "5"], category: "Categories" },
  { name: "Category 06", file: "category-06.svg", tags: ["category", "illustration", "6"], category: "Categories" },
  { name: "Category 07", file: "category-07.svg", tags: ["category", "illustration", "7"], category: "Categories" },
  { name: "Category 08", file: "category-08.svg", tags: ["category", "illustration", "8"], category: "Categories" },
  { name: "Category 09", file: "category-09.svg", tags: ["category", "illustration", "9"], category: "Categories" },
  { name: "Category 10", file: "category-10.svg", tags: ["category", "illustration", "10"], category: "Categories" },
  { name: "Category 11", file: "category-11.svg", tags: ["category", "illustration", "11"], category: "Categories" },
  { name: "Category 12", file: "category-12.svg", tags: ["category", "illustration", "12"], category: "Categories" },
  { name: "Category 13", file: "category-13.svg", tags: ["category", "illustration", "13"], category: "Categories" },
  { name: "Category 14", file: "category-14.svg", tags: ["category", "illustration", "14"], category: "Categories" },
]

const CATEGORIES = [
  "Logos",
  "Claude",
  "MCP",
  "Navigation",
  "UI",
  "Development",
  "Social",
  "Content",
  "Features",
  "Engineering",
  "Pictograms",
  "Illustrations",
  "Categories",
]

interface IconCardProps {
  icon: AnthropicIcon
}

function IconCard({ icon }: IconCardProps) {
  const isIllustration = icon.category === "Illustrations" || icon.category === "Categories"

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group",
            isIllustration && "col-span-2 row-span-2"
          )}
        >
          <div className={cn(
            "relative flex items-center justify-center",
            isIllustration ? "size-24" : "size-10"
          )}>
            <Image
              src={`/anthropic/${icon.file}`}
              alt={icon.name}
              width={isIllustration ? 96 : 40}
              height={isIllustration ? 96 : 40}
              className="object-contain dark:invert"
            />
          </div>
          <span className="text-xs text-muted-foreground text-center truncate w-full group-hover:text-foreground transition-colors">
            {icon.name.length > 15 ? icon.name.slice(0, 15) + "..." : icon.name}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" side="top">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-12 flex items-center justify-center rounded-md bg-muted">
              <Image
                src={`/anthropic/${icon.file}`}
                alt={icon.name}
                width={32}
                height={32}
                className="object-contain dark:invert"
              />
            </div>
            <div>
              <h4 className="font-medium text-sm">{icon.name}</h4>
              <p className="text-xs text-muted-foreground">{icon.category}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Tags</p>
            <div className="flex flex-wrap gap-1">
              {icon.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Path</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
              /anthropic/{icon.file}
            </code>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface AnthropicShowcaseProps {
  filter?: string
  showCategories?: boolean
}

export function AnthropicShowcase({ filter, showCategories = true }: AnthropicShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredIcons = React.useMemo(() => {
    let icons = ANTHROPIC_ASSETS

    if (filter) {
      icons = icons.filter(icon => icon.category === filter)
    }

    if (selectedCategory) {
      icons = icons.filter(icon => icon.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      icons = icons.filter(icon =>
        icon.name.toLowerCase().includes(query) ||
        icon.tags.some(tag => tag.toLowerCase().includes(query)) ||
        icon.file.toLowerCase().includes(query)
      )
    }

    return icons
  }, [filter, selectedCategory, searchQuery])

  const groupedIcons = React.useMemo(() => {
    const groups: Record<string, AnthropicIcon[]> = {}
    filteredIcons.forEach(icon => {
      if (!groups[icon.category]) {
        groups[icon.category] = []
      }
      groups[icon.category].push(icon)
    })
    return groups
  }, [filteredIcons])

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search icons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-md border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {showCategories && !filter && (
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredIcons.length} icons found
      </p>

      {/* Icons Grid */}
      {Object.entries(groupedIcons).map(([category, icons]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">{category}</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {icons.map((icon) => (
              <IconCard key={icon.file} icon={icon} />
            ))}
          </div>
        </div>
      ))}

      {filteredIcons.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No icons found matching your search.
        </div>
      )}
    </div>
  )
}

export { ANTHROPIC_ASSETS, CATEGORIES }
