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
  const hasValidImage = book.coverUrl && !book.coverUrl.includes('placeholder') && !imageError;

  return (
    <li className="book-card">
      <Link href={`/library/books/${book.id}`} className="book-card-link">
        <div className="book-card-cover" style={{ backgroundColor: book.coverColor }}>
          {hasValidImage ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              width={200}
              height={300}
              className="book-cover-image"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="book-cover-placeholder">
              <div className="text-center p-4 flex flex-col justify-center h-full">
                <h4 className="font-bold text-white text-lg mb-2 line-clamp-3">{book.title}</h4>
                <p className="text-white/90 text-sm">{book.author}</p>
              </div>
            </div>
          )}
        </div>

        <div className="book-card-content">
          <h3 className="book-card-title">{book.title}</h3>
          <p className="book-card-author">by {book.author}</p>

          <div className="book-card-meta">
            <span className="book-card-genre">{book.genre}</span>
            <span className="book-card-rating">
              ⭐ {book.rating}/5
            </span>
          </div>

          <p className="book-card-availability">
            {book.availableCopies > 0
              ? `${book.availableCopies} available`
              : "Currently unavailable"}
          </p>
        </div>
      </Link>
    </li>
  );
}
