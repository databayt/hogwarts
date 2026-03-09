// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import {
  Award,
  Download,
  FileCheck,
  Plus,
  Settings,
  Share2,
} from "lucide-react"

import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { getCertificateConfigs, getCertificates } from "./actions"
import { CertificateList } from "./certificate-list"
import { CertificateConfigList } from "./config-list"

export async function CertificateContent() {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  if (!schoolId) return null

  const role = session.user.role || "USER"
  const canManage = ["DEVELOPER", "ADMIN"].includes(role)
  const isStudentOrGuardian = ["STUDENT", "GUARDIAN"].includes(role)

  // For students/guardians, scope certificates to their own
  let studentIds: string[] = []
  if (isStudentOrGuardian) {
    if (role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { userId: session.user.id, schoolId },
        select: { id: true },
      })
      if (student) studentIds = [student.id]
    } else if (role === "GUARDIAN") {
      const guardian = await db.guardian.findFirst({
        where: { userId: session.user.id, schoolId },
        select: { id: true },
      })
      if (guardian) {
        const sgs = await db.studentGuardian.findMany({
          where: { guardianId: guardian.id, schoolId },
          select: { studentId: true },
        })
        studentIds = sgs.map((sg) => sg.studentId)
      }
    }
  }

  const fetchCertificates =
    isStudentOrGuardian && studentIds.length > 0
      ? Promise.all(
          studentIds.map((sid) => getCertificates({ studentId: sid }))
        ).then((results) => results.flat())
      : getCertificates()

  const [configs, certificates] = await Promise.all([
    canManage ? getCertificateConfigs() : Promise.resolve([]),
    fetchCertificates,
  ])

  // Student/Guardian view: simplified certificate gallery
  if (isStudentOrGuardian) {
    const activeCerts = certificates.filter((c: any) => c.status === "active")

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Certificates</h2>
          <p className="text-muted-foreground">
            {activeCerts.length > 0
              ? `You have ${activeCerts.length} certificate${activeCerts.length === 1 ? "" : "s"}`
              : "No certificates issued yet"}
          </p>
        </div>

        {activeCerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Award className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">
                No certificates yet
              </h3>
              <p className="text-muted-foreground text-sm">
                Certificates will appear here when they are issued to you
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeCerts.map((cert: any) => (
              <Card key={cert.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {cert.examTitle || "Certificate"}
                      </CardTitle>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {cert.recipientName}
                      </p>
                    </div>
                    <FileCheck className="text-primary h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {cert.score && (
                      <Badge variant="secondary">{cert.score}%</Badge>
                    )}
                    {cert.grade && (
                      <Badge variant="outline">{cert.grade}</Badge>
                    )}
                    {cert.rank && <Badge>#{cert.rank}</Badge>}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    #{cert.certificateNumber} &middot; Issued{" "}
                    {new Date(cert.issuedAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    {cert.pdfUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a href={cert.pdfUrl} target="_blank" rel="noopener">
                          <Download className="me-1 h-3.5 w-3.5" />
                          Download
                        </a>
                      </Button>
                    )}
                    {cert.verificationCode && (
                      <Button asChild variant="ghost" size="sm">
                        <a
                          href={`/verify/${cert.verificationCode}`}
                          target="_blank"
                          rel="noopener"
                        >
                          <Share2 className="me-1 h-3.5 w-3.5" />
                          Verify
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Admin/Teacher view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Certificates</h2>
          <p className="text-muted-foreground">
            Manage certificate templates and issue certificates to students
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <a href="certificates/cert-wizard">
              <Plus className="me-2 h-4 w-4" />
              New Template
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Settings className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configs.length}</div>
            <p className="text-muted-foreground text-xs">Active templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued</CardTitle>
            <Award className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificates.length}</div>
            <p className="text-muted-foreground text-xs">
              Total certificates issued
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Award className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {certificates.filter((c: any) => c.status === "active").length}
            </div>
            <p className="text-muted-foreground text-xs">
              Currently active certificates
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="certificates">
        <TabsList>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          {canManage && <TabsTrigger value="templates">Templates</TabsTrigger>}
        </TabsList>
        <TabsContent value="certificates" className="space-y-4">
          <CertificateList
            certificates={certificates as any}
            canManage={canManage}
          />
        </TabsContent>
        {canManage && (
          <TabsContent value="templates" className="space-y-4">
            <CertificateConfigList configs={configs} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default CertificateContent
