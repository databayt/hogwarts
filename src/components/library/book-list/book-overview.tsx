"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Book } from "@/components/ui/book";
import type { Book as BookType } from "../types";
import { useDictionary } from "@/components/internationalization/use-dictionary";
import { Star } from "lucide-react";

interface Props {
  book: BookType;
  userId: string;
}

export default function BookOverview({ book, userId }: Props) {
  const params = useParams();
  const locale = (params?.lang as string) || "ar";
  const isRTL = locale === "ar";
  const { dictionary } = useDictionary();
  const libraryDict = dictionary?.library?.book;

  // Detect if book content is in Arabic (check for Arabic characters in title)
  const hasArabicContent = /[\u0600-\u06FF]/.test(book.title);

  // Render filled/empty stars based on rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "fill-amber-400 text-amber-400"
            : "fill-muted text-muted"
        }`}
      />
    ));
  };

  return (
    <section className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
      {/* 3D Book - no hover animation */}
      <div className="shrink-0">
        <Book
          depth={10}
          color={book.coverColor || "#f50537"}
          coverUrl={book.coverUrl}
          hoverAnimation={false}
        >
          {!book.coverUrl && (
            <div className="p-3 mb-2 grid gap-4">
              <h1 className="font-semibold text-white">
                {book.title}
              </h1>
              <p className="text-xs opacity-70 text-white">
                {book.author}
              </p>
            </div>
          )}
        </Book>
      </div>

      {/* Book Info */}
      <div className={`flex-1 text-center md:text-start space-y-4 ${hasArabicContent ? "font-arabic" : ""}`}>
        {/* Newly Arrived Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {libraryDict?.newlyArrived || "Newly Arrived"}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          {book.title}
        </h1>

        {/* Author */}
        <p className="text-lg text-muted-foreground">
          {libraryDict?.by || "By"} {book.author}
        </p>

        {/* Genre & Rating */}
        <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
            {book.genre}
          </span>
          <span className="flex items-center gap-1">
            {renderStars(book.rating)}
            <span className="text-muted-foreground text-sm ms-1">({book.rating}/5)</span>
          </span>
        </div>

        {/* Description */}
        <p className="text-muted-foreground line-clamp-3 max-w-xl">
          {book.description}
        </p>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start pt-2">
          <Button asChild size="lg">
            <Link href={`/${locale}/library/books/${book.id}`}>
              {libraryDict?.viewDetails || "View Details"}
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline">
            <Link href={`/${locale}/library`}>
              {libraryDict?.browse || "Browse"}
            </Link>
          </Button>

          {/* Availability Badge */}
          <span
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              book.availableCopies > 0
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            }`}
          >
            {book.availableCopies > 0
              ? `${book.availableCopies} ${libraryDict?.copies || "copies"} ${libraryDict?.available || "available"}`
              : libraryDict?.status?.borrowed || "Currently unavailable"}
          </span>
        </div>
      </div>
    </section>
  );
}
