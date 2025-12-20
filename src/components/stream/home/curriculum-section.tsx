"use client"

import type { StreamContentProps } from "../types"

const features = [
  {
    icon: "https://images.ctfassets.net/2pudprfttvy6/4XMrz5se3QIJusI0TKe8Vp/2e71bff5bf8f587e24bb7b2d4fb515f5/icon_website.svg",
    title: "World-Class Content",
    description: "Curated courses from industry leaders and top universities.",
    width: 56,
    height: 50,
  },
  {
    icon: "https://images.ctfassets.net/2pudprfttvy6/14Ncu21DhOvd6FxJYVX8zk/3fc2089321031b72a380553f7ca7f0a2/icon-instructor.svg",
    title: "Guided Projects",
    description:
      "Hands-on projects to practice skills and stand out to employers.",
    width: 63,
    height: 60,
  },
  {
    icon: "https://images.ctfassets.net/2pudprfttvy6/4weCx1DOOp7qrFXKOQhOVr/c3ed49c7d07bbcacf569012056f7a900/CourseraIcon_Diplomas_Black.svg",
    title: "Professional Certificates",
    description: "Build job confidence and hone skills in high-growth fields.",
    width: 68,
    height: 55,
  },
  {
    icon: "https://images.ctfassets.net/2pudprfttvy6/55nWm7sKBNc29Ey0gfWsgo/230dfdcbbb963ea06109df7c30094e6c/icon-integration.svg",
    title: "LMS Integration",
    description:
      "Seamlessly connect courses to your learning management system.",
    width: 61,
    height: 54,
  },
]

export function CurriculumSection({
  dictionary,
  lang,
}: Omit<StreamContentProps, "schoolId">) {
  const isRTL = lang === "ar"

  return (
    <section className="mb-16 rounded-xl bg-[#6A9BCC] py-16">
      <div className="px-6 text-white">
        <div className="flex flex-col items-start gap-12 md:flex-row md:rtl:flex-row-reverse">
          {/* Title Section */}
          <div className="text-start md:w-1/2">
            <h2 className="mb-4 text-4xl leading-tight font-bold">
              {dictionary?.curriculum?.title || "Expand curriculum"}
            </h2>
            <p className="max-w-[70%] text-lg leading-relaxed text-white/80">
              {dictionary?.curriculum?.description ||
                "Arts of learning with enchanting courses crafted by the finest wizards in education."}
            </p>
          </div>

          {/* Icons Grid 2x2 */}
          <div className="grid grid-cols-2 gap-10 md:w-1/2">
            {features.map((feature, index) => (
              <div key={index} className="text-start">
                {/* Icon */}
                <div className="mb-4 flex h-14 items-end">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={feature.icon}
                    alt={feature.title}
                    width={feature.width}
                    height={feature.height}
                  />
                </div>

                {/* Title */}
                <h3 className="mb-3 text-lg font-semibold">
                  {dictionary?.curriculum?.[`feature${index + 1}Title`] ||
                    feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm leading-relaxed text-white/70">
                  {dictionary?.curriculum?.[`feature${index + 1}Desc`] ||
                    feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
