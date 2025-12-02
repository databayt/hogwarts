"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Book } from "@/components/ui/book";
import type { Book as BookType } from "../types";

interface Props {
  book: BookType;
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
        className="block transition-transform hover:scale-[1.02]"
      >
        <Book
          color={book.coverColor || "#1a1a2e"}
          textColor="#ffffff"
          width={180}
          depth={3}
        >
          <div className="p-4 flex flex-col h-full justify-end min-h-[60px]">
            {hasValidImage ? (
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : null}
            <div className="relative z-10">
              <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">
                {book.title}
              </h3>
              <p className="text-white/70 text-xs">{book.author}</p>
            </div>
          </div>
        </Book>

        <div className="mt-3 space-y-1 px-1">
          <h4 className="font-medium text-foreground text-sm line-clamp-1">
            {book.title}
          </h4>
          <p className="text-muted-foreground text-xs">by {book.author}</p>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{book.genre}</span>
            <span className="text-amber-500">⭐ {book.rating}/5</span>
          </div>

          <p
            className={`text-xs ${
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
