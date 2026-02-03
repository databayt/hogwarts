import Image from "next/image"

import { InfiniteSlider } from "@/components/atom/infinite-slider"
import { ProgressiveBlur } from "@/components/atom/progressive-blur"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

const sponsors = [
  {
    name: "Faisal",
    src: "/sponser/faisal.png",
    width: 120,
    height: 60,
    className: "h-12 w-auto",
  },
  {
    name: "MTDT",
    src: "/sponser/mtdt.png",
    width: 120,
    height: 60,
    className: "h-12 w-auto",
  },
  {
    name: "Zain",
    src: "/sponser/zain.png",
    width: 100,
    height: 50,
    className: "h-10 w-auto",
  },
  {
    name: "Khartoum",
    src: "/sponser/khartoum.png",
    width: 120,
    height: 60,
    className: "h-12 w-auto",
  },
  {
    name: "Dal",
    src: "/sponser/dal.png",
    width: 120,
    height: 60,
    className: "h-12 w-auto",
  },
  {
    name: "249",
    src: "/sponser/249.png",
    width: 100,
    height: 50,
    className: "h-10 w-auto",
  },
  {
    name: "University of Khartoum",
    src: "/sponser/uok.png",
    width: 110,
    height: 55,
    className: "h-11 w-auto",
  },
]

interface LogoCloudProps {
  dictionary?: Dictionary
  lang?: Locale
}

export default function LogoCloud({ dictionary, lang }: LogoCloudProps) {
  const isRTL = lang === "ar"
  const text =
    dictionary?.marketing?.logoCloud?.trustedBy ||
    "Trusted by amazing\nsponsors"

  return (
    <section
      className="bg-background overflow-hidden py-16"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="group relative">
        <div className="flex flex-col items-center md:flex-row">
          <div className="shrink-0 md:border-r md:pr-6">
            <p className="text-base font-medium whitespace-pre-line">{text}</p>
          </div>
          <div className="relative flex-1 overflow-hidden py-6">
            <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
              {sponsors.map((sponsor, index) => (
                <div key={index} className="flex items-center justify-center">
                  <Image
                    src={sponsor.src}
                    alt={sponsor.name}
                    width={sponsor.width}
                    height={sponsor.height}
                    className={`${sponsor.className} object-contain opacity-70 transition-opacity duration-300 hover:opacity-100 dark:invert`}
                  />
                </div>
              ))}
            </InfiniteSlider>

            {/* Gradient overlays for color fade - both sides */}
            <div className="from-background via-background/80 pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r to-transparent" />
            <div className="from-background via-background/80 pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l to-transparent" />

            {/* Progressive blur for smooth effect */}
            <ProgressiveBlur
              className="pointer-events-none absolute top-0 left-0 z-20 h-full w-24"
              direction="left"
              blurIntensity={1}
            />
            <ProgressiveBlur
              className="pointer-events-none absolute top-0 right-0 z-20 h-full w-24"
              direction="right"
              blurIntensity={1}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
