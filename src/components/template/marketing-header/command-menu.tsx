"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface CommandMenuProps {
  dictionary?: Dictionary
}

export function CommandMenu({ dictionary }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false)

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

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="sr-only">Search documentation</span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>
              <span>Documentation</span>
            </CommandItem>
            <CommandItem>
              <span>Components</span>
            </CommandItem>
            <CommandItem>
              <span>Examples</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
