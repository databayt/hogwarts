import React from "react";
import { GradientAnimation } from "@/components/atom/gradient-animation";
import { Button } from "../ui/button";

export function BackgroundGradientAnimationDemo() {
  return (
    <div className="full-bleed">
    <GradientAnimation height="h-[70vh]">
      <div className="absolute z-50 inset-0">
        <div className="text-center pt-16">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl text-primary-foreground dark:invert">
            Ready to begin a journey of wonder?
          </h1>
          <p className="py-4 max-w-2xl mx-auto text-primary-foreground/80 dark:invert">
          Every great wizard started with a single step. Take yours today and join thousands of students who have discovered their potential in our enchanted halls of learning.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button  size="lg" className="bg-background text-primary dark:invert hover:bg-background/80">
              Apply for Admission
            </Button>
            <Button  variant="outline" size="lg" className="bg-transparent text-background hover:text-background/80 border-background dark:invert">
              Schedule a Tour
            </Button>
          </div>
          {/* <p className="flex items-center justify-center gap-2 text-primary-foreground/80 pt-4">
            <AlertTriangle className="h-4 w-4" />
            Application deadline: March 31st • Rolling admissions available
          </p> */}
        </div>
      </div>
    </GradientAnimation>
    </div>
  );
}
