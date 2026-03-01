"use client"

import { useEffect, useState, useTransition } from "react"
import { Download, FileText, Loader2, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  createExamVersion,
  deleteExamVersion,
  getExamVersions,
} from "./actions/versions"
import type { ExamVersion } from "./actions/versions"

interface VersionLibraryProps {
  examId: string
}

export function VersionLibrary({ examId }: VersionLibraryProps) {
  const [versions, setVersions] = useState<ExamVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, startCreateTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Load versions on mount
  useEffect(() => {
    loadVersions()
  }, [examId])

  async function loadVersions() {
    setLoading(true)
    setError(null)

    const result = await getExamVersions(examId)
    if (result.success && result.data) {
      setVersions(result.data.versions)
    } else {
      setError(result.error || "Failed to load versions")
    }

    setLoading(false)
  }

  function handleCreate() {
    startCreateTransition(async () => {
      const result = await createExamVersion(examId)
      if (result.success) {
        await loadVersions()
      } else {
        setError(result.error || "Failed to create version")
      }
    })
  }

  async function handleDelete(generatedExamId: string) {
    setDeletingId(generatedExamId)
    setError(null)

    const result = await deleteExamVersion(generatedExamId)
    if (result.success) {
      await loadVersions()
    } else {
      setError(result.error || "Failed to delete version")
    }

    setDeletingId(null)
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        <span className="text-muted-foreground ms-2 text-sm">
          Loading versions...
        </span>
      </div>
    )
  }

  // Error state
  if (error && versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={loadVersions}>
          Try Again
        </Button>
      </div>
    )
  }

  // Empty state
  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <FileText className="text-muted-foreground h-12 w-12" />
        <div className="text-center">
          <p className="font-medium">No versions generated yet</p>
          <p className="text-muted-foreground text-sm">
            Generate your first exam version to get started.
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="me-2 h-4 w-4" />
              Generate Version
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Version Library</h3>
          <p className="text-muted-foreground text-sm">
            {versions.length} version{versions.length !== 1 ? "s" : ""}{" "}
            generated
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isCreating} size="sm">
          {isCreating ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="me-2 h-4 w-4" />
              New Version
            </>
          )}
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Version cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {versions.map((version) => (
          <Card key={version.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{version.title}</CardTitle>
                {version.isActive && (
                  <Badge variant="default" className="ms-2 shrink-0">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {formatDate(version.createdAt)}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Questions:</span>{" "}
                  <span className="font-medium">{version.questionCount}</span>
                </div>
                {version.totalMarks !== null && (
                  <div>
                    <span className="text-muted-foreground">Marks:</span>{" "}
                    <span className="font-medium">{version.totalMarks}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {version.hasPaper && version.paperUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a
                      href={version.paperUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="me-2 h-3.5 w-3.5" />
                      Download Paper
                    </a>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled
                  >
                    <FileText className="me-2 h-3.5 w-3.5" />
                    No Paper
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
                  disabled={versions.length <= 1 || deletingId === version.id}
                  onClick={() => handleDelete(version.id)}
                  title={
                    versions.length <= 1
                      ? "Cannot delete the only version"
                      : "Delete version"
                  }
                >
                  {deletingId === version.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
