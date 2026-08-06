// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (about/events) — UI and motion verbatim, copy rewritten for
// the school tenant. Renders under the `.zenda-clone` CSS scope (see
// src/styles/zenda-clone.css).

"use client"

import { Keyboard, Mousewheel } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

import "swiper/css"

/**
 * About "Our School Year" — a Swiper carousel of event cards. Each card pairs a
 * photo with the event name, date · place, a recap paragraph, and a "Book a
 * visit" link into the tour flow. `slidesPerView: 1.2` peeks the next card;
 * drag / keyboard / mousewheel advance it (no visible arrows). Below 768px the
 * card stacks.
 *
 * PLACEHOLDER CONTENT, on both sides. The twelve events are an illustrative
 * school calendar — real tenants must replace them with things that actually
 * happened, the same way the demo homepage's class-size and placement figures
 * are placeholders. The photographs are still the reference site's own
 * conference shots, which is why the events chosen are hall- and stage-shaped;
 * swap them for the school's own photography. The link glyph is a LinkedIn mark
 * left over from the reference and now points at `/tour` — replace it with a
 * calendar or arrow icon.
 */

type EventItem = {
  img: string
  fit?: "left" | "right" // object-position variant for a couple of shots
  heading: string
  details: string
  para: string
}

const EVENTS: EventItem[] = [
  {
    img: "e1.webp",
    heading: "Prize Giving Evening",
    details: "20 Jun '25  I  Main Hall",
    para: "An evening for the people who make a school year work — the students who kept at it, and the parents who kept them at it. We handed out awards for academic progress, for service to the school, and for the quiet persistence that never shows up on a report card. Every graduating student left with a photograph and a handshake, and the hall stayed full long after the last certificate.",
  },
  {
    img: "e2.webp",
    heading: "Science and Innovation Fair",
    details: "29 May '25 | Main Hall",
    para: "Ninety projects, from a Grade 4 water filter to a Grade 11 solar tracker, judged by teachers and two visiting engineers. Students defended their work at their own tables all morning and answered better questions than most of us expected. Three projects went forward to the regional fair.",
  },
  {
    img: "e3.webp",
    heading: "Parent Partnership Evening",
    details: "28-30 Jan '25 | Campus",
    para: "Three evenings of one-to-one meetings between families and every teacher who takes their child. No queues and no ten-minute bell — each family booked the slots it needed. Alongside the meetings, our heads of department ran short sessions on how reading, arithmetic and revision are actually taught here, so what happens at home can pull in the same direction.",
  },
  {
    img: "e4.webp",
    heading: "Careers and Universities Day",
    details: "17-20 Oct '24 | Main Hall",
    para: "Former students came back to talk about what they actually do all day — medicine, engineering, teaching, running a business — and stayed to answer the questions our seniors were too polite to ask in front of the room. Admissions officers from four universities took walk-ins all afternoon.",
  },
  {
    img: "e5.webp",
    fit: "left",
    heading: "Inter-House Sports Day",
    details: "9 Nov '24 | School Field",
    para: "The whole school on the field for a day, from the kindergarten shuttle run to the staff relay that the staff would rather not discuss. Every student competed in something, which is the point — the trophy goes to the house with the widest participation, not the fastest runner.",
  },
  {
    img: "e6.jpeg",
    heading: "Debate and Public Speaking Final",
    details: "3-4 Dec '24 | Main Hall",
    para: "Our senior debaters argued both sides of a motion they only saw an hour beforehand, in front of a hall of students who were, remarkably, silent. Public speaking is on the timetable here from Grade 6 precisely so this evening is possible — being able to hold a room is a skill we teach, not a talent we wait for.",
  },
  {
    img: "e7.webp",
    fit: "right",
    heading: "Open Day for New Families",
    details: "13-14 Nov '24 | Campus",
    para: "Families walked the school while it was running — lessons in progress, no staged classrooms — and asked our students, not our brochures, what it is like here. Our leadership team and heads of year took questions until everyone had run out, and applications for the next intake opened that evening.",
  },
  {
    img: "e8.jpg",
    heading: "Reading Week and Book Fair",
    details: "9 Dec '23 | Library",
    para: "A week where every class stopped for twenty minutes a day to read whatever they liked, teachers included. A visiting author spent an afternoon with our middle school, the library ran a book swap, and our youngest students came dressed as their favourite characters — which remains the most photographed morning of the year.",
  },
  {
    img: "e9.webp",
    heading: "Arts and Music Showcase",
    details: "5-6 Dec '23 | Main Hall",
    para: "A term of art, drama and music put in front of an audience: the choir, two class plays, a first-time student band, and a gallery of work from every year group along the corridor. Nothing here is auditioned — every child who wanted a place on the programme had one.",
  },
  {
    img: "e10.webp",
    heading: "Community Service Week",
    details: "20-21 Nov '23 | Around the City",
    para: "Our senior years spent the week outside the school — a neighbourhood clean-up, reading sessions at a nearby primary, and a food drive our own students ran end to end. Service is a graduation requirement here, and the point of the week is that the requirement is the easy part.",
  },
  {
    img: "e11.webp",
    heading: "Graduation Ceremony",
    details: "4-5 Oct '23 | Main Hall",
    para: "The class we have taught since primary walked across the stage, some of them for the last time in a uniform they have worn for a decade. Every graduate was named by the teacher who knew them best, with a sentence about who they actually are — which took considerably longer than the schedule allowed, and was worth it.",
  },
  {
    img: "e12.webp",
    heading: "Welcome Morning for New Students",
    details: "8-9 May '23 | Campus",
    para: "New students met their class, their teacher and their assigned buddy a week before term started, so the first day was a return rather than an arrival. Parents had coffee with the year head in the hall while the children were shown where everything is — most importantly, the canteen.",
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

export function Events({ lang = "en" }: { lang?: string }) {
  return (
    <section className="section_events">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div className="events_wrap">
            <div className="events_header">
              <div className="tag is-text">Our school year</div>
              <div className="padding-bottom padding-xxsmall" />
              <h2 className="events_heading heading-style-h2">
                Life &amp; Events
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
                              href={`/${lang}/tour`}
                              aria-label={`Book a visit — ${e.heading}`}
                              className="events_slide_social_wrap w-inline-block"
                            >
                              <div className="events_slide_social_icon">
                                <div className="svg-embed w-embed">
                                  <LinkedInOutlineIcon />
                                </div>
                              </div>
                              <div className="text-size-medium">
                                Book a visit
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
