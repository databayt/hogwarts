"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

export function StoryVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isInView, setIsInView] = useState(false);

  // Intersection Observer for auto mute/unmute based on visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.5 } // Trigger when 50% of video is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto mute/unmute based on visibility
  useEffect(() => {
    if (videoRef.current) {
      if (isInView) {
        // Unmute when in view
        videoRef.current.muted = false;
        setIsMuted(false);
      } else {
        // Mute when out of view
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    }
  }, [isInView]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      ref={containerRef}
      className="mt-8 mb-8 relative aspect-video w-full max-w-3xl mx-auto rounded-sm overflow-hidden bg-black/5"
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/story.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <span className="text-white text-sm font-medium">hogwarts</span>
      </div>
    </div>
  );
}
