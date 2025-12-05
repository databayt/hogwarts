"use client";

import Image from "next/image";
import { useState } from "react";

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
}

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
}: BookCoverProps) {
  const [imageError, setImageError] = useState(false);

  const textSizeClasses = {
    sm: { title: "text-sm", author: "text-xs" },
    md: { title: "text-base", author: "text-sm" },
    lg: { title: "text-lg", author: "text-sm" },
  };

  if (!coverUrl || imageError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className={`font-bold text-white line-clamp-3 ${textSizeClasses[textSize].title}`}>
          {title}
        </p>
        <p className={`text-white/70 mt-1 ${textSizeClasses[textSize].author}`}>
          {author}
        </p>
      </div>
    );
  }

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
