// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (for-schools/features "Services" deck) — GSAP
// sticky-card stack. Runs under the `.zenda-clone` CSS scope. SERVICES is
// inlined; slide art was copied to public/imported/zenda/.

"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const IMG = "/imported/zenda"

interface ServiceCard {
  id: string
  tag: string
  tagClass: string
  iconViewBox: string
  iconPath: string
  title: string
  description: string
  image: string
  width: number
  height: number
}

const SERVICES: ServiceCard[] = [
  {
    id: "card-1",
    tag: "PAY NOW",
    tagClass: "",
    iconViewBox: "0 0 25 25",
    iconPath:
      "M20.0493 5H5.0493C4.45256 5 3.88027 5.23705 3.45831 5.65901C3.03635 6.08097 2.7993 6.65326 2.7993 7.25V17.75C2.7993 18.3467 3.03635 18.919 3.45831 19.341C3.88027 19.7629 4.45256 20 5.0493 20H20.0493C20.646 20 21.2183 19.7629 21.6403 19.341C22.0622 18.919 22.2993 18.3467 22.2993 17.75V7.25C22.2993 6.65326 22.0622 6.08097 21.6403 5.65901C21.2183 5.23705 20.646 5 20.0493 5ZM4.2993 9.5H20.7993V11H15.5493C15.3504 11 15.1596 11.079 15.019 11.2197C14.8783 11.3603 14.7993 11.5511 14.7993 11.75C14.7993 12.3467 14.5622 12.919 14.1403 13.341C13.7183 13.7629 13.146 14 12.5493 14C11.9526 14 11.3803 13.7629 10.9583 13.341C10.5364 12.919 10.2993 12.3467 10.2993 11.75C10.2993 11.5511 10.2203 11.3603 10.0796 11.2197C9.93898 11.079 9.74821 11 9.5493 11H4.2993V9.5ZM5.0493 6.5H20.0493C20.2482 6.5 20.439 6.57902 20.5796 6.71967C20.7203 6.86032 20.7993 7.05109 20.7993 7.25V8H4.2993V7.25C4.2993 7.05109 4.37832 6.86032 4.51897 6.71967C4.65962 6.57902 4.85039 6.5 5.0493 6.5ZM20.0493 18.5H5.0493C4.85039 18.5 4.65962 18.421 4.51897 18.2803C4.37832 18.1397 4.2993 17.9489 4.2993 17.75V12.5H8.8743C9.04644 13.3477 9.50635 14.1099 10.1761 14.6573C10.8459 15.2047 11.6843 15.5038 12.5493 15.5038C13.4143 15.5038 14.2527 15.2047 14.9225 14.6573C15.5923 14.1099 16.0522 13.3477 16.2243 12.5H20.7993V17.75C20.7993 17.9489 20.7203 18.1397 20.5796 18.2803C20.439 18.421 20.2482 18.5 20.0493 18.5Z",
    title: "Improve collection efficiency",
    description:
      "Allow transactions anytime, anywhere via multiple payment modes. Fully reconciled & digital.",
    image: `${IMG}/slide_pay-now_img.webp`,
    width: 2561,
    height: 2095,
  },
  {
    id: "card-2",
    tag: "AUTOPAY",
    tagClass: " is-autopay",
    iconViewBox: "0 0 25 25",
    iconPath:
      "M21.5489 5H3.54887C3.15105 5 2.76952 5.15804 2.48821 5.43934C2.20691 5.72064 2.04887 6.10218 2.04887 6.5V18.5C2.04887 18.8978 2.20691 19.2794 2.48821 19.5607C2.76952 19.842 3.15105 20 3.54887 20H21.5489C21.9467 20 22.3282 19.842 22.6095 19.5607C22.8908 19.2794 23.0489 18.8978 23.0489 18.5V6.5C23.0489 6.10218 22.8908 5.72064 22.6095 5.43934C22.3282 5.15804 21.9467 5 21.5489 5ZM21.5489 6.5V8.75H3.54887V6.5H21.5489ZM21.5489 18.5H3.54887V10.25H21.5489V18.5ZM20.0489 16.25C20.0489 16.4489 19.9699 16.6397 19.8292 16.7803C19.6886 16.921 19.4978 17 19.2989 17H16.2989C16.1 17 15.9092 16.921 15.7685 16.7803C15.6279 16.6397 15.5489 16.4489 15.5489 16.25C15.5489 16.0511 15.6279 15.8603 15.7685 15.7197C15.9092 15.579 16.1 15.5 16.2989 15.5H19.2989C19.4978 15.5 19.6886 15.579 19.8292 15.7197C19.9699 15.8603 20.0489 16.0511 20.0489 16.25ZM14.0489 16.25C14.0489 16.4489 13.9699 16.6397 13.8292 16.7803C13.6886 16.921 13.4978 17 13.2989 17H11.7989C11.6 17 11.4092 16.921 11.2685 16.7803C11.1279 16.6397 11.0489 16.4489 11.0489 16.25C11.0489 16.0511 11.1279 15.8603 11.2685 15.7197C11.4092 15.579 11.6 15.5 11.7989 15.5H13.2989C13.4978 15.5 13.6886 15.579 13.8292 15.7197C13.9699 15.8603 14.0489 16.0511 14.0489 16.25Z",
    title: "Increase predictability via auto-payments",
    description:
      "Leverage zenda's modern tools to automate collection, reminders and follow-ups, as well as to change habits.",
    image: `${IMG}/slide_autopay_img.webp`,
    width: 2561,
    height: 2095,
  },
  {
    id: "card-3",
    tag: "MARKETPLACE",
    tagClass: " is-marketplace",
    iconViewBox: "0 0 25 25",
    iconPath:
      "M20.2989 4.25H3.79887C3.40105 4.25 3.01952 4.40804 2.73821 4.68934C2.45691 4.97064 2.29887 5.35218 2.29887 5.75V19.25C2.29887 19.6478 2.45691 20.0294 2.73821 20.3107C3.01952 20.592 3.40105 20.75 3.79887 20.75H20.2989C20.6967 20.75 21.0782 20.592 21.3595 20.3107C21.6408 20.0294 21.7989 19.6478 21.7989 19.25V5.75C21.7989 5.35218 21.6408 4.97064 21.3595 4.68934C21.0782 4.40804 20.6967 4.25 20.2989 4.25ZM20.2989 5.75V7.25H3.79887V5.75H20.2989ZM20.2989 19.25H3.79887V8.75H20.2989V19.25ZM16.5489 11C16.5489 12.1935 16.0748 13.3381 15.2309 14.182C14.3869 15.0259 13.2423 15.5 12.0489 15.5C10.8554 15.5 9.71081 15.0259 8.86689 14.182C8.02298 13.3381 7.54887 12.1935 7.54887 11C7.54887 10.8011 7.62789 10.6103 7.76854 10.4697C7.9092 10.329 8.09996 10.25 8.29887 10.25C8.49779 10.25 8.68855 10.329 8.8292 10.4697C8.96986 10.6103 9.04887 10.8011 9.04887 11C9.04887 11.7956 9.36494 12.5587 9.92755 13.1213C10.4902 13.6839 11.2532 14 12.0489 14C12.8445 14 13.6076 13.6839 14.1702 13.1213C14.7328 12.5587 15.0489 11.7956 15.0489 11C15.0489 10.8011 15.1279 10.6103 15.2685 10.4697C15.4092 10.329 15.6 10.25 15.7989 10.25C15.9978 10.25 16.1886 10.329 16.3292 10.4697C16.4699 10.6103 16.5489 10.8011 16.5489 11Z",
    title: "All transactions in one place",
    description:
      "Collect payments for all things school like trips, canteen, uniform & more. Fully reconciled with stronger control.",
    image: `${IMG}/slide_marketplace_img.webp`,
    width: 2562,
    height: 2095,
  },
  {
    id: "card-4",
    tag: "RE-ENROLLMENT",
    tagClass: " is-re-enrollment",
    iconViewBox: "0 0 25 24",
    iconPath:
      "M15.7989 14.2499C15.7989 14.4488 15.7199 14.6395 15.5792 14.7802C15.4386 14.9208 15.2478 14.9999 15.0489 14.9999H9.04887C8.84996 14.9999 8.6592 14.9208 8.51854 14.7802C8.37789 14.6395 8.29887 14.4488 8.29887 14.2499C8.29887 14.051 8.37789 13.8602 8.51854 13.7195C8.6592 13.5789 8.84996 13.4999 9.04887 13.4999H15.0489C15.2478 13.4999 15.4386 13.5789 15.5792 13.7195C15.7199 13.8602 15.7989 14.051 15.7989 14.2499ZM15.0489 10.4999H9.04887C8.84996 10.4999 8.6592 10.5789 8.51854 10.7195C8.37789 10.8602 8.29887 11.051 8.29887 11.2499C8.29887 11.4488 8.37789 11.6395 8.51854 11.7802C8.6592 11.9208 8.84996 11.9999 9.04887 11.9999H15.0489C15.2478 11.9999 15.4386 11.9208 15.5792 11.7802C15.7199 11.6395 15.7989 11.4488 15.7989 11.2499C15.7989 11.051 15.7199 10.8602 15.5792 10.7195C15.4386 10.5789 15.2478 10.4999 15.0489 10.4999ZM20.2989 4.49986V20.2499C20.2989 20.6477 20.1408 21.0292 19.8595 21.3105C19.5782 21.5918 19.1967 21.7499 18.7989 21.7499H5.29887C4.90105 21.7499 4.51952 21.5918 4.23821 21.3105C3.95691 21.0292 3.79887 20.6477 3.79887 20.2499V4.49986C3.79887 4.10204 3.95691 3.72051 4.23821 3.4392C4.51952 3.1579 4.90105 2.99986 5.29887 2.99986H8.69825C9.11966 2.52804 9.63597 2.15054 10.2134 1.89207C10.7908 1.63361 11.4163 1.5 12.0489 1.5C12.6815 1.5 13.307 1.63361 13.8844 1.89207C14.4618 2.15054 14.9781 2.52804 15.3995 2.99986H18.7989C19.1967 2.99986 19.5782 3.1579 19.8595 3.4392C20.1408 3.72051 20.2989 4.10204 20.2989 4.49986ZM9.04887 5.99986H15.0489C15.0489 5.20421 14.7328 4.44115 14.1702 3.87854C13.6076 3.31593 12.8445 2.99986 12.0489 2.99986C11.2532 2.99986 10.4902 3.31593 9.92755 3.87854C9.36494 4.44115 9.04887 5.20421 9.04887 5.99986ZM18.7989 4.49986H16.2911C16.4617 4.98157 16.5489 5.48884 16.5489 5.99986V6.74986C16.5489 6.94878 16.4699 7.13954 16.3292 7.28019C16.1886 7.42085 15.9978 7.49986 15.7989 7.49986H8.29887C8.09996 7.49986 7.9092 7.42085 7.76854 7.28019C7.62789 7.13954 7.54887 6.94878 7.54887 6.74986V5.99986C7.54889 5.48884 7.63608 4.98157 7.80669 4.49986H5.29887V20.2499H18.7989V4.49986Z",
    title: "Get ahead on enrollment",
    description:
      "Actively monitor next year's enrollment pipeline and auto-collect on due-dates.",
    image: `${IMG}/slide_re-enrollment_img.webp`,
    width: 2561,
    height: 2095,
  },
  {
    id: "card-5",
    tag: "REWARDS",
    tagClass: "",
    iconViewBox: "0 0 25 24",
    iconPath:
      "M22.553 6.00879H20.303V4.50879C20.303 4.30988 20.224 4.11911 20.0833 3.97846C19.9427 3.83781 19.7519 3.75879 19.553 3.75879H6.05298C5.85407 3.75879 5.6633 3.83781 5.52265 3.97846C5.382 4.11911 5.30298 4.30988 5.30298 4.50879V6.00879H3.05298C2.65515 6.00879 2.27362 6.16682 1.99232 6.44813C1.71101 6.72943 1.55298 7.11096 1.55298 7.50879V9.00879C1.55298 10.0034 1.94807 10.9572 2.65133 11.6604C2.99955 12.0087 3.41294 12.2849 3.86792 12.4733C4.32289 12.6618 4.81052 12.7588 5.30298 12.7588H5.64517C6.08696 14.1589 6.92932 15.3988 8.06814 16.3253C9.20695 17.2519 10.5923 17.8244 12.053 17.9722V20.2588H9.80298C9.60407 20.2588 9.4133 20.3378 9.27265 20.4785C9.132 20.6191 9.05298 20.8099 9.05298 21.0088C9.05298 21.2077 9.132 21.3985 9.27265 21.5391C9.4133 21.6798 9.60407 21.7588 9.80298 21.7588H15.803C16.0019 21.7588 16.1927 21.6798 16.3333 21.5391C16.474 21.3985 16.553 21.2077 16.553 21.0088C16.553 20.8099 16.474 20.6191 16.3333 20.4785C16.1927 20.3378 16.0019 20.2588 15.803 20.2588H13.553V17.9694C16.5474 17.6666 19.0317 15.5657 19.9355 12.7588H20.303C21.2975 12.7588 22.2514 12.3637 22.9546 11.6604C23.6579 10.9572 24.053 10.0034 24.053 9.00879V7.50879C24.053 7.11096 23.8949 6.72943 23.6136 6.44813C23.3323 6.16682 22.9508 6.00879 22.553 6.00879ZM5.30298 11.2588C4.70624 11.2588 4.13395 11.0217 3.71199 10.5998C3.29003 10.1778 3.05298 9.60553 3.05298 9.00879V7.50879H5.30298V10.5088C5.30298 10.7588 5.31517 11.0088 5.33954 11.2588H5.30298ZM18.803 10.4244C18.803 13.7544 16.0842 16.4844 12.803 16.5088C11.2117 16.5088 9.68556 15.8766 8.56034 14.7514C7.43512 13.6262 6.80298 12.1001 6.80298 10.5088V5.25879H18.803V10.4244ZM22.553 9.00879C22.553 9.60553 22.3159 10.1778 21.894 10.5998C21.472 11.0217 20.8997 11.2588 20.303 11.2588H20.2561C20.2869 10.9817 20.3025 10.7032 20.303 10.4244V7.50879H22.553V9.00879Z",
    title: "Reward good parent behaviour",
    description:
      "Incentivise and appreciate parents with thoughtful experiences.",
    image: `${IMG}/rewards.webp`,
    width: 2289,
    height: 2045,
  },
]

