/**
 * All leads list view component
 * Displays all leads in a table format with filtering and sorting
 */

"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle2,
  ChevronDown,
  Edit,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { deleteLead } from "./actions"
import { LEAD_SCORE_RANGES, LEAD_SOURCE, LEAD_STATUS } from "./constants"
import { Form } from "./form"
import type { Lead, LeadFilters } from "./types"

interface AllProps {
  leads: Lead[]
  isLoading: boolean
  filters: LeadFilters
  showFilters: boolean
  onFiltersChange: (filters: LeadFilters) => void
  selectedLeads: string[]
  onSelectionChange: (ids: string[]) => void
  onRefresh: () => void
  onAnalyticsClick?: () => void
}

// Simplified time formatter
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals = [
    { label: "y", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "w", seconds: 604800 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
    { label: "s", seconds: 1 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count}${interval.label}`
    }
  }

  return "now"
}

export function All({
  leads,
  isLoading,
  filters,
  showFilters,
  onFiltersChange,
  selectedLeads,
  onSelectionChange,
  onRefresh,
  onAnalyticsClick,
}: AllProps) {
  const [sortField, setSortField] = useState<keyof Lead>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [editLead, setEditLead] = useState<Lead | null>(null)

  // Handle select all
  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(leads.map((l) => l.id))
    }
  }

  // Handle single selection
  const handleSelectLead = (id: string) => {
    if (selectedLeads.includes(id)) {
      onSelectionChange(selectedLeads.filter((lid) => lid !== id))
    } else {
      onSelectionChange([...selectedLeads, id])
    }
  }

  // Sort leads
  const sortedLeads = useMemo(() => {
    const sorted = [...leads].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return sorted
  }, [leads, sortField, sortDirection])

  // Handle sort
  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      const result = await deleteLead(id)
      if (result.success) {
        onRefresh()
      }
    }
  }

  // Get score color
  const getScoreColor = (
    score: number
  ): "default" | "destructive" | "secondary" | "outline" => {
    if (score >= LEAD_SCORE_RANGES.HOT.min) return "destructive"
    if (score >= LEAD_SCORE_RANGES.WARM.min) return "default"
    if (score >= LEAD_SCORE_RANGES.COOL.min) return "secondary"
    return "outline"
  }

  // Get status color
  const getStatusColor = (
    status: string
  ): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "NEW":
        return "default"
      case "CONTACTED":
        return "secondary"
      case "QUALIFIED":
        return "outline"
      case "PROPOSAL":
        return "default"
      case "NEGOTIATION":
        return "secondary"
      case "CLOSED_WON":
        return "default"
      case "CLOSED_LOST":
        return "destructive"
      default:
        return "default"
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading leads...</div>
      </div>
    )
  }

  return (
    <>
      {/* Filters */}
      {showFilters && (
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-48">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Search leads..."
                value={filters.search || ""}
                onChange={(e) =>
                  onFiltersChange({ ...filters, search: e.target.value })
                }
                className="h-9 pl-9"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 min-w-[120px] justify-between px-3"
                >
                  {filters.status ? LEAD_STATUS[filters.status] : "Status"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() =>
                    onFiltersChange({ ...filters, status: undefined })
                  }
                >
                  All Statuses
                </DropdownMenuItem>
                {Object.entries(LEAD_STATUS).map(([key, value]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        status: key as keyof typeof LEAD_STATUS,
                      })
                    }
                  >
                    {value}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 min-w-[120px] justify-between px-3"
                >
                  {filters.source ? LEAD_SOURCE[filters.source] : "Source"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() =>
                    onFiltersChange({ ...filters, source: undefined })
                  }
                >
                  All Sources
                </DropdownMenuItem>
                {Object.entries(LEAD_SOURCE).map(([key, value]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        source: key as keyof typeof LEAD_SOURCE,
                      })
                    }
                  >
                    {value}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="link"
                  className="flex h-9 w-9 items-center justify-center p-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    style={{ width: "28px", height: "28px" }}
                  >
                    <g fill="none" stroke="currentColor" strokeWidth="1">
                      <circle cx="12" cy="12" r="3.5" />
                      <path d="M21 12s-1-8-9-8s-9 8-9 8" />
                    </g>
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <input type="checkbox" checked className="mr-2" readOnly />{" "}
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <input type="checkbox" checked className="mr-2" readOnly />{" "}
                  Email
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <input type="checkbox" checked className="mr-2" readOnly />{" "}
                  Company
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <input type="checkbox" checked className="mr-2" readOnly />{" "}
                  Score
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <input type="checkbox" checked className="mr-2" readOnly />{" "}
                  Status
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <input type="checkbox" checked className="mr-2" readOnly />{" "}
                  Source
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <input type="checkbox" checked className="mr-2" readOnly />{" "}
                  Created
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="link"
              className="flex h-9 w-9 items-center justify-center p-0"
              onClick={onAnalyticsClick}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                style={{ width: "28px", height: "28px" }}
              >
                <path
                  fill="currentColor"
                  d="M12.5 11.5h7.489q-.202-3.039-2.326-5.172q-2.124-2.134-5.163-2.317zm-1 8.489V4.012q-3.16.182-5.33 2.483T4 12t2.17 5.505t5.33 2.484m1 0q3.039-.177 5.166-2.314q2.126-2.136 2.323-5.175H12.5zM12.003 21q-1.866 0-3.51-.708q-1.643-.709-2.859-1.924t-1.925-2.856T3 12.003t.709-3.51Q4.417 6.85 5.63 5.634t2.857-1.925T11.997 3t3.506.71t2.858 1.93t1.929 2.855q.71 1.637.71 3.511q0 1.852-.708 3.491t-1.924 2.864t-2.856 1.932t-3.509.707"
                />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-foreground">
              <TableRow className="hover:bg-foreground h-14 border-b">
                <TableHead className="text-background w-12 px-2 py-4 first:pl-4 last:pr-4">
                  <Checkbox
                    checked={
                      selectedLeads.length === leads.length && leads.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead
                  className="text-background min-w-[100px] cursor-pointer px-2 py-4"
                  onClick={() => handleSort("name")}
                >
                  Name{" "}
                  {sortField === "name" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="text-background min-w-[150px] cursor-pointer px-2 py-4"
                  onClick={() => handleSort("email")}
                >
                  Email{" "}
                  {sortField === "email" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="text-background min-w-[120px] cursor-pointer px-2 py-4"
                  onClick={() => handleSort("company")}
                >
                  Company{" "}
                  {sortField === "company" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="text-background cursor-pointer px-2 py-4 text-center"
                  onClick={() => handleSort("score")}
                >
                  Score{" "}
                  {sortField === "score" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="text-background px-2 py-4">
                  Status
                </TableHead>
                <TableHead className="text-background px-2 py-4">
                  Source
                </TableHead>
                <TableHead
                  className="text-background cursor-pointer px-2 py-4 text-center"
                  onClick={() => handleSort("createdAt")}
                >
                  Created{" "}
                  {sortField === "createdAt" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="text-background px-2 py-4 text-center last:pr-4">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/50 border-b">
                  <TableCell className="px-2 first:pl-4">
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => handleSelectLead(lead.id)}
                    />
                  </TableCell>
                  <TableCell
                    className="max-w-[150px] min-w-[100px] px-2 font-medium"
                    title={lead.name}
                  >
                    <div className="flex items-center gap-1 truncate">
                      <span className="truncate">{lead.name}</span>
                      {lead.verified && (
                        <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-green-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] min-w-[150px] truncate px-2"
                    title={lead.email || "-"}
                  >
                    {lead.email || "-"}
                  </TableCell>
                  <TableCell
                    className="max-w-[180px] min-w-[120px] truncate px-2"
                    title={lead.company || "-"}
                  >
                    {lead.company || "-"}
                  </TableCell>
                  <TableCell className="px-2 text-center">
                    <Badge variant={getScoreColor(lead.score)}>
                      {lead.score}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2">
                    <Badge variant={getStatusColor(lead.status)}>
                      {LEAD_STATUS[lead.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2">
                    {LEAD_SOURCE[lead.source]}
                  </TableCell>
                  <TableCell className="px-2 text-center">
                    {formatTimeAgo(new Date(lead.createdAt))}
                  </TableCell>
                  <TableCell className="px-2 last:pr-4">
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditLead(lead)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(lead.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {leads.length === 0 && (
          <div className="text-muted-foreground bg-muted/30 mt-4 rounded-lg p-8 text-center">
            No leads found. Create your first lead to get started.
          </div>
        )}
      </div>

      {/* Modals */}
      {editLead && (
        <Form
          open={!!editLead}
          onClose={() => setEditLead(null)}
          onSuccess={() => {
            setEditLead(null)
            onRefresh()
          }}
          lead={editLead}
          mode="edit"
        />
      )}
    </>
  )
}
