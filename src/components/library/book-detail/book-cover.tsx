"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  coverUrl: string;
  coverColor: string;
  title: string;
  author?: string;
}

export default function BookCover({ coverUrl, coverColor, title, author }: Props) {
  const [imageError, setImageError] = useState(false);
  const hasValidImage = coverUrl && !coverUrl.includes('placeholder') && !imageError;

  return (
    <div
      className="book-cover-wrapper"
      style={{ backgroundColor: coverColor }}
    >
      {hasValidImage ? (
        <Image
          src={coverUrl}
          alt={title}
          width={400}
          height={600}
          className="book-cover-detail-image"
          priority
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <h2 className="font-bold text-white text-3xl mb-4 line-clamp-4">{title}</h2>
          {author && <p className="text-white/90 text-xl">{author}</p>}
        </div>
      )}
    </div>
  );
}