export function Features() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (window.innerWidth <= 767) return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[services-card]")
      const dots = gsap.utils.toArray<HTMLElement>("[services-dot]")

      const remPx =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const pin = `top ${6 * remPx}px`
      const spy = `top ${7 * remPx}px`

      const setCurrent = (i: number) => {
        const idx = Math.max(0, Math.min(i, dots.length - 1))
        dots.forEach((d, di) => d.classList.toggle("w--current", di === idx))
      }
      setCurrent(0)

      cards.forEach((card, i) => {
        if (i < cards.length - 1) {
          gsap.to(card, {
            scale: 0.92,
            transformOrigin: "50% 0%",
            ease: "none",
            scrollTrigger: {
              trigger: cards[i + 1],
              start: "top bottom",
              end: pin,
              scrub: true,
            },
          })
        }

        ScrollTrigger.create({
          trigger: card,
          start: spy,
          onEnter: () => setCurrent(i),
          onLeaveBack: () => setCurrent(i - 1),
        })
      })
    }, section)

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener("load", refresh)
    const refreshTimer = window.setTimeout(refresh, 600)

    return () => {
      window.removeEventListener("load", refresh)
      window.clearTimeout(refreshTimer)
      ctx.revert()
    }
  }, [])

  return (
    <section ref={sectionRef} className="section_services">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div className="services_wrap">
            <div className="services_header">
              <div className="tag is-text">Services</div>
              <div className="padding-bottom padding-small"></div>
              <div className="max-width-large align-center">
                <h2 className="services_heading heading-style-h2">
                  Smarter transactions <br /> for smarter schools
                </h2>
              </div>
            </div>

            <div className="padding-bottom padding-xxlarge"></div>

            <div className="services_list">
              {SERVICES.map((s) => (
                <div
                  key={s.id}
                  id={s.id}
                  services-card=""
                  className="services_sticky-card"
                >
                  <div className="services_grid">
                    <div className="services_content-wrap">
                      <div className={`services_tag${s.tagClass}`}>
                        <div className="icon-embed-xsmall w-embed">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="100%"
                            height="100%"
                            viewBox={s.iconViewBox}
                            fill="none"
                            preserveAspectRatio="xMidYMid meet"
                            aria-hidden="true"
                            role="img"
                          >
                            <path d={s.iconPath} fill="currentColor" />
                          </svg>
                        </div>
                        <div>{s.tag}</div>
                      </div>
                      <div className="services_content">
                        <div className="max-width-xxsmall">
                          <h2 className="services_sub-heading heading-style-h2">
                            {s.title}
                          </h2>
                        </div>
                        <div className="padding-bottom padding-xsmall"></div>
                        <div className="max-width is-24rem">
                          <p className="services_para">{s.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="services_img-wrap">
                      <Image
                        src={s.image}
                        alt={s.title}
                        width={s.width}
                        height={s.height}
                        sizes="(max-width: 767px) 100vw, 588px"
                        className="img-cover"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="services_links-parent">
                <div className="services_links-wrap">
                  {SERVICES.map((s, i) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      services-dot=""
                      aria-label={s.tag}
                      className={`services_link${i === 0 ? "w--current" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
