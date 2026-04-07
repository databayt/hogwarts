// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/i18n-format"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getFeeStats } from "@/components/school-dashboard/finance/fees/queries"

export const metadata = { title: "Fee Collection Report" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function FeeReportsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.fees?.reports
  const { schoolId } = await getTenantContext()

  if (!schoolId) notFound()

  const [stats, recentPayments, topStructures] = await Promise.all([
    getFeeStats(schoolId),
    db.payment.findMany({
      where: { schoolId, status: "SUCCESS" },
      orderBy: { paymentDate: "desc" },
      take: 10,
      select: {
        id: true,
        paymentNumber: true,
        amount: true,
        paymentDate: true,
        paymentMethod: true,
        student: { select: { firstName: true, lastName: true } },
      },
    }),
    db.feeStructure.findMany({
      where: { schoolId, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        totalAmount: true,
        academicYear: true,
        _count: { select: { feeAssignments: true } },
      },
    }),
  ])

  const totalExpected =
    Object.values(stats.assignmentsByStatus).reduce(
      (sum, s) => sum + s.amount,
      0
    ) || 0
  const collectionRate =
    totalExpected > 0
      ? Math.round((stats.totalCollected / totalExpected) * 100)
      : 0

  const statusEntries = Object.entries(stats.assignmentsByStatus)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {d?.feeCollectionReport || "Fee Collection Report"}
        </h1>
        <p className="text-muted-foreground">
          {d?.reportDescription || "Overview of fee collection performance"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {d?.totalCollected || "Total Collected"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(stats.totalCollected, lang)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {d?.totalPending || "Total Pending"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(stats.totalPending, lang)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {d?.collectionRate || "Collection Rate"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{collectionRate}%</p>
            <Progress value={collectionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {d?.activeScholarships || "Active Scholarships"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {stats.totalScholarships}
            </p>
            <p className="text-muted-foreground text-sm">
              {stats.unpaidFines} {d?.unpaidFines || "unpaid fines"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>
            {d?.assignmentStatusBreakdown || "Assignment Status Breakdown"}
          </CardTitle>
          <CardDescription>
            {stats.totalStructures} {d?.feeStructures || "structures"},{" "}
            {stats.activeStructures}{" "}
            {dictionary?.finance?.common?.active || "active"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusEntries.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">
              {d?.noFeeAssignments || "No fee assignments found."}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {statusEntries.map(([status, data]) => {
                const colors: Record<string, string> = {
                  PAID: "bg-green-500/10 text-green-500",
                  PARTIAL: "bg-yellow-500/10 text-yellow-500",
                  PENDING: "bg-blue-500/10 text-blue-500",
                  OVERDUE: "bg-red-500/10 text-red-500",
                  CANCELLED: "bg-gray-500/10 text-gray-500",
                }
                return (
                  <div
                    key={status}
                    className="rounded-lg border p-4 text-center"
                  >
                    <Badge variant="outline" className={colors[status] || ""}>
                      {status}
                    </Badge>
                    <p className="mt-2 text-2xl font-bold tabular-nums">
                      {data.count}
                    </p>
                    <p className="text-muted-foreground text-sm tabular-nums">
                      {formatCurrency(data.amount, lang)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Fee Structures */}
        <Card>
          <CardHeader>
            <CardTitle>{d?.feeStructures || "Fee Structures"}</CardTitle>
            <CardDescription>
              {d?.activeFeeStructures || "Active fee structures"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d?.name || "Name"}</TableHead>
                  <TableHead>{d?.year || "Year"}</TableHead>
                  <TableHead>{d?.amount || "Amount"}</TableHead>
                  <TableHead>{d?.students || "Students"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topStructures.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.academicYear}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(Number(s.totalAmount), lang)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {s._count.feeAssignments}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>{d?.recentPayments || "Recent Payments"}</CardTitle>
            <CardDescription>
              {d?.lastPayments || "Last 10 successful payments"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d?.student || "Student"}</TableHead>
                  <TableHead>{d?.amount || "Amount"}</TableHead>
                  <TableHead>{d?.method || "Method"}</TableHead>
                  <TableHead>{d?.date || "Date"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {[p.student?.firstName, p.student?.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(Number(p.amount), lang)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {p.paymentMethod.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums">
                      {p.paymentDate
                        ? new Date(p.paymentDate).toLocaleDateString(
                            lang === "ar" ? "ar-SA" : "en-US"
                          )
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
