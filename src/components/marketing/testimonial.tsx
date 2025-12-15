import Image from "next/image"

import SectionHeading from "@/components/atom/section-heading"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface TestimonialProps {
  dictionary?: Dictionary
}

export default function Testimonial({ dictionary }: TestimonialProps) {
  const testDict = dictionary?.marketing?.testimonial || {
    title: "Testimonials",
    subtitle:
      "Trusted by educational institutions worldwide to streamline operations and enhance learning outcomes.",
    items: [],
  }

  const defaultTestimonials = [
    {
      name: "Amira Bashir",
      role: "School Principal",
      content: "40% reduction in admin work. Teachers focus on teaching.",
      avatar: "/contributors/1.jpg",
    },
    {
      name: "Osman Abdout",
      role: "District Superintendent",
      content:
        "Streamlined attendance and grades. Staff communication improved.",
      avatar: "/contributors/2.jpg",
    },
    {
      name: "Fatima Mahdi",
      role: "Academic Director",
      content:
        "Automated enrollment and scheduling. Efficiency improved dramatically.",
      avatar: "/contributors/3.jpg",
    },
    {
      name: "Ahmed Hassan",
      role: "University Dean",
      content: "Revolutionized student management. Faculty focus on research.",
      avatar: "/contributors/mazin.jpg",
    },
    {
      name: "Layla Osman",
      role: "Education Coordinator",
      content: "Simplified parent-teacher communication. Highly effective.",
      avatar: "/contributors/5.jpg",
    },
    {
      name: "Mohamed Khalid",
      role: "School Administrator",
      content:
        "Enhanced student tracking and attendance. Essential for education.",
      avatar: "/contributors/6.jpg",
    },
  ]

  const testimonials =
    testDict.items && testDict.items.length > 0
      ? testDict.items.map((item, index) => ({
          ...item,
          avatar:
            defaultTestimonials[index]?.avatar ||
            `/contributors/${index + 1}.jpg`,
        }))
      : defaultTestimonials

  return (
    <section id="features">
      <SectionHeading title={testDict.title} description={testDict.subtitle} />
      <div className="grid justify-center gap-4 sm:grid-cols-2 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="bg-background relative overflow-hidden rounded-lg border p-2"
          >
            <div className="flex h-[150px] flex-col justify-between rounded-md p-6">
              <div className="space-y-2">
                <small className="muted">{testimonial.content}</small>
              </div>

              <div className="flex items-center gap-3 py-4">
                <Image
                  src={testimonial.avatar}
                  alt={`${testimonial.name}'s avatar`}
                  width={40}
                  height={40}
                  className="aspect-square rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <strong>{testimonial.name}</strong>
                  <small className="muted">{testimonial.role}</small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
