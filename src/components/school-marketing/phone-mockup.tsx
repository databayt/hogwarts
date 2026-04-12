"use client"

import { useRef } from "react"
import Image from "next/image"
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion"

import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

// Left side items — matching Zenda reference exactly
const LEFT_ITEMS = [
  {
    text: "Activities",
    icon: "/icons/services/basketball.webp",
    type: "both" as const,
    y: -280,
    x: -20,
    row: 1,
  },
  {
    text: "Uniform",
    icon: "/icons/services/uniform.webp",
    type: "both" as const,
    y: -140,
    x: -60,
    row: 2,
  },
  {
    text: "",
    icon: "/icons/services/activities-goggles.webp",
    type: "icon" as const,
    y: -140,
    x: 60,
    row: 2,
  },
  {
    text: "",
    icon: "/icons/services/juice.webp",
    type: "icon" as const,
    y: 0,
    x: -80,
    row: 3,
  },
  {
    text: "Notebooks",
    icon: "/icons/services/textbooks.webp",
    type: "both" as const,
    y: 0,
    x: 40,
    row: 3,
  },
  {
    text: "Laboratory equipment",
    icon: "/icons/services/frame.webp",
    type: "both" as const,
    y: 140,
    x: -120,
    row: 4,
  },
  {
    text: "",
    icon: "/icons/services/activities-paint.png",
    type: "icon" as const,
    y: 140,
    x: 15,
    row: 4,
  },
  {
    text: "Supplies",
    icon: "/icons/services/backpack.webp",
    type: "both" as const,
    y: 140,
    x: 110,
    row: 4,
  },
]

// Right side items — matching Zenda reference exactly
const RIGHT_ITEMS = [
  {
    text: "Transport",
    icon: "/icons/services/transport.webp",
    type: "both" as const,
    y: -280,
    x: -20,
    row: 1,
  },
  {
    text: "Security",
    icon: "",
    type: "text" as const,
    y: -140,
    x: -90,
    row: 2,
  },
  {
    text: "",
    icon: "/icons/services/bread.webp",
    type: "icon" as const,
    y: -140,
    x: 30,
    row: 2,
  },
  {
    text: "",
    icon: "/icons/services/clock.webp",
    type: "icon" as const,
    y: 0,
    x: -80,
    row: 3,
  },
  {
    text: "Fees",
    icon: "/icons/services/fee.svg",
    type: "both" as const,
    y: 0,
    x: 60,
    row: 3,
  },
  {
    text: "",
    icon: "/icons/services/supplies.webp",
    type: "icon" as const,
    y: 140,
    x: -130,
    row: 4,
  },
  {
    text: "Trips & Tours",
    icon: "/icons/services/supplies.webp",
    type: "both" as const,
    y: 140,
    x: 15,
    row: 4,
  },
  {
    text: "Events",
    icon: "/icons/services/events.webp",
    type: "both" as const,
    y: 140,
    x: 110,
    row: 4,
  },
]

// Inner phone cards
interface InnerPhoneCard {
  id: string
  text: string
  icon?: string
  row: 1 | 2 | 3 | 4
  side: "start" | "end"
  bgGradient: string
  textColor: string
  finalX: number
  finalY: number
  isBlob?: boolean
  isXLarge?: boolean
  isLarge?: boolean
  isMedium?: boolean
}

const INNER_PHONE_CARDS: InnerPhoneCard[] = [
  {
    id: "inner-uniform",
    text: "Uniform",
    row: 1,
    side: "start",
    bgGradient:
      "bg-gradient-to-br from-purple-500 via-purple-600 to-violet-700",
    textColor: "text-white",
    finalX: -30,
    finalY: 20,
    isXLarge: true,
  },
  {
    id: "inner-blob-blue",
    text: "",
    row: 1,
    side: "end",
    bgGradient: "bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200",
    textColor: "",
    finalX: 20,
    finalY: 30,
    isBlob: true,
  },
  {
    id: "inner-blob-purple",
    text: "",
    row: 2,
    side: "end",
    bgGradient:
      "bg-gradient-to-br from-purple-400 via-purple-500 to-violet-500",
    textColor: "",
    finalX: 30,
    finalY: 100,
    isBlob: true,
  },
  {
    id: "inner-supplies",
    text: "Supplies",
    icon: "https://cdn.prod.website-files.com/622da43f87e21836ee21bed6/685d45179dbf65da8996ec74_bag.webp",
    row: 2,
    side: "end",
    bgGradient:
      "bg-gradient-to-br from-indigo-400 via-purple-400 to-purple-500",
    textColor: "text-white",
    finalX: 40,
    finalY: 190,
    isLarge: true,
  },
  {
    id: "inner-blob-beige",
    text: "",
    row: 3,
    side: "start",
    bgGradient: "bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100",
    textColor: "",
    finalX: -40,
    finalY: 340,
    isBlob: true,
  },
  {
    id: "inner-rewards",
    text: "Rewards",
    icon: "https://cdn.prod.website-files.com/622da43f87e21836ee21bed6/67e431889b4aa073c0a33447_cup-icon.webp",
    row: 4,
    side: "end",
    bgGradient: "bg-gradient-to-br from-pink-100 via-pink-200 to-rose-200",
    textColor: "text-white",
    finalX: 30,
    finalY: 350,
    isMedium: true,
  },
]

