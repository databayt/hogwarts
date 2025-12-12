"use client";

import { useState, useMemo } from "react";
import { BookCoverImage } from "@/components/ui/imagekit-image";
import Image from "next/image";

// ============================================================================
// Types
// ============================================================================

interface BookCoverProps {
  coverUrl?: string | null;
  coverColor?: string | null;
  title: string;
  author: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  textSize?: "sm" | "md" | "lg";
  /** Use ImageKit transformations for optimization */
  useImageKit?: boolean;
  /** ImageKit preset (thumbnail, card, detail, original) */
  preset?: "thumbnail" | "card" | "detail" | "original";
}

// ============================================================================
// Component
// ============================================================================

export function BookCover({
  coverUrl,
  coverColor,
  title,
  author,
  width = 200,
  height = 300,
  priority = false,
  className = "",
  textSize = "md",
  useImageKit = true,
  preset = "card",
}: BookCoverProps) {
  const [imageError, setImageError] = useState(false);

  const textSizeClasses = {
    sm: { title: "text-sm", author: "text-xs" },
    md: { title: "text-base", author: "text-sm" },
    lg: { title: "text-lg", author: "text-sm" },
  };

  // Check if the URL is from ImageKit
  const isImageKitUrl = useMemo(() => {
    if (!coverUrl) return false;
    return (
      coverUrl.includes("ik.imagekit.io") ||
      coverUrl.startsWith("hogwarts/")
    );
  }, [coverUrl]);

  // Fallback content when no image or error
  const FallbackContent = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <p className={`font-bold text-white line-clamp-3 ${textSizeClasses[textSize].title}`}>
        {title}
      </p>
      <p className={`text-white/70 mt-1 ${textSizeClasses[textSize].author}`}>
        {author}
      </p>
    </div>
  );

  // Show fallback if no URL or image error
  if (!coverUrl || imageError) {
    return <FallbackContent />;
  }

  // Use ImageKit component for ImageKit URLs when enabled
  if (useImageKit && isImageKitUrl) {
    return (
      <BookCoverImage
        src={coverUrl}
        alt={title}
        width={width}
        height={height}
        preset={preset}
        priority={priority}
        className={`w-full h-full object-cover ${className}`}
        onError={() => setImageError(true)}
        fallback={<FallbackContent />}
      />
    );
  }

  // Fallback to regular Image for non-ImageKit URLs
  return (
    <Image
      src={coverUrl}
      alt={title}
      width={width}
      height={height}
      className={`w-full h-full object-cover ${className}`}
      priority={priority}
      onError={() => setImageError(true)}
    />
  );
}
