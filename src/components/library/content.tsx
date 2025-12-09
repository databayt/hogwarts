import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import BookOverview from "./book-list/book-overview";
import BookList from "./book-list/content";
import { CollaborateSection } from "./collaborate-section";

interface Props {
  userId: string;
  dictionary?: Record<string, unknown>;
  lang?: string;
}

export default async function LibraryContent({ userId, dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext();

  if (!schoolId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="mb-4">School context not found</h2>
        <p className="muted">
          Unable to load library. Please contact support.
        </p>
      </div>
    );
  }

  // First try to get Harry Potter specifically
  let heroBook = await db.book.findFirst({
    where: {
      schoolId,
      title: { contains: "Harry Potter" }
    },
  });

  // Fallback to most recent if Harry Potter not found
  if (!heroBook) {
    heroBook = await db.book.findFirst({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
    });
  }

  // Fetch other books in parallel
  const [latestBooks, featuredBooks, literatureBooks, scienceBooks] = await Promise.all([
    // Latest Books - exclude Harry Potter (hero), get 12 books
    db.book.findMany({
      where: {
        schoolId,
        NOT: { title: { contains: "Harry Potter" } }
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    // Featured - skip latest 13 to show different ones
    db.book.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      skip: 13,
      take: 12,
    }),
    // Literature - fiction, classic, drama, poetry genres
    db.book.findMany({
      where: {
        schoolId,
        OR: [
          { genre: { contains: "Fiction" } },
          { genre: { contains: "Classic" } },
          { genre: { contains: "Drama" } },
          { genre: { contains: "أدب" } },
          { genre: { contains: "شعر" } },
        ],
      },
      take: 12,
    }),
    // Science - science, history genres
    db.book.findMany({
      where: {
        schoolId,
        OR: [
          { genre: { contains: "Science" } },
          { genre: { contains: "History" } },
          { genre: { contains: "فلسفة" } },
        ],
      },
      take: 12,
    }),
  ]);

  const hasBooks = heroBook || latestBooks.length > 0;

  if (!hasBooks) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-24 h-24 mb-6 rounded-full bg-muted flex items-center justify-center">
          <svg
            className="w-12 h-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">No books available</h2>
        <p className="text-muted-foreground text-center max-w-md">
          The library is empty. Check back later or contact your library
          administrator to add books.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 overflow-x-hidden">
      {/* Collaborate Section - Claude style */}
      <CollaborateSection lang={lang} />

      {/* Featured Book - Single book highlight */}
      {heroBook && (
        <BookOverview book={heroBook} userId={userId} />
      )}

      {/* Row 1: Latest Books */}
      {latestBooks.length > 0 && (
        <BookList
          title="Latest Books"
          books={latestBooks}
          containerClassName=""
        />
      )}

      {/* Row 2: Featured */}
      {featuredBooks.length > 0 && (
        <BookList
          title="Featured"
          books={featuredBooks}
          containerClassName=""
        />
      )}

      {/* Row 3: Literature */}
      {literatureBooks.length > 0 && (
        <BookList
          title="Literature"
          books={literatureBooks}
          containerClassName=""
        />
      )}

      {/* Row 4: Science */}
      {scienceBooks.length > 0 && (
        <BookList
          title="Science"
          books={scienceBooks}
          containerClassName=""
        />
      )}
    </div>
  );
}
