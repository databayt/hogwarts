// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/testimonials) — Swiper carousel + GSAP
// reveal. Runs under the `.zenda-clone` CSS scope.

/* eslint-disable @next/next/no-img-element */

"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type { Swiper as SwiperClass } from "swiper"
import { Keyboard, Mousewheel } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

import "swiper/css"

const CDN = "https://cdn.prod.website-files.com/622da43f87e21836ee21bed6/"
const STAR =
  "M12.0587 1.71266C12.418 0.607083 13.982 0.607083 14.3413 1.71266L16.5677 8.56494C16.7284 9.05937 17.1891 9.39412 17.709 9.39412H24.9139C26.0764 9.39412 26.5597 10.8817 25.6192 11.5649L19.7903 15.7999C19.3698 16.1055 19.1938 16.6471 19.3544 17.1415L21.5809 23.9938C21.9401 25.0994 20.6747 26.0187 19.7342 25.3354L13.9053 21.1005C13.4848 20.7949 12.9152 20.7949 12.4947 21.1005L6.66576 25.3354C5.7253 26.0187 4.45992 25.0994 4.81915 23.9938L7.04559 17.1415C7.20624 16.6471 7.03025 16.1055 6.60966 15.7999L0.780762 11.5649C-0.159695 10.8817 0.323637 9.39412 1.4861 9.39412H8.69102C9.21089 9.39412 9.67164 9.05937 9.83229 8.56494L12.0587 1.71266Z"

type Story = {
  name: string
  role: string
  date: string
  quote: string
  img: string
}

const STORIES: Story[] = [
  {
    name: "Thyge Foss",
    role: "Clarion School Parent",
    date: "April 18, 2025",
    quote:
      "Very user-friendly and easy to use app. The integration is seamless, and making payments is quick and simple.",
    img:
      CDN +
      "68dcf96810fac966e824df62_e5f87bca899b7ff284cfe815b184b530_Thyge%20Foss%20-%20Theodore%20Foss.webp",
  },
  {
    name: "Priya Sankpal",
    role: "Parent and zenda user",
    date: "17 April, 2025",
    quote:
      "An amazing & user-friendly app for hassle free fee payment. It's a boon for working parents. Grateful that my kids' school has adopted this feature. I am very happy with the support team as well!!!",
    img: CDN + "68714f1466cc69580e48d872_Priya%20Sankpal.webp",
  },
  {
    name: "Aseel Shiddo",
    role: "Scholars International Academy Parent",
    date: "May 20, 2025",
    quote:
      "Love the zenda app! It’s incredibly easy to use and navigate. We’re on the monthly plan and really appreciate the flexible payment options. Being able to pay directly through the app - without extra fees or the hassle of bank transfers is a huge plus. I also love that it supports Apple Pay.",
    img:
      CDN +
      "68dcf9d044f9cb52dd123b91_ba1f6d434cf2d11bf44da624ba43e955_Aseel%20Shiddo.webp",
  },
  {
    name: "Akshay Nayak",
    role: "Parent and zenda user",
    date: "May 19, 2025",
    quote:
      "zenda makes paying school fees convenient and hassle-free. The app is easy to understand and offers faster payment solutions with added convenience.",
    img: CDN + "68dcfa2a9249b5ec20bbf56d_Akshay%20Nayak.webp",
  },
  {
    name: "Saiqua Jabeen & Mohammad Tarique Ashraf",
    role: "Dubai Scholars Private School Parents",
    date: "May 17, 2025",
    quote:
      "I’m extremely satisfied with the zenda app. It has made school fee payments simple, fast, and incredibly convenient. Whether it’s regular tuition or one-time events like field trips, I can easily make payments from my phone without any hassle.",
    img:
      CDN +
      "68dcd04573aa7436537f37e9_SAIQUA%20JABEEN%20-%20MOHAMMAD%20TARIQUE%20ASHRAF.webp",
  },
]

function Stars() {
  return (
    <div className="testimonial_slide_rating">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="testimonial_slide_star w-embed">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            viewBox="0 0 27 26"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            role="img"
          >
            <path d={STAR} fill="currentColor" />
          </svg>
        </div>
      ))}
    </div>
  )
}

const NEIGHBOUR_SCALE = 0.9
function zoomByProgress(swiper: SwiperClass) {
  for (const slide of swiper.slides) {
    const progress = (slide as unknown as { progress: number }).progress ?? 0
    const dist = Math.min(Math.abs(progress), 1)
    ;(slide as HTMLElement).style.transform =
      `scale(${1 - dist * (1 - NEIGHBOUR_SCALE)})`
  }
}
function syncSlideTransition(swiper: SwiperClass, duration: number) {
  for (const slide of swiper.slides) {
    ;(slide as HTMLElement).style.transitionDuration = `${duration}ms`
  }
}

