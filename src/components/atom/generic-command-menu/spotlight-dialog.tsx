"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Compass, Palette, SearchIcon, Settings, Zap } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Category definitions                                               */
/* ------------------------------------------------------------------ */

export const SPOTLIGHT_CATEGORIES = [
  { id: "navigation", icon: Compass, label: "Navigation", shortcut: "⌘1" },
  { id: "actions", icon: Zap, label: "Actions", shortcut: "⌘2" },
  { id: "settings", icon: Settings, label: "Settings", shortcut: "⌘3" },
  { id: "theme", icon: Palette, label: "Theme", shortcut: "⌘4" },
] as const

export type SpotlightCategoryId = (typeof SPOTLIGHT_CATEGORIES)[number]["id"]

/* ------------------------------------------------------------------ */
/*  SpotlightDialog – Radix Dialog root (no background, just layout)   */
/* ------------------------------------------------------------------ */

function SpotlightDialog({
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root> & {
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root data-slot="spotlight-dialog" {...props}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />

        {/* Content – transparent flex column, children have their own glass */}
        <DialogPrimitive.Content
          className={cn(
            "fixed start-[50%] top-[15vh] z-50",
            "w-[calc(100%-2rem)] max-w-[540px]",
            "translate-x-[-50%] rtl:-translate-x-[50%]",
            "flex flex-col items-center",
            // Animation on wrapper
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "duration-200",
            // No background — each child has its own
            "outline-none"
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Search
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search for a command or page
          </DialogPrimitive.Description>

          <CommandPrimitive className="flex w-full flex-col items-center" loop>
            {children}
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightBar – pill-shaped search input                            */
/* ------------------------------------------------------------------ */

const GLASS =
  "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl backdrop-saturate-[180%] border border-white/20 shadow-2xl"

function SpotlightBar({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="spotlight-bar"
      className={cn(
        "flex h-12 items-center gap-3 px-5",
        "rounded-full",
        GLASS,
        "transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightInput                                                     */
/* ------------------------------------------------------------------ */

function SpotlightInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex flex-1 items-center gap-3">
      <SearchIcon className="text-muted-foreground/70 size-5 shrink-0" />
      <CommandPrimitive.Input
        data-slot="spotlight-input"
        className={cn(
          "flex h-12 w-full bg-transparent text-base outline-hidden",
          "placeholder:text-muted-foreground/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightCategories – horizontal text chip row                      */
/* ------------------------------------------------------------------ */

function SpotlightCategories({
  activeCategory,
  onSelect,
  className,
}: {
  activeCategory: SpotlightCategoryId | null
  onSelect: (id: SpotlightCategoryId) => void
  className?: string
}) {
  return (
    <div
      data-slot="spotlight-categories"
      className={cn(
        "flex gap-1.5 overflow-x-auto border-b border-black/5 px-3 py-2 dark:border-white/10",
        className
      )}
    >
      {SPOTLIGHT_CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            data-active={isActive}
            title={`${cat.label} (${cat.shortcut})`}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
              "cursor-pointer transition-colors duration-150",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground/70 hover:bg-accent/50 hover:text-accent-foreground"
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onSelect(cat.id)
            }}
          >
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightCategoryIcons – circular glass icons (hover state)        */
/* ------------------------------------------------------------------ */

function SpotlightCategoryIcons({
  activeCategory,
  onSelect,
  className,
}: {
  activeCategory: SpotlightCategoryId | null
  onSelect: (id: SpotlightCategoryId) => void
  className?: string
}) {
  return (
    <div
      data-slot="spotlight-category-icons"
      className={cn("flex items-center gap-2", className)}
    >
      {SPOTLIGHT_CATEGORIES.map((cat, i) => {
        const Icon = cat.icon
        const isActive = activeCategory === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            data-active={isActive}
            title={`${cat.label} (${cat.shortcut})`}
            className={cn(
              "flex size-12 items-center justify-center",
              "rounded-full",
              GLASS,
              "shadow-lg",
              "cursor-pointer transition-all duration-200",
              "hover:scale-105",
              "animate-in fade-in slide-in-from-left-2",
              isActive && "bg-accent border-accent shadow-accent/20"
            )}
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onSelect(cat.id)
            }}
          >
            <Icon
              className={cn(
                "size-4",
                isActive ? "text-accent-foreground" : "text-muted-foreground/70"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightDropdown – results panel below the bar                    */
/* ------------------------------------------------------------------ */

function SpotlightDropdown({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-slot="spotlight-dropdown"
      className={cn(
        "mt-2 w-full max-w-[540px]",
        "rounded-2xl",
        GLASS,
        "overflow-hidden",
        "animate-in fade-in slide-in-from-top-1 duration-200",
        className
      )}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightList                                                      */
/* ------------------------------------------------------------------ */

function SpotlightList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="spotlight-list"
      className={cn(
        "max-h-[min(400px,50vh)] scroll-py-1 overflow-x-hidden overflow-y-auto",
        "[transition:height_150ms_ease-out]",
        className
      )}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightEmpty                                                     */
/* ------------------------------------------------------------------ */

function SpotlightEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="spotlight-empty"
      className="text-muted-foreground/60 py-8 text-center text-sm"
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightGroup                                                     */
/* ------------------------------------------------------------------ */

function SpotlightGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="spotlight-group"
      className={cn(
        "overflow-hidden p-2",
        "[&_[cmdk-group-heading]]:hidden",
        className
      )}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightItem                                                      */
/* ------------------------------------------------------------------ */

function SpotlightItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="spotlight-item"
      className={cn(
        "relative flex cursor-default items-center gap-3 rounded-xl px-3 py-3 text-sm outline-hidden select-none",
        "transition-colors duration-100",
        "data-[selected=true]:bg-accent/50",
        "[&_svg:not([class*='text-'])]:text-muted-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        "[&>[data-slot=icon-wrapper]]:bg-muted/50 [&>[data-slot=icon-wrapper]]:flex [&>[data-slot=icon-wrapper]]:size-9 [&>[data-slot=icon-wrapper]]:shrink-0 [&>[data-slot=icon-wrapper]]:items-center [&>[data-slot=icon-wrapper]]:justify-center [&>[data-slot=icon-wrapper]]:rounded-xl",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className
      )}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightSeparator                                                 */
/* ------------------------------------------------------------------ */

function SpotlightSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="spotlight-separator"
      className={cn("mx-2 h-px bg-black/5 dark:bg-white/5", className)}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightFooter – keyboard hints                                   */
/* ------------------------------------------------------------------ */

function SpotlightFooter({ className }: { className?: string }) {
  return (
    <div
      data-slot="spotlight-footer"
      className={cn(
        "text-muted-foreground/50 flex items-center gap-4 border-t border-black/5 px-4 py-2 text-xs dark:border-white/10",
        className
      )}
    >
      <span className="flex items-center gap-1.5">
        <kbd className="inline-flex size-5 items-center justify-center rounded-md border border-black/10 bg-black/5 font-mono text-[10px] dark:border-white/10 dark:bg-white/5">
          ↑
        </kbd>
        <kbd className="inline-flex size-5 items-center justify-center rounded-md border border-black/10 bg-black/5 font-mono text-[10px] dark:border-white/10 dark:bg-white/5">
          ↓
        </kbd>
        <span>navigate</span>
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="inline-flex h-5 items-center justify-center rounded-md border border-black/10 bg-black/5 px-1.5 font-mono text-[10px] dark:border-white/10 dark:bg-white/5">
          ↵
        </kbd>
        <span>open</span>
      </span>
      <span className="ms-auto flex items-center gap-1.5">
        <kbd className="inline-flex h-5 items-center justify-center rounded-md border border-black/10 bg-black/5 px-1.5 font-mono text-[10px] dark:border-white/10 dark:bg-white/5">
          esc
        </kbd>
        <span>close</span>
      </span>
    </div>
  )
}

export {
  SpotlightDialog,
  SpotlightBar,
  SpotlightInput,
  SpotlightCategories,
  SpotlightCategoryIcons,
  SpotlightDropdown,
  SpotlightList,
  SpotlightEmpty,
  SpotlightGroup,
  SpotlightItem,
  SpotlightSeparator,
  SpotlightFooter,
}
