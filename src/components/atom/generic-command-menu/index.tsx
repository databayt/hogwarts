"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { type DialogProps } from "@radix-ui/react-dialog"
import { ChevronRight, Clock, Laptop, Moon, Search, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  SpotlightBar,
  SpotlightCategories,
  SpotlightCategoryIcons,
  SpotlightDialog,
  SpotlightDropdown,
  SpotlightEmpty,
  SpotlightGroup,
  SpotlightInput,
  SpotlightItem,
  SpotlightList,
  type SpotlightCategoryId,
} from "./spotlight-dialog"
import type { SearchConfig, SearchContext, SearchItem } from "./types"
import { useRecentItems } from "./use-recent-items"
import { filterByQuery, filterByRole } from "./utils"

interface GenericCommandMenuProps extends DialogProps {
  config: SearchConfig
  context?: SearchContext
  variant?: "default" | "compact" | "icon"
}

export function GenericCommandMenu({
  config,
  context,
  variant = "default",
  ...props
}: GenericCommandMenuProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeCategory, setActiveCategory] =
    React.useState<SpotlightCategoryId | null>(null)
  const [showIcons, setShowIcons] = React.useState(false)
  const [dropdownReady, setDropdownReady] = React.useState(false)
  const { setTheme } = useTheme()
  const { recentSearchItems, addRecentItem } = useRecentItems()
  const { dictionary } = useDictionary()

  // Get translations
  const commandMenuDict = dictionary?.commandMenu as
    | Record<string, string>
    | undefined
  const placeholder =
    config.placeholder || commandMenuDict?.placeholder || "Spotlight search"
  const emptyMessage =
    config.emptyMessage || commandMenuDict?.noResults || "No results found."

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setActiveCategory(null)
      setShowIcons(false)
      setDropdownReady(false)
    }
  }, [open])

  // Any mouse movement while open triggers the icon split
  React.useEffect(() => {
    if (!open) return
    const handler = () => setShowIcons(true)
    document.addEventListener("mousemove", handler, { once: true })
    return () => document.removeEventListener("mousemove", handler)
  }, [open])

  // Keyboard shortcuts: Cmd+K to open, Cmd+1/2/3/4 for categories
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+K or / to toggle
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }
        e.preventDefault()
        setOpen((o) => !o)
      }

      // Cmd+1/2/3/4 for category shortcuts (only when open)
      if (open && (e.metaKey || e.ctrlKey)) {
        const categoryMap: Record<string, SpotlightCategoryId> = {
          "1": "navigation",
          "2": "actions",
          "3": "settings",
          "4": "theme",
        }
        const cat = categoryMap[e.key]
        if (cat) {
          e.preventDefault()
          setActiveCategory((prev) => (prev === cat ? null : cat))
          setShowIcons(true)
        }
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open])

  // Filter items by role and query
  const filteredNavigation = React.useMemo(() => {
    let items = config.navigation || []
    items = filterByRole(items, context?.currentRole)
    items = filterByQuery(items, query)
    return items
  }, [config.navigation, context?.currentRole, query])

  const filteredActions = React.useMemo(() => {
    let items = config.actions || []
    items = filterByRole(items, context?.currentRole)
    items = filterByQuery(items, query)
    return items
  }, [config.actions, context?.currentRole, query])

  const filteredSettings = React.useMemo(() => {
    let items = config.settings || []
    items = filterByQuery(items, query)
    return items
  }, [config.settings, query])

  const filteredRecent = React.useMemo(() => {
    if (!config.showRecent) return []
    return filterByQuery(recentSearchItems, query).slice(
      0,
      config.maxRecent || 5
    )
  }, [config.showRecent, config.maxRecent, recentSearchItems, query])

  // Whether dropdown should be visible
  const showDropdown = query.length > 0 || activeCategory !== null

  // Sequence: bar expands first (300ms), then dropdown appears
  React.useEffect(() => {
    if (showDropdown) {
      const timer = setTimeout(() => setDropdownReady(true), 700)
      return () => clearTimeout(timer)
    } else {
      setDropdownReady(false)
    }
  }, [showDropdown])

  // Command execution handler
  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    setQuery("")
    setActiveCategory(null)
    command()
  }, [])

  // Handle item selection
  const handleItemSelect = React.useCallback(
    (item: SearchItem) => {
      if (item.href) {
        addRecentItem({
          id: item.id,
          title: item.title,
          href: item.href,
        })
        runCommand(() => router.push(item.href as string))
      } else if (item.action) {
        runCommand(item.action)
      }
    },
    [addRecentItem, runCommand, router]
  )

  // Handle category toggle
  const handleCategorySelect = React.useCallback((id: SpotlightCategoryId) => {
    setActiveCategory((prev) => (prev === id ? null : id))
  }, [])

  // Render search item
  const renderItem = (item: SearchItem) => {
    const Icon = item.icon
    return (
      <SpotlightItem
        key={item.id}
        value={`${item.title} ${item.keywords?.join(" ") || ""}`}
        onSelect={() => handleItemSelect(item)}
      >
        {Icon && (
          <div data-slot="icon-wrapper">
            <Icon className="size-5" />
          </div>
        )}
        <div className="flex flex-1 flex-col">
          <span>{item.title}</span>
          {item.breadcrumb && item.breadcrumb.length > 0 && (
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              {item.breadcrumb.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="size-3" />}
                  {crumb}
                </React.Fragment>
              ))}
            </span>
          )}
        </div>
        {item.shortcut && (
          <kbd className="bg-muted pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
            {item.shortcut}
          </kbd>
        )}
      </SpotlightItem>
    )
  }

  // Should show a specific category group?
  const shouldShowGroup = (group: SpotlightCategoryId) => {
    if (!activeCategory) return true
    return activeCategory === group
  }

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="link"
          size="icon"
          className="size-7 cursor-pointer transition-opacity hover:opacity-70"
          onClick={() => setOpen(true)}
          {...props}
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">{commandMenuDict?.search || "Search"}</span>
        </Button>
      ) : (
        <Button
          variant="outline"
          className={cn(
            "bg-muted/50 text-muted-foreground relative h-8 w-full justify-start rounded-[0.5rem] text-sm font-normal shadow-none sm:pe-12",
            variant === "compact"
              ? "md:w-40 lg:w-48"
              : "md:w-40 lg:w-56 xl:w-64"
          )}
          onClick={() => setOpen(true)}
          {...props}
        >
          <span className="hidden lg:inline-flex">{placeholder}</span>
          <span className="inline-flex lg:hidden">
            {commandMenuDict?.searchShort || "Search..."}
          </span>
          <kbd className="bg-muted pointer-events-none absolute top-[0.3rem] right-[0.3rem] hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      )}

      <SpotlightDialog open={open} onOpenChange={setOpen}>
        <div className="flex w-full flex-col items-center">
          {/* Top row: pill bar + hover icons */}
          <div className="flex w-full items-center justify-center gap-2">
            <SpotlightBar
              className={cn(
                showDropdown
                  ? dropdownReady
                    ? "w-full rounded-t-3xl rounded-b-none border-b-0 shadow-none"
                    : "w-full"
                  : showIcons
                    ? "w-[calc(100%-14rem)]"
                    : "w-full"
              )}
            >
              <SpotlightInput
                placeholder={placeholder}
                value={query}
                onValueChange={setQuery}
              />
            </SpotlightBar>

            {showIcons && !dropdownReady && (
              <SpotlightCategoryIcons
                activeCategory={activeCategory}
                onSelect={handleCategorySelect}
                className={cn(
                  "transition-all duration-200",
                  showDropdown && "pointer-events-none opacity-0"
                )}
              />
            )}
          </div>

          {dropdownReady && (
            <SpotlightDropdown className="mt-0 rounded-t-none rounded-b-3xl border-t-0">
              <SpotlightCategories
                activeCategory={activeCategory}
                onSelect={handleCategorySelect}
              />
              <SpotlightList>
                <SpotlightEmpty>{emptyMessage}</SpotlightEmpty>

                {/* Recent items */}
                {shouldShowGroup("navigation") && filteredRecent.length > 0 && (
                  <SpotlightGroup>
                    {filteredRecent.map((item) => (
                      <SpotlightItem
                        key={item.id}
                        value={item.title}
                        onSelect={() => handleItemSelect(item)}
                      >
                        <div data-slot="icon-wrapper">
                          <Clock className="size-5" />
                        </div>
                        {item.title}
                      </SpotlightItem>
                    ))}
                  </SpotlightGroup>
                )}

                {/* Navigation items */}
                {shouldShowGroup("navigation") &&
                  filteredNavigation.length > 0 && (
                    <SpotlightGroup>
                      {filteredNavigation.map(renderItem)}
                    </SpotlightGroup>
                  )}

                {/* Action items */}
                {shouldShowGroup("actions") && filteredActions.length > 0 && (
                  <SpotlightGroup>
                    {filteredActions.map(renderItem)}
                  </SpotlightGroup>
                )}

                {/* Settings items */}
                {shouldShowGroup("settings") && filteredSettings.length > 0 && (
                  <SpotlightGroup>
                    {filteredSettings.map(renderItem)}
                  </SpotlightGroup>
                )}

                {/* Theme switcher */}
                {shouldShowGroup("theme") && (
                  <SpotlightGroup>
                    <SpotlightItem
                      onSelect={() => runCommand(() => setTheme("light"))}
                    >
                      <div data-slot="icon-wrapper">
                        <Sun className="size-5" />
                      </div>
                      {commandMenuDict?.light || "Light"}
                    </SpotlightItem>
                    <SpotlightItem
                      onSelect={() => runCommand(() => setTheme("dark"))}
                    >
                      <div data-slot="icon-wrapper">
                        <Moon className="size-5" />
                      </div>
                      {commandMenuDict?.dark || "Dark"}
                    </SpotlightItem>
                    <SpotlightItem
                      onSelect={() => runCommand(() => setTheme("system"))}
                    >
                      <div data-slot="icon-wrapper">
                        <Laptop className="size-5" />
                      </div>
                      {commandMenuDict?.system || "System"}
                    </SpotlightItem>
                  </SpotlightGroup>
                )}
              </SpotlightList>
            </SpotlightDropdown>
          )}
        </div>
      </SpotlightDialog>
    </>
  )
}
