// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (about/hero-cards). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

"use client"

import { useEffect } from "react"
import { gsap } from "gsap"

/**
 * About hero flip cards — a faithful port of zenda.com/about-us' `aboutHeroCards`.
 *
 * Six cards spell PARENT on the front and SCHOOL on the back. Hovering the inline
 * "parents" / "schools" buttons (or any card) flips all six with a staggered
 * `expo.inOut` tween; the active button gets `.is-active` (the filled purple
 * pill). Touch devices swap hover for click, matching the reference.
 *
 * Renders nothing — it drives the elements the markup tags with
 * `hero-btn-parents` / `hero-btn-schools` (the buttons) and `hero-card` (each
 * flipping card item), the same selectors the reference site uses.
 */
export function AboutHeroCards() {
  useEffect(() => {
    const btnParents = document.querySelector<HTMLElement>("[hero-btn-parents]")
    const btnSchools = document.querySelector<HTMLElement>("[hero-btn-schools]")
    const cards = gsap.utils.toArray<HTMLElement>("[hero-card]")
    if (!btnParents || !btnSchools || !cards.length) return

    // Flip every card to the same Y rotation, one after another (0.2s apart).
    const rotateCards = (y: number) =>
      gsap.to(cards, {
        rotationY: y,
        duration: 0.6,
        ease: "expo.inOut",
        stagger: 0.2,
      })

    const activateParents = () => {
      btnSchools.classList.remove("is-active")
      btnParents.classList.add("is-active")
      rotateCards(0) // front faces — PARENT
    }

    const activateSchools = () => {
      btnParents.classList.remove("is-active")
      btnSchools.classList.add("is-active")
      rotateCards(180) // back faces — SCHOOL
    }

    const toggle = () =>
      btnParents.classList.contains("is-active")
        ? activateSchools()
        : activateParents()

    // Reference: hover drives the desktop flip, click drives touch devices.
    const evt = window.matchMedia("(pointer: coarse)").matches
      ? "click"
      : "mouseenter"

    btnParents.addEventListener(evt, activateParents)
    btnSchools.addEventListener(evt, activateSchools)
    cards.forEach((card) => card.addEventListener(evt, toggle))

    return () => {
      btnParents.removeEventListener(evt, activateParents)
      btnSchools.removeEventListener(evt, activateSchools)
      cards.forEach((card) => card.removeEventListener(evt, toggle))
      gsap.killTweensOf(cards)
    }
  }, [])

  return null
}
