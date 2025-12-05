"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookCover } from "../book-cover";
import type { Book } from "../types";
import { useDictionary } from "@/components/internationalization/use-dictionary";

interface Props {
  book: Book;
  userId: string;
}

export default function BookOverview({ book, userId }: Props) {
  const params = useParams();
  const locale = (params?.lang as string) || "ar";
  const { dictionary } = useDictionary();
  const libraryDict = dictionary?.library?.book;

  return (
    <section className="flex flex-col md:flex-row gap-8 items-center">
      {/* Book Cover */}
      <div
        className="shrink-0 w-48 aspect-[2/3] rounded-lg overflow-hidden"
        style={{ backgroundColor: book.coverColor || "#1a1a2e" }}
      >
        <BookCover
          coverUrl={book.coverUrl}
          coverColor={book.coverColor}
          title={book.title}
          author={book.author}
          textSize="lg"
        />
      </div>

      {/* Book Info */}
      <div className="flex-1 text-center md:text-start space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground max-w-md leading-tight">
          {book.title}
        </h1>

        <p className="text-muted-foreground">
          {libraryDict?.by || "By"} {book.author}
        </p>

        {/* Genre Badge */}
        <div className="flex items-center gap-2 justify-center md:justify-start">
          <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            {book.genre || "Fantasy"}
          </span>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 max-w-xl">
          {book.description}
        </p>

        {/* Review Stars */}
        <div className="flex items-center gap-2 justify-center md:justify-start">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${star <= (book.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {book.rating || 5}/5
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
          <Button asChild>
            <Link href={`/${locale}/library/books/${book.id}`}>
              {libraryDict?.viewDetails || "View Details"}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
