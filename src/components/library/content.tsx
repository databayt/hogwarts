import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import BookOverview from "./book-list/book-overview";
import BookList from "./book-list/content";

interface Props {
  userId: string;
}

export default async function LibraryContent({ userId }: Props) {
  const { schoolId } = await getTenantContext();

  if (!schoolId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-semibold mb-4">School context not found</h2>
        <p className="text-muted-foreground">
          Unable to load library. Please contact support.
        </p>
      </div>
    );
  }

  const latestBooks = await db.book.findMany({
    where: {
      schoolId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  if (latestBooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-semibold mb-4">No books available</h2>
        <p className="text-muted-foreground">
          Check back later or contact your library administrator
        </p>
      </div>
    );
  }

  return (
    <>
      <BookOverview book={latestBooks[0]} userId={userId} />

      <BookList
        title="Latest Books"
        books={latestBooks.slice(1)}
        containerClassName="mt-28"
      />
    </>
  );
}
