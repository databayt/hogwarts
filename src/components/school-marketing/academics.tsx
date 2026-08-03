"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useDictionary } from "@/components/internationalization/use-dictionary"

const AUTO_ADVANCE_SECONDS = 6

/**
 * Synced accordion + preview panel, auto-advancing every 6s (topmate.io's
 * features pattern). A `setTimeout` keyed to `activeIndex` -- rather than a
 * bare `setInterval` -- is what makes a manual click "restart the timer" for
 * free: changing `activeIndex` reruns the effect, clearing the pending
 * timeout and scheduling a fresh one.
 *
 * Auto-advance is disarmed (no timer, no progress bar) under
 * prefers-reduced-motion, and paused while the section is scrolled out of
 * view so it never spins unseen.
 */
export function Academics() {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.academics
  const items = t?.items ?? []

  const [activeIndex, setActiveIndex] = useState(0)
  const [inView, setInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const armed = inView && !reducedMotion && items.length > 1

  useEffect(() => {
    if (!armed) return
    const id = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % items.length)
    }, AUTO_ADVANCE_SECONDS * 1000)
    return () => clearTimeout(id)
  }, [activeIndex, armed, items.length])

  if (!t || items.length === 0) return null

  const active = items[activeIndex] ?? items[0]
  const titleLines = (t.title ?? "").split("\n").filter(Boolean)

  return (
    <section ref={sectionRef} className="section-y">
      <div className="mb-10 max-w-2xl md:mb-14">
        {t.eyebrow && <p className="eyebrow mb-3">{t.eyebrow}</p>}
        <h2 className="display-2">
          {titleLines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h2>
        {t.description && <p className="display-intro mt-4">{t.description}</p>}
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        <Accordion
          type="single"
          value={String(activeIndex)}
          onValueChange={(value) => {
            if (value) setActiveIndex(Number(value))
          }}
        >
          {items.map((item, index) => (
            <AccordionItem key={item.title} value={String(index)}>
              <AccordionTrigger>{item.title}</AccordionTrigger>

              {/* Only the active item carries a progress bar; the flex
                  container (not a transform) is what keeps the fill
                  anchored to the inline-start edge under RTL. */}
              {index === activeIndex && (
                <div
                  aria-hidden
                  className="bg-foreground/10 flex h-0.5 w-full justify-start overflow-hidden rounded-full"
                >
                  {armed && (
                    <motion.div
                      key={activeIndex}
                      className="bg-foreground h-full rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: AUTO_ADVANCE_SECONDS,
                        ease: "linear",
                      }}
                    />
                  )}
                </div>
              )}

              <AccordionContent>
                <p className="text-muted-foreground">{item.body}</p>
                <ul className="mt-4 list-disc space-y-2 ps-5 text-sm">
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="band-cool min-h-[22rem] rounded-2xl p-8 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.3 }}
            >
              <h3 className="display-3">{active.title}</h3>
              <ul className="mt-6 space-y-3">
                {active.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <Check className="band-muted mt-1 size-4 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
