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
import { formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { getCertificateConfigs, getCertificates } from "./actions"
import { CertificateList } from "./certificate-list"
import { CertificateConfigList } from "./config-list"

const STAT_CELL =
  "max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none"

export async function CertificateContent({ lang = "ar" }: { lang?: Locale }) {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  if (!schoolId) return null

  const dictionary = await getDictionary(lang)
  const t = dictionary?.school?.exams?.certificates
  const cc = dictionary?.school?.exams?.certificateContent

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
          <h2 className="text-2xl font-bold tracking-tight">
            {cc?.myCertificates ?? "My Certificates"}
          </h2>
          <p className="text-muted-foreground">
            {activeCerts.length > 0
              ? `${activeCerts.length} ${cc?.certificatesCount ?? "certificates"}`
              : (t?.noCertificates ?? "No certificates issued yet")}
          </p>
        </div>

        {activeCerts.length === 0 ? (
          <Card className="max-md:bg-muted max-md:border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Award className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">
                {cc?.noCertificatesYet ?? "No certificates yet"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {cc?.certificatesWillAppear ??
                  "Certificates will appear here when they are issued to you"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeCerts.map((cert: any) => (
              <Card key={cert.id} className="max-md:bg-muted max-md:border-0">
                <CardHeader className="pb-3 max-md:p-4 max-md:pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {cert.examTitle || (cc?.certificate ?? "Certificate")}
                      </CardTitle>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {cert.recipientName}
                      </p>
                    </div>
                    <FileCheck className="text-primary h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 max-md:px-4 max-md:pb-4">
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
                    #{cert.certificateNumber} &middot;{" "}
                    {cc?.issuedLabel ?? "Issued"}{" "}
                    {formatDate(cert.issuedAt, lang)}
                  </p>
                  <div className="flex gap-2">
                    {cert.pdfUrl && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="max-md:bg-background max-md:h-9 max-md:rounded-full max-md:border-0 max-md:px-4"
                      >
                        <a href={cert.pdfUrl} target="_blank" rel="noopener">
                          <Download className="me-1 h-3.5 w-3.5" />
                          {cc?.download ?? "Download"}
                        </a>
                      </Button>
                    )}
                    {cert.verificationCode && (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="max-md:h-9 max-md:rounded-full max-md:px-4"
                      >
                        <a
                          href={`/verify/${cert.verificationCode}`}
                          target="_blank"
                          rel="noopener"
                        >
                          <Share2 className="me-1 h-3.5 w-3.5" />
                          {cc?.verify ?? "Verify"}
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
          <h2 className="text-2xl font-bold tracking-tight">
            {cc?.certificates ?? "Certificates"}
          </h2>
          <p className="text-muted-foreground">
            {cc?.manageCertificatesDescription ??
              "Manage certificate templates and issue certificates to students"}
          </p>
        </div>
        {canManage && (
          <Button asChild className="max-md:rounded-full">
            <a href="certificates/configs/new">
              <Plus className="me-2 h-4 w-4" />
              {cc?.newTemplate ?? "New Template"}
            </a>
          </Button>
        )}
      </div>

      {/* Phone: one grey panel, two across, hairlines between the cells; the
          third figure spans the row. */}
      <div className="max-md:bg-border grid gap-4 max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl md:grid-cols-3 max-md:[&>*:last-child:nth-child(odd)]:col-span-2">
        <Card className={STAT_CELL}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:text-xs max-md:font-normal">
              {cc?.templates ?? "Templates"}
            </CardTitle>
            <Settings className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {configs.length}
            </div>
            <p className="text-muted-foreground text-xs">
              {cc?.activeTemplates ?? "Active templates"}
            </p>
          </CardContent>
        </Card>
        <Card className={STAT_CELL}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:text-xs max-md:font-normal">
              {cc?.issued ?? "Issued"}
            </CardTitle>
            <Award className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {certificates.length}
            </div>
            <p className="text-muted-foreground text-xs">
              {cc?.totalCertificatesIssued ?? "Total certificates issued"}
            </p>
          </CardContent>
        </Card>
        <Card className={STAT_CELL}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="max-md:text-muted-foreground text-sm font-medium max-md:text-xs max-md:font-normal">
              {cc?.active ?? "Active"}
            </CardTitle>
            <Award className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {certificates.filter((c: any) => c.status === "active").length}
            </div>
            <p className="text-muted-foreground text-xs">
              {cc?.currentlyActiveCertificates ??
                "Currently active certificates"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="certificates">
        <TabsList>
          <TabsTrigger value="certificates">
            {t?.tabs?.certificates ?? "Certificates"}
          </TabsTrigger>
          {canManage && (
            <TabsTrigger value="templates">
              {t?.tabs?.templates ?? "Templates"}
            </TabsTrigger>
          )}
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
