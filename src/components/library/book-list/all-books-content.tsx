import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import BookList from "./content"

export default async function AllBooksContent() {
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2 className="mb-4">School context not found</h2>
        <p className="muted">Unable to load library. Please contact support.</p>
      </div>
    )
  }

  const allBooks = await db.book.findMany({
    where: {
      schoolId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  if (allBooks.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="bg-muted mb-6 flex h-24 w-24 items-center justify-center rounded-full">
          <svg
            className="text-muted-foreground h-12 w-12"
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
        <h2 className="mb-2 text-xl font-semibold">No books available</h2>
        <p className="text-muted-foreground max-w-md text-center">
          The library is empty. Check back later or contact your library
          administrator to add books.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {allBooks.length} books in the library
        </p>
      </div>

      <BookList title="All Books" books={allBooks} containerClassName="" />
    </div>
  )
}
