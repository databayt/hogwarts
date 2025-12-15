/**
 * Content orchestration component for the Sales/Leads feature
 * Main UI component that brings together all lead-related functionality
 */

"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/atom/page-header"

import { All } from "./all"
import { LeadAnalytics } from "./analytics"
import { LeadCard } from "./card"
import { FEATURE_FLAGS } from "./constants"
import { Featured } from "./featured"
import { Form } from "./form"
import { PasteImport } from "./paste-import"
import SalesPrompt from "./prompt"
import { useLeads } from "./use-leads"

export default function SalesContent() {
  const {
    leads,
    isLoading,
    filters,
    setFilters,
    selectedLeads,
    setSelectedLeads,
    refreshLeads,
  } = useLeads({
    autoRefresh: true,
    refreshInterval: 5000, // Refresh every 5 seconds for real-time updates
  })

  console.log("🎯 [SalesContent] Component rendered with:", {
    leadsCount: leads.length,
    isLoading,
    hasFilters: Object.keys(filters).length > 0,
    selectedCount: selectedLeads.length,
  })

  const [activeTab, setActiveTab] = useState("/sales/all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  console.log("📄 [SalesContent] State:", {
    activeTab,
    showCreateForm,
  })

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault()
        setShowCreateForm(true)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  const handleLeadsCreated = (count: number) => {
    console.log(`📊 [SalesContent] ${count} new leads created, refreshing...`)
    refreshLeads()
  }

  return (
    <>
      <SalesPrompt onLeadsCreated={handleLeadsCreated} />
      <div
        id="sales-content"
        className="flex flex-col gap-6 p-6"
        suppressHydrationWarning
      >
        {/* Header Section */}
        <PageHeader
          heading="Leads Management"
          description="Efficiently manage, track, and convert your sales pipeline. Transform prospects into customers with intelligent lead scoring and automation."
          headingClassName="text-3xl font-bold tracking-tight"
          actions={
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setShowCreateForm(true)}>Add Lead</Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("/sales/all")}
              >
                Browse Leads
              </Button>
            </div>
          }
        />

        {/* Tabs Navigation */}
        <div className="border-t border-b">
          <div className="flex items-center gap-2 py-2">
            <button
              className={`hover:text-primary flex h-7 items-center justify-center rounded-full px-4 text-center transition-colors ${
                activeTab === "/sales/all" ? "bg-muted text-primary" : ""
              }`}
              onClick={() => setActiveTab("/sales/all")}
            >
              All Leads
            </button>
            <button
              className={`hover:text-primary flex h-7 items-center justify-center rounded-full px-4 text-center transition-colors ${
                activeTab === "/sales/featured" ? "bg-muted text-primary" : ""
              }`}
              onClick={() => setActiveTab("/sales/featured")}
            >
              Featured
            </button>
            <button
              className={`hover:text-primary flex h-7 items-center justify-center rounded-full px-4 text-center transition-colors ${
                activeTab === "/sales/cards" ? "bg-muted text-primary" : ""
              }`}
              onClick={() => setActiveTab("/sales/cards")}
            >
              Card View
            </button>
            {FEATURE_FLAGS.AI_EXTRACTION && (
              <button
                className={`hover:text-primary flex h-7 items-center justify-center rounded-full px-4 text-center transition-colors ${
                  activeTab === "/sales/ai" ? "bg-muted text-primary" : ""
                }`}
                onClick={() => setActiveTab("/sales/ai")}
              >
                AI Extraction
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-4">
          {activeTab === "/sales/all" && (
            <All
              leads={leads}
              isLoading={isLoading}
              filters={filters}
              showFilters={true}
              onFiltersChange={setFilters}
              selectedLeads={selectedLeads}
              onSelectionChange={setSelectedLeads}
              onRefresh={refreshLeads}
              onAnalyticsClick={() => setShowAnalytics(true)}
            />
          )}
          {activeTab === "/sales/featured" && (
            <Featured
              leads={leads.filter((l) => l.score >= 80)}
              isLoading={isLoading}
              onRefresh={refreshLeads}
            />
          )}
          {activeTab === "/sales/cards" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onUpdate={refreshLeads}
                  onDelete={refreshLeads}
                />
              ))}
            </div>
          )}
          {FEATURE_FLAGS.AI_EXTRACTION && activeTab === "/sales/ai" && (
            <PasteImport onComplete={refreshLeads} />
          )}
        </div>

        {/* Dialogs */}
        {showCreateForm && (
          <Form
            open={showCreateForm}
            onClose={() => {
              console.log("🔘 [SalesContent] Form.onClose callback triggered")
              setShowCreateForm(false)
            }}
            onSuccess={() => {
              console.log("📤 [SalesContent] Form.onSuccess callback triggered")
              console.log(
                "🔄 [SalesContent] Closing form and refreshing leads..."
              )
              setShowCreateForm(false)
              refreshLeads()
            }}
          />
        )}

        {/* Analytics Dialog */}
        <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="sr-only">Lead Analytics</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <LeadAnalytics />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
