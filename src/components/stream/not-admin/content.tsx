// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { ArrowLeft, ShieldX } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { StreamDictionary } from "../types"

interface Props {
  dictionary: Pick<StreamDictionary, "header"> & {
    notAdmin?: {
      title?: string
      description?: string
      backToHome?: string
    }
  }
  lang: string
  subdomain: string
}

export function StreamNotAdminContent({ dictionary, lang }: Props) {
  const title =
    dictionary.notAdmin?.title ??
    (lang === "ar" ? "الوصول مقيّد" : "Access Restricted")
  const description =
    dictionary.notAdmin?.description ??
    (lang === "ar"
      ? "ليس لديك صلاحيات المسؤول لإنشاء الدورات."
      : "You are not an admin, which means you cannot create courses.")
  const backToHome =
    dictionary.notAdmin?.backToHome ??
    dictionary.header?.home ??
    (lang === "ar" ? "العودة إلى الرئيسية" : "Back to home")

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto w-fit rounded-full p-4">
            <ShieldX className="text-destructive size-16" />
          </div>

          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="mx-auto max-w-xs">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={`/${lang}`}
            className={buttonVariants({
              className: "w-full",
            })}
          >
            <ArrowLeft className="me-1 size-4 rtl:rotate-180" />
            {backToHome}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
