"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Book } from "@/components/ui/book";
import type { Book as BookType } from "../types";

interface Props {
  book: BookType;
  userId: string;
}

export default function BookOverview({ book, userId }: Props) {
  const [imageError, setImageError] = useState(false);
  const hasValidImage =
    book.coverUrl && !book.coverUrl.includes("placeholder") && !imageError;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
        {/* 3D Book */}
        <div className="shrink-0">
          <Book
            color={book.coverColor || "#1a1a2e"}
            textColor="#ffffff"
            width={280}
            depth={5}
          >
            <div className="relative h-full min-h-[200px]">
              {hasValidImage ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  priority
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <h2 className="font-bold text-white text-2xl mb-3 line-clamp-3">
                    {book.title}
                  </h2>
                  <p className="text-white/80 text-lg">{book.author}</p>
                </div>
              )}
            </div>
          </Book>
        </div>

        {/* Book Info */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary-foreground text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Featured Book
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {book.title}
          </h1>

          <p className="text-lg text-slate-300">by {book.author}</p>

          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
            <span className="px-3 py-1 rounded-full bg-slate-700/50 text-slate-300 text-sm">
              {book.genre}
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="text-lg">⭐</span>
              <span className="font-medium">{book.rating}/5</span>
            </span>
          </div>

          <p className="text-slate-400 line-clamp-3 max-w-xl">
            {book.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start pt-2">
            <Button asChild size="lg">
              <Link href={`/library/books/${book.id}`}>View Details</Link>
            </Button>

            <div
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                book.availableCopies > 0
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {book.availableCopies > 0
                ? `${book.availableCopies} copies available`
                : "Currently unavailable"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
