"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Book } from "../types";

interface Props {
  book: Book;
}

export default function BookCard({ book }: Props) {
  const [imageError, setImageError] = useState(false);
  const hasValidImage =
    book.coverUrl &&
    !book.coverUrl.includes("placeholder") &&
    !imageError;

  return (
    <li className="list-none">
      <Link
        href={`/library/books/${book.id}`}
        className="block bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
      >
        {/* Book Cover */}
        <div
          className="relative aspect-[3/4] overflow-hidden"
          style={{ backgroundColor: book.coverColor || "#1a1a2e" }}
        >
          {hasValidImage ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <h3 className="font-bold text-white text-lg line-clamp-3 mb-2">
                {book.title}
              </h3>
              <p className="text-white/80 text-sm">{book.author}</p>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="p-4 space-y-2">
          <h4 className="font-semibold text-foreground line-clamp-1">
            {book.title}
          </h4>
          <p className="text-muted-foreground text-sm">by {book.author}</p>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{book.genre}</span>
            <span className="text-amber-500">⭐ {book.rating}/5</span>
          </div>

          <p
            className={`text-sm font-medium ${
              book.availableCopies > 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {book.availableCopies > 0
              ? `${book.availableCopies} available`
              : "Unavailable"}
          </p>
        </div>
      </Link>
    </li>
  );
}
