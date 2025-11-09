"use client"

import { useState } from "react"
import { Eye, Plus } from "lucide-react"
import PageHeader from "@/components/atom/page-header"
import { Button } from "@/components/ui/button"
import { DashboardCardsShowcase } from "@/components/platform/lab/dashboard-cards-showcase"
import { ShadcnShowcase } from "@/components/atom/lab/shadcn-showcase"

type ViewMode = "browse" | "add"

export default function LabPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("browse")

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Page Header */}
      <PageHeader
        title="Atom"
        description="A collection of reusable UI components built with shadcn/ui and Radix primitives"
        variant="dashboard"
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
