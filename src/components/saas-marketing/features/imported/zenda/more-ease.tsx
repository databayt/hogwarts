// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (parents/services "Less Stress / More Ease") —
// GSAP pinned scrub. Runs under the `.zenda-clone` CSS scope. PARENT_SERVICES
// is inlined; category art reuses the same Webflow CDN illustrations.

/* eslint-disable @next/next/no-img-element */

"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const CDN = "https://cdn.prod.website-files.com/622da43f87e21836ee21bed6/"

const PARENT_SERVICES: { title: string; image: string }[] = [
  {
    title: "Uniform",
    image: CDN + "67ecd573d52fd02665fc093c_Group%201244838934.webp",
  },
  {
    title: "Activities",
    image: CDN + "67ecd57339122da7a049c1c3_Group%202147226802.webp",
  },
  {
    title: "Trips & Tours",
    image: CDN + "67ecd5738b42c09836a6a451_Group%202147226814.webp",
  },
  { title: "Exams", image: CDN + "6867786909fd44c183a35f1e_Exams.webp" },
  {
    title: "Transport",
    image: CDN + "67ecd5746a265afb0ef69250_Group%202147226817.webp",
  },
  {
    title: "Canteen",
    image: CDN + "67ecd5731a9f1c4f49ce8fa4_Group%202147226801.webp",
  },
  {
    title: "Events",
    image: CDN + "67ecd573745cd68d0ee5b361_Group%202147226812.webp",
  },
  {
    title: "Supplies",
    image: CDN + "67ecd57301080e715ed55b09_Group%202147226813.webp",
  },
  {
    title: "Counselling",
    image: CDN + "686776b7c313e2af8a057eb6_Counselling.webp",
  },
  {
    title: "Fees",
    image: CDN + "67ecd573618ad39b90780be1_Group%202147226818.webp",
  },
]

const EASE_ITEMS = [...PARENT_SERVICES, ...PARENT_SERVICES, ...PARENT_SERVICES]

export function Services() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=4100",
          pin: true,
          scrub: 1,
        },
      })

      tl.from("[parents-ease-header]", {
        maxWidth: "22rem",
        duration: 1,
        ease: "power2.out",
      })
        .from(
          "[parents-ease-para]",
          { opacity: 0, y: "2rem", duration: 1, ease: "power2.out" },
          ">"
        )
        .from(
          "[parents-ease-marquee]",
          { opacity: 0, duration: 1, ease: "power2.out" },
          0.2
        )
        .from(
          "[parents-ease-marquee]",
          { y: "40%", duration: 8, ease: "power2.out" },
          0.2
        )
    }, section)

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener("load", refresh)

    return () => {
      window.removeEventListener("load", refresh)
      ctx.revert()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      section-parents-ease=""
      className="section_parents-ease bg-[#f4f2ec]"
    >
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div className="parents-ease_wrap">
            <div parents-ease-header="" className="parents-ease_header">
              <div className="parents-ease_left-block">
                <h2 className="parents-ease_heading heading-style-h2">
                  Less Stress
                </h2>
              </div>
              <div className="parents-ease_right-block">
                <h2 className="parents-ease_heading heading-style-h2">
                  More Ease
                </h2>
                <div className="padding-bottom padding-xxsmall"></div>
                <p parents-ease-para="" className="heading-style-h5">
                  a simple, smart way to pay
                </p>
              </div>
            </div>

            <div className="parents-ease_marquee-component">
              <div className="parents-ease_marquee_wrap">
                <div
                  parents-ease-marquee=""
                  className="parents-ease_marquee_list-wrap"
                >
                  <div className="parents-ease_marquee_track">
                    <div className="parents-ease_marquee_list">
                      {EASE_ITEMS.map((item, idx) => (
                        <div key={idx} className="parents-ease_marquee_item">
                          <div className="parents-ease_item">
                            <div
                              className={`parents-ease_img-wrap${
                                item.title === "Supplies" ? "is-supplies" : ""
                              }`}
                            >
                              <img
                                src={item.image}
                                alt=""
                                className="img-auto"
                                loading="lazy"
                              />
                            </div>
                            <div className="parents-ease_title">
                              {item.title}
                            </div>
                          </div>
                          <div className="parents-ease_checkmark">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="100%"
                              viewBox="0 0 40 40"
                              fill="none"
                              className="svg"
                            >
                              <circle
                                cx="19.7673"
                                cy="19.7635"
                                r="19.7204"
                                fill="#614D76"
                              />
                              <path
                                d="M11.7383 20.1998L16.7974 25.2589L27.7891 14.2672"
                                stroke="white"
                                strokeWidth="3.50069"
                              />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="parents-ease_gradient is-bottom"></div>
              <div className="parents-ease_ground-wrap">
                <img
                  src="https://cdn.prod.website-files.com/622da43f87e21836ee21bed6/685573ecd43d1904eee1127d_Group%202147226852.svg"
                  alt=""
                  className="img-auto"
                  loading="lazy"
                />
              </div>
              <div className="parents-ease_gradient"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
