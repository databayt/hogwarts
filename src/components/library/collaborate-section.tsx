import Image from "next/image"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

interface CollaborateSectionProps {
  lang?: string
}

export function CollaborateSection({ lang = "en" }: CollaborateSectionProps) {
  return (
    <section className="dark:bg-muted/50 w-full max-w-full overflow-hidden rounded-2xl bg-[#F5F5F0]">
      <div className="flex flex-col lg:flex-row">
        {/* Image - Left side */}
        <div className="relative aspect-[4/3] lg:aspect-auto lg:w-1/2">
          <Image
            src="/site/harry-potter.png"
            alt="Students in the library"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        {/* Content - Right side */}
        <div className="flex flex-col justify-center p-8 lg:w-1/2 lg:p-12">
          <h2 className="mb-2 text-3xl font-semibold tracking-tight lg:text-4xl">
            Harry Potter and the Philosopher&apos;s Stone
          </h2>
          <p className="text-muted-foreground mb-4 text-lg">By J.K. Rowling</p>
          <p className="text-muted-foreground mb-6">
            Harry Potter has never even heard of Hogwarts when the letters start
            dropping on the doormat at number four, Privet Drive.
          </p>
          <div>
            <Link
              href={`/${lang}/library/books`}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Get book
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
