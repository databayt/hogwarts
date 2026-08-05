// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (about/events). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

"use client"

import { Keyboard, Mousewheel } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

import "swiper/css"

/**
 * About "Media & Events" — a Swiper carousel of event cards, a faithful port of
 * zenda.com/about-us' events slider. Each card pairs a portrait photo with the
 * event name, date · location, a recap paragraph, and a "Linkedin Post" link.
 * `slidesPerView: 1.2` peeks the next card; drag / keyboard / mousewheel advance
 * it (the reference has no visible arrows). Below 768px the card stacks.
 */

type EventItem = {
  img: string
  fit?: "left" | "right" // object-position variant for a couple of shots
  heading: string
  details: string
  para: string
  href: string
}

const EVENTS: EventItem[] = [
  {
    img: "e1.webp",
    heading: "An Evening of Celebration",
    details: "20 Jun '25  I  Dubai",
    para: "An evening dedicated to celebrating the people who make it all possible — our peers and partners in schools who are the backbone of our shared success. As we reflected on a year of milestones, from being named among UAE's Top Fintech companies to expanding to 450+ schools, we were reminded that every achievement is powered by trust and genuine collaboration. Here’s to many more! 🚀",
    href: "https://www.linkedin.com/posts/zendaapp_schoolfinance-digitalpayments-educationfinance-activity-7345713136269676544-RkXa",
  },
  {
    img: "e2.webp",
    heading: "Higher Education Conference",
    details: "29 May '25 | Dubai",
    para: "Financial innovation in higher education is no longer just an idea — it’s quickly becoming the norm. The event brought together leaders and experts for an energising morning of ideas, perspectives, and progress. From insightful panel discussions to meaningful new connections, the gathering highlighted the urgent need for efficient, unified solutions to manage transactions across tuition fee and beyond.",
    href: "https://www.linkedin.com/posts/zendaapp_highereducation-universityfinance-smartpayments-ugcPost-7334255343205531649-QtTr",
  },
  {
    img: "e3.webp",
    heading: "BSME / Annual School Leaders' Conference",
    details: "28-30 Jan '25 | Abu Dhabi",
    para: "Inspiring sessions and invaluable networking unfolded in Abu Dhabi, bringing together education leaders and British schools from across the region. The BSME Annual Conference showcased a shared commitment to shaping the future of learning through innovation and collaboration. The experience highlighted the power of community in driving positive change in education.",
    href: "https://www.linkedin.com/feed/update/urn:li:activity:7293273691721732096",
  },
  {
    img: "e4.webp",
    heading: "NESA Fall Leadership conference",
    details: "17-20 Oct '24 | Dubai",
    para: "At the NESA Fall Leadership Conference, we connected with forward-thinking school leaders and changemakers dedicated to shaping the future of education in the region. We engaged in meaningful dialogues around building stronger partnerships with schools to support their evolving needs. It was inspiring to witness the energy and ideas shared across the community, to empower schools with seamless, technology-driven solutions.",
    href: "https://www.linkedin.com/feed/update/urn:li:activity:7252283019242209280",
  },
  {
    img: "e5.webp",
    fit: "left",
    heading: "BSME Business Leader's Conference",
    details: "9 Nov '24 | Dubai",
    para: "Industry experts and education leaders explored fresh strategies for advancing school operations and leadership in Dubai. Through an engaging workshop, we shared insights on financial innovation and empowering schools to achieve operational excellence. It was an inspiring day of thought leadership and collaboration focused on shaping the future of education across the region.",
    href: "https://www.linkedin.com/feed/update/urn:li:activity:7260873919170023424",
  },
  {
    img: "e6.jpeg",
    heading: "EdInvest Saudi Arabia",
    details: "3-4 Dec '24 | Riyadh",
    para: "Haseeb joined industry experts at the EdInvest platform to talk about 'improving profitability through digital transformations in financial services & classrooms'. As the Kingdom moves towards Vision 2030, the event provided a dynamic platform for leading investors, educators, and policymakers to discuss innovative partnerships and opportunities to meet the growing demand for world-class private education.",
    href: "https://www.linkedin.com/feed/update/urn:li:activity:7272194224563920898",
  },
  {
    img: "e7.webp",
    fit: "right",
    heading: "EdInvest MENA",
    details: "13-14 Nov'24 | Dubai",
    para: "EdEx MENA brought together education leaders, investors, and innovators from across the region to explore new ideas, partnerships, and solutions driving the future of learning. From school operators to EdTech pioneers, the event offered a powerful platform to discuss opportunities for growth and collaboration in an evolving education landscape.",
    href: "https://www.linkedin.com/feed/update/urn:li:activity:7262395621955751938",
  },
  {
    img: "e8.jpg",
    heading: "Future 100 by Ministry Of UAE",
    details: "9 Dec '23 | Dubai",
    para: "zenda is thrilled to be recognized as a Future 100 company by the Ministry Of Economy, UAE and the Government Development and the Future Office! A true testament to zenda's mission orientation, team spirit, and the unstoppable drive to sculpt the future of school payments! A special thanks to HE Abdulla Bin Touq, and HE Ohood Khalfan Al Roumi for extending this honour.",
    href: "https://www.linkedin.com/posts/zendaapp_future100-activity-7143960167443849216-adFT",
  },
  {
    img: "e9.webp",
    heading: "EdInvest Saudi Arabia '23",
    details: "5-6 Dec '23 | Riyadh",
    para: "At Education Investment Saudi, conversations on transforming financial services for K-12 education were dynamic and enlightening. Our co-Founder Haseeb joined industry experts at the event to talk about 'improving profitability through digital transformations in financial services & classrooms'. Grateful for the opportunity to engage and collaborate with some of the best minds in Saudi's education & technology sector.",
    href: "https://www.linkedin.com/feed/update/urn:li:activity:7141765813463678976",
  },
  {
    img: "e10.webp",
    heading: "Fintech Kuwait",
    details: "20-21 Nov '23 | Kuwait",
    para: "A delightful few days discovering the future of digital payments in Kuwait at the Fintech Festival! Our Founder, Raman thiagarajan lead a powerhouse panel featuring experts from LuLu Financial Holdings, McKinsey & Company, and Ahli United Bank & Kem, as he unraveled the blueprint of nurturing fintech ecosystems for key industries.",
    href: "https://www.linkedin.com/feed/update/urn:li:activity:7132326686611681281",
  },
  {
    img: "e11.webp",
    heading: "EdInvest MENA '23",
    details: "4-5 Oct '23 | Dubai",
    para: "A pleasure meeting with our peers, partners & potential associates on this mindfully curated platform. Our Founder & Co-founder, Raman Thiagarajan & Haseeb Ahmed respectively, lent their voice at the conference & shared some key insights on revolutionising financial services in education through technology, creating an unmistakable stir in this melting pot of ideas",
    href: "https://www.linkedin.com/posts/zendaapp_edexmena-zenda-fintech-ugcPost-7117795182879674368-PJ63",
  },
  {
    img: "e12.webp",
    heading: "Dubai Fintech Summit '23 by DIFC",
    details: "8-9 May '23 | Dubai",
    para: "Packed with a cluster of industry experts coming from beyond the length & breadth of the fintech eco-system, a pleasure to meet with like minded folks that are changing the narrative with their tech. As zenda leads the walk in providing specialised solutions, our founder & Co-founder, Raman Thiagarajan & Haseeb Ahmed, shared their expertise on leveraging technology to transform financial services in education.",
    href: "https://www.linkedin.com/feed/update/urn:li:activity:7067506544203993088",
  },
]

function LinkedInOutlineIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 35 34"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      role="img"
    >
      <path
        d="M10.2109 14.1709V24.0876"
        stroke="currentColor"
        strokeWidth="1.06643"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.0391 18.4209V24.0876M16.0391 18.4209C16.0391 16.0736 17.9977 14.1709 20.4141 14.1709C22.8304 14.1709 24.7891 16.0736 24.7891 18.4209V24.0876M16.0391 18.4209V14.1709"
        stroke="currentColor"
        strokeWidth="1.06643"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.225 9.92188H10.2109"
        stroke="currentColor"
        strokeWidth="1.4219"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.64844 17.0062C3.64844 10.6619 3.64844 7.48971 5.67733 5.51878C7.70624 3.54785 10.9717 3.54785 17.5026 3.54785C24.0335 3.54785 27.299 3.54785 29.3279 5.51878C31.3568 7.48971 31.3568 10.6619 31.3568 17.0062C31.3568 23.3504 31.3568 26.5226 29.3279 28.4937C27.299 30.4645 24.0335 30.4645 17.5026 30.4645C10.9717 30.4645 7.70624 30.4645 5.67733 28.4937C3.64844 26.5226 3.64844 23.3504 3.64844 17.0062Z"
        stroke="currentColor"
        strokeWidth="1.06643"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Events() {
  return (
    <section className="section_events">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div className="events_wrap">
            <div className="events_header">
              <div className="tag is-text">Our presence</div>
              <div className="padding-bottom padding-xxsmall" />
              <h2 className="events_heading heading-style-h2">
                Media &amp; Events
              </h2>
            </div>

            <div className="padding-bottom padding-xlarge" />

            <div className="events_slider_component">
              <Swiper
                modules={[Keyboard, Mousewheel]}
                className="is-events-slider"
                speed={300}
                slidesPerView={1.2}
                spaceBetween="2%"
                slideActiveClass="is-active"
                keyboard={{ enabled: true, onlyInViewport: true }}
                mousewheel={{ forceToAxis: true }}
                breakpoints={{
                  280: { slidesPerView: 1.05, spaceBetween: "4%" },
                  768: { slidesPerView: 1.2, spaceBetween: "2%" },
                  992: { slidesPerView: 1.2, spaceBetween: "2%" },
                }}
              >
                {EVENTS.map((e, i) => (
                  <SwiperSlide key={i} className="is-events-slider">
                    <div className="events_slider_slide">
                      <div className="events_slide_grid">
                        <div className="events_slide_img_wrap">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/images/about/events/${e.img}`}
                            alt={e.heading}
                            loading="lazy"
                            className={
                              e.fit === "left"
                                ? "events_slider_left_align_img"
                                : e.fit === "right"
                                  ? "events_slider_right_align_img"
                                  : "img-cover"
                            }
                          />
                        </div>
                        <div className="events_slide_content">
                          <div className="events_slide_header">
                            <h3 className="events_slide_heading heading-style-h2">
                              {e.heading}
                            </h3>
                            <div className="padding-bottom padding-xxsmall" />
                            <div className="events_slide_details">
                              <div className="text-size-large text-weight-normal text-color-grey">
                                {e.details}
                              </div>
                            </div>
                          </div>
                          <div className="events_slide_bottom">
                            <p className="events_slide_para text-size-large">
                              {e.para}
                            </p>
                            <a
                              href={e.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="events_slide_social_wrap w-inline-block"
                            >
                              <div className="events_slide_social_icon">
                                <div className="svg-embed w-embed">
                                  <LinkedInOutlineIcon />
                                </div>
                              </div>
                              <div className="text-size-medium">
                                Linkedin Post
                              </div>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
