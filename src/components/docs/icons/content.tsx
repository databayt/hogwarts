"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { IconCategory } from "@/components/icons/types"

import { getCategories, iconItems } from "./config"
import { IconPreviewCard } from "./icon-preview-card"

export default function IconBrowser() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  const categories = React.useMemo(() => getCategories(), [])

  // Filter icons by category and search query
  const filteredIcons = React.useMemo(() => {
    let filtered = iconItems

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((icon) => icon.category === selectedCategory)
    }

    // Filter by search query (name, id, tags, description)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((icon) => {
        return (
          icon.name.toLowerCase().includes(query) ||
          icon.id.toLowerCase().includes(query) ||
          icon.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          icon.description?.toLowerCase().includes(query)
        )
      })
    }

    return filtered
  }, [selectedCategory, searchQuery])

  // Get category counts for display
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    iconItems.forEach((icon) => {
      counts[icon.category] = (counts[icon.category] || 0) + 1
    })
    return counts
  }, [])

  return (
    <div className="py-4">
      {/* Filters and Search */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All Categories ({iconItems.length})
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)} (
                {categoryCounts[category] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search icons by name, tag, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="text-muted-foreground mb-4 text-sm">
        Showing {filteredIcons.length} of {iconItems.length} icons
      </div>

      {/* Icon Grid */}
      {filteredIcons.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredIcons.map((icon) => (
            <IconPreviewCard key={icon.id} icon={icon} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            No icons found matching your search.
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Try different keywords or category.
          </p>
        </div>
      )}

      {/* Usage Guide */}
      <div className="bg-muted/50 mt-12 rounded-lg border p-6">
        <h3 className="mb-4 font-semibold">Usage</h3>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">
              Namespace Pattern (Recommended)
            </p>
            <code className="bg-background block rounded p-3 text-sm">
              {`import { Icons } from "@/components/icons"`}
              <br />
              {`<Icons.github className="w-6 h-6" />`}
            </code>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">
              Individual Imports (Tree-shaking)
            </p>
            <code className="bg-background block rounded p-3 text-sm">
              {`import { GitHubIcon } from "@/components/icons"`}
              <br />
              {`<GitHubIcon className="w-6 h-6" />`}
            </code>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Dynamic Loading</p>
            <code className="bg-background block rounded p-3 text-sm">
              {`import { Icon } from "@/components/icons"`}
              <br />
              {`<Icon name="github" className="w-6 h-6" />`}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