export function Testimonials() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const swiperRef = useRef<SwiperClass | null>(null)

  const reveal = (on: boolean, name: string): Record<string, string> =>
    on ? { [name]: "" } : {}

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          start: "top 80%",
          end: "bottom 70%",
          scrub: 1,
        },
      })
      tl.from(wrap.querySelectorAll("[testimonial-element]"), {
        opacity: 0,
        y: "6rem",
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.2,
      })
      tl.from(
        wrap.querySelectorAll("[testimonial-img]"),
        { scale: 0.4, opacity: 0, duration: 0.8, ease: "power2.out" },
        "-=0.8"
      )
      tl.from(
        wrap.querySelectorAll("[testimonial-scope]"),
        { scale: 0.6, opacity: 0, duration: 0.8, ease: "power2.out" },
        "-=0.4"
      )
    }, wrap)

    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener("load", onLoad)
    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 800)
    return () => {
      window.removeEventListener("load", onLoad)
      window.clearTimeout(refreshTimer)
      ctx.revert()
    }
  }, [])

  return (
    <section className="section_testimonial">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div ref={wrapRef} testimonial-wrap="" className="testimonial_wrap">
            <div className="testimonial_header">
              <div testimonial-element="" className="tag is-text">
                PARENTS VOICE
              </div>
              <div className="padding-bottom padding-xsmall"></div>
              <h2
                testimonial-element=""
                className="testimonial_heading heading-style-h1"
              >
                Stories from our parent community
              </h2>
            </div>
            <div className="padding-bottom padding-xlarge"></div>

            <div className="testimonial_swiper_component">
              <div className="testimonial_swiper_wrap">
                <Swiper
                  modules={[Keyboard, Mousewheel]}
                  className="is-testimonial"
                  speed={480}
                  centeredSlides
                  loop
                  watchSlidesProgress
                  slidesPerView={1}
                  spaceBetween="4%"
                  keyboard={{ enabled: true, onlyInViewport: true }}
                  mousewheel={{ forceToAxis: true }}
                  slideActiveClass="is-active"
                  breakpoints={{
                    280: { slidesPerView: 1.1, spaceBetween: "-1%" },
                    768: { slidesPerView: 1, spaceBetween: "-2%" },
                    992: { slidesPerView: 1, spaceBetween: "-2%" },
                  }}
                  onSwiper={(s) => {
                    swiperRef.current = s
                  }}
                  onSetTranslate={zoomByProgress}
                  onSetTransition={syncSlideTransition}
                >
                  {STORIES.map((s, i) => (
                    <SwiperSlide key={i} className="is-testimonial">
                      <div className="testimonial_slide">
                        <div className="testimonial_slide-grid">
                          <div className="testimonial_content">
                            <div {...reveal(i === 0, "testimonial-element")}>
                              <div className="heading-style-h5 text-weight-medium">
                                {s.name}
                              </div>
                              <div className="padding-bottom padding-tiny"></div>
                              <div className="text-size-large">{s.role}</div>
                            </div>
                            <div className="testimonial_slide_content">
                              <div
                                {...reveal(i === 0, "testimonial-element")}
                                className="testimonial_slide_details"
                              >
                                <Stars />
                                <div className="testimonial_slide_date">
                                  <div className="text-size-medium">
                                    {s.date}
                                  </div>
                                </div>
                              </div>
                              <div
                                {...reveal(i === 0, "testimonial-element")}
                                className="max-width is-27rem"
                              >
                                <p className="text-size-large text-weight-normal">
                                  {s.quote}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="testimonial_img-parent">
                            <div
                              {...reveal(i === 0, "testimonial-img")}
                              className="testimonial_img-wrap"
                            >
                              <img
                                src={s.img}
                                loading="lazy"
                                alt={s.name}
                                className="img-cover"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              <div
                testimonial-element=""
                className="testimonial_slider_btn-wrap"
              >
                <a
                  href="#"
                  className="testimonial_slider_btn swiper-prev w-inline-block"
                  role="button"
                  aria-label="Previous slide"
                  onClick={(e) => {
                    e.preventDefault()
                    swiperRef.current?.slidePrev()
                  }}
                >
                  <div className="icon-embed-small w-embed">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                      role="img"
                      width="100%"
                      height="100%"
                      preserveAspectRatio="xMidYMid meet"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M12.707 17.293L8.414 13H18v-2H8.414l4.293-4.293l-1.414-1.414L4.586 12l6.707 6.707z"
                      />
                    </svg>
                  </div>
                </a>
                <a
                  href="#"
                  className="testimonial_slider_btn swiper-next w-inline-block"
                  role="button"
                  aria-label="Next slide"
                  onClick={(e) => {
                    e.preventDefault()
                    swiperRef.current?.slideNext()
                  }}
                >
                  <div className="icon-embed-small w-embed">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                      role="img"
                      width="100%"
                      height="100%"
                      preserveAspectRatio="xMidYMid meet"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="m11.293 17.293l1.414 1.414L19.414 12l-6.707-6.707l-1.414 1.414L15.586 11H6v2h9.586z"
                      />
                    </svg>
                  </div>
                </a>
              </div>
            </div>

            <div testimonial-scope="" className="testimonial_abs-wrap">
              <img
                src={CDN + "67da7e672525f92ae2c877cb_telescope.webp"}
                loading="lazy"
                width={174}
                height={244}
                alt=""
                className="img-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
