import Image from "next/image"
import SectionHeading from "@/components/atom/section-heading"

export default function Testimonial() {
    const testimonials = [
        {
            name: "Amira Bashir",
            role: "School Principal",
            content: "40% reduction in admin work. Teachers focus on teaching.",
            avatar: "/contributors/1.jpg"
        },
        {
            name: "Osman Abdout",
            role: "District Superintendent",
            content: "Streamlined attendance and grades. Staff communication improved.",
            avatar: "/contributors/2.jpg"
        },
        {
            name: "Fatima Mahdi",
            role: "Academic Director",
            content: "Automated enrollment and scheduling. Efficiency improved dramatically.",
            avatar: "/contributors/3.jpg"
        },
        {
            name: "Ahmed Hassan",
            role: "University Dean",
            content: "Revolutionized student management. Faculty focus on research.",
            avatar: "/contributors/mazin.jpg"
        },
        {
            name: "Layla Osman",
            role: "Education Coordinator",
            content: "Simplified parent-teacher communication. Highly effective for our district.",
            avatar: "/contributors/5.jpg"
        },
        {
            name: "Mohamed Khalid",
            role: "School Administrator",
            content: "Enhanced student tracking and attendance. Essential for education.",
            avatar: "/contributors/6.jpg"
        }        
    ]

    return (
        <section
            id="features"
        >
            <SectionHeading
                title="Testimonials"
                description="Trusted by educational institutions worldwide to streamline operations and enhance learning outcomes."
            />
            <div className="grid justify-center gap-4 sm:grid-cols-2 md:grid-cols-3">
                {testimonials.map((testimonial, index) => (
                    <div key={index} className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[150px] flex-col justify-between rounded-md p-6">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    {testimonial.content}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-3 py-4">
                                <Image
                                    src={testimonial.avatar}
                                    alt={`${testimonial.name}'s avatar`}
                                    width={40}
                                    height={40}
                                    className="rounded-full aspect-square object-cover"
                                />
                                <div className="flex flex-col">
                                    <strong className="font-medium">{testimonial.name}</strong>
                                    <p className="text-sm text-muted-foreground">
                                        {testimonial.role}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}