"use client"

import React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { useLocale } from "@/components/internationalization/use-locale"

interface Stage {
  number: number
  title: string
  description: string
  illustration: string
}

interface ApplyOverviewClientProps {
  dictionary: Dictionary["school"]["admission"]["form"]
  lang: Locale
  subdomain: string
  id?: string
}

const ApplyOverviewClient: React.FC<ApplyOverviewClientProps> = ({
  dictionary,
  lang,
  subdomain,
  id,
}) => {
  const router = useRouter()
  const [isStarting, setIsStarting] = React.useState(false)
  const { isRTL } = useLocale()

  const applyDict = (
    dictionary as unknown as {
      apply?: {
        overview?: Record<string, string>
      }
    }
  )?.apply
  const overviewDict = applyDict?.overview ?? {}

  // 3 stages matching ADMISSION_CONFIG.groupLabels
  const stages: Stage[] = [
    {
      number: 1,
      title: isRTL ? "المعلومات الأساسية" : "Basic Information",
      description: isRTL
        ? "أدخل بياناتك الشخصية ومعلومات الاتصال"
        : "Provide your personal and contact details",
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/5dfb835ad3cbbf76b85824e969146eac20329e72-1000x1000.svg",
    },
    {
      number: 2,
      title: isRTL ? "العائلة والتعليم" : "Family & Education",
      description: isRTL
        ? "أضف معلومات ولي الأمر والخلفية الأكاديمية"
        : "Add guardian info and academic background",
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/521a945a74f2d25262db4a002073aaeec9bc1919-1000x1000.svg",
    },
    {
      number: 3,
      title: isRTL ? "الإنهاء" : "Finalize",
      description: isRTL
        ? "ارفع المستندات وراجع طلبك"
        : "Upload documents and review your application",
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/0321b0ecbbf93535e93be1310ae1935157bcebdd-1000x1000.svg",
    },
  ]

  const handleGetStarted = async () => {
    if (isStarting || !id) return
    setIsStarting(true)

    try {
      router.push(`/${lang}/apply/${id}/personal`)
    } catch (error) {
      console.error("Navigation error:", error)
    } finally {
      setIsStarting(false)
    }
  }

  const handleBack = () => {
    router.push(`/${lang}/apply`)
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col pb-24">
      <div className="flex flex-1 items-center">
        <div className="w-full">
          <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
            {/* Left Side - Title */}
            <div>
              <h2 className="text-start text-4xl font-bold tracking-tight">
                {overviewDict.title ||
                  (isRTL ? "خطوات التقديم" : "Application Steps")}
              </h2>
              <p className="text-muted-foreground mt-4 text-start">
                {overviewDict.subtitle ||
                  (isRTL
                    ? "اتبع هذه الخطوات لإكمال طلب التقديم"
                    : "Follow these steps to complete your application")}
              </p>
            </div>

            {/* Right Side - 3 Stages */}
            <div className="space-y-6">
              {stages.map((stage) => (
                <div
                  key={stage.number}
                  className="flex items-start justify-between gap-6 rtl:flex-row-reverse"
                >
                  <div className="flex flex-1 gap-3 rtl:flex-row-reverse">
                    <div className="flex-shrink-0">
                      <h4 className="text-foreground">{stage.number}.</h4>
                    </div>
                    <div className="text-start">
                      <h4 className="mb-1 font-semibold">{stage.title}</h4>
                      <p className="text-muted-foreground">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                  <div className="hidden flex-shrink-0 justify-end md:flex rtl:justify-start">
                    <div className="relative h-14 w-14 overflow-hidden">
                      <Image
                        src={stage.illustration}
                        alt={stage.title}
                        fill
                        sizes="56px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed footer - matches onboarding pattern */}
      <footer className="bg-background fixed right-0 bottom-0 left-0 px-4 py-3 sm:px-6 sm:py-4 md:px-12 lg:px-20">
        <Separator className="mx-auto mb-3 w-full max-w-5xl sm:mb-4" />
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between rtl:flex-row-reverse">
          <Button variant="ghost" onClick={handleBack}>
            {overviewDict.back || (isRTL ? "رجوع" : "Back")}
          </Button>
          <Button onClick={handleGetStarted} disabled={isStarting || !id}>
            {isStarting
              ? overviewDict.loading ||
                (isRTL ? "جاري التحميل..." : "Loading...")
              : overviewDict.getStarted || (isRTL ? "ابدأ" : "Get Started")}
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default ApplyOverviewClient
