"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import { motion } from "framer-motion"

import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

type Pill =
  | { kind: "textIcon"; labelKey: PillKey; icon: string }
  | { kind: "iconOnly"; icon: string; alt: string }
  | { kind: "textOnly"; labelKey: PillKey }

type PillKey =
  | "activities"
  | "uniform"
  | "transport"
  | "security"
  | "fees"
  | "notebooks"
  | "supplies"
  | "laboratoryEquipment"
  | "events"
  | "tripsAndTours"

const ROW_1: Pill[] = [
  {
    kind: "textIcon",
    labelKey: "activities",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/basketball.webp",
  },
  {
    kind: "textIcon",
    labelKey: "transport",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/transport.webp",
  },
]

const ROW_2: Pill[] = [
  {
    kind: "textIcon",
    labelKey: "uniform",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/palette.webp",
  },
  {
    kind: "iconOnly",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/activities-goggles.webp",
    alt: "",
  },
  {
    kind: "textIcon",
    labelKey: "supplies",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/graduation.webp",
  },
  {
    kind: "iconOnly",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/bread.webp",
    alt: "",
  },
  { kind: "textOnly", labelKey: "security" },
]

const ROW_3: Pill[] = [
  {
    kind: "iconOnly",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/juice.webp",
    alt: "",
  },
  {
    kind: "textIcon",
    labelKey: "notebooks",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/notebooks.webp",
  },
  {
    kind: "iconOnly",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/clock.webp",
    alt: "",
  },
  {
    kind: "iconOnly",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/activities-paint.png",
    alt: "",
  },
  {
    kind: "textIcon",
    labelKey: "fees",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/fee.svg",
  },
  {
    kind: "iconOnly",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/backpack.webp",
    alt: "",
  },
]

const ROW_4: Pill[] = [
  {
    kind: "textIcon",
    labelKey: "laboratoryEquipment",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/backpack.webp",
  },
  {
    kind: "iconOnly",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/palette.webp",
    alt: "",
  },
  {
    kind: "iconOnly",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/fee.svg",
    alt: "",
  },
  {
    kind: "textIcon",
    labelKey: "events",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/events.webp",
  },
  {
    kind: "textIcon",
    labelKey: "tripsAndTours",
    icon: "https://cdn.databayt.org/hogwarts/icons/services/graduation.webp",
  },
]

interface PhoneMockupProps {
  dictionary?: Dictionary
  lang?: Locale
}

