/**
 * Parent Profile Documents Tab
 * Important documents, forms, and records for all children
 */

"use client"

import React, { useState } from "react"
import { format } from "date-fns"
import {
  Calendar,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  CreditCard,
  Download,
  Eye,
  File,
  FileCheck,
  FileText,
  FolderOpen,
  GraduationCap,
  Heart,
  ListFilter,
  Paperclip,
  Plus,
  Search,
  Share,
  Shield,
  Trash,
  Upload,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { ParentProfile } from "../../types"

// ============================================================================
// Types
// ============================================================================

interface DocumentsTabProps {
  profile: ParentProfile
  dictionary?: Dictionary
  lang?: "ar" | "en"
  isOwner?: boolean
  className?: string
}

type DocumentCategory =
  | "academic"
  | "medical"
  | "financial"
  | "administrative"
  | "permission"
  | "other"
type DocumentStatus = "valid" | "expired" | "pending" | "rejected"

interface Document {
  id: string
  name: string
  category: DocumentCategory
  type: string
  childId?: string
  childName?: string
  uploadedDate: Date
  expiryDate?: Date
  size: string
  status: DocumentStatus
  url: string
  isRequired?: boolean
  uploadedBy: string
  description?: string
}

interface RequiredDocument {
  id: string
  name: string
  category: DocumentCategory
  description: string
  isUploaded: boolean
  dueDate?: Date
  childSpecific: boolean
  uploadedDocument?: Document
}

interface DocumentFolder {
  id: string
  name: string
  icon: React.ReactNode
  count: number
  category: DocumentCategory
}

// ============================================================================
// Mock Data
// ============================================================================

const mockDocuments: Document[] = [
  {
    id: "doc-1",
    name: "Birth Certificate - Alex",
    category: "administrative",
    type: "PDF",
    childId: "student-1",
    childName: "Alex Thompson",
    uploadedDate: new Date("2020-09-01"),
    size: "245 KB",
    status: "valid",
    url: "#",
    isRequired: true,
    uploadedBy: "Robert Thompson",
  },
  {
    id: "doc-2",
    name: "Birth Certificate - Emma",
    category: "administrative",
    type: "PDF",
    childId: "student-2",
    childName: "Emma Thompson",
    uploadedDate: new Date("2020-09-01"),
    size: "238 KB",
    status: "valid",
    url: "#",
    isRequired: true,
    uploadedBy: "Robert Thompson",
  },
  {
    id: "doc-3",
    name: "Immunization Records - Alex",
    category: "medical",
    type: "PDF",
    childId: "student-1",
    childName: "Alex Thompson",
    uploadedDate: new Date("2023-08-15"),
    expiryDate: new Date("2024-08-15"),
    size: "512 KB",
    status: "valid",
    url: "#",
    isRequired: true,
    uploadedBy: "Robert Thompson",
    description: "Complete vaccination record",
  },
  {
    id: "doc-4",
    name: "Immunization Records - Emma",
    category: "medical",
    type: "PDF",
    childId: "student-2",
    childName: "Emma Thompson",
    uploadedDate: new Date("2023-08-15"),
    expiryDate: new Date("2024-08-15"),
    size: "498 KB",
    status: "valid",
    url: "#",
    isRequired: true,
    uploadedBy: "Robert Thompson",
  },
  {
    id: "doc-5",
    name: "Report Card - Fall 2023",
    category: "academic",
    type: "PDF",
    childId: "student-1",
    childName: "Alex Thompson",
    uploadedDate: new Date("2023-12-20"),
    size: "1.2 MB",
    status: "valid",
    url: "#",
    uploadedBy: "School System",
  },
  {
    id: "doc-6",
    name: "Field Trip Permission Form",
    category: "permission",
    type: "PDF",
    childId: "student-1",
    childName: "Alex Thompson",
    uploadedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    size: "156 KB",
    status: "valid",
    url: "#",
    uploadedBy: "Robert Thompson",
    description: "Science Museum Visit - March 2024",
  },
  {
    id: "doc-7",
    name: "Payment Receipt - Spring 2024",
    category: "financial",
    type: "PDF",
    uploadedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    size: "89 KB",
    status: "valid",
    url: "#",
    uploadedBy: "Finance Department",
  },
  {
    id: "doc-8",
    name: "Medical Consent Form",
    category: "medical",
    type: "PDF",
    childId: "student-2",
    childName: "Emma Thompson",
    uploadedDate: new Date("2023-09-01"),
    expiryDate: new Date("2024-09-01"),
    size: "234 KB",
    status: "valid",
    url: "#",
    isRequired: true,
    uploadedBy: "Robert Thompson",
  },
]

const mockRequiredDocuments: RequiredDocument[] = [
  {
    id: "req-1",
    name: "Emergency Contact Form",
    category: "administrative",
    description:
      "Updated emergency contact information for current school year",
    isUploaded: false,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    childSpecific: false,
  },
  {
    id: "req-2",
    name: "Health Insurance Card",
    category: "medical",
    description: "Copy of current health insurance card",
    isUploaded: false,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    childSpecific: true,
  },
  {
    id: "req-3",
    name: "Photo ID",
    category: "administrative",
    description: "Recent passport-style photo for student ID",
    isUploaded: false,
    childSpecific: true,
  },
]

const mockFolders: DocumentFolder[] = [
  {
    id: "folder-1",
    name: "Academic Records",
    icon: <GraduationCap className="h-4 w-4" />,
    count: mockDocuments.filter((d) => d.category === "academic").length,
    category: "academic",
  },
  {
    id: "folder-2",
    name: "Medical Documents",
    icon: <Heart className="h-4 w-4" />,
    count: mockDocuments.filter((d) => d.category === "medical").length,
    category: "medical",
  },
  {
    id: "folder-3",
    name: "Financial Records",
    icon: <CreditCard className="h-4 w-4" />,
    count: mockDocuments.filter((d) => d.category === "financial").length,
    category: "financial",
  },
  {
    id: "folder-4",
    name: "Administrative",
    icon: <FileText className="h-4 w-4" />,
    count: mockDocuments.filter((d) => d.category === "administrative").length,
    category: "administrative",
  },
  {
    id: "folder-5",
    name: "Permission Forms",
    icon: <FileCheck className="h-4 w-4" />,
    count: mockDocuments.filter((d) => d.category === "permission").length,
    category: "permission",
  },
]

// ============================================================================
// Component
// ============================================================================

export function DocumentsTab({
  profile,
  dictionary,
  lang = "en",
  isOwner = false,
  className,
}: DocumentsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    DocumentCategory | "all"
  >("all")
  const [selectedChild, setSelectedChild] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  const { children } = profile

  // Filter documents
  const filteredDocuments = mockDocuments.filter((doc) => {
    if (selectedCategory !== "all" && doc.category !== selectedCategory)
      return false
    if (selectedChild !== "all" && doc.childId && doc.childId !== selectedChild)
      return false
    if (
      searchTerm &&
      !doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false
    return true
  })

  // Calculate statistics
  const totalDocuments = mockDocuments.length
  const requiredPending = mockRequiredDocuments.filter(
    (d) => !d.isUploaded
  ).length
  const expiringCount = mockDocuments.filter((d) => {
    if (!d.expiryDate) return false
    const daysUntilExpiry =
      (d.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }).length
  const uploadProgress =
    (mockRequiredDocuments.filter((d) => d.isUploaded).length /
      mockRequiredDocuments.length) *
      100 || 0

  const getCategoryColor = (category: DocumentCategory) => {
    switch (category) {
      case "academic":
        return "text-blue-500"
      case "medical":
        return "text-red-500"
      case "financial":
        return "text-green-500"
      case "administrative":
        return "text-purple-500"
      case "permission":
        return "text-yellow-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case "valid":
        return "text-green-500"
      case "expired":
        return "text-red-500"
      case "pending":
        return "text-yellow-500"
      case "rejected":
        return "text-red-500"
      default:
        return ""
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Alert for Required Documents */}
      {requiredPending > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CircleAlert className="h-5 w-5 text-yellow-500" />
              <div className="flex-1">
                <p className="font-medium">Action Required</p>
                <p className="text-muted-foreground text-sm">
                  You have {requiredPending} required document
                  {requiredPending > 1 ? "s" : ""} pending upload
                </p>
              </div>
              <Button variant="outline" size="sm">
                View Required
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDocuments}</p>
                <p className="text-muted-foreground text-xs">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-500/10 p-2">
                <CircleAlert className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requiredPending}</p>
                <p className="text-muted-foreground text-xs">
                  Required Pending
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/10 p-2">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiringCount}</p>
                <p className="text-muted-foreground text-xs">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <CircleCheck className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {uploadProgress.toFixed(0)}%
                </p>
                <p className="text-muted-foreground text-xs">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Folders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="h-4 w-4" />
            Document Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {mockFolders.map((folder) => (
              <button
                key={folder.id}
                className={cn(
                  "hover:bg-muted/50 rounded-lg border p-3 transition-colors",
                  selectedCategory === folder.category && "bg-muted"
                )}
                onClick={() => setSelectedCategory(folder.category)}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "bg-muted rounded-lg p-2",
                      getCategoryColor(folder.category)
                    )}
                  >
                    {folder.icon}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{folder.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {folder.count} files
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-9"
              />
            </div>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
            >
              <option value="all">All Children</option>
              {(children || []).map((child) => (
                <option key={child.id} value={child.id}>
                  {child.givenName} {child.surname}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedCategory("all")}
            >
              <ListFilter className="h-4 w-4" />
            </Button>
            <Button>
              <Upload className="me-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Required Documents */}
      {requiredPending > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleAlert className="h-4 w-4" />
              Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockRequiredDocuments
              .filter((d) => !d.isUploaded)
              .map((doc) => (
                <div key={doc.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{doc.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {doc.category}
                        </Badge>
                        {doc.childSpecific && (
                          <Badge variant="secondary" className="text-xs">
                            Per Child
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {doc.description}
                      </p>
                      {doc.dueDate && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          Due: {format(doc.dueDate, "MMM dd, yyyy")}
                        </p>
                      )}
                    </div>
                    <Button size="sm">
                      <Upload className="me-1 h-3 w-3" />
                      Upload
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents ({filteredDocuments.length})
            </span>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                List
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {viewMode === "list" ? (
            // List View
            filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "bg-muted rounded-lg p-2",
                        getCategoryColor(doc.category)
                      )}
                    >
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{doc.name}</p>
                        {doc.isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                        <Badge
                          variant={
                            doc.status === "valid" ? "default" : "secondary"
                          }
                          className={cn("text-xs", getStatusColor(doc.status))}
                        >
                          {doc.status}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                        {doc.childName && (
                          <>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {doc.childName}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>
                          Uploaded {format(doc.uploadedDate, "MMM dd, yyyy")}
                        </span>
                        <span>•</span>
                        <span>By {doc.uploadedBy}</span>
                      </div>
                      {doc.expiryDate && (
                        <div className="mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-orange-500" />
                          <span className="text-xs text-orange-500">
                            Expires: {format(doc.expiryDate, "MMM dd, yyyy")}
                          </span>
                        </div>
                      )}
                      {doc.description && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share className="h-4 w-4" />
                    </Button>
                    {isOwner && (
                      <Button variant="ghost" size="sm">
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Grid View
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "bg-muted mb-3 rounded-lg p-3",
                        getCategoryColor(doc.category)
                      )}
                    >
                      <FileText className="h-6 w-6" />
                    </div>
                    <p className="w-full truncate text-sm font-medium">
                      {doc.name}
                    </p>
                    {doc.childName && (
                      <p className="text-muted-foreground text-xs">
                        {doc.childName}
                      </p>
                    )}
                    <Badge
                      variant={doc.status === "valid" ? "default" : "secondary"}
                      className="mt-2 text-xs"
                    >
                      {doc.status}
                    </Badge>
                    <div className="mt-3 flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredDocuments.length === 0 && (
            <div className="text-muted-foreground py-8 text-center">
              No documents found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
