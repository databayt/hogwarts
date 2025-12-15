"use client"

import * as React from "react"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface AnthropicIcon {
  name: string
  file: string
  tags: string[]
  category: string
}

const ANTHROPIC_ASSETS: AnthropicIcon[] = [
  // Logos
  {
    name: "Anthropic A (Large)",
    file: "anthropic-a-large.svg",
    tags: ["logo", "brand", "primary"],
    category: "Logos",
  },
  {
    name: "Anthropic A (Small)",
    file: "anthropic-a-small.svg",
    tags: ["logo", "brand", "compact"],
    category: "Logos",
  },
  {
    name: "Anthropic Logomark",
    file: "anthropic-logomark.svg",
    tags: ["logo", "brand", "mark"],
    category: "Logos",
  },
  {
    name: "Anthropic Wordmark",
    file: "anthropic-wordmark.svg",
    tags: ["logo", "brand", "text"],
    category: "Logos",
  },
  {
    name: "By Anthropic",
    file: "by-anthropic.svg",
    tags: ["logo", "attribution", "badge"],
    category: "Logos",
  },

  // Claude
  {
    name: "Claude Sparkle",
    file: "claude-sparkle.svg",
    tags: ["claude", "ai", "sparkle", "brand"],
    category: "Claude",
  },
  {
    name: "Claude Wordmark",
    file: "claude-wordmark.svg",
    tags: ["claude", "brand", "text"],
    category: "Claude",
  },
  {
    name: "Claude for Personal",
    file: "claude-for-personal.svg",
    tags: ["claude", "product", "personal"],
    category: "Claude",
  },
  {
    name: "Claude for Work",
    file: "claude-for-work.svg",
    tags: ["claude", "product", "enterprise"],
    category: "Claude",
  },

  // MCP
  {
    name: "MCP Logo (Dark)",
    file: "mcp-logo-dark.svg",
    tags: ["mcp", "protocol", "dark"],
    category: "MCP",
  },
  {
    name: "MCP Logo (Light)",
    file: "mcp-logo-light.svg",
    tags: ["mcp", "protocol", "light"],
    category: "MCP",
  },

  // Arrows & Navigation
  {
    name: "Arrow Right",
    file: "arrow-right.svg",
    tags: ["arrow", "navigation", "direction"],
    category: "Navigation",
  },
  {
    name: "Arrow Right Line",
    file: "arrow-right-line.svg",
    tags: ["arrow", "navigation", "line"],
    category: "Navigation",
  },
  {
    name: "Arrow Down",
    file: "arrow-down.svg",
    tags: ["arrow", "navigation", "down"],
    category: "Navigation",
  },
  {
    name: "Arrow Up",
    file: "arrow-up.svg",
    tags: ["arrow", "navigation", "up"],
    category: "Navigation",
  },
  {
    name: "Arrow Up Right",
    file: "arrow-up-right-small.svg",
    tags: ["arrow", "external", "link"],
    category: "Navigation",
  },
  {
    name: "Arrow Diagonal",
    file: "arrow-diagonal.svg",
    tags: ["arrow", "diagonal", "expand"],
    category: "Navigation",
  },
  {
    name: "Chevron Down",
    file: "chevron-down.svg",
    tags: ["chevron", "dropdown", "expand"],
    category: "Navigation",
  },
  {
    name: "Chevron Right",
    file: "chevron-right.svg",
    tags: ["chevron", "next", "forward"],
    category: "Navigation",
  },
  {
    name: "Caret Down",
    file: "caret-down.svg",
    tags: ["caret", "dropdown", "select"],
    category: "Navigation",
  },
  {
    name: "Caret Small",
    file: "caret-small.svg",
    tags: ["caret", "compact", "inline"],
    category: "Navigation",
  },
  {
    name: "External Link",
    file: "external-link.svg",
    tags: ["link", "external", "new-tab"],
    category: "Navigation",
  },

  // UI Elements
  {
    name: "Search",
    file: "search.svg",
    tags: ["search", "find", "ui"],
    category: "UI",
  },
  {
    name: "Search Large",
    file: "search-large.svg",
    tags: ["search", "find", "prominent"],
    category: "UI",
  },
  {
    name: "Menu",
    file: "menu.svg",
    tags: ["menu", "hamburger", "nav"],
    category: "UI",
  },
  {
    name: "Hamburger Menu",
    file: "hamburger-menu.svg",
    tags: ["menu", "mobile", "nav"],
    category: "UI",
  },
  {
    name: "Close",
    file: "close.svg",
    tags: ["close", "dismiss", "x"],
    category: "UI",
  },
  {
    name: "Copy",
    file: "copy.svg",
    tags: ["copy", "clipboard", "duplicate"],
    category: "UI",
  },
  {
    name: "Download",
    file: "download.svg",
    tags: ["download", "save", "export"],
    category: "UI",
  },
  {
    name: "Filter",
    file: "filter.svg",
    tags: ["filter", "sort", "refine"],
    category: "UI",
  },
  {
    name: "Settings",
    file: "settings.svg",
    tags: ["settings", "config", "gear"],
    category: "UI",
  },
  {
    name: "Check Circle",
    file: "check-circle.svg",
    tags: ["check", "success", "done"],
    category: "UI",
  },
  {
    name: "Help Circle",
    file: "help-circle.svg",
    tags: ["help", "info", "question"],
    category: "UI",
  },
  {
    name: "More Horizontal",
    file: "more-horizontal.svg",
    tags: ["more", "options", "menu"],
    category: "UI",
  },
  {
    name: "More Vertical",
    file: "more-vertical.svg",
    tags: ["more", "options", "kebab"],
    category: "UI",
  },
  {
    name: "Grid",
    file: "grid.svg",
    tags: ["grid", "layout", "view"],
    category: "UI",
  },
  {
    name: "List",
    file: "list.svg",
    tags: ["list", "layout", "view"],
    category: "UI",
  },
  {
    name: "Sidebar",
    file: "sidebar.svg",
    tags: ["sidebar", "panel", "layout"],
    category: "UI",
  },
  {
    name: "Globe",
    file: "globe.svg",
    tags: ["globe", "world", "international"],
    category: "UI",
  },
  {
    name: "Monitor",
    file: "monitor.svg",
    tags: ["monitor", "screen", "display"],
    category: "UI",
  },
  {
    name: "User",
    file: "user.svg",
    tags: ["user", "profile", "account"],
    category: "UI",
  },
  {
    name: "Users",
    file: "users.svg",
    tags: ["users", "team", "group"],
    category: "UI",
  },
  {
    name: "Pencil",
    file: "pencil.svg",
    tags: ["edit", "pencil", "write"],
    category: "UI",
  },
  {
    name: "Star Outline",
    file: "star-outline.svg",
    tags: ["star", "favorite", "rating"],
    category: "UI",
  },
  {
    name: "Play",
    file: "play.svg",
    tags: ["play", "video", "start"],
    category: "UI",
  },
  {
    name: "Play Filled",
    file: "play-filled.svg",
    tags: ["play", "video", "solid"],
    category: "UI",
  },
  {
    name: "Play Outline",
    file: "play-outline.svg",
    tags: ["play", "video", "outline"],
    category: "UI",
  },

  // Development
  {
    name: "Terminal",
    file: "terminal.svg",
    tags: ["terminal", "cli", "command"],
    category: "Development",
  },
  {
    name: "Terminal Prompt",
    file: "terminal-prompt.svg",
    tags: ["terminal", "prompt", "cli"],
    category: "Development",
  },
  {
    name: "Code Brackets",
    file: "code-brackets.svg",
    tags: ["code", "brackets", "syntax"],
    category: "Development",
  },
  {
    name: "Curly Braces",
    file: "curly-braces.svg",
    tags: ["code", "json", "object"],
    category: "Development",
  },
  {
    name: "Document",
    file: "document.svg",
    tags: ["document", "file", "page"],
    category: "Development",
  },
  {
    name: "Route",
    file: "route.svg",
    tags: ["route", "path", "api"],
    category: "Development",
  },
  {
    name: "API Vine",
    file: "api-vine.svg",
    tags: ["api", "integration", "connect"],
    category: "Development",
  },
  {
    name: "Bar Chart",
    file: "bar-chart.svg",
    tags: ["chart", "analytics", "data"],
    category: "Development",
  },
  {
    name: "Lightning",
    file: "lightning.svg",
    tags: ["fast", "performance", "speed"],
    category: "Development",
  },
  {
    name: "Lightning Outline",
    file: "lightning-outline.svg",
    tags: ["fast", "performance", "outline"],
    category: "Development",
  },

  // Social
  {
    name: "X Twitter",
    file: "x-twitter.svg",
    tags: ["twitter", "x", "social"],
    category: "Social",
  },
  {
    name: "LinkedIn",
    file: "linkedin.svg",
    tags: ["linkedin", "professional", "social"],
    category: "Social",
  },
  {
    name: "YouTube",
    file: "youtube.svg",
    tags: ["youtube", "video", "social"],
    category: "Social",
  },
  {
    name: "Instagram",
    file: "instagram.svg",
    tags: ["instagram", "photo", "social"],
    category: "Social",
  },

  // Content & Topics
  {
    name: "Book Open",
    file: "book-open.svg",
    tags: ["book", "docs", "learn"],
    category: "Content",
  },
  {
    name: "Cookbook",
    file: "cookbook.svg",
    tags: ["cookbook", "recipes", "guide"],
    category: "Content",
  },
  {
    name: "Graduation Cap",
    file: "graduation-cap.svg",
    tags: ["education", "learn", "course"],
    category: "Content",
  },
  {
    name: "News",
    file: "news.svg",
    tags: ["news", "updates", "blog"],
    category: "Content",
  },
  {
    name: "News Icon",
    file: "news-icon.svg",
    tags: ["news", "article", "compact"],
    category: "Content",
  },
  {
    name: "Research Icon",
    file: "research-icon.svg",
    tags: ["research", "science", "study"],
    category: "Content",
  },
  {
    name: "Chat Bubble",
    file: "chat-bubble.svg",
    tags: ["chat", "message", "conversation"],
    category: "Content",
  },
  {
    name: "Dual Chat",
    file: "dual-chat.svg",
    tags: ["chat", "conversation", "dialogue"],
    category: "Content",
  },

  // Pictograms
  {
    name: "Pictogram Heart",
    file: "pictogram-heart.svg",
    tags: ["heart", "love", "care"],
    category: "Pictograms",
  },
  {
    name: "Pictogram Shield",
    file: "pictogram-shield.svg",
    tags: ["shield", "security", "protection"],
    category: "Pictograms",
  },

  // Anthropic (combined: Features, Engineering, Illustrations, Categories)
  {
    name: "nodes",
    file: "agent-skills.svg",
    tags: ["agent", "skills", "radial"],
    category: "Anthropic",
  },
  {
    name: "clover",
    file: "advanced-tool-use.svg",
    tags: ["tools", "quad", "octagons"],
    category: "Anthropic",
  },
  {
    name: "blocks",
    file: "build-with-claude.svg",
    tags: ["build", "tetris", "outline"],
    category: "Anthropic",
  },
  {
    name: "rings",
    file: "building-effective-agents.svg",
    tags: ["circles", "grid", "agents"],
    category: "Anthropic",
  },
  {
    name: "diamond",
    file: "claude-agent-sdk.svg",
    tags: ["sdk", "square", "rotated"],
    category: "Anthropic",
  },
  {
    name: "layers",
    file: "claude-code-best-practices.svg",
    tags: ["code", "stack", "guide"],
    category: "Anthropic",
  },
  {
    name: "sandbox",
    file: "claude-code-sandboxing.svg",
    tags: ["box", "security", "isolation"],
    category: "Anthropic",
  },
  {
    name: "execute",
    file: "code-execution-mcp.svg",
    tags: ["mcp", "run", "code"],
    category: "Anthropic",
  },
  {
    name: "rays",
    file: "context-engineering.svg",
    tags: ["burst", "palm", "radial"],
    category: "Anthropic",
  },
  {
    name: "retrieve",
    file: "contextual-retrieval.svg",
    tags: ["rag", "fetch", "context"],
    category: "Anthropic",
  },
  {
    name: "desktop",
    file: "desktop-extensions.svg",
    tags: ["screen", "apps", "extensions"],
    category: "Anthropic",
  },
  {
    name: "async",
    file: "long-running-agents.svg",
    tags: ["agents", "loop", "background"],
    category: "Anthropic",
  },
  {
    name: "bench",
    file: "swe-bench.svg",
    tags: ["benchmark", "test", "coding"],
    category: "Anthropic",
  },
  {
    name: "arch",
    file: "think-tool.svg",
    tags: ["think", "bridge", "connect"],
    category: "Anthropic",
  },
  {
    name: "paper",
    file: "transparency.svg",
    tags: ["document", "text", "trust"],
    category: "Anthropic",
  },
  {
    name: "growth",
    file: "economic-futures.svg",
    tags: ["economics", "chart", "research"],
    category: "Anthropic",
  },
  {
    name: "diamond",
    file: "eng-agent-sdk.svg",
    tags: ["engineering", "sdk", "square"],
    category: "Anthropic",
  },
  {
    name: "nodes",
    file: "eng-agent-skills.svg",
    tags: ["engineering", "skills", "radial"],
    category: "Anthropic",
  },
  {
    name: "sandbox",
    file: "eng-claude-code-sandboxing.svg",
    tags: ["engineering", "box", "security"],
    category: "Anthropic",
  },
  {
    name: "execute",
    file: "eng-code-execution-mcp.svg",
    tags: ["engineering", "mcp", "run"],
    category: "Anthropic",
  },
  {
    name: "rays",
    file: "eng-context-engineering.svg",
    tags: ["engineering", "burst", "context"],
    category: "Anthropic",
  },
  {
    name: "desktop",
    file: "eng-desktop-extensions.svg",
    tags: ["engineering", "screen", "apps"],
    category: "Anthropic",
  },
  {
    name: "async",
    file: "eng-harnesses-long-running-agents.svg",
    tags: ["engineering", "loop", "agents"],
    category: "Anthropic",
  },
  {
    name: "hands",
    file: "Hands-Build.svg",
    tags: ["hand", "stack", "stones"],
    category: "Anthropic",
  },
  {
    name: "stack",
    file: "Hands-Stack.svg",
    tags: ["hand", "pile", "build"],
    category: "Anthropic",
  },
  {
    name: "puzzle",
    file: "Objects-Puzzle.svg",
    tags: ["pieces", "fit", "objects"],
    category: "Anthropic",
  },
  {
    name: "abstract",
    file: "6903d22d0099a66d72e05699_33ddc751e21fb4b116b3f57dd553f0bc55ea09d1-1000x1000.svg",
    tags: ["claude", "pattern", "art"],
    category: "Anthropic",
  },
  {
    name: "blocks",
    file: "category-01.svg",
    tags: ["tetris", "build", "outline"],
    category: "Anthropic",
  },
  {
    name: "spirals",
    file: "category-02.svg",
    tags: ["springs", "coils", "three"],
    category: "Anthropic",
  },
  {
    name: "chart",
    file: "category-03.svg",
    tags: ["graph", "axis", "wave"],
    category: "Anthropic",
  },
  {
    name: "weave",
    file: "category-04.svg",
    tags: ["pattern", "cross", "grid"],
    category: "Anthropic",
  },
  {
    name: "flow",
    file: "category-05.svg",
    tags: ["stream", "line", "path"],
    category: "Anthropic",
  },
  {
    name: "dots",
    file: "category-06.svg",
    tags: ["points", "scatter", "grid"],
    category: "Anthropic",
  },
  {
    name: "wave",
    file: "category-07.svg",
    tags: ["curve", "line", "flow"],
    category: "Anthropic",
  },
  {
    name: "mesh",
    file: "category-08.svg",
    tags: ["grid", "net", "cross"],
    category: "Anthropic",
  },
  {
    name: "orbit",
    file: "category-09.svg",
    tags: ["circle", "spin", "round"],
    category: "Anthropic",
  },
  {
    name: "branch",
    file: "category-10.svg",
    tags: ["tree", "split", "fork"],
    category: "Anthropic",
  },
  {
    name: "pulse",
    file: "category-11.svg",
    tags: ["beat", "signal", "wave"],
    category: "Anthropic",
  },
  {
    name: "grid",
    file: "category-12.svg",
    tags: ["squares", "matrix", "tiles"],
    category: "Anthropic",
  },
  {
    name: "spiral",
    file: "category-13.svg",
    tags: ["coil", "spin", "round"],
    category: "Anthropic",
  },
  {
    name: "lines",
    file: "category-14.svg",
    tags: ["strokes", "parallel", "bars"],
    category: "Anthropic",
  },
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
  "Pictograms",
  "Anthropic",
]