export function PhoneMockup({ dictionary, lang }: PhoneMockupProps) {
  const isRTL = lang === "ar"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dict = ((dictionary as any)?.marketing?.phoneMockup ?? {}) as {
    heading?: string
    subheading?: string
    phoneAlt?: string
    items?: Record<PillKey, string>
  }

  const heading = dict.heading ?? "Your school, in every pocket"
  const subheading =
    dict.subheading ??
    "Discover, enroll, organize, pay and track all transactions in one place"
  const phoneAlt = dict.phoneAlt ?? "School management mobile app"
  const items = dict.items ?? ({} as Record<PillKey, string>)

  const labelFor = (key: PillKey): string => items[key] ?? key

  return (
    <section
      className="relative overflow-hidden px-4 pt-20 pb-32 md:px-6 md:pt-28 md:pb-48 lg:pt-36 lg:pb-56"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          className="mx-auto mb-16 max-w-3xl text-center md:mb-24"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-foreground text-3xl font-bold md:text-5xl lg:text-6xl">
            {heading}
          </h2>
          <p className="text-muted-foreground mt-4 text-base md:text-lg lg:text-xl">
            {subheading}
          </p>
        </motion.div>

        {/* Mobile: phone only (pill grid hidden on small screens) */}
        <div className="flex items-center justify-center md:hidden">
          <Image
            src="https://cdn.databayt.org/hogwarts/images/phone-mockup.webp"
            alt={phoneAlt}
            width={320}
            height={640}
            className="h-auto w-64"
            priority
          />
        </div>

        {/* Desktop: pill grid with absolutely-centered phone */}
        <div className="relative hidden min-h-[700px] md:block">
          {/* Pill rows */}
          <motion.div
            className="flex flex-col gap-6"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <div className="flex justify-between">
              {ROW_1.map((p, i) => (
                <PillItem key={`r1-${i}`} pill={p} labelFor={labelFor} />
              ))}
            </div>
            <div className="flex justify-start gap-6">
              {ROW_2.map((p, i) => (
                <PillItem key={`r2-${i}`} pill={p} labelFor={labelFor} />
              ))}
            </div>
            <div className="flex justify-start gap-6">
              {ROW_3.map((p, i) => (
                <PillItem key={`r3-${i}`} pill={p} labelFor={labelFor} />
              ))}
            </div>
            <div className="flex justify-end gap-6">
              {ROW_4.map((p, i) => (
                <PillItem key={`r4-${i}`} pill={p} labelFor={labelFor} />
              ))}
            </div>
          </motion.div>

          {/* Phone absolutely centered over the rows */}
          <div className="pointer-events-none absolute top-0 left-1/2 z-10 -translate-x-1/2">
            <div className="relative">
              <Image
                src="https://cdn.databayt.org/hogwarts/images/phone-mockup.webp"
                alt={phoneAlt}
                width={320}
                height={640}
                className="relative z-10 h-auto w-72 lg:w-80"
                priority
              />
              {/* Static decorative gradient screen behind the phone frame */}
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
                <StaticPhoneScreen />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PillItem({
  pill,
  labelFor,
}: {
  pill: Pill
  labelFor: (key: PillKey) => string
}) {
  if (pill.kind === "iconOnly") {
    return (
      <div className="border-border bg-card flex h-36 w-36 shrink-0 items-center justify-center rounded-full border">
        <Image
          src={pill.icon}
          alt={pill.alt}
          width={80}
          height={80}
          className="h-20 w-20 object-contain"
        />
      </div>
    )
  }

  if (pill.kind === "textOnly") {
    return (
      <div className="flex h-36 shrink-0 items-center rounded-full bg-transparent px-10">
        <span className="text-foreground text-lg font-semibold whitespace-nowrap">
          {labelFor(pill.labelKey)}
        </span>
      </div>
    )
  }

  return (
    <div className="border-border bg-card flex h-36 shrink-0 items-center gap-4 rounded-full border ps-8 pe-16">
      <Image
        src={pill.icon}
        alt=""
        width={56}
        height={56}
        className="h-14 w-14 shrink-0 object-contain"
      />
      <span className="text-foreground text-lg font-semibold whitespace-nowrap">
        {labelFor(pill.labelKey)}
      </span>
    </div>
  )
}

function StaticPhoneScreen() {
  // Decorative static content mirroring Zenda's phone screen: gradient blobs + a
  // backpack card. No motion, no scroll-linked transforms.
  return (
    <>
      {/* Purple blob top-left */}
      <div
        className="absolute"
        style={{
          top: "6%",
          left: "-8%",
          width: "55%",
          height: "22%",
          borderRadius: "0 9999px 9999px 0",
          background:
            "linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #6d28d9 100%)",
        }}
      />
      {/* Pink blob top-right */}
      <div
        className="absolute"
        style={{
          top: "10%",
          right: "-10%",
          width: "45%",
          height: "15%",
          borderRadius: "9999px 0 0 9999px",
          background: "linear-gradient(135deg, #fce7f3 0%, #f5d0fe 100%)",
        }}
      />
      {/* Supplies (backpack) card */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: "40%",
          right: "-8%",
          width: "60%",
          height: "22%",
          borderRadius: "9999px 0 0 9999px",
          background:
            "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #8b5cf6 100%)",
        }}
      >
        <Image
          src="https://cdn.databayt.org/hogwarts/icons/services/backpack.webp"
          alt=""
          width={96}
          height={96}
          className="h-20 w-20 object-contain"
        />
      </div>
      {/* Rewards (trophy) card */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: "70%",
          right: "-6%",
          width: "55%",
          height: "18%",
          borderRadius: "9999px 0 0 9999px",
          background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
        }}
      >
        <Image
          src="https://cdn.databayt.org/hogwarts/icons/services/activities-paint.png"
          alt=""
          width={72}
          height={72}
          className="h-16 w-16 object-contain"
        />
      </div>
      {/* Purple blob bottom */}
      <div
        className="absolute"
        style={{
          bottom: "-6%",
          left: "10%",
          width: "45%",
          height: "18%",
          borderRadius: "9999px 9999px 0 0",
          background:
            "linear-gradient(180deg, #a855f7 0%, #9333ea 50%, #6d28d9 100%)",
        }}
      />
    </>
  )
}
