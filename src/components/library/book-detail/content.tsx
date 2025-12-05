import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { notFound } from "next/navigation";
import BookVideo from "./book-video";
import BorrowBook from "./borrow-book";
import { BookCover } from "../book-cover";

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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Book Cover - Centered on top */}
      <div className="flex justify-center">
        <div
          className="w-48 aspect-[2/3] rounded-lg overflow-hidden shadow-lg"
          style={{ backgroundColor: book.coverColor || "#1a1a2e" }}
        >
          <BookCover
            coverUrl={book.coverUrl}
            coverColor={book.coverColor}
            title={book.title}
            author={book.author}
            width={192}
            height={288}
            priority
            textSize="md"
          />
        </div>
      </div>

      {/* Book Info */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold text-foreground">{book.title}</h1>
        <p className="text-muted-foreground">by {book.author}</p>

        <div className="flex items-center justify-center gap-3">
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
            {book.genre}
          </span>
          <span className="text-amber-500 text-sm">⭐ {book.rating}/5</span>
        </div>

        <p className={`text-sm ${book.availableCopies > 0 ? "text-green-600" : "text-red-600"}`}>
          {book.availableCopies} of {book.totalCopies} copies available
        </p>

        <div className="pt-2">
          <BorrowBook
            bookId={book.id}
            userId={userId}
            schoolId={schoolId}
            availableCopies={book.availableCopies}
            hasBorrowedBook={!!activeBorrowRecord}
            borrowRecordId={activeBorrowRecord?.id}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="font-semibold text-foreground mb-2">Description</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{book.description}</p>
      </div>

      {/* More Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-muted-foreground">Total Copies</p>
          <p className="font-semibold text-foreground">{book.totalCopies}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-muted-foreground">Available</p>
          <p className="font-semibold text-foreground">{book.availableCopies}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-muted-foreground">Genre</p>
          <p className="font-semibold text-foreground">{book.genre}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-muted-foreground">Rating</p>
          <p className="font-semibold text-foreground">{book.rating}/5</p>
        </div>
      </div>

      {/* Summary */}
      {book.summary && (
        <div>
          <h3 className="font-semibold text-foreground mb-2">Summary</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{book.summary}</p>
        </div>
      )}

      {/* Video */}
      {book.videoUrl && (
        <div>
          <BookVideo videoUrl={book.videoUrl} title={book.title} />
        </div>
      )}
    </div>
  );
}
