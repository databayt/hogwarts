"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Book } from "../types";

interface Props {
  book: Book;
  userId: string;
}

export default function BookOverview({ book, userId }: Props) {
  const [imageError, setImageError] = useState(false);
  const hasValidImage = book.coverUrl && !book.coverUrl.includes('placeholder') && !imageError;

  return (
    <section className="book-overview">
      <div className="book-overview-container">
        <div className="book-overview-cover" style={{ backgroundColor: book.coverColor }}>
          {hasValidImage ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              width={400}
              height={600}
              className="book-overview-image"
              priority
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <h2 className="font-bold text-white text-4xl mb-4 line-clamp-4">{book.title}</h2>
              <p className="text-white/90 text-2xl">{book.author}</p>
            </div>
          )}
        </div>

        <div className="book-overview-content">
          <h1 className="book-overview-title">{book.title}</h1>
          <p className="book-overview-author">by {book.author}</p>

          <div className="book-overview-meta">
            <span className="book-overview-genre">{book.genre}</span>
            <span className="book-overview-rating">
              ⭐ {book.rating}/5
            </span>
          </div>

          <p className="book-overview-description">{book.description}</p>

          <div className="book-overview-actions">
            <Button asChild>
              <Link href={`/library/books/${book.id}`}>
                View Details
              </Link>
            </Button>

            {book.availableCopies > 0 ? (
              <p className="text-green-600">
                {book.availableCopies} copies available
              </p>
            ) : (
              <p className="text-red-600">Currently unavailable</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