function InnerCard({
  card,
  progress,
  isRTL,
}: {
  card: InnerPhoneCard
  progress: MotionValue<number>
  isRTL: boolean
}) {
  const physicalSide = isRTL
    ? card.side === "start"
      ? "right"
      : "left"
    : card.side === "start"
      ? "left"
      : "right"

  const dir = physicalSide === "left" ? -1 : 1
  const startX = dir * 150

  const x = useTransform(
    progress,
    [0.15, 0.4],
    [startX, card.finalX * (isRTL ? -1 : 1)]
  )
  const opacity = useTransform(progress, [0.15, 0.22, 0.38], [0, 0.7, 1])

  const sizes: Record<string, { w: string; h: string }> = {
    "inner-uniform": { w: "w-36", h: "h-32" },
    "inner-blob-blue": { w: "w-24", h: "h-20" },
    "inner-blob-purple": { w: "w-20", h: "h-16" },
    "inner-supplies": { w: "w-40", h: "h-44" },
    "inner-blob-beige": { w: "w-20", h: "h-16" },
    "inner-rewards": { w: "w-36", h: "h-40" },
  }

  const size = sizes[card.id] || { w: "w-32", h: "h-28" }

  const borderRadius =
    physicalSide === "left" ? "0 9999px 9999px 0" : "9999px 0 0 9999px"

  if (card.isBlob) {
    return (
      <motion.div
        className={`absolute ${card.bgGradient} ${size.w} ${size.h}`}
        style={{
          x,
          y: card.finalY,
          opacity,
          borderRadius,
          left: physicalSide === "left" ? 0 : "auto",
          right: physicalSide === "right" ? 0 : "auto",
        }}
      />
    )
  }

  const sizeClass = card.isXLarge
    ? "px-12 py-10 gap-3"
    : card.isLarge
      ? "px-10 py-8 gap-2"
      : card.isMedium
        ? "px-8 py-6 gap-2"
        : "px-6 py-5 gap-3"
  const iconSize = card.isXLarge
    ? "w-28 h-28"
    : card.isLarge
      ? "w-24 h-24"
      : card.isMedium
        ? "w-18 h-18"
        : "w-14 h-14"
  const textSize = card.isXLarge
    ? "text-2xl"
    : card.isLarge
      ? "text-xl"
      : card.isMedium
        ? "text-lg"
        : "text-lg"

  return (
    <motion.div
      className={`absolute ${card.bgGradient} flex items-center ${sizeClass}`}
      style={{
        x,
        y: card.finalY,
        opacity,
        borderRadius,
        left: physicalSide === "left" ? 0 : "auto",
        right: physicalSide === "right" ? 0 : "auto",
      }}
    >
      {card.icon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.icon}
          alt={card.text}
          className={`shrink-0 object-contain ${iconSize}`}
        />
      )}
      {card.text && (
        <span
          className={`font-semibold ${card.textColor} whitespace-nowrap ${textSize}`}
        >
          {card.text}
        </span>
      )}
    </motion.div>
  )
}

interface PhoneMockupProps {
  dictionary?: Dictionary
  lang?: Locale
}

