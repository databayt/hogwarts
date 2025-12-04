import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/atom/animated-button";
import Image from "next/image";

export function Hero() {
  return (
    <section className="h-[calc(80vh-3.5rem)] max-h-[700px] w-full grid grid-cols-1 lg:grid-cols-2">
      {/* Image Half */}
      <div className="relative h-full lg:order-last">
        <div
          className="absolute inset-0 md:inset-y-8 rounded-none lg:rounded-sm overflow-hidden"
          style={{
            backgroundImage: "url('/site/harry-potter.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 lg:bg-gradient-to-r lg:from-black/60 lg:to-black/40" />
        </div>

        {/* Content for mobile */}
        <div className="relative h-full flex flex-col items-start justify-center px-container lg:hidden">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-6">
              <Image src="/site/ball.png" alt="Hogwarts Logo" width={100} height={100} className="w-14 h-14 dark:invert"/>
            </div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tighter text-white py-4">
              Beautiful Mind,<br />
              Curious. Wonder.
            </h1>
            <p className="pb-2 text-amber-400/90 font-medium">
              open source. open code.
            </p>
            <p className="pb-6 text-white/80 max-w-[80%]">
              The most magical part of the Harry Potter books, is that they eventually used the skills they learned at school
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <AnimatedButton
                size="lg"
                className="w-full sm:w-auto"
              >
                Schedule a Visit
              </AnimatedButton>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-transparent text-white border-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Content */}
      <div className="relative hidden lg:flex h-full items-center">
        <div className="max-w-xl">
          <div className="flex items-center gap-2">
            <Image src="/site/ball.png" alt="Hogwarts Logo" width={100} height={100} className="w-14 h-14 dark:invert"/>
          </div>
          <h1 className="font-heading font-black text-5xl lg:text-6xl xl:text-7xl tracking-tighter py-4">
            Beautiful Mind,<br />
            Curious. Wonder.
          </h1>
          <p className="pb-2 text-amber-600 dark:text-amber-400 font-medium">
            open source. open code.
          </p>
          <p className="pb-6 text-muted-foreground max-w-[80%]">
            The most magical part of the Harry Potter books, is that they eventually used the skills they learned at school
          </p>
          <div className="flex flex-row gap-4">
            <AnimatedButton
              size="lg"
            >
              Schedule a Visit
            </AnimatedButton>
            <Button
              variant="outline"
              size="lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}