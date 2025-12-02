"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Book } from "@/components/ui/book";
import type { Book as BookType } from "../types";

interface Props {
  book: BookType;
  userId: string;
}

export default function BookOverview({ book, userId }: Props) {
  return (
    <section className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
      {/* 3D Book - aliimam style */}
      <div className="shrink-0">
        <Book depth={10}>
          <div className="p-3 mb-2 grid gap-4">
            <h1 className="font-semibold">
              {book.title}
            </h1>
            <p className="text-xs opacity-70">
              {book.author}
            </p>
          </div>
        </Book>
      </div>

      {/* Book Info */}
      <div className="flex-1 text-center md:text-left space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Featured Book
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          {book.title}
        </h1>

        <p className="text-lg text-muted-foreground">by {book.author}</p>

        <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
            {book.genre}
          </span>
          <span className="flex items-center gap-1 text-amber-500">
            <span className="text-lg">⭐</span>
            <span className="font-medium">{book.rating}/5</span>
          </span>
        </div>

        <p className="text-muted-foreground line-clamp-3 max-w-xl">
          {book.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start pt-2">
          <Button asChild size="lg">
            <Link href={`/library/books/${book.id}`}>View Details</Link>
          </Button>

          <span
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              book.availableCopies > 0
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            }`}
          >
            {book.availableCopies > 0
              ? `${book.availableCopies} copies available`
              : "Currently unavailable"}
          </span>
        </div>
      </div>
    </section>
  );
}
