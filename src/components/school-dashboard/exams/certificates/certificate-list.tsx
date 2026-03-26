"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import {
  Award,
  ExternalLink,
  MoreHorizontal,
  Share2,
  XCircle,
} from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { revokeCertificate, shareCertificate } from "./actions"

interface Certificate {
  id: string
  certificateNumber: string
  recipientName: string
  examTitle: string
  score: number
  grade: string | null
  status: string
  issuedAt: Date
  isPublic: boolean
  viewCount: number
  config: { name: string; type: string }
  student: {
    firstName: string
    middleName: string | null
    lastName: string
  }
}

export function CertificateList({
  certificates,
  canManage,
}: {
  certificates: Certificate[]
  canManage: boolean
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.exams?.certificates?.list
  const cl = dictionary?.school?.exams?.certificateList

  async function handleShare(id: string) {
    setLoading(id)
    const result = await shareCertificate({
      id,
      isPublic: true,
      expiryDays: 30,
    })
    setLoading(null)

    if (result.success && result.data) {
      toast({
        title: t?.toast?.shared ?? "Certificate shared",
        description: `Share URL: ${result.data.shareUrl}`,
      })
    } else if (!result.success) {
      toast({
        title: t?.toast?.error ?? "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  async function handleRevoke(id: string) {
    setLoading(id)
    const result = await revokeCertificate({
      id,
      reason: "Revoked by administrator",
    })
    setLoading(null)

    if (result.success) {
      toast({ title: t?.toast?.revoked ?? "Certificate revoked" })
    } else if (!result.success) {
      toast({
        title: t?.toast?.error ?? "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  if (certificates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Award className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-lg font-medium">
          {cl?.noCertificatesYet ?? "No certificates yet"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {cl?.certificatesAppearHere ??
            "Certificates will appear here once generated for exam results."}
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t?.headers?.number ?? "Certificate #"}</TableHead>
          <TableHead>{t?.headers?.student ?? "Student"}</TableHead>
          <TableHead>{t?.headers?.exam ?? "Exam"}</TableHead>
          <TableHead>{t?.headers?.score ?? "Score"}</TableHead>
          <TableHead>{t?.headers?.type ?? "Type"}</TableHead>
          <TableHead>{t?.headers?.status ?? "Status"}</TableHead>
          <TableHead>{t?.headers?.issued ?? "Issued"}</TableHead>
          {canManage && <TableHead className="w-[50px]" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {certificates.map((cert) => (
          <TableRow key={cert.id}>
            <TableCell className="font-mono text-sm">
              {cert.certificateNumber}
            </TableCell>
            <TableCell>{cert.recipientName}</TableCell>
            <TableCell>{cert.examTitle}</TableCell>
            <TableCell>
              {cert.score.toFixed(1)}%
              {cert.grade && (
                <Badge variant="outline" className="ms-2">
                  {cert.grade}
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{cert.config.type}</Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={cert.status === "active" ? "default" : "destructive"}
              >
                {cert.status}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(cert.issuedAt, "ar")}</TableCell>
            {canManage && (
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading === cert.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleShare(cert.id)}>
                      <Share2 className="me-2 h-4 w-4" />
                      {cl?.share ?? "Share"}
                    </DropdownMenuItem>
                    {cert.isPublic && (
                      <DropdownMenuItem asChild>
                        <a
                          href={`/exams/certificates/verify/${cert.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="me-2 h-4 w-4" />
                          {cl?.viewPublic ?? "View Public"}
                        </a>
                      </DropdownMenuItem>
                    )}
                    {cert.status === "active" && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleRevoke(cert.id)}
                      >
                        <XCircle className="me-2 h-4 w-4" />
                        {cl?.revoke ?? "Revoke"}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