interface IconCardProps {
  icon: AnthropicIcon
}

function IconCard({ icon }: IconCardProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="hover:bg-accent/50 group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg p-3 transition-colors">
          <div className="relative flex size-10 items-center justify-center">
            <Image
              src={`/anthropic/${icon.file}`}
              alt={icon.name}
              width={40}
              height={40}
              className="object-contain dark:invert"
            />
          </div>
          <span className="text-muted-foreground group-hover:text-foreground w-full truncate text-center text-xs transition-colors">
            {icon.name.length > 12 ? icon.name.slice(0, 12) + "..." : icon.name}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" side="top">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-muted flex size-12 items-center justify-center rounded-md">
              <Image
                src={`/anthropic/${icon.file}`}
                alt={icon.name}
                width={32}
                height={32}
                className="object-contain dark:invert"
              />
            </div>
            <div>
              <h4 className="text-sm font-medium">{icon.name}</h4>
              <p className="text-muted-foreground text-xs">{icon.category}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium">Tags</p>
            <div className="flex flex-wrap gap-1">
              {icon.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="px-1.5 py-0 text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium">Path</p>
            <code className="bg-muted block truncate rounded px-2 py-1 text-xs">
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

export function AnthropicShowcase({
  filter,
  showCategories = true,
}: AnthropicShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  )
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredIcons = React.useMemo(() => {
    let icons = ANTHROPIC_ASSETS

    if (filter) {
      icons = icons.filter((icon) => icon.category === filter)
    }

    if (selectedCategory) {
      icons = icons.filter((icon) => icon.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      icons = icons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(query) ||
          icon.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          icon.file.toLowerCase().includes(query)
      )
    }

    return icons
  }, [filter, selectedCategory, searchQuery])

  const groupedIcons = React.useMemo(() => {
    const groups: Record<string, AnthropicIcon[]> = {}
    filteredIcons.forEach((icon) => {
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search icons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-background placeholder:text-muted-foreground focus:ring-ring flex-1 rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        />
        {showCategories && !filter && (
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="bg-background focus:ring-ring rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Results count */}
      <p className="text-muted-foreground text-sm">
        {filteredIcons.length} icons found
      </p>

      {/* Icons Grid - 6 columns */}
      {Object.entries(groupedIcons).map(([category, icons]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-muted-foreground text-sm font-semibold">
            {category}
          </h3>
          <div className="grid grid-cols-6 gap-2">
            {icons.map((icon) => (
              <IconCard key={icon.file} icon={icon} />
            ))}
          </div>
        </div>
      ))}

      {filteredIcons.length === 0 && (
        <div className="text-muted-foreground py-12 text-center">
          No icons found matching your search.
        </div>
      )}
    </div>
  )
}

export { ANTHROPIC_ASSETS, CATEGORIES }
