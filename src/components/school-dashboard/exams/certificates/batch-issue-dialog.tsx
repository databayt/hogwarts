"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Batch certificate issuance dialog for exam results page
import { useEffect, useState, useTransition } from "react"
import { Award, CheckCircle, Loader2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { batchGenerateCertificates, getCertificateConfigs } from "./actions"
import type { CertificateConfigSummary } from "./actions/types"

interface BatchIssueDialogProps {
  examId: string
  examTitle: string
  eligibleCount: number
}

export function BatchIssueDialog({
  examId,
  examTitle,
  eligibleCount,
}: BatchIssueDialogProps) {
  const [configs, setConfigs] = useState<CertificateConfigSummary[]>([])
  const [selectedConfig, setSelectedConfig] = useState<string>("")
  const [isIssuing, setIsIssuing] = useState(false)
  const [result, setResult] = useState<{
    generated: number
    skipped: number
    failed: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const configList = await getCertificateConfigs()
      setConfigs(configList)
      if (configList.length > 0) setSelectedConfig(configList[0].id)
    })
  }, [])

  async function handleIssue() {
    if (!selectedConfig) return
    setIsIssuing(true)
    setError(null)
    setResult(null)

    try {
      const response = await batchGenerateCertificates({
        examId,
        configId: selectedConfig,
      })

      if (response.success) {
        if (response.data) {
          setResult({
            generated: response.data.generated,
            skipped: response.data.skipped,
            failed: response.data.failed,
          })
        }
      } else {
        setError(response.error)
      }
    } catch {
      setError("Failed to issue certificates")
    } finally {
      setIsIssuing(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Award className="h-4 w-4" />
          Issue Certificates
          {eligibleCount > 0 && (
            <Badge variant="secondary" className="ms-1 text-xs">
              {eligibleCount}
            </Badge>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batch Issue Certificates</AlertDialogTitle>
          <AlertDialogDescription>
            Issue certificates for eligible students in &quot;{examTitle}&quot;.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {result ? (
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Certificates issued!</span>
            </div>
            <div className="bg-muted/50 grid grid-cols-3 gap-3 rounded-md p-3">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">
                  {result.generated}
                </p>
                <p className="text-muted-foreground text-xs">Issued</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-yellow-600">
                  {result.skipped}
                </p>
                <p className="text-muted-foreground text-xs">Skipped</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-600">
                  {result.failed}
                </p>
                <p className="text-muted-foreground text-xs">Failed</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">
                Certificate Template
              </label>
              {isPending ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground text-sm">
                    Loading templates...
                  </span>
                </div>
              ) : configs.length === 0 ? (
                <p className="text-muted-foreground py-2 text-sm">
                  No certificate templates configured. Create one in certificate
                  settings first.
                </p>
              ) : (
                <Select
                  value={selectedConfig}
                  onValueChange={setSelectedConfig}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {configs.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.name} ({config.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-sm">
                <strong>{eligibleCount}</strong> students are eligible based on
                the selected template criteria.
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Students who already have a certificate for this exam or were
                absent will be skipped.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>{result ? "Close" : "Cancel"}</AlertDialogCancel>
          {!result && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleIssue()
              }}
              disabled={isIssuing || !selectedConfig || configs.length === 0}
            >
              {isIssuing ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  Issuing...
                </>
              ) : (
                "Issue Certificates"
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
