"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { useSession } from "next-auth/react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type ProjectType = {
  title: string
  slug: string
  color: string
}

const projects: ProjectType[] = [
  {
    title: "Project 1",
    slug: "project-number-one",
    color: "bg-red-500",
  },
  {
    title: "Project 2",
    slug: "project-number-two",
    color: "bg-blue-500",
  },
]
const selected: ProjectType = projects[1]

export default function ProjectSwitcher({
  large = false,
}: {
  large?: boolean
}) {
  const { data: session, status } = useSession()
  const [openPopover, setOpenPopover] = useState(false)

  if (!projects || status === "loading") {
    return <ProjectSwitcherPlaceholder />
  }

  return (
    <div>
      <Popover open={openPopover} onOpenChange={setOpenPopover}>
        <PopoverTrigger asChild>
          <Button
            className="h-8 px-2"
            variant={openPopover ? "secondary" : "ghost"}
          >
            <div className="flex items-center gap-3 pe-2">
              <div
                className={cn("size-3 shrink-0 rounded-full", selected.color)}
              />
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "muted inline-block truncate xl:max-w-[120px]",
                    large ? "w-full" : "max-w-[80px]"
                  )}
                >
                  {selected.slug}
                </span>
              </div>
            </div>
            <ChevronsUpDown
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="max-w-60 p-2">
          <ProjectList
            selected={selected}
            projects={projects}
            setOpenPopover={setOpenPopover}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function ProjectList({
  selected,
  projects,
  setOpenPopover,
}: {
  selected: ProjectType
  projects: ProjectType[]
  setOpenPopover: (open: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      {projects.map(({ slug, color }) => (
        <Link
          key={slug}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "text-muted-foreground hover:text-foreground relative flex h-9 items-center gap-3 p-3"
          )}
          href="#"
          onClick={() => setOpenPopover(false)}
        >
          <div className={cn("size-3 shrink-0 rounded-full", color)} />
          <span
            className={`muted flex-1 truncate ${
              selected.slug === slug ? "text-foreground" : ""
            }`}
          >
            {slug}
          </span>
          {selected.slug === slug && (
            <span className="text-foreground absolute inset-y-0 right-0 flex items-center pe-3">
              <Check size={18} aria-hidden="true" />
            </span>
          )}
        </Link>
      ))}
      <Button
        variant="outline"
        className="relative flex h-9 items-center justify-center gap-2 p-2"
        onClick={() => {
          setOpenPopover(false)
        }}
      >
        <Plus size={18} className="absolute top-2 left-2.5" />
        <span className="flex-1 truncate text-center">New Project</span>
      </Button>
    </div>
  )
}

function ProjectSwitcherPlaceholder() {
  return (
    <div className="flex animate-pulse items-center gap-1.5 rounded-lg px-1.5 py-2 sm:w-60">
      <div className="bg-muted h-8 w-36 animate-pulse rounded-md xl:w-[180px]" />
    </div>
  )
}
