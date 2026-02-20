"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { AnimatePresence, motion } from "framer-motion"
import { Compass, Palette, SearchIcon, Settings, Zap } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Category definitions                                               */
/* ------------------------------------------------------------------ */

export const SPOTLIGHT_CATEGORIES = [
  { id: "navigation", icon: Compass, label: "Pages", shortcut: "⌘1" },
  { id: "actions", icon: Zap, label: "Actions", shortcut: "⌘2" },
  { id: "settings", icon: Settings, label: "Settings", shortcut: "⌘3" },
  { id: "theme", icon: Palette, label: "Theme", shortcut: "⌘4" },
] as const

export type SpotlightCategoryId = (typeof SPOTLIGHT_CATEGORIES)[number]["id"]

/* ------------------------------------------------------------------ */
/*  Glass effect                                                       */
/* ------------------------------------------------------------------ */

export const GLASS =
  "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl backdrop-saturate-[180%] border border-black/10 dark:border-white/10 shadow-2xl"

/* ------------------------------------------------------------------ */
/*  SpotlightDialog – Radix Dialog root with spring animations         */
/* ------------------------------------------------------------------ */

function SpotlightDialog({
  children,
  open,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root> & {
  children: React.ReactNode
  open?: boolean
}) {
  return (
    <DialogPrimitive.Root data-slot="spotlight-dialog" open={open} {...props}>
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Overlay key="spotlight-overlay" forceMount asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </DialogPrimitive.Overlay>
          )}
          {open && (
            <DialogPrimitive.Content
              key="spotlight-content"
              forceMount
              className={cn(
                "fixed start-[50%] top-[15vh] z-50",
                "w-[calc(100%-2rem)] max-w-[540px]",
                "translate-x-[-50%] rtl:-translate-x-[50%]",
                "flex flex-col items-center",
                "outline-none"
              )}
            >
              <motion.div
                initial={{ scaleX: 1.05 }}
                animate={{ scaleX: 1 }}
                exit={{ scaleX: 1.03, opacity: 0 }}
                transition={{
                  scaleX: { type: "spring", duration: 0.45, bounce: 0.2 },
                }}
                className="flex w-full flex-col items-center"
              >
                <DialogPrimitive.Title className="sr-only">
                  Search
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  Search for a command or page
                </DialogPrimitive.Description>

                <CommandPrimitive
                  className="flex w-full flex-col items-center"
                  loop
                >
                  {children}
                </CommandPrimitive>
              </motion.div>
            </DialogPrimitive.Content>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightBar – search input area (glass provided by container)     */
/* ------------------------------------------------------------------ */

function SpotlightBar({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="spotlight-bar"
      className={cn("relative flex h-12 items-center gap-3 px-5", className)}
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
      <SearchIcon className="text-muted-foreground size-5 shrink-0" />
      <CommandPrimitive.Input
        data-slot="spotlight-input"
        className={cn(
          "flex h-12 w-full bg-transparent text-base outline-hidden",
          "placeholder:text-muted-foreground/70",
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
/*  SpotlightCategoryIcons – circular glass icons with spring pop      */
/* ------------------------------------------------------------------ */

function SpotlightCategoryIcons({
  activeCategory,
  onSelect,
  onHover,
  className,
}: {
  activeCategory: SpotlightCategoryId | null
  onSelect: (id: SpotlightCategoryId) => void
  onHover?: (id: SpotlightCategoryId | null) => void
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
          <motion.button
            key={cat.id}
            type="button"
            data-active={isActive}
            title={`${cat.label} (${cat.shortcut})`}
            initial={{ opacity: 0, x: -20, scale: 0.6 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{
              opacity: 0,
              x: -20,
              scale: 0.6,
              transition: { duration: 0.15 },
            }}
            transition={{
              type: "spring",
              duration: 0.4,
              bounce: 0.2,
              delay: i * 0.04,
            }}
            className={cn(
              "flex size-12 items-center justify-center",
              "rounded-full",
              GLASS,
              "shadow-lg",
              "cursor-pointer",
              isActive && "bg-accent border-accent shadow-accent/20"
            )}
            onMouseEnter={() => onHover?.(cat.id)}
            onMouseLeave={() => onHover?.(null)}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onSelect(cat.id)
            }}
          >
            <Icon
              className={cn(
                "size-5",
                isActive ? "text-accent-foreground" : "text-muted-foreground"
              )}
            />
          </motion.button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  SpotlightDropdown – results panel with scale reveal                */
/* ------------------------------------------------------------------ */

function SpotlightDropdown({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      data-slot="spotlight-dropdown"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
      transition={{ type: "spring", duration: 0.45, bounce: 0.05 }}
      className={cn("w-full overflow-hidden", className)}
    >
      {children}
    </motion.div>
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
