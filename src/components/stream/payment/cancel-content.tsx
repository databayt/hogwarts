// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { ArrowLeft, XIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Props {
  dictionary: Record<string, any>
  lang: string
}

export default function PaymentCancelContent({ dictionary, lang }: Props) {
  const d = dictionary?.payment?.cancel

  return (
    <div className="flex min-h-screen w-full flex-1 items-center justify-center">
      <Card className="w-[350px]">
        <CardContent>
          <div className="flex w-full justify-center">
            <XIcon className="size-12 rounded-full bg-red-500/30 p-2 text-red-500" />
          </div>
          <div className="mt-3 w-full text-center sm:mt-5">
            <h2 className="text-xl font-semibold">
              {d?.title || "Payment Cancelled"}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm tracking-tight text-balance">
              {d?.detail ||
                "Your enrollment was not completed. You can try again anytime."}
            </p>

            <Link
              href={`/${lang}/stream/courses`}
              className={buttonVariants({ className: "mt-5 w-full" })}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {d?.browseCourses || "Browse Courses"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
