"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion"
import { BookOpen, Building2, Cpu, DollarSign } from "lucide-react"
import { useTheme } from "next-themes"

import { asset } from "@/lib/asset-url"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

interface DreamSectionProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang?: Locale
}

type CategoryKey = "academic" | "admin" | "finance" | "tech"

interface Tag {
  id: string
  categories: CategoryKey[]
}

const tags: Tag[] = [
  // Academic (core + essential + lms)
  { id: "admission", categories: ["academic"] },
  { id: "exam", categories: ["academic"] },
  { id: "gradebook", categories: ["academic"] },
  { id: "assignment", categories: ["academic"] },
  { id: "e-learning", categories: ["academic"] },
  { id: "timetable", categories: ["academic"] },
  { id: "qbank", categories: ["academic"] },
  { id: "digital-library", categories: ["academic"] },
  // Admin (core + essential + management + communication)
  { id: "student", categories: ["admin"] },
  { id: "faculty", categories: ["admin"] },
  { id: "attendance", categories: ["admin"] },
  { id: "classroom", categories: ["admin"] },
  { id: "transportation", categories: ["admin"] },
  { id: "events", categories: ["admin"] },
  { id: "helpdesk", categories: ["admin"] },
  { id: "parent-login", categories: ["admin"] },
  { id: "leave-request", categories: ["admin"] },
  { id: "announcement", categories: ["admin"] },
  // Finance (core + erp)
  { id: "financial", categories: ["finance"] },
  { id: "payment", categories: ["finance"] },
  { id: "accounting", categories: ["finance"] },
  { id: "payroll", categories: ["finance"] },
  { id: "expense", categories: ["finance"] },
  // Tech (advance + technical + integration + ai)
  { id: "dashboard", categories: ["tech"] },
  { id: "multi-organization", categories: ["tech"] },
  { id: "ai-powered", categories: ["tech"] },
  { id: "mobile-application", categories: ["tech"] },
  { id: "biometric", categories: ["tech"] },
  { id: "multi-lingual", categories: ["tech"] },
  // Cross-category
  { id: "reporting", categories: ["admin", "finance"] },
  { id: "live-classroom", categories: ["academic", "tech"] },
]

// Per-tag images (add more as they become available)
const tagImages: Record<string, string> = {
  admission: asset("https://cdn.databayt.org/hogwarts/features/admission.png"),
  "e-learning": asset("https://cdn.databayt.org/hogwarts/features/lms.png"),
  accounting: asset(
    "https://cdn.databayt.org/hogwarts/features/accounting.png"
  ),
  "digital-library": asset(
    "https://cdn.databayt.org/hogwarts/features/library.png"
  ),
  events: asset("https://cdn.databayt.org/hogwarts/features/events.png"),
  transportation: asset(
    "https://cdn.databayt.org/hogwarts/features/transport.png"
  ),
}

const categoryCards = [
  { key: "academic" as const, icon: BookOpen, color: "bg-primary" },
  { key: "admin" as const, icon: Building2, color: "bg-blue-500" },
  { key: "finance" as const, icon: DollarSign, color: "bg-pink-500" },
  { key: "tech" as const, icon: Cpu, color: "bg-green-500" },
]

