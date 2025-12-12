"use client"

import Link from "next/link"
import { Star, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StreamContentProps } from "../types"

const hotReleases = [
  {
    title: "Google People Management Essentials",
    provider: "Google",
    providerLogo: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/4a/cb36835ae3421187080898a7ecc11d/Google-G_360x360.png",
    image: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://d15cw65ipctsrr.cloudfront.net/72/c2e795cd584b74accb5937ae2ac8c0/GwG_Career_Certs_Coursera_PME_Overall_Course_1x1.jpg?auto=format%2C%20compress%2C%20enhance&dpr=1&w=320&h=180&fit=crop&q=50",
    type: "Specialization",
    rating: 4.8,
  },
  {
    title: "Microsoft AI Agents: From Foundations to Applications",
    provider: "Microsoft",
    providerLogo: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/cc/61dbdf2c1c475d82d3b8bf8eee1bda/MSFT-stacked-logo_FINAL.png",
    image: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://d15cw65ipctsrr.cloudfront.net/f4/6b2dde582549308d4a217c0686e215/Professional_Certificate_Image_1200x1200.jpg?auto=format%2C%20compress%2C%20enhance&dpr=1&w=320&h=180&fit=crop&q=50",
    type: "Professional Certificate",
    rating: 4.7,
  },
  {
    title: "PyTorch for Deep Learning",
    provider: "DeepLearning.AI",
    providerLogo: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/b4/5cb90bb92f420b99bf323a0356f451/Icon.png",
    image: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://d15cw65ipctsrr.cloudfront.net/fe/a2eb6ae01140698ae0c0d1bb635f2b/DeepLearningAI_PyTorch_for_Deep-Learning_1000x1000-01.png?auto=format%2C%20compress%2C%20enhance&dpr=1&w=320&h=180&fit=crop&q=50",
    type: "Professional Certificate",
    rating: 4.9,
  },
  {
    title: "Google Data Analysis with Python",
    provider: "Google",
    providerLogo: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/4a/cb36835ae3421187080898a7ecc11d/Google-G_360x360.png",
    image: "https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://d15cw65ipctsrr.cloudfront.net/18/a529bbeefc4bb79f3ae12773ad7542/176-85B-GRT-SEAN-0989.png?auto=format%2C%20compress%2C%20enhance&dpr=1&w=320&h=180&fit=crop&q=50",
    type: "Specialization",
    rating: 4.9,
  },
]

export function HotReleasesSection({ dictionary, lang }: Omit<StreamContentProps, 'schoolId'>) {
  const isRTL = lang === "ar"

  return (
    <section className="py-6 mb-16 bg-[#BCD1CA] rounded-xl">
      <div className="px-6">
        {/* Title Row */}
        <div className={cn("mb-4 flex items-center justify-between", isRTL && "flex-row-reverse")}>
          <h2 className="text-lg font-semibold">
            {dictionary?.hotReleases?.title || "Hot new releases"}
          </h2>
          <Link
            href={`/${lang}/stream/courses`}
            className="text-foreground hover:text-primary transition-colors"
          >
            <ArrowRight className={cn("h-5 w-5", isRTL && "rotate-180")} />
          </Link>
        </div>

        {/* Cards Grid */}
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
          isRTL && "direction-rtl"
        )}>
          {hotReleases.map((course, index) => (
            <Link
              key={index}
              href={`/${lang}/stream/courses`}
              className="block group bg-background rounded-xl overflow-hidden"
            >
              {/* Card Image */}
              <div className="overflow-hidden aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <div className={cn("p-4 space-y-2", isRTL && "text-right")}>
                {/* Provider */}
                <div className={cn("flex items-center gap-1.5", isRTL && "flex-row-reverse")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={course.providerLogo}
                    alt={course.provider}
                    className="h-4 w-4 object-contain"
                  />
                  <span className="text-xs text-muted-foreground">{course.provider}</span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>

                {/* Type */}
                <p className="text-xs text-muted-foreground">
                  {course.type}
                </p>

                {/* Rating */}
                <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                  <Star className="h-3 w-3 fill-current text-foreground" />
                  <span className="text-xs font-medium">{course.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
