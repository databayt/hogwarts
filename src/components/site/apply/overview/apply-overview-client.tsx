"use client"

import React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { useLocale } from "@/components/internationalization/use-locale"

interface Step {
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

  // Access the apply dictionary for overview and steps
  const applyDict = (
    dictionary as unknown as {
      apply?: {
        overview?: Record<string, string>
        steps?: Record<string, { title?: string; description?: string }>
      }
    }
  )?.apply
  const overviewDict = applyDict?.overview ?? {}
  const stepsDict = applyDict?.steps ?? {}

  const steps: Step[] = [
    {
      number: 1,
      title: stepsDict.personal?.title || dictionary.stepPersonal,
      description:
        stepsDict.personal?.description ||
        (isRTL
          ? "أدخل بياناتك الشخصية الأساسية"
          : "Enter your basic personal information"),
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/5dfb835ad3cbbf76b85824e969146eac20329e72-1000x1000.svg",
    },
    {
      number: 2,
      title: stepsDict.guardian?.title || dictionary.stepGuardian,
      description:
        stepsDict.guardian?.description ||
        (isRTL ? "أضف معلومات ولي الأمر" : "Add guardian/parent information"),
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/521a945a74f2d25262db4a002073aaeec9bc1919-1000x1000.svg",
    },
    {
      number: 3,
      title: stepsDict.academic?.title || dictionary.stepAcademic,
      description:
        stepsDict.academic?.description ||
        (isRTL ? "أدخل خلفيتك الأكاديمية" : "Enter your academic background"),
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/0321b0ecbbf93535e93be1310ae1935157bcebdd-1000x1000.svg",
    },
    {
      number: 4,
      title: stepsDict.documents?.title || dictionary.stepDocuments,
      description:
        stepsDict.documents?.description ||
        (isRTL ? "ارفع المستندات المطلوبة" : "Upload required documents"),
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/5dfb835ad3cbbf76b85824e969146eac20329e72-1000x1000.svg",
    },
    {
      number: 5,
      title: stepsDict.review?.title || dictionary.stepReview,
      description:
        stepsDict.review?.description ||
        (isRTL ? "راجع طلبك وقدمه" : "Review and submit your application"),
      illustration:
        "https://www-cdn.anthropic.com/images/4zrzovbb/website/521a945a74f2d25262db4a002073aaeec9bc1919-1000x1000.svg",
    },
  ]

  const handleGetStarted = async () => {
    if (isStarting || !id) return
    setIsStarting(true)

    try {
      router.push(`/${lang}/s/${subdomain}/apply/${id}/personal`)
    } catch (error) {
      console.error("Navigation error:", error)
    } finally {
      setIsStarting(false)
    }
  }

  const handleBack = () => {
    router.push(`/${lang}/s/${subdomain}/apply`)
  }

  return (
    <div className={`flex h-full flex-col px-20 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
            {/* Left Side - Title */}
            <div>
              <h2
                className={`text-4xl font-bold tracking-tight ${isRTL ? "text-right" : "text-left"}`}
              >
                {overviewDict.title ||
                  (isRTL ? "خطوات التقديم" : "Application Steps")}
              </h2>
              <p
                className={`text-muted-foreground mt-4 ${isRTL ? "text-right" : "text-left"}`}
              >
                {overviewDict.subtitle ||
                  (isRTL
                    ? "اتبع هذه الخطوات لإكمال طلب التقديم"
                    : "Follow these steps to complete your application")}
              </p>
            </div>

            {/* Right Side - Steps */}
            <div className="space-y-6">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`flex items-start justify-between gap-6 ${isRTL ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex flex-1 gap-3 ${isRTL ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className="flex-shrink-0">
                      <h4 className="text-foreground">{step.number}.</h4>
                    </div>
                    <div className={isRTL ? "text-right" : "text-left"}>
                      <h4 className="mb-1 font-semibold">{step.title}</h4>
                      <p className="text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`hidden flex-shrink-0 md:flex ${isRTL ? "justify-start" : "justify-end"}`}
                  >
                    <div className="relative h-14 w-14 overflow-hidden">
                      <Image
                        src={step.illustration}
                        alt={step.title}
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

      {/* Bottom Section with HR and Buttons */}
      <div className="mx-auto w-full max-w-7xl">
        <Separator className="w-full" />
        <div className={`flex py-4 ${isRTL ? "justify-start" : "justify-end"}`}>
          <div
            className={`flex gap-4 ${isRTL ? "flex-row-reverse" : "flex-row"}`}
          >
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
        </div>
      </div>
    </div>
  )
}

export default ApplyOverviewClient
