"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { TeacherCreateForm } from "../form"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
}

export default function AddTeacherContent({ dictionary, lang }: Props) {
  const router = useRouter()

  const d = dictionary?.teachers

  const t = {
    title: d?.addNewTeacher || "Add New Teacher",
    description:
      d?.addNewTeacherDescription || "Enter the new teacher's information",
    back: d?.back || "Back",
  }

  const handleSuccess = () => {
    router.push(`/${lang}/teachers`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${lang}/teachers`}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <TeacherCreateForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  )
}
