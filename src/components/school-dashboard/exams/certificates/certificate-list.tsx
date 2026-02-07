"use client"

import { useState } from "react"
import {
  Award,
  ExternalLink,
  MoreHorizontal,
  Share2,
  XCircle,
} from "lucide-react"

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
    givenName: string
    middleName: string | null
    surname: string
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
        title: "Certificate shared",
        description: `Share URL: ${result.data.shareUrl}`,
      })
    } else if (!result.success) {
      toast({
        title: "Error",
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
      toast({ title: "Certificate revoked" })
    } else if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  if (certificates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Award className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-lg font-medium">No certificates yet</h3>
        <p className="text-muted-foreground text-sm">
          Certificates will appear here once generated for exam results.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Certificate #</TableHead>
          <TableHead>Student</TableHead>
          <TableHead>Exam</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Issued</TableHead>
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
                <Badge variant="outline" className="ml-2">
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
            <TableCell>
              {new Date(cert.issuedAt).toLocaleDateString()}
            </TableCell>
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
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    {cert.isPublic && (
                      <DropdownMenuItem asChild>
                        <a
                          href={`/exams/certificates/verify/${cert.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Public
                        </a>
                      </DropdownMenuItem>
                    )}
                    {cert.status === "active" && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleRevoke(cert.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Revoke
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
