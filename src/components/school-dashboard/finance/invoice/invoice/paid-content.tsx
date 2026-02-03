"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import Loading from "@/components/school-dashboard/finance/invoice/loading"
import type { Invoice } from "@/components/school-dashboard/finance/invoice/types"

interface Props {
  invoiceId: string
  dictionary: any
  lang: Locale
}

export default function PaidInvoiceContent({
  invoiceId,
  dictionary,
  lang,
}: Props) {
  const [data, setData] = useState<Invoice>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const res =
        await import("@/components/school-dashboard/finance/invoice/actions")
      const response = await res.getInvoiceById(String(invoiceId))
      if (response.success && response.data) setData(response.data)
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpdate = async () => {
    try {
      setIsLoading(true)
      const res =
        await import("@/components/school-dashboard/finance/invoice/actions")
      const response = await res.updateInvoice(String(invoiceId), {
        ...data!,
        status: "PAID",
      } as any)
      if (response.success) {
        fetchData()
        toast.success("Invoice status updated")
      } else {
        toast.error(response.error || "Something went wrong")
      }
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative z-10 flex items-center gap-4">
        <Link
          href={`/${lang}/invoice`}
          className={buttonVariants({ size: "icon" })}
        >
          <ArrowLeft />
        </Link>
        <h1 className="font-semibold"> Invoice Status</h1>
      </div>

      <div className="relative flex min-h-[calc(100dvh-200px)] flex-col items-center justify-center">
        <div className="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] [background-size:16px_16px]"></div>

        <Card className="relative z-10 min-w-sm">
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
            <CardDescription>Make your invoice paid</CardDescription>
          </CardHeader>
          <CardContent className="py-4">
            {isLoading ? (
              <Loading />
            ) : data?.status === "UNPAID" ? (
              <Button className="w-full" onClick={handleUpdate}>
                Make Invoice Paid
              </Button>
            ) : (
              <div
                className={cn(
                  "flex items-center gap-3 bg-green-50 p-4 font-semibold text-green-600"
                )}
              >
                <Check />
                <p>Your invoice payment done</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
