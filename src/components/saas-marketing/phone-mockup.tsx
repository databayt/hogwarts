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
import {
  Apple,
  Backpack,
  BarChart3,
  BookOpen,
  Bus,
  CalendarDays,
  ClipboardCheck,
  Clock,
  GraduationCap,
  MessageCircle,
  Paintbrush,
  PartyPopper,
  School,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

// Layout config for outer floating pills
interface ItemConfig {
  key: string
  fallback: string
  icon: LucideIcon
  type: "both" | "icon"
  y: number
  x: number
  row: 1 | 2 | 3 | 4
}

const START_ITEMS: ItemConfig[] = [
  {
    key: "grades",
    fallback: "Grades",
    icon: GraduationCap,
    type: "both",
    y: -280,
    x: -20,
    row: 1,
  },
  {
    key: "attendance",
    fallback: "Attendance",
    icon: ClipboardCheck,
    type: "both",
    y: -140,
    x: -60,
    row: 2,
  },
  {
    key: "",
    fallback: "",
    icon: CalendarDays,
    type: "icon",
    y: -140,
    x: 60,
    row: 2,
  },
  {
    key: "",
    fallback: "",
    icon: Paintbrush,
    type: "icon",
    y: 0,
    x: -80,
    row: 3,
  },
  {
    key: "timetable",
    fallback: "Timetable",
    icon: Clock,
    type: "both",
    y: 0,
    x: 40,
    row: 3,
  },
  {
    key: "admission",
    fallback: "Admission",
    icon: School,
    type: "both",
    y: 140,
    x: -120,
    row: 4,
  },
  { key: "", fallback: "", icon: Apple, type: "icon", y: 140, x: 15, row: 4 },
  {
    key: "courses",
    fallback: "Courses",
    icon: BookOpen,
    type: "both",
    y: 140,
    x: 110,
    row: 4,
  },
]

const END_ITEMS: ItemConfig[] = [
  {
    key: "messaging",
    fallback: "Messaging",
    icon: MessageCircle,
    type: "both",
    y: -280,
    x: -20,
    row: 1,
  },
  {
    key: "parentPortal",
    fallback: "Parent Portal",
    icon: Users,
    type: "both",
    y: -140,
    x: -90,
    row: 2,
  },
  {
    key: "",
    fallback: "",
    icon: BarChart3,
    type: "icon",
    y: -140,
    x: 30,
    row: 2,
  },
  { key: "", fallback: "", icon: Wallet, type: "icon", y: 0, x: -80, row: 3 },
  {
    key: "finance",
    fallback: "Finance",
    icon: Wallet,
    type: "both",
    y: 0,
    x: 60,
    row: 3,
  },
  {
    key: "",
    fallback: "",
    icon: Backpack,
    type: "icon",
    y: 140,
    x: -130,
    row: 4,
  },
  {
    key: "transport",
    fallback: "Transport",
    icon: Bus,
    type: "both",
    y: 140,
    x: 15,
    row: 4,
  },
  {
    key: "events",
    fallback: "Events",
    icon: PartyPopper,
    type: "both",
    y: 140,
    x: 110,
    row: 4,
  },
]

// Inner phone cards config
interface InnerPhoneCard {
  id: string
  key: string
  fallback: string
  icon: LucideIcon | null
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
    id: "inner-gradebook",
    key: "gradebook",
    fallback: "Gradebook",
    icon: GraduationCap,
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
    key: "",
    fallback: "",
    icon: null,
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
    key: "",
    fallback: "",
    icon: null,
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
    id: "inner-dashboard",
    key: "dashboard",
    fallback: "Dashboard",
    icon: BarChart3,
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
    key: "",
    fallback: "",
    icon: null,
    row: 3,
    side: "start",
    bgGradient: "bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100",
    textColor: "",
    finalX: -40,
    finalY: 340,
    isBlob: true,
  },
  {
    id: "inner-analytics",
    key: "analytics",
    fallback: "Analytics",
    icon: Trophy,
    row: 4,
    side: "end",
    bgGradient: "bg-gradient-to-br from-pink-100 via-pink-200 to-rose-200",
    textColor: "text-white",
    finalX: 30,
    finalY: 350,
    isMedium: true,
  },
]

