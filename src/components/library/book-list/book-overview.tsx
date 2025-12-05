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

        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 max-w-xl">
          {book.description}
        </p>

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
