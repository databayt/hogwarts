"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, CheckIcon } from "lucide-react"

import { useConfetti } from "@/hooks/use-confetti"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Props {
  dictionary: any
  lang: string
  schoolId: string | null
  sessionId?: string
}

export function StreamPaymentSuccessContent({
  dictionary,
  lang,
  schoolId,
  sessionId,
}: Props) {
  const triggerConfetti = useConfetti()

  useEffect(() => {
    triggerConfetti()
  }, [triggerConfetti])

  return (
    <div className="flex min-h-screen w-full flex-1 items-center justify-center">
      <Card className="w-[350px]">
        <CardContent>
          <div className="flex w-full justify-center">
            <CheckIcon className="size-12 rounded-full bg-green-500/30 p-2 text-green-500" />
          </div>
          <div className="mt-3 w-full text-center sm:mt-5">
            <h2 className="text-xl font-semibold">Payment Successfull</h2>
            <p className="text-muted-foreground mt-2 text-sm tracking-tight text-balance">
              Congrats your payment was successfull. You should now have access
              to the course!
            </p>

            <Link
              href="/dashboard"
              className={buttonVariants({ className: "mt-5 w-full" })}
            >
              <ArrowLeft className="size-4" />
              Go to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
