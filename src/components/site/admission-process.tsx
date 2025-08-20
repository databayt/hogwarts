"use client";

import { 
  Sparkles,
  MapPin,
  Users,
  BookOpen
} from "lucide-react";
import SectionHeading from "../atom/section-heading";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function CTA() {
  const [isSafari, setIsSafari] = useState(false);
  
  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  const admissionSteps = [
    {
      title: "Submit Application",
      icon: <BookOpen className="w-8 h-8" />,
      color: "bg-gradient-to-br from-blue-400 to-blue-600"
    },
    {
      title: "Campus Tour",
      icon: <MapPin className="w-8 h-8" />,
      color: "bg-gradient-to-br from-purple-400 to-purple-600"
    },
    {
      title: "Meet & Greet",
      icon: <Users className="w-8 h-8" />,
      color: "bg-gradient-to-br from-green-400 to-green-600"
    },
    {
      title: "Join Family",
      icon: <Sparkles className="w-8 h-8" />,
      color: "bg-gradient-to-br from-yellow-400 to-yellow-600"
    }
  ];



  return (
    <section className=" ">
      <div>
       

        {/* Admission Process */}
        <div className="">
          <SectionHeading title="Process" description="Starting your journey is easier than casting a spell." />
          
          {/* Simple Timeline Container */}
          <div className="relative mt-8 py-28">
            {/* Timeline line crossing through dots */}
            <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 h-0.5 bg-muted-foreground"></div>

            {/* Timeline items */}
            <div className="relative flex justify-between px-24 py-16">
            {admissionSteps.map((step, index) => (
                <div key={index} className="flex flex-col items-center relative">
                  {/* Content above timeline (for dots 2 & 4) */}
                  {(index === 1 || index === 3) && (
                    <div className="absolute bottom-12 text-center w-48">
                      <h3 className="text-lg font-semibold mb-2">
                        {step.title}
                      </h3>
                      <p >
                        {index === 1 && "Experience our enchanting campus firsthand with a guided tour to all facilities and departments."}
                        {index === 3 && "Complete your enrollment process and officially join our educational family to begin your journey."}
                      </p>
                      </div>
                  )}

                  {/* Dot crossing the line - positioned at center */}
                  <div 
                    className="w-10 h-10 rounded-full relative top-1/2 transform -translate-y-1/2 z-10 overflow-hidden border-2 border-background "
                    style={{
                      '--gradient-background-start': 'rgb(108, 0, 162)',
                      '--gradient-background-end': 'rgb(0, 17, 82)',
                      '--first-color': `${18 + index * 20}, ${113 + index * 30}, ${255 - index * 20}`,
                      '--second-color': `${221 - index * 15}, ${74 + index * 25}, ${255 - index * 10}`,
                      '--third-color': `${100 + index * 20}, ${220 - index * 15}, ${255 - index * 25}`,
                      '--fourth-color': `${200 - index * 10}, ${50 + index * 30}, ${50 + index * 40}`,
                      '--fifth-color': `${180 + index * 15}, ${180 - index * 20}, ${50 + index * 35}`,
                      '--size': '80%',
                      '--blending-value': 'hard-light'
                    } as React.CSSProperties}
                  >
                    {/* SVG Filter for advanced blur effects */}
                    <svg className="hidden">
                      <defs>
                        <filter id={`blurMe-${index}`}>
                          <feGaussianBlur
                            in="SourceGraphic"
                            stdDeviation="10"
                            result="blur"
                          />
                          <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                            result="goo"
                          />
                          <feBlend in="SourceGraphic" in2="goo" />
                        </filter>
                      </defs>
                    </svg>

                    {/* Base gradient background */}
                    <div className="absolute inset-0 bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))] rounded-full"></div>

                    {/* Gradient Animation Container */}
                    <div 
                      className={cn(
                        "gradients-container absolute inset-0 overflow-hidden rounded-full",
                        isSafari ? "blur-2xl" : "[filter:url(#blurMe-" + index + ")_blur(40px)]"
                      )}
                    >
                      {/* First gradient orb */}
                      <div
                        className={cn(
                          "absolute [background:radial-gradient(circle_at_center,_var(--first-color)_0,_var(--first-color)_50%)_no-repeat]",
                          "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
                          "[transform-origin:center_center]",
                          "animate-spin",
                          "opacity-100"
                        )}
                        style={{
                          animationDuration: `${6 + index * 0.7}s`,
                          animationDelay: `${index * 0.3}s`
                        }}
                      />
                      
                      {/* Second gradient orb */}
                      <div
                        className={cn(
                          "absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]",
                          "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
                          "[transform-origin:calc(50%-20px)]",
                          "animate-pulse",
                          "opacity-100"
                        )}
                        style={{
                          animationDuration: `${4 + index * 0.5}s`,
                          animationDelay: `${index * 0.4}s`
                        }}
                      />
                      
                      {/* Third gradient orb */}
                      <div
                        className={cn(
                          "absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]",
                          "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
                          "[transform-origin:calc(50%+20px)]",
                          "animate-bounce",
                          "opacity-100"
                        )}
                        style={{
                          animationDuration: `${8 + index * 0.8}s`,
                          animationDelay: `${index * 0.6}s`
                        }}
                      />
                      
                      {/* Fourth gradient orb */}
                      <div
                        className={cn(
                          "absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]",
                          "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
                          "[transform-origin:calc(50%-10px)]",
                          "animate-ping",
                          "opacity-70"
                        )}
                        style={{
                          animationDuration: `${8 + index * 1.2}s`,
                          animationDelay: `${index * 0.8}s`
                        }}
                      />
                      
                      {/* Fifth gradient orb */}
                      <div
                        className={cn(
                          "absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]",
                          "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
                          "[transform-origin:calc(50%-40px)_calc(50%+40px)]",
                          "animate-spin",
                          "opacity-100"
                        )}
                        style={{
                          animationDuration: `${4 + index * 0.9}s`,
                          animationDelay: `${index * 0.5}s`,
                          animationDirection: 'reverse'
                        }}
                      />
                    </div>

                    {/* Shimmer overlay */}
                    <div 
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse opacity-50"
                      style={{
                        animationDuration: `${3 + index * 0.4}s`,
                        animationDelay: `${index * 0.2}s`
                      }}
                    ></div>
                    
                    {/* Outer glow effect */}
                    <div 
                      className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 animate-pulse blur-sm -z-10"
                      style={{
                        animationDuration: `${2.5 + index * 0.6}s`,
                        animationDelay: `${index * 0.1}s`
                      }}
                    ></div>
                  </div>

                  {/* Content below timeline (for dots 1 & 3) */}
                  {(index === 0 || index === 2) && (
                    <div className="absolute top-12 text-center w-48">
                      <h3 className="text-lg font-semibold mb-2">
                      {step.title}
                      </h3>
                      <p >
                        {index === 0 && "Complete our application form online with all required documents and personal information."}
                        {index === 2 && "Get in touch with faculty members and current students in a welcoming environment."}
                      </p>
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
} 