import BookCard from "./book-card";
import type { Book } from "../types";

interface Props {
  title: string;
  books: Book[];
  containerClassName?: string;
}

export default function BookList({ title, books, containerClassName }: Props) {
  if (books.length < 1) return null;

  return (
    <section className={containerClassName}>
      <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>

      <ul className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </ul>
    </section>
  );
}
