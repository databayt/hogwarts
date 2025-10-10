"use client"

import Link from "next/link"
import { awesomeShadcn } from "./config"
import { useMemo, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

export default function AwesomeShadcn() {
  const [selectedTag, setSelectedTag] = useState<string>("all")

  const tags = useMemo(() => {
    const set = new Set<string>()
    for (const item of awesomeShadcn) {
      for (const t of item.tags) set.add(t)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [])

  const items = useMemo(() => {
    const filtered = selectedTag === "all"
      ? awesomeShadcn
      : awesomeShadcn.filter((i) => i.tags.includes(selectedTag))
    return filtered
  }, [selectedTag])

  return (
    <div className="py-4">
      <div className="mb-8 flex items-center gap-3">
        <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="relative overflow-hidden rounded-lg border bg-background p-2 hover:border-primary transition-[border-color] duration-200 text-foreground hover:text-foreground"
        >
          <div className="flex h-[180px] flex-col justify-end rounded-sm p-6">
            <div className="space-y-2">
              <h4 className="text-foreground line-clamp-1">{item.title}</h4>
              <p className="text-sm text-muted-foreground font-light line-clamp-4">{item.description}</p>
            </div>
          </div>
        </Link>
      ))}
      </div>
    </div>
  )
}
