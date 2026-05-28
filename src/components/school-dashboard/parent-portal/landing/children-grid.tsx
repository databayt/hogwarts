// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { ArrowRight, User2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"

import { getMyChildren } from "../actions"

interface Props {
  lang: Locale
}

export async function ChildrenGrid({ lang }: Props) {
  const { children } = await getMyChildren()
  const isRTL = lang === "ar"

  if (children.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {isRTL ? "لا يوجد طلاب مرتبطون" : "No linked children"}
          </CardTitle>
          <CardDescription>
            {isRTL
              ? "يرجى الاتصال بإدارة المدرسة لربط حسابك بطلابك."
              : "Contact your school administration to link your account to your children."}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {children.map((child) => (
        <Link
          key={child.id}
          href={`/${lang}/parent/children/${child.id}`}
          className="group"
        >
          <Card className="hover:border-primary/40 h-full transition-colors">
            <CardHeader>
              <div className="bg-muted text-muted-foreground mb-3 flex h-10 w-10 items-center justify-center rounded-full">
                <User2 className="h-5 w-5" />
              </div>
              <CardTitle className="flex items-center justify-between">
                <span>{child.name}</span>
                <ArrowRight className="text-muted-foreground group-hover:text-primary h-4 w-4 transition-colors rtl:rotate-180" />
              </CardTitle>
              <CardDescription>
                {isRTL ? "رقم الطالب" : "Student ID"}:{" "}
                <Badge variant="outline">{child.studentId ?? "—"}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {isRTL
                  ? "اضغط لعرض الدرجات والحضور وبطاقات التقرير"
                  : "Tap to view grades, attendance, and report cards"}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
