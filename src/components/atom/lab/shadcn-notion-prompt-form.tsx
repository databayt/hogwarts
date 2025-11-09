"use client"

import { useState } from "react"
import {
  ArrowUp,
  AtSign,
  FileText,
  Paperclip,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type PageItem = {
  id: string
  name: string
  type: "page"
  icon: typeof FileText
}

type UserItem = {
  id: string
  name: string
  type: "user"
  avatar: string
  workspace: string
}

type Item = PageItem | UserItem
type Mention = { id: string; name: string; type: "page" | "user" }

const pages: PageItem[] = [
  { id: "1", name: "Meeting Notes", type: "page" as const, icon: FileText },
  { id: "2", name: "Project Dashboard", type: "page" as const, icon: FileText },
  { id: "3", name: "Product Roadmap", type: "page" as const, icon: FileText },
  { id: "4", name: "Team Handbook", type: "page" as const, icon: FileText },
  { id: "5", name: "Design System", type: "page" as const, icon: FileText },
]

const users: UserItem[] = [
  {
    id: "u1",
    name: "Sarah Chen",
    type: "user" as const,
    avatar: "https://github.com/shadcn.png",
    workspace: "Engineering",
  },
  {
    id: "u2",
    name: "Mike Johnson",
    type: "user" as const,
    avatar: "https://github.com/maxleiter.png",
    workspace: "Product",
  },
  {
    id: "u3",
    name: "Emma Davis",
    type: "user" as const,
    avatar: "https://github.com/evilrabbit.png",
    workspace: "Design",
  },
]

/**
 * ShadcnNotionPromptForm - AI prompt interface inspired by Notion
 *
 * Advanced AI prompt interface with:
 * - Mention support for pages and users
 * - AI model selection
 * - File attachments
 * - Source scope configuration
 *
 * @example
 * ```tsx
 * <ShadcnNotionPromptForm />
 * ```
 */
export function ShadcnNotionPromptForm() {
  const [mentions, setMentions] = useState<Mention[]>([])
  const [mentionPopoverOpen, setMentionPopoverOpen] = useState(false)
  const [model, setModel] = useState("auto")
  const [webSearch, setWebSearch] = useState(true)
  const [appsIntegrations, setAppsIntegrations] = useState(false)

  const allItems: Item[] = [...pages, ...users]
  const filteredItems = allItems.filter(
    (item) => !mentions.some((m) => m.id === item.id)
  )

  const addMention = (item: Item) => {
    setMentions([...mentions, { id: item.id, name: item.name, type: item.type }])
    setMentionPopoverOpen(false)
  }

  const removeMention = (id: string) => {
    setMentions(mentions.filter((m) => m.id !== id))
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-2xl">
        <div className="relative overflow-hidden rounded-lg border border-border bg-card">
          {/* Mentions Display */}
          {mentions.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-border bg-muted/50 p-3">
              {mentions.map((mention) => (
                <Badge key={mention.id} variant="secondary" className="gap-1">
                  {mention.type === "page" ? (
                    <FileText className="size-3" />
                  ) : (
                    <User className="size-3" />
                  )}
                  {mention.name}
                  <button
                    onClick={() => removeMention(mention.id)}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Textarea */}
          <Textarea
            placeholder="Ask, search, or make anything..."
            className="min-h-[120px] resize-none border-0 focus-visible:ring-0"
          />

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-border bg-muted/50 p-2">
            <div className="flex items-center gap-1">
              {/* Mention Selector */}
              <Popover open={mentionPopoverOpen} onOpenChange={setMentionPopoverOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-8">
                        <AtSign className="size-4" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Add reference</TooltipContent>
                </Tooltip>
                <PopoverContent align="start" className="w-80 p-0">
                  <Command>
                    <CommandInput placeholder="Search pages and people..." />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup heading="Pages">
                        {filteredItems
                          .filter((item): item is PageItem => item.type === "page")
                          .map((page) => {
                            const Icon = page.icon
                            return (
                              <CommandItem
                                key={page.id}
                                onSelect={() => addMention(page)}
                              >
                                <Icon className="mr-2 size-4" />
                                {page.name}
                              </CommandItem>
                            )
                          })}
                      </CommandGroup>
                      <CommandGroup heading="People">
                        {filteredItems
                          .filter((item): item is UserItem => item.type === "user")
                          .map((user) => (
                            <CommandItem
                              key={user.id}
                              onSelect={() => addMention(user)}
                            >
                              <Avatar className="mr-2 size-5">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>
                                  {user.name.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm">{user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {user.workspace}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* File Attachment */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="size-8">
                    <Paperclip className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>

              {/* AI Model Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    {model === "auto" && "Auto"}
                    {model === "agent" && (
                      <>
                        <Badge variant="secondary" className="h-4 px-1 text-xs">
                          Agent
                        </Badge>
                        Agent Mode
                      </>
                    )}
                    {model === "plan" && (
                      <>
                        <Badge variant="secondary" className="h-4 px-1 text-xs">
                          Plan
                        </Badge>
                        Plan Mode
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setModel("auto")}>
                    Auto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setModel("agent")}>
                    <Badge variant="secondary" className="mr-2 h-4 px-1 text-xs">
                      Agent
                    </Badge>
                    Agent Mode
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setModel("plan")}>
                    <Badge variant="secondary" className="mr-2 h-4 px-1 text-xs">
                      Plan
                    </Badge>
                    Plan Mode
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Source Scope */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Search className="mr-1 size-4" />
                    Sources
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuCheckboxItem
                      checked={webSearch}
                      onCheckedChange={setWebSearch}
                    >
                      Web Search
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={appsIntegrations}
                      onCheckedChange={setAppsIntegrations}
                    >
                      Apps and Integrations
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Sparkles className="mr-2 size-4" />
                      Your Knowledge
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>All Workspaces</DropdownMenuItem>
                      <DropdownMenuItem>Current Workspace</DropdownMenuItem>
                      <DropdownMenuItem>Current Page</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Send Button */}
            <Button size="icon" className="size-8 rounded-full">
              <ArrowUp className="size-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
