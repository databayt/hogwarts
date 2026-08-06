"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import { gsap } from "gsap"

/**
 * Drives the curriculum stage accordion.
 *
 * The interaction is zenda's `vCardInteraction` (about/values-cards), retargeted
 * at the unscoped `.stage-*` classes in school-marketing.css so it works on a
 * bilingual page. Cards sit in a row; one is open (full width, lavender, content
 * shown) while the rest collapse to a rail showing a number and a vertical
 * label. Hovering (fine pointer) or tapping (coarse) opens a card and closes the
 * others, GSAP tweening width and autoAlpha.
 *
 * Renders nothing -- the markup is the server component's, so the stage copy
 * stays in the RSC payload and out of the client bundle.
 */
export function StageAccordion() {
  useEffect(() => {
    // Below 768 the cards stack and every one is open (CSS) -- no accordion.
    // Same breakpoint as the stacking rule; the two must not drift apart.
    if (window.matchMedia("(max-width: 768px)").matches) return

    const cards = gsap.utils.toArray<HTMLElement>(
      ".stage-accordion [data-stage-card]"
    )
    if (!cards.length) return

    const ctx = gsap.context(() => {
      const content = (c: HTMLElement) =>
        c.querySelector("[data-stage-content]")
      const label = (c: HTMLElement) => c.querySelector("[data-stage-label]")

      const closeAll = () => {
        cards.forEach((card) => {
          card.classList.remove("is-active")
          gsap.to(card, { width: "8rem", duration: 0.6, ease: "power2.out" })
          gsap.to(content(card), {
            autoAlpha: 0,
            duration: 0.4,
            ease: "power2.out",
          })
          gsap.to(label(card), {
            autoAlpha: 1,
            duration: 0.4,
            ease: "power2.out",
          })
        })
      }

      const open = (card: HTMLElement) => {
        if (card.classList.contains("is-active")) return
        closeAll()
        card.classList.add("is-active")
        gsap.to(card, { width: "100%", duration: 0.6, ease: "power2.out" })
        gsap.to(content(card), {
          autoAlpha: 1,
          duration: 0.5,
          ease: "power2.out",
        })
        gsap.to(label(card), {
          autoAlpha: 0,
          duration: 0.5,
          ease: "power2.out",
        })
      }

      const evt = window.matchMedia("(pointer: coarse)").matches
        ? "click"
        : "mouseenter"

      const handlers = cards.map((card) => {
        const h = () => open(card)
        card.addEventListener(evt, h)
        // Keyboard parity: the cards are focusable, so Enter/Space opens one.
        // Without this the section is mouse-only, and it carries real copy.
        const k = (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            open(card)
          }
        }
        card.addEventListener("keydown", k as EventListener)
        card.addEventListener("focus", h)
        return { h, k }
      })

      // Stage the first card open, matching the `is-active` in the markup.
      const first = cards[0]
      if (first?.classList.contains("is-active")) {
        gsap.set(first, { width: "100%" })
        gsap.set(content(first), { autoAlpha: 1 })
        gsap.set(label(first), { autoAlpha: 0 })
      }

      return () =>
        cards.forEach((card, i) => {
          card.removeEventListener(evt, handlers[i].h)
          card.removeEventListener("focus", handlers[i].h)
          card.removeEventListener("keydown", handlers[i].k as EventListener)
        })
    })

    return () => ctx.revert()
  }, [])

  return null
}
