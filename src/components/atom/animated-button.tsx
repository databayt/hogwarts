"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState, useId } from "react";

interface AnimatedButtonProps {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  onClick?: () => void;
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  blendingValue?: string;
  interactive?: boolean;
}

export function AnimatedButton({
  children,
  className,
  size = "default",
  variant = "default",
  onClick,
  gradientBackgroundStart = "rgb(108, 0, 162)",
  gradientBackgroundEnd = "rgb(0, 17, 82)",
  firstColor = "18, 113, 255",
  secondColor = "221, 74, 255",
  thirdColor = "100, 220, 255",
  fourthColor = "200, 50, 50",
  fifthColor = "180, 180, 50",
  pointerColor = "140, 100, 255",
  blendingValue = "hard-light",
  interactive = true,
  ...props
}: AnimatedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const interactiveRef = useRef<HTMLDivElement>(null);
  const [curX, setCurX] = useState(0);
  const [curY, setCurY] = useState(0);
  const [tgX, setTgX] = useState(0);
  const [tgY, setTgY] = useState(0);
  const [isSafari, setIsSafari] = useState(false);
  const filterId = useId();

  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.style.setProperty("--gradient-background-start", gradientBackgroundStart);
      buttonRef.current.style.setProperty("--gradient-background-end", gradientBackgroundEnd);
      buttonRef.current.style.setProperty("--first-color", firstColor);
      buttonRef.current.style.setProperty("--second-color", secondColor);
      buttonRef.current.style.setProperty("--third-color", thirdColor);
      buttonRef.current.style.setProperty("--fourth-color", fourthColor);
      buttonRef.current.style.setProperty("--fifth-color", fifthColor);
      buttonRef.current.style.setProperty("--pointer-color", pointerColor);
      buttonRef.current.style.setProperty("--blending-value", blendingValue);
      buttonRef.current.style.setProperty("--size", "120%");
    }
  }, [gradientBackgroundStart, gradientBackgroundEnd, firstColor, secondColor, thirdColor, fourthColor, fifthColor, pointerColor, blendingValue]);

  useEffect(() => {
    let animationId: number;
    
    function animate() {
      if (!interactiveRef.current) return;
      setCurX(prev => prev + (tgX - prev) / 20);
      setCurY(prev => prev + (tgY - prev) / 20);
      interactiveRef.current.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
      animationId = requestAnimationFrame(animate);
    }
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [tgX, tgY, curX, curY]);

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (interactiveRef.current) {
      const rect = interactiveRef.current.getBoundingClientRect();
      setTgX(event.clientX - rect.left);
      setTgY(event.clientY - rect.top);
    }
  };

  return (
    <Button
      ref={buttonRef}
      size={size}
      variant={variant}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative overflow-hidden",
        "bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]",
        "text-white border-0 hover:shadow-2xl transition-all duration-500",
        "hover:scale-105 transform",
        className
      )}
      {...props}
    >
      {/* SVG Filter for advanced blur effects */}
      <svg className="absolute inset-0 w-0 h-0">
        <defs>
          <filter id={`blurMe-${filterId}`}>
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="3"
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

      {/* Gradient Animation Container */}
      <div
        className={cn(
          "absolute inset-0 overflow-hidden",
          isSafari ? "blur-sm" : "[filter:url(#blurMe-${filterId})_blur(8px)]"
        )}
      >
        {/* First gradient orb */}
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,_rgba(var(--first-color),_1)_0,_rgba(var(--first-color),_0)_50%)_no-repeat]",
            "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "[transform-origin:center_center]",
            "animate-[moveVertical_6s_ease-in-out_infinite]",
            "opacity-100"
          )}
        />
        
        {/* Second gradient orb */}
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]",
            "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "[transform-origin:calc(50%-80px)]",
            "animate-[moveInCircle_4s_reverse_infinite]",
            "opacity-100"
          )}
        />
        
        {/* Third gradient orb */}
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]",
            "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "[transform-origin:calc(50%+80px)]",
            "animate-[moveInCircle_8s_linear_infinite]",
            "opacity-100"
          )}
        />
        
        {/* Fourth gradient orb */}
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]",
            "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "[transform-origin:calc(50%-40px)]",
            "animate-[moveHorizontal_8s_ease_infinite]",
            "opacity-70"
          )}
        />
        
        {/* Fifth gradient orb */}
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]",
            "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "[transform-origin:calc(50%-160px)_calc(50%+160px)]",
            "animate-[moveInCircle_4s_ease_infinite]",
            "opacity-100"
          )}
        />

        {/* Interactive pointer orb */}
        {interactive && (
          <div
            ref={interactiveRef}
            className={cn(
              "absolute [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.8)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat]",
              "[mix-blend-mode:var(--blending-value)] w-full h-full -top-1/2 -left-1/2",
              "opacity-70 pointer-events-none"
            )}
          />
        )}
      </div>
      
      {/* Button content */}
      <span className="relative z-10 font-medium">{children}</span>
    </Button>
  );
} 