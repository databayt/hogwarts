"use client"

import React from "react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Icons } from "@/components/marketing/pricing/shared/icons"
import { SidebarNavItem } from "@/components/marketing/pricing/types"

export function SearchCommand({ links }: { links: SidebarNavItem[] }) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "bg-muted/50 text-muted-foreground relative h-9 w-full justify-start rounded-md text-sm font-normal shadow-none sm:pr-12 md:w-72"
        )}
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex">
          Search
          <span className="hidden sm:inline-flex">&nbsp;documentation</span>...
        </span>
        <kbd className="bg-muted pointer-events-none absolute top-[0.45rem] right-[0.3rem] hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {links.map((section) => (
            <CommandGroup key={section.title} heading={section.title}>
              {section.items.map((item) => {
                const Icon = Icons[item.icon || "arrowRight"]
                return (
                  <CommandItem
                    key={item.title}
                    onSelect={() => {
                      runCommand(() => router.push(item.href as string))
                    }}
                  >
                    <Icon className="mr-2 size-5" />
                    {item.title}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
