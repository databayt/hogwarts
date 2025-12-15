import Image from "next/image"

import SectionHeading from "../atom/section-heading"

export default function EventCard() {
  // Type definitions
  interface Event {
    date: string
    month: string
    title: string
    time: string
    location: string
    isHighlighted: boolean
    isDisabled?: boolean
  }

  // Event data array
  const events: Event[] = [
    {
      date: "01",
      month: "September",
      title: "Hogwarts Welcome Feast",
      time: "7PM — 10PM",
      location: "@ Great Hall, Hogwarts Castle",
      isHighlighted: true,
    },
    {
      date: "15",
      month: "October",
      title: "Defense Against Dark Arts Seminar",
      time: "2PM — 5PM",
      location: "@ Defense, Hogwarts",
      isHighlighted: false,
    },
    {
      date: "31",
      month: "October",
      title: "Halloween Feast & Celebration",
      time: "6PM — 11PM",
      location: "@ Great Hall, Hogwarts Castle",
      isHighlighted: false,
    },
    {
      date: "25",
      month: "December",
      title: "Christmas Holiday Feast",
      time: "5PM — 9PM",
      location: "@ Great Hall, Hogwarts Castle",
      isHighlighted: false,
      isDisabled: true,
    },
  ]

  return (
    <section className="py-16 md:py-24">
      <SectionHeading title="Events" description="what's happening" />
      {/* Events Grid */}
      <div className="grid grid-cols-1 gap-1 py-14 md:grid-cols-4">
        {events.map((event, index) => (
          <div
            key={index}
            className={`${
              event.isHighlighted ? "bg-[#6A9BCC] text-white" : "bg-muted"
            } flex h-full flex-col p-8`}
          >
            <div
              className={`mb-1 text-5xl font-light ${
                !event.isHighlighted
                  ? event.isDisabled
                    ? "text-muted-foreground/50"
                    : "text-foreground"
                  : ""
              }`}
            >
              {event.date}
            </div>
            <div
              className={`pb-10 text-sm tracking-wider ${
                !event.isHighlighted
                  ? event.isDisabled
                    ? "text-muted-foreground/50"
                    : "text-foreground"
                  : ""
              }`}
            >
              {event.month}
            </div>

            <h2
              className={`pb-4 text-xl font-light ${
                !event.isHighlighted
                  ? event.isDisabled
                    ? "text-muted-foreground/50"
                    : "text-foreground"
                  : ""
              }`}
            >
              {event.title.split(" ").slice(0, 2).join(" ")}
              <br />
              {event.title.split(" ").slice(2).join(" ")}
            </h2>

            <div
              className={`mt-auto ${
                !event.isHighlighted
                  ? event.isDisabled
                    ? "text-muted-foreground/50"
                    : "text-foreground"
                  : ""
              }`}
            >
              <div className="pb-1 text-sm font-medium">{event.time}</div>
              <div className="text-sm font-medium">{event.location}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Feed Section */}
      <div className="border-border border-t pt-4 pt-12">
        <div className="mb-8 flex w-full items-start gap-4 md:w-[70%]">
          <Image
            src="/logo.png"
            alt="logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full bg-[#6A9BCC] object-cover p-1.5"
            priority
            quality={100}
          />
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-foreground font-semibold">@hogwarts</span>
              <span className="text-muted-foreground text-sm">
                4 minutes ago in
              </span>
              <span className="text-primary">#events</span>
            </div>
            <p className="text-foreground mb-2">
              Hogwarts School of Witchcraft and Wizardry invites you to attend
              our Welcome Feast - where we&apos;ll present our magical
              curriculum, discuss the challenges ahead, and open dialogue about
              our shared journey in the wizarding world.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