// Inner Card sub-component
function InnerCard({
  card,
  progress,
  isRTL,
  dict,
}: {
  card: InnerPhoneCard
  progress: MotionValue<number>
  isRTL: boolean
  dict: Record<string, string>
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
    "inner-gradebook": { w: "w-36", h: "h-32" },
    "inner-blob-blue": { w: "w-24", h: "h-20" },
    "inner-blob-purple": { w: "w-20", h: "h-16" },
    "inner-dashboard": { w: "w-40", h: "h-44" },
    "inner-blob-beige": { w: "w-20", h: "h-16" },
    "inner-analytics": { w: "w-36", h: "h-40" },
  }

  const size = sizes[card.id] || { w: "w-32", h: "h-28" }

  const borderRadius =
    physicalSide === "left" ? "0 9999px 9999px 0" : "9999px 0 0 9999px"

  const text = card.key ? dict[card.key] || card.fallback : ""
  const Icon = card.icon

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
    ? 28
    : card.isLarge
      ? 24
      : card.isMedium
        ? 18
        : 14
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
      {Icon && (
        <Icon
          className={`shrink-0 ${card.textColor}`}
          size={iconSize}
          strokeWidth={1.5}
        />
      )}
      {text && (
        <span
          className={`font-semibold ${card.textColor} whitespace-nowrap ${textSize}`}
        >
          {text}
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
      "Manage grades, attendance, scheduling, and messaging — all from one app",
    phoneAlt: "School management mobile app",
    items: {},
    innerCards: {},
  }

  const items = dict.items || {}
  const innerCards = dict.innerCards || {}

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

  const startRotate = useTransform(smoothProgress, [0, 0.3], [-25 * dir, 0])
  const endRotate = useTransform(smoothProgress, [0, 0.3], [25 * dir, 0])

  const PHONE_EDGE_PADDING = 160

  const startXRow1 = useTransform(
    smoothProgress,
    [0, 0.3],
    [-200 * dir, PHONE_EDGE_PADDING * dir]
  )
  const startXRow2 = useTransform(
    smoothProgress,
    [0, 0.3],
    [-200 * dir, PHONE_EDGE_PADDING * dir]
  )
  const startXRow3 = useTransform(
    smoothProgress,
    [0, 0.3],
    [-200 * dir, PHONE_EDGE_PADDING * dir]
  )
  const startXRow4 = useTransform(
    smoothProgress,
    [0, 0.3],
    [-200 * dir, (PHONE_EDGE_PADDING + 40) * dir]
  )

  const endXRow1 = useTransform(
    smoothProgress,
    [0, 0.3],
    [200 * dir, -PHONE_EDGE_PADDING * dir]
  )
  const endXRow2 = useTransform(
    smoothProgress,
    [0, 0.3],
    [200 * dir, -PHONE_EDGE_PADDING * dir]
  )
  const endXRow3 = useTransform(
    smoothProgress,
    [0, 0.3],
    [200 * dir, -PHONE_EDGE_PADDING * dir]
  )
  const endXRow4 = useTransform(
    smoothProgress,
    [0, 0.3],
    [200 * dir, -(PHONE_EDGE_PADDING + 40) * dir]
  )

  const getStartX = (row: number) => {
    switch (row) {
      case 1:
        return startXRow1
      case 2:
        return startXRow2
      case 3:
        return startXRow3
      case 4:
        return startXRow4
      default:
        return startXRow1
    }
  }

  const getEndX = (row: number) => {
    switch (row) {
      case 1:
        return endXRow1
      case 2:
        return endXRow2
      case 3:
        return endXRow3
      case 4:
        return endXRow4
      default:
        return endXRow1
    }
  }

  // Resolve physical sides based on direction
  const startSide = isRTL ? "right" : "left"
  const endSide = isRTL ? "left" : "right"

  return (
    <section ref={sectionRef} className="relative min-h-[200vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="relative container mx-auto max-w-7xl px-4">
          {/* Heading text */}
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
            {/* Start-side cards (left in LTR, right in RTL) */}
            <div
              className="absolute top-1/2 hidden -translate-y-1/2 md:block"
              style={{ [startSide]: 0 }}
            >
              {START_ITEMS.map((item, index) => {
                const Icon = item.icon
                const text = item.key ? items[item.key] || item.fallback : ""
                return (
                  <motion.div
                    key={`start-${index}`}
                    className={`border-border/50 absolute flex items-center justify-center rounded-full border ${
                      item.type === "icon"
                        ? "bg-card p-6"
                        : "bg-card gap-3 px-7 py-6"
                    }`}
                    style={{
                      [startSide]: `${3 + item.x / 10}rem`,
                      top: item.y,
                      x: getStartX(item.row),
                      rotate: startRotate,
                      zIndex: 20 + index,
                    }}
                  >
                    <Icon
                      className={`text-foreground shrink-0 ${
                        item.type === "icon" ? "h-8 w-8" : "h-6 w-6"
                      }`}
                      strokeWidth={1.5}
                    />
                    {text && (
                      <span className="text-foreground text-sm font-semibold whitespace-nowrap">
                        {text}
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Phone frame with inner cards */}
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
                    dict={innerCards}
                  />
                ))}
              </div>
            </motion.div>

            {/* End-side cards (right in LTR, left in RTL) */}
            <div
              className="absolute top-1/2 hidden -translate-y-1/2 md:block"
              style={{ [endSide]: 0 }}
            >
              {END_ITEMS.map((item, index) => {
                const Icon = item.icon
                const text = item.key ? items[item.key] || item.fallback : ""
                return (
                  <motion.div
                    key={`end-${index}`}
                    className={`border-border/50 absolute flex items-center justify-center rounded-full border ${
                      item.type === "icon"
                        ? "bg-card p-6"
                        : "bg-card gap-3 px-7 py-6"
                    }`}
                    style={{
                      [endSide]: `${3 + item.x / 10}rem`,
                      top: item.y,
                      x: getEndX(item.row),
                      rotate: endRotate,
                      zIndex: 20 + index,
                    }}
                  >
                    <Icon
                      className={`text-foreground shrink-0 ${
                        item.type === "icon" ? "h-8 w-8" : "h-6 w-6"
                      }`}
                      strokeWidth={1.5}
                    />
                    {text && (
                      <span className="text-foreground text-sm font-semibold whitespace-nowrap">
                        {text}
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
