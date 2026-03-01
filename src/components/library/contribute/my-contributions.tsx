// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import { Shell as PageContainer } from "@/components/table/shell"

interface Props {
  lang: Locale
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export default async function MyContributionsContent({ lang }: Props) {
  const isRTL = lang === "ar"
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <PageContainer>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-muted-foreground">
            {isRTL ? "يرجى تسجيل الدخول" : "Please sign in"}
          </p>
        </div>
      </PageContainer>
    )
  }

  const contributions = await db.catalogBook.findMany({
    where: { contributedBy: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      author: true,
      genre: true,
      approvalStatus: true,
      rejectionReason: true,
      status: true,
      createdAt: true,
      coverUrl: true,
      coverColor: true,
    },
  })

  const t = {
    heading: isRTL ? "مساهماتي" : "My Contributions",
    subtitle: isRTL
      ? "تتبع حالة الكتب التي ساهمت بها في الكتالوج العالمي"
      : "Track the status of books you contributed to the global catalog",
    noContributions: isRTL
      ? "لم تساهم بأي كتب بعد"
      : "You haven't contributed any books yet",
    contributeFirst: isRTL ? "ساهم بكتابك الأول" : "Contribute your first book",
    title: isRTL ? "العنوان" : "Title",
    author: isRTL ? "المؤلف" : "Author",
    genre: isRTL ? "النوع" : "Genre",
    status: isRTL ? "الحالة" : "Status",
    date: isRTL ? "التاريخ" : "Date",
    reason: isRTL ? "السبب" : "Reason",
    contributeMore: isRTL ? "ساهم بكتاب آخر" : "Contribute another book",
    pending: isRTL ? "قيد المراجعة" : "Pending",
    approved: isRTL ? "مقبول" : "Approved",
    rejected: isRTL ? "مرفوض" : "Rejected",
  }

  const statusLabels: Record<string, string> = {
    PENDING: t.pending,
    APPROVED: t.approved,
    REJECTED: t.rejected,
  }

  if (contributions.length === 0) {
    return (
      <PageContainer>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">{t.noContributions}</p>
          <Button asChild>
            <Link href="/library/contribute">{t.contributeFirst}</Link>
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>{t.heading}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
          <Button asChild>
            <Link href="/library/contribute">{t.contributeMore}</Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-start">{t.title}</th>
                <th className="py-3 text-start">{t.author}</th>
                <th className="py-3 text-start">{t.genre}</th>
                <th className="py-3 text-start">{t.status}</th>
                <th className="py-3 text-start">{t.date}</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((book) => (
                <tr key={book.id} className="border-b">
                  <td className="py-3">
                    <strong>{book.title}</strong>
                  </td>
                  <td className="py-3">{book.author}</td>
                  <td className="py-3">{book.genre}</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="secondary"
                        className={STATUS_STYLES[book.approvalStatus] || ""}
                      >
                        {statusLabels[book.approvalStatus] ||
                          book.approvalStatus}
                      </Badge>
                      {book.approvalStatus === "REJECTED" &&
                        book.rejectionReason && (
                          <span className="text-muted-foreground text-xs">
                            {t.reason}: {book.rejectionReason}
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="text-muted-foreground py-3">
                    {book.createdAt.toLocaleDateString(
                      isRTL ? "ar-SA" : "en-US"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  )
}