export function DreamSection({ dictionary, lang = "en" }: DreamSectionProps) {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)
  const [animationComplete, setAnimationComplete] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  // Scroll-linked animation setup
  // Animation starts when section top hits viewport top (after header)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 80px", "end start"], // 80px = header height
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  // Box animations - starts at 0 (when section reaches top), completes at 0.4
  const boxY = useTransform(smoothProgress, [0, 0.4], [5, 170])
  const boxHeight = useTransform(smoothProgress, [0, 0.4], ["105px", "470px"])
  const boxBgColor = useTransform(
    smoothProgress,
    [0, 0.4],
    ["#E5E5E5", "#E8704E"]
  )

  // Text animations ("YOUR BOOST" moves left, both texts turn gray suddenly at end)
  const textX = useTransform(smoothProgress, [0, 0.4], [0, -195])
  const textColor = useTransform(
    smoothProgress,
    [0.35, 0.4],
    ["#E8704E", "#E5E5E5"]
  )
  const findColor = useTransform(
    smoothProgress,
    [0.35, 0.4],
    ["#E8704E", "#E5E5E5"]
  )
  const subtitleColor = useTransform(
    smoothProgress,
    [0.35, 0.4],
    [isDark ? "#FAFAFA" : "#171717", "#E8704E"]
  )

  // Track when animation completes to enable tag hover
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setAnimationComplete(latest >= 0.35)
  })

  const dreamDict = dictionary.dream as {
    title: string
    titleAr: string
    subtitle: string
    tags: Record<string, string>
  }

  const categoriesDict = dictionary.dreamServices as {
    title: string
    subtitle: string
    academic: { title: string; description: string }
    admin: { title: string; description: string }
    finance: { title: string; description: string }
    tech: { title: string; description: string }
  }

  const visibleCategories = useMemo(() => {
    if (selectedTags.size === 0) return new Set<CategoryKey>()

    const catSet = new Set<CategoryKey>()
    selectedTags.forEach((tagId) => {
      const tag = tags.find((t) => t.id === tagId)
      if (tag) {
        tag.categories.forEach((cat) => catSet.add(cat))
      }
    })
    return catSet
  }, [selectedTags])

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(tagId)) {
        newSet.delete(tagId)
      } else {
        newSet.add(tagId)
      }
      return newSet
    })
  }

  return (
    <section ref={sectionRef} className="bg-background relative h-[200vh]">
      <div className="sticky top-0 h-screen px-4 py-12 md:px-0 md:py-24">
        {/* Desktop Title Row with scroll animation */}
        <div className="mb-8 hidden w-full items-center gap-1 md:mb-12 md:flex md:gap-1.5">
          {/* FIND */}
          <motion.span
            className="flex-shrink-0 text-[clamp(2.5rem,12vw,10rem)] leading-[0.8] font-black"
            style={{ color: findColor }}
          >
            FIND
          </motion.span>

          {/* Box container - relative wrapper for absolute positioned animated box */}
          <div className="relative w-[clamp(6rem,15vw,13rem)] flex-shrink-0 self-start">
            {/* Animated ? box - absolutely positioned so height expansion doesn't affect layout */}
            <motion.div
              className="absolute start-0 top-0 flex w-full flex-col items-center justify-center overflow-hidden rounded-lg will-change-transform"
              style={{
                y: boxY,
                height: boxHeight,
                backgroundColor: boxBgColor,
              }}
            >
              <AnimatePresence mode="wait">
                {hoveredTag ? (
                  <motion.div
                    key="hovered-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex h-full w-full flex-col p-3"
                  >
                    {/* Top cream card with speech bubble - fixed container */}
                    <div className="relative mx-2 mt-10 flex flex-col items-center justify-center rounded-[3.5rem] bg-[#FAE5CC] px-2 py-16 text-center text-black">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={hoveredTag}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="flex flex-col items-center"
                        >
                          <span className="text-xs tracking-wider text-[#F5A623] uppercase">
                            {
                              tags.find((t) => t.id === hoveredTag)
                                ?.categories[0]
                            }
                          </span>
                          <span className="mt-1 text-lg leading-tight font-extrabold">
                            {dreamDict.tags[hoveredTag]}
                          </span>
                          <span className="mt-2 text-lg font-extrabold">
                            included!
                          </span>
                        </motion.div>
                      </AnimatePresence>
                      {/* Speech bubble pointer */}
                      <svg
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2"
                        width="20"
                        height="12"
                        viewBox="0 0 20 12"
                      >
                        <path d="M0 0 L10 12 L20 0 Z" fill="#FAE5CC" />
                      </svg>
                    </div>
                    {/* Bottom section */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={hoveredTag}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-1 flex-col items-center justify-start px-2 pt-8 text-center"
                      >
                        <p className="text-lg leading-tight font-bold text-white">
                          {tags.find((t) => t.id === hoveredTag)
                            ?.categories[0] === "academic" && "Academic"}
                          {tags.find((t) => t.id === hoveredTag)
                            ?.categories[0] === "admin" && "Administration"}
                          {tags.find((t) => t.id === hoveredTag)
                            ?.categories[0] === "finance" && "Finance"}
                          {tags.find((t) => t.id === hoveredTag)
                            ?.categories[0] === "tech" && "Technology"}
                        </p>
                        <p className="mt-1 text-base text-white/80">module</p>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.span
                    key="question"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[clamp(1.5rem,6vw,4rem)] font-light text-white"
                  >
                    ?
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
            {/* Image - appears on hover, slides out from behind the box */}
            <AnimatePresence mode="wait">
              {hoveredTag && tagImages[hoveredTag] && (
                <motion.div
                  key={hoveredTag}
                  initial={{ opacity: 0, x: 100, zIndex: -10 }}
                  animate={{ opacity: 1, x: -100, zIndex: 10 }}
                  exit={{ opacity: 0, x: 100, zIndex: -10 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeOut",
                    zIndex: { delay: 0.15 },
                  }}
                  className="pointer-events-none absolute -start-48 top-[250px] h-[30rem] w-80"
                >
                  <Image
                    src={tagImages[hoveredTag]}
                    alt="Feature preview"
                    fill
                    className="object-contain object-bottom"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* YOUR BOOST - animated container */}
          <motion.div
            className="-ms-3 flex flex-grow items-center justify-end"
            style={{ x: textX }}
          >
            {/* YOUR - Vertical text */}
            <motion.span
              className="flex-shrink-0 text-[clamp(1.25rem,2.7vw,2.15rem)] font-extrabold tracking-[0.1em]"
              style={{
                writingMode: "vertical-lr",
                transform: "rotate(180deg)",
                color: textColor,
              }}
            >
              YOUR
            </motion.span>

            {/* BOOST */}
            <motion.span
              className="-ms-3 text-[clamp(2.5rem,12vw,10rem)] leading-[0.8] font-black"
              style={{ color: textColor }}
            >
              BOOST
            </motion.span>
          </motion.div>
        </div>

        {/* Mobile Title Row - no scroll animation */}
        <div className="mb-8 flex flex-col items-center gap-2 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-4xl leading-[0.9] font-black text-[#E8704E]">
              FIND
            </span>
            <div className="flex h-10 w-12 items-center justify-center rounded-md bg-neutral-200">
              <span className="text-2xl font-light text-white">?</span>
            </div>
          </div>
          <span className="text-4xl leading-[0.9] font-black text-[#E8704E]">
            YOUR BOOST
          </span>
        </div>

        {/* Subtitle - mobile: centered, desktop: aligned with YOUR at half screen */}
        <p className="text-foreground mb-5 pe-0 text-center text-lg font-black md:ms-[50%] md:mb-8 md:pe-4 md:text-start md:text-2xl lg:text-3xl">
          {dreamDict.subtitle.split("features").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <motion.span style={{ color: subtitleColor }}>
                  features
                </motion.span>
              )}
            </span>
          ))}
        </p>

        {/* Hashtag Tag Cloud - mobile: centered, desktop: aligned with YOUR at half screen */}
        <div className="pe-0 md:ms-[50%] md:pe-8 lg:pe-16 xl:pe-24">
          <div className="flex flex-wrap justify-center gap-2.5 md:justify-start">
            {tags.map((tag) => {
              const isSelected = selectedTags.has(tag.id)
              const isHovered = hoveredTag === tag.id
              const tagLabel = dreamDict.tags[tag.id]

              // Skip if tag not in dictionary
              if (!tagLabel) return null

              return (
                <Link
                  key={tag.id}
                  href={`/${lang}/features/${tag.id}`}
                  onMouseEnter={() =>
                    animationComplete && setHoveredTag(tag.id)
                  }
                  onMouseLeave={() => setHoveredTag(null)}
                  className={`rounded-full px-2.5 py-1.5 text-xs transition-all duration-200 select-none md:px-4 md:py-2 md:text-sm ${
                    isHovered && animationComplete
                      ? "bg-foreground text-background outline-foreground outline outline-1"
                      : "text-foreground outline-foreground bg-transparent outline outline-1"
                  } `}
                >
                  #{tagLabel}
                </Link>
              )
            })}
          </div>

          {/* Service Cards - Only shown when tags selected */}
          <AnimatePresence>
            {selectedTags.size > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-12 overflow-hidden md:mt-16"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
                  <AnimatePresence mode="popLayout">
                    {categoryCards.map((cat, index) => {
                      const Icon = cat.icon
                      const catData = categoriesDict[cat.key]
                      const isVisible = visibleCategories.has(cat.key)

                      if (!isVisible) return null

                      return (
                        <motion.div
                          key={cat.key}
                          layout
                          initial={{ opacity: 0, y: 30, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{
                            duration: 0.4,
                            delay: index * 0.1,
                            layout: { duration: 0.3 },
                          }}
                          className="group"
                        >
                          <motion.div
                            whileHover={{ y: -8 }}
                            transition={{ duration: 0.3 }}
                            className={`h-64 rounded-2xl md:h-72 ${cat.color} flex flex-col items-center justify-center p-6 text-white shadow-lg transition-shadow duration-300 hover:shadow-xl`}
                          >
                            <Icon
                              size={44}
                              className="mb-4 transition-transform duration-300 group-hover:scale-110"
                            />
                            <h3 className="mb-2 text-center text-lg font-bold md:text-xl">
                              {catData.title}
                            </h3>
                            <p className="text-center text-sm leading-relaxed text-white/80">
                              {catData.description}
                            </p>
                          </motion.div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
