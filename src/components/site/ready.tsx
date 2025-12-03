import React from "react";
import { GradientAnimation } from "@/components/atom/gradient-animation";
import { Button } from "../ui/button";

export function BackgroundGradientAnimationDemo() {
  return (
    <section className="py-16 md:py-24">
      <GradientAnimation height="h-[400px]" containerClassName="!w-full rounded-lg overflow-hidden">
        <div className="absolute z-50 inset-0 flex items-center justify-center">
          <div className="text-center px-6">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-white">
              Ready to begin a journey of wonder?
            </h2>
            <p className="py-4 max-w-2xl mx-auto text-white/80">
              Every great wizard started with a single step. Take yours today and join thousands of students who have discovered their potential in our enchanted halls of learning.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Apply for Admission
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent text-white hover:text-white/80 border-white hover:bg-white/10">
                Schedule a Tour
              </Button>
            </div>
          </div>
        </div>
      </GradientAnimation>
    </section>
  );
}
