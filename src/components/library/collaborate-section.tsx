import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface CollaborateSectionProps {
  lang?: string;
}

export function CollaborateSection({ lang = "en" }: CollaborateSectionProps) {
  return (
    <section className="bg-[#F5F5F0] dark:bg-muted/50 rounded-2xl overflow-hidden w-full max-w-full">
      <div className="flex flex-col lg:flex-row">
        {/* Image - Left side */}
        <div className="lg:w-1/2 relative aspect-[4/3] lg:aspect-auto">
          <Image
            src="/site/harry-potter.png"
            alt="Students in the library"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        {/* Content - Right side */}
        <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-2">
            Harry Potter and the Philosopher&apos;s Stone
          </h2>
          <p className="text-muted-foreground text-lg mb-4">
            By J.K. Rowling
          </p>
          <p className="text-muted-foreground mb-6">
            Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive.
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
  );
}
