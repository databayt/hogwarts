import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { notFound } from "next/navigation";
import BookCover from "./book-cover";
import BookVideo from "./book-video";
import BorrowBook from "./borrow-book";

interface Props {
  bookId: string;
  userId: string;
}

export default async function LibraryBookDetailContent({ bookId, userId }: Props) {
  const { schoolId } = await getTenantContext();

  if (!schoolId) {
    notFound();
  }

  const book = await db.book.findFirst({
    where: {
      id: bookId,
      schoolId,
    },
  });

  if (!book) {
    notFound();
  }

  // Check if user has active borrow record for this book
  const activeBorrowRecord = await db.borrowRecord.findFirst({
    where: {
      bookId: book.id,
      userId,
      schoolId,
      status: "BORROWED",
    },
  });

  return (
    <div className="book-detail-container">
      <div className="book-detail-grid">
        {/* Left column - Book cover */}
        <div className="book-detail-cover-section">
          <BookCover
            coverUrl={book.coverUrl}
            coverColor={book.coverColor}
            title={book.title}
          />
        </div>

        {/* Right column - Book information */}
        <div className="book-detail-info-section">
          <h1 className="book-detail-title">{book.title}</h1>
          <p className="book-detail-author">by {book.author}</p>

          <div className="book-detail-meta">
            <span className="book-detail-genre">{book.genre}</span>
            <span className="book-detail-rating">
              ⭐ {book.rating}/5
            </span>
          </div>

          <div className="book-detail-availability">
            <h6>Availability</h6>
            <p className="lead">
              {book.availableCopies} of {book.totalCopies} copies available
            </p>
          </div>

          {/* Borrow action */}
          <BorrowBook
            bookId={book.id}
            userId={userId}
            schoolId={schoolId}
            availableCopies={book.availableCopies}
            hasBorrowedBook={!!activeBorrowRecord}
            borrowRecordId={activeBorrowRecord?.id}
          />

          {/* Description */}
          <div className="book-detail-description">
            <h4 className="mb-2">Description</h4>
            <p className="muted">{book.description}</p>
          </div>

          {/* Summary */}
          <div className="book-detail-summary">
            <h4 className="mb-2">Summary</h4>
            <p className="muted">{book.summary}</p>
          </div>
        </div>
      </div>

      {/* Video section (if available) */}
      {book.videoUrl && (
        <div className="book-detail-video-section">
          <BookVideo videoUrl={book.videoUrl} title={book.title} />
        </div>
      )}
    </div>
  );
}
