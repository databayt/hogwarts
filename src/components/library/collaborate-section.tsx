import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface CollaborateSectionProps {
  lang?: string;
}

export function CollaborateSection({ lang = "en" }: CollaborateSectionProps) {
  return (
    <section className="bg-[#F5F5F0] rounded-2xl overflow-hidden">
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
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-4">
            Discover worlds within pages
          </h2>
          <p className="text-muted-foreground text-lg mb-6">
            The library is your gateway to knowledge and adventure—from ancient
            scrolls to modern masterpieces, every book holds a spell waiting to
            be cast.
          </p>
          <div>
            <Link
              href={`/${lang}/library/books`}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Browse collection
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
