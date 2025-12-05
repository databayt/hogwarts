"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/components/internationalization/use-dictionary";
import { BookCover } from "../book-cover";
import type { Book } from "../types";

interface Props {
  title: string;
  books: Book[];
  containerClassName?: string;
  showViewAll?: boolean;
}

export default function BookList({ title, books, containerClassName, showViewAll = false }: Props) {
  const params = useParams();
  const locale = (params?.lang as string) || "ar";
  const { dictionary } = useDictionary();

  if (books.length < 1) return null;

  return (
    <section className={containerClassName}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {showViewAll && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/library/books`}>
              {dictionary?.library?.filters?.all || "All Books"}
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/${locale}/library/books/${book.id}`}
            className="block"
          >
            <div
              className="aspect-[2/3] rounded-md overflow-hidden"
              style={{ backgroundColor: book.coverColor || "#1a1a2e" }}
            >
              <BookCover
                coverUrl={book.coverUrl}
                coverColor={book.coverColor}
                title={book.title}
                author={book.author}
                textSize="sm"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