export function PhoneMockup({ dictionary, lang }: PhoneMockupProps) {
  const isRTL = lang === "ar"
  const sectionRef = useRef<HTMLElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dict = (dictionary as any)?.marketing?.phoneMockup || {
    heading: "Your school, in every pocket",
    subheading:
      "Discover, enroll, organize, pay and track all transactions in one place",
    phoneAlt: "School management mobile app",
  }

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  const dir = isRTL ? -1 : 1

  const phoneScale = useTransform(smoothProgress, [0, 0.25], [1.8, 1.1])
  const phoneY = useTransform(smoothProgress, [0, 0.25], [40, 0])
  const textY = useTransform(smoothProgress, [0, 0.25], [300, -350])
  const textOpacity = useTransform(smoothProgress, [0, 0.1, 0.2], [0, 0.7, 1])

  const leftRotate = useTransform(smoothProgress, [0, 0.3], [-25 * dir, 0])
  const rightRotate = useTransform(smoothProgress, [0, 0.3], [25 * dir, 0])

  const PHONE_EDGE_PADDING = 160

  const leftXRow1 = useTransform(
    smoothProgress,
    [0, 0.3],
    [-200 * dir, PHONE_EDGE_PADDING * dir]
  )
  const leftXRow2 = useTransform(
    smoothProgress,
    [0, 0.3],
    [-200 * dir, PHONE_EDGE_PADDING * dir]
  )
  const leftXRow3 = useTransform(
    smoothProgress,
    [0, 0.3],
    [-200 * dir, PHONE_EDGE_PADDING * dir]
  )
  const leftXRow4 = useTransform(
    smoothProgress,
    [0, 0.3],
    [-200 * dir, (PHONE_EDGE_PADDING + 40) * dir]
  )

  const rightXRow1 = useTransform(
    smoothProgress,
    [0, 0.3],
    [200 * dir, -PHONE_EDGE_PADDING * dir]
  )
  const rightXRow2 = useTransform(
    smoothProgress,
    [0, 0.3],
    [200 * dir, -PHONE_EDGE_PADDING * dir]
  )
  const rightXRow3 = useTransform(
    smoothProgress,
    [0, 0.3],
    [200 * dir, -PHONE_EDGE_PADDING * dir]
  )
  const rightXRow4 = useTransform(
    smoothProgress,
    [0, 0.3],
    [200 * dir, -(PHONE_EDGE_PADDING + 40) * dir]
  )

  const getLeftX = (row: number) => {
    switch (row) {
      case 1:
        return leftXRow1
      case 2:
        return leftXRow2
      case 3:
        return leftXRow3
      case 4:
        return leftXRow4
      default:
        return leftXRow1
    }
  }

  const getRightX = (row: number) => {
    switch (row) {
      case 1:
        return rightXRow1
      case 2:
        return rightXRow2
      case 3:
        return rightXRow3
      case 4:
        return rightXRow4
      default:
        return rightXRow1
    }
  }

  const startSide = isRTL ? "right" : "left"
  const endSide = isRTL ? "left" : "right"

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[200vh] overflow-y-clip"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="relative container mx-auto max-w-7xl px-4">
          {/* Text */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center"
            style={{ y: textY, opacity: textOpacity }}
          >
            <h2 className="text-foreground mb-4 text-center text-3xl font-bold md:text-5xl">
              {dict.heading}
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-center text-lg md:text-xl">
              {dict.subheading}
            </p>
          </motion.div>

          {/* Phone with floating cards */}
          <div className="relative mx-auto flex min-h-[800px] max-w-6xl items-center justify-center">
            {/* Left Cards */}
            <div
              className="absolute top-1/2 hidden -translate-y-1/2 md:block"
              style={{ [startSide]: 0 }}
            >
              {LEFT_ITEMS.map((item, index) => (
                <motion.div
                  key={`left-${index}`}
                  className={`border-border absolute flex items-center justify-center rounded-full border ${
                    item.type === "icon"
                      ? "bg-card p-6"
                      : "bg-card gap-3 px-7 py-6"
                  }`}
                  style={{
                    [startSide]: `${3 + item.x / 10}rem`,
                    top: item.y,
                    x: getLeftX(item.row),
                    rotate: leftRotate,
                    zIndex: 20 + index,
                  }}
                >
                  {item.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.icon}
                      alt={item.text || ""}
                      className={
                        item.type === "icon"
                          ? "h-16 w-16 shrink-0 object-contain"
                          : "h-14 w-14 shrink-0 object-contain"
                      }
                    />
                  )}
                  {item.text && (
                    <span className="text-foreground text-sm font-semibold whitespace-nowrap">
                      {item.text}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Phone with inner cards */}
            <motion.div
              className="relative z-30 mt-64"
              style={{ scale: phoneScale, y: phoneY }}
            >
              <Image
                src="/images/phone-mockup.webp"
                alt={dict.phoneAlt}
                width={320}
                height={640}
                className="relative z-10 h-auto w-64 md:w-80"
              />

              {/* Inner cards container */}
              <div
                className="absolute overflow-hidden"
                style={{
                  top: "2.5%",
                  bottom: "2.5%",
                  left: "4%",
                  right: "4%",
                  borderRadius: "32px",
                  background:
                    "linear-gradient(180deg, #e8e0f0 0%, #f5f0fa 50%, #faf5f5 100%)",
                }}
              >
                {INNER_PHONE_CARDS.map((card) => (
                  <InnerCard
                    key={card.id}
                    card={card}
                    progress={smoothProgress}
                    isRTL={isRTL}
                  />
                ))}
              </div>
            </motion.div>

            {/* Right Cards */}
            <div
              className="absolute top-1/2 hidden -translate-y-1/2 md:block"
              style={{ [endSide]: 0 }}
            >
              {RIGHT_ITEMS.map((item, index) => (
                <motion.div
                  key={`right-${index}`}
                  className={`border-border absolute flex items-center justify-center rounded-full border ${
                    item.type === "icon"
                      ? "bg-card p-6"
                      : item.type === "text"
                        ? "bg-card/80 px-8 py-6"
                        : "bg-card gap-3 px-7 py-6"
                  }`}
                  style={{
                    [endSide]: `${3 + item.x / 10}rem`,
                    top: item.y,
                    x: getRightX(item.row),
                    rotate: rightRotate,
                    zIndex: 20 + index,
                  }}
                >
                  {item.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.icon}
                      alt={item.text || ""}
                      className={
                        item.type === "icon"
                          ? "h-16 w-16 shrink-0 object-contain"
                          : "h-14 w-14 shrink-0 object-contain"
                      }
                    />
                  )}
                  {item.text && (
                    <span className="text-foreground text-sm font-semibold whitespace-nowrap">
                      {item.text}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
