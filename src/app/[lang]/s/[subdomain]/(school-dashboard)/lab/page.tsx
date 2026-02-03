"use client"

import { useState } from "react"
import { Eye, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ShadcnShowcase } from "@/components/atom/lab/shadcn-showcase"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { DashboardCardsShowcase } from "@/components/school-dashboard/lab/dashboard-cards-showcase"

type ViewMode = "browse" | "add"

export default function LabPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("browse")

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeadingSetter
        title="Atom"
        description="A collection of reusable UI components built with shadcn/ui and Radix primitives"
      />

      {/* View Mode Toggle Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "browse" ? "default" : "outline"}
          onClick={() => setViewMode("browse")}
          className="gap-2"
        >
          <Eye className="size-4" />
          Browse Atom
        </Button>
        <Button
          variant={viewMode === "add" ? "default" : "outline"}
          onClick={() => setViewMode("add")}
          className="gap-2"
        >
          <Plus className="size-4" />
          Add Atom
        </Button>
      </div>

      {/* Content based on view mode */}
      <div className="mt-6">
        {viewMode === "browse" ? (
          <DashboardCardsShowcase />
        ) : (
          <ShadcnShowcase />
        )}
      </div>
    </div>
  )
}
