"use client";

import { useEffect, useRef, useState } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";

interface LibraryAnimationProps {
  className?: string;
}

export function LibraryAnimation({ className }: LibraryAnimationProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Frame ranges matching Anthropic's pattern
  const FRAMES_IN = { start: 0, end: 309 };
  const FRAMES_LOOP = { start: 310, end: 349 };

  // Load the Lottie JSON
  useEffect(() => {
    fetch(
      "https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/6930dae98ed924a2ab62c6a3_Government.json"
    )
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(console.error);
  }, []);

  // Intersection Observer for visibility
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Handle animation playback based on visibility
  useEffect(() => {
    const lottie = lottieRef.current;
    if (!lottie || !animationData) return;

    if (isVisible) {
      if (!hasPlayedIntro) {
        // Play intro animation
        lottie.goToAndStop(FRAMES_IN.start, true);
        lottie.playSegments([FRAMES_IN.start, FRAMES_IN.end], true);
        setHasPlayedIntro(true);
      } else {
        // Resume if paused
        lottie.play();
      }
    } else {
      // Pause when not visible
      lottie.pause();
    }
  }, [isVisible, hasPlayedIntro, animationData]);

  // Handle animation complete - start loop
  const handleComplete = () => {
    const lottie = lottieRef.current;
    if (!lottie) return;

    // Start looping segment
    lottie.playSegments([FRAMES_LOOP.start, FRAMES_LOOP.end], true);
  };

  // Handle loop complete - continue looping
  const handleLoopComplete = () => {
    const lottie = lottieRef.current;
    if (!lottie || !isVisible) return;

    // Continue loop
    lottie.playSegments([FRAMES_LOOP.start, FRAMES_LOOP.end], true);
  };

  if (!animationData) {
    return (
      <div
        ref={containerRef}
        className={`${className} flex items-center justify-center`}
      >
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <style jsx global>{`
        .library-lottie-wrap [fill="rgb(19,19,20)"],
        .library-lottie-wrap [fill="rgb(19, 19, 20)"],
        .library-lottie-wrap [fill="#131314"] {
          fill: hsl(var(--foreground)) !important;
        }
        .library-lottie-wrap [fill="rgb(217,119,87)"],
        .library-lottie-wrap [fill="rgb(217, 119, 87)"],
        .library-lottie-wrap [fill="#d97757"] {
          fill: rgb(217, 119, 87) !important;
        }
      `}</style>
      <div className="library-lottie-wrap w-full h-full">
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={false}
          autoplay={false}
          onComplete={handleComplete}
          onLoopComplete={handleLoopComplete}
          style={{ width: "100%", height: "100%" }}
          rendererSettings={{
            preserveAspectRatio: "xMidYMid meet",
          }}
        />
      </div>
    </div>
  );
}
