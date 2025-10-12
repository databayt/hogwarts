import Link from "next/link";
import Image from "next/image";
import type { Book } from "../types";

interface Props {
  book: Book;
}

export default function BookCard({ book }: Props) {
  return (
    <li className="book-card">
      <Link href={`/library/books/${book.id}`} className="book-card-link">
        <div className="book-card-cover" style={{ backgroundColor: book.coverColor }}>
          <Image
            src={book.coverUrl}
            alt={book.title}
            width={200}
            height={300}
            className="book-cover-image"
          />
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
