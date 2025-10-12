import BookCard from "./book-card";
import type { Book } from "../types";

interface Props {
  title: string;
  books: Book[];
  containerClassName?: string;
}

export default function BookList({ title, books, containerClassName }: Props) {
  if (books.length < 2) return null;

  return (
    <section className={containerClassName}>
      <h2 className="font-bebas-neue text-4xl text-light-100">{title}</h2>

      <ul className="book-list">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </ul>
    </section>
  );
}
